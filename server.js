"use strict";

var express        = require("express");
var compression = require('compression');
var http = require('http');
var logger = require('./logger');
var util = require('util');
var _ = require('underscore');

var cluster = require('cluster');
var isalive = require('./isalive');
var count = require('os').cpus().length;
var pg = require('pg.js');
require('pg-parse-float')(pg);


/**
 * We log memory statistics, so we can monitor memory consumption in splunk.
 * This does not work on windows.
 */
if(process.platform !== 'win32') {
  var memwatch = require('memwatch-next');
  memwatch.on('stats', function(stats) {
    var logMeta = {
      pid: process.pid,
      current_base: stats.current_base,
      estimated_base: stats.estimated_base,
      min: stats.min,
      max: stats.max,
      usage_trend: stats.usage_trend
    };
    logger.info('memory', 'stats', logMeta);
    if(stats.current_base > 768 * 1024 * 1024) {
      logger.error('memory','Memory limit exceeded. Exiting process.', logMeta);
      process.exit(1);
    }
  });

}
function asInteger(stringOrNumber) {
  return _.isNumber(stringOrNumber) ? stringOrNumber : parseInt(stringOrNumber);
}

function socketTimeoutMiddleware(timeoutMillis) {
  return function(req, res, next) {
    res.socket.setTimeout(timeoutMillis);
    res.socket.setKeepAlive(true, 1000);
    next();
  };
}

function setupWorker() {
  var proddb = require('./psql/proddb');
  var poolLogger = logger.forCategory('dbPool');
  var dboptions = {
    poolSize: asInteger(process.env.pgPoolSize),
    poolIdleTimeout: asInteger(process.env.pgPoolIdleTimeout),
    maxWaitingClients: process.env.maxWaitingClients,
    connString: process.env.pgConnectionUrl,
    pooled: true,
    poolLog: function (msg, level) {
      if (level === 'info' || level === 'warn' || level === 'error') {
        poolLogger.log(level, msg);
      }
    }
  };
  proddb.init(dboptions);
  var dawaPgApi      = require('./dawaPgApi');
  var documentation = require('./documentation');
  require('./apiSpecification/allSpecs');

  process.on('message', function(message) {
    if(message.type === 'getStatus') {
      isalive.isaliveSlave(server).then(function(result) {
        result.requestId = message.requestId;
        process.send(result);
      }).catch(function(err) {
        logger.error('isalive', 'Unexpected error during isalive', err);
      });
    }
  });

  var app = express();

  app.use(socketTimeoutMiddleware(asInteger(process.env.socketTimeout)));

  // Hackish: We reduce memlevel to prevent zLib from caching too much internally
  // Otherwise, it will take too long for our application to start responding to JSON requests,
  // potentially resulting in a TCP disconnection.
  app.use(compression( {
    memLevel: 3
  }));
  app.use(express.static(__dirname + '/public', {maxAge: 10000}));


  var listenPort = process.env.listenPort || 3000;

  app.use('', dawaPgApi.setupRoutes());
  app.use('', documentation);


  var server = http.createServer(app);
  server.listen(listenPort);
  logger.info("startup", "Express server listening for connections", {listenPort: listenPort, mode: app.settings.env});
  console.log('Express server listening for connections on port ' + listenPort);
}

function setupMaster() {
  var cliParameterParsing = require('./bbr/common/cliParameterParsing');
  var optionSpec = {
    pgConnectionUrl: [false, 'URL som anvendes ved forbindelse til databasen', 'string'],
    listenPort: [false, 'TCP port der lyttes på', 'number', 3000],
    masterListenPort: [false, 'TCP port hvor master processen lytter (isalive)', 'number', 3001],
    disableClustering: [false, 'Deaktiver nodejs clustering, så der kun kører en proces', 'boolean'],
    pgPoolSize: [false, 'PostgreSQL connection pool størrelse', 'number', 25],
    pgPoolIdleTimeout: [false, 'Tidsrum en connection skal være idle før den lukkes (ms)', 'number', 10000],
    socketTimeout: [false, 'Socket timeout for TCP-forbindelser til APIet', 'number', 60000],
    maxWaitingClients: [false, 'Maximum number of clients to queue when there is no available db connections', 'number', 0]
  };

  cliParameterParsing.main(optionSpec, _.without(_.keys(optionSpec), 'disableClustering'), function(args, options) {
    if(options.disableClustering) {
      _.extend(process.env, options);
      setupWorker();
      return;
    }

    var workerOptions = {
      pgConnectionUrl: options.pgConnectionUrl,
      listenPort: options.listenPort,
      logOptions: JSON.stringify(options.logOptions),
      socketTimeout: options.socketTimeout,
      pgPoolSize: options.pgPoolSize,
      pgPoolIdleTimeout: options.pgPoolIdleTimeout,
      maxWaitingClients: options.maxWaitingClients
    };
    for (var i = 0; i < count; i++) {
      spawn(workerOptions);
    }

    cluster.on('exit', function (worker, code, signal) {
      logger.error('master', 'Worker died. Restarting worker.', { pid: worker.process.pid, signal: signal, code: code});
      spawn(workerOptions);
    });

    var isaliveApp = express();
    isaliveApp.get('/isalive', function(req, res) {
      isalive.isaliveMaster(options).then(function(isalive) {
        res.json(isalive);
      }).catch(function(err) {
        logger.error('isalive', 'Unexpected error during isalive', err);
        res.status(500).send('Unexpected error during isalive: ' + util.inspect(err));
      });
    });

    isaliveApp.set('json spaces', 2);

    isaliveApp.listen(options.masterListenPort);
    logger.info("startup", "Master listening for isalive", {listenPort: options.masterListenPort});
  });
}


if (cluster.isMaster) {
  setupMaster();
} else {
  logger.initialize(JSON.parse(process.env.logOptions));
  setupWorker();
}


////////////////////////////////////////////////////////////////////////////////
//// Helper functions //////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function spawn(options){
  var worker = cluster.fork(options);
  return worker;
}

process.on('uncaughtException', function(err) {
  logger.error('uncaughtException', 'An uncaught exception occured, terminating process', err);
  process.exit(1);
});


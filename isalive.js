"use strict";

var cluster = require('cluster');
var fs = require('fs');
var pgConnectionString = require('pg-connection-string');
var q = require('q');
var util = require('util');
var uuid = require('node-uuid');

var database = require('./psql/database');
var checkdns = require('./checkdns');
var proddb = require('./psql/proddb');
var statistics = require('./statistics');

var packageJson = JSON.parse(fs.readFileSync(__dirname + '/package.json'));

// get status from a single worker
function getStatus(worker) {
  var deferred = q.defer();
  var request = {
    type: 'getStatus',
    requestId: uuid.v4(),
    data: {}
  };
  function listener(response) {
    if (response.type === 'status' && response.requestId === request.requestId) {
      worker.removeListener('message', listener);
      deferred.resolve(response.data);
    }
  }
  worker.on('message', listener);
  worker.send(request);
  return q.timeout(deferred.promise, 5000);
}

exports.getWorkerStatuses = function() {
  var workerIds = Object.keys(cluster.workers);
  var statusPromises =
    workerIds.map(function(workerId) {
      var worker = cluster.workers[workerId];
      return getStatus(worker);
    });
  var result = [];
  return q.allSettled(statusPromises).then(function(statuses) {
    for(var i = 0; i < workerIds.length; ++i) {
      var workerId = workerIds[i];
      var worker = cluster.workers[workerId];
      var status = statuses[i];
      result.push({
        id: workerId,
        pid: worker ? worker.process.pid : null,
        isalive: status.state === 'fulfilled' ? status.value : {
          status: 'down',
          reason: 'Could not get status from worker process'
        }
      });
    }
    return result;
  });

};

function getDnsStatus(host) {
  return checkdns(host)
    .then(function(dnsStatus) {
      dnsStatus.status = dnsStatus.lookupStale ? 'down' : 'up';
      return dnsStatus;
  }, function(error) {
      return {
        status: 'down',
        reason: util.inspect(error)
      };
  });
}

exports.isaliveMaster = function(options) {
  var pgConnectionUrl = options.pgConnectionUrl;
  var host = pgConnectionString.parse(pgConnectionUrl).host;
  var result = {
    name: packageJson.name,
    version: packageJson.version,
    generation_time: new Date().toISOString()
  };
  var workerStatusesPromise = exports.getWorkerStatuses();
  var dnsCheckPromise = getDnsStatus(host);
  return q.all([workerStatusesPromise, dnsCheckPromise]).spread(function(workerStatuses, dnsStatus) {
      result.workers = workerStatuses;
      result.database_dns = dnsStatus;
      result.status = result.database_dns.status;
      return result;
    });
};

exports.isaliveSlave = function(server) {
  return q.ninvoke(server, 'getConnections').then(function(count) {
    return proddb.withTransaction('READ_ONLY', function(client) {
      return client.queryp('select * from adgangsadresser limit 1').then(function(result) {
        return {
          type: 'status',
          data: {
            status: result.rows && result.rows.length === 1 ? 'up' : 'down',
            postgresPool: database.getPoolStatus('prod'),
            statistics: statistics.getStatistics(),
            connections: count
          }
        };
      }, function(err) {
        return {
          type: 'status',
          data: {
            status: 'down',
            postgresError: err,
            postgresPool: database.getPoolStatus('prod'),
            statistics: statistics.getStatistics(),
            connections: count
          }
        };
      });
    });
  });
};
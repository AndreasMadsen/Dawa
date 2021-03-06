"use strict";
var csvStringify = require('csv-stringify');
var eventStream = require('event-stream');
var Transform        = require('stream').Transform;
var util             = require('util');
var pipeline = require('../../pipeline');

function jsonStringify(object, prettyPrint){
  return JSON.stringify(object, undefined, prettyPrint ? 2 : 0);
}

util.inherits(JsonStringifyStream, Transform);
function JsonStringifyStream(replacer, space, sep) {
  Transform.call(this, {
    objectMode: true,
    highWaterMark: 0
  });
  this.replacer = replacer;
  this.space = space;
  this.headerWritten = false;
  this.sep = sep ? sep : { open: '[\n', separator: ',\n', close: '\n]'};
}

JsonStringifyStream.prototype._flush = function(cb) {
  if(!this.headerWritten) {
    this.push(this.sep.open);
  }
  this.push(this.sep.close);
  cb();
};

JsonStringifyStream.prototype._transform = function(chunk, encoding, cb) {
  var json = JSON.stringify(chunk, this.replacer, this.space);
  if(!this.headerWritten) {
    this.headerWritten = true;
    this.push(this.sep.open);
  }
  else {
    this.push(this.sep.separator);
  }
  this.push(json);
  cb();
};

function jsonSep(prettyPrint) {
  if(prettyPrint) {
    return {
      open: '[\n',
      separator: ', ',
      close: '\n]'
    };
  }
  else {
    return {
      open: '[',
      separator: ',',
      close: ']'
    };
  }
}

function geojsonFeatureSep(crsUri, prettyPrint) {
  if(prettyPrint) {
    return {
      open: '{\n' +
        '  "type": "FeatureCollection",\n' +
        '  "crs": {\n' +
        '    "type": "name",\n' +
        '    "properties": {"name": "' + crsUri + '"}\n'+
        '  },\n'+
        '  "features": [\n',
      separator: ', ',
      close: ']\n}'
    };
  }
  else {
    return {
      open: '{"type":"FeatureCollection","crs":{"type":"name","properties":{"name":"'+crsUri+'"}},"features":[',
      separator: ',',
      close:']}'
    };
  }
}

function jsonpSep(callbackName, sep, prettyPrint) {
  return {
    open: callbackName +'(' + sep.open,
    separator: jsonSep(prettyPrint).separator,
    close: sep.close + ');'
  };
}

function toGeoJsonUrn(srid) {
  return 'EPSG:' + srid;
}

function computeSeparator(formatParam, callbackParam, sridParam, prettyPrint) {
  var sep = formatParam === 'geojson' ? geojsonFeatureSep(toGeoJsonUrn(sridParam), prettyPrint) : jsonSep(prettyPrint);
  if (callbackParam) {
    sep = jsonpSep(callbackParam, sep, prettyPrint);
  }
  return sep;
}

function transformToText(pipe, formatParam, callbackParam, sridParam, prettyPrint) {
  var sep = computeSeparator(formatParam, callbackParam, sridParam, prettyPrint);
  pipe.add(new JsonStringifyStream(undefined, prettyPrint ? 2 : 0, sep));
  return pipe;
}

/**
 * Compute the appropriate Content-Type header based on the format and
 */
function contentHeader(format, jsonpCallbackName) {
  if(format === 'csv') {
    return 'text/csv; charset=UTF-8';
  }
  else if (jsonpCallbackName) {
    return "application/javascript; charset=UTF-8";
  }
  else {
    return 'application/json; charset=UTF-8';
  }
}

function streamCsv(pipe, csvFieldNames) {
  var csvStringifier = csvStringify({header: true, columns: csvFieldNames, rowDelimiter: '\r\n', highWaterMark: 0});

  pipe.add(csvStringifier);
}


exports.createStreamSerializer = function(formatParam, callbackParam, sridParam, prettyPrint, representation) {
  formatParam = formatParam || 'json';
  sridParam = sridParam || 4326;
  return function(pipe, callback) {
    if(formatParam === 'csv') {
      streamCsv(pipe, representation.outputFields);
    } else {
      transformToText(pipe, formatParam, callbackParam, sridParam, prettyPrint);
    }
    var response = {
      status: 200,
      headers: {
        'Content-Type': contentHeader(formatParam, callbackParam)
      },
      bodyPipe: pipe
    };
    callback(null, response);
  };
};

exports.createSingleObjectSerializer = function(formatParam, callbackParam, prettyPrint, representation) {
  return function(object, callback) {
    var response = {
      status: 200,
      headers: {
        'Content-Type': contentHeader(formatParam, callbackParam)
      }
    };

    if(formatParam === 'csv') {
      var stream = eventStream.readArray([object]);
      var pipe = pipeline(stream);
      streamCsv(pipe, representation.outputFields);
      response.bodyPipe = pipe;
    } else {
      var textObject = jsonStringify(object, prettyPrint);
      if(callbackParam) {
        var sep = jsonpSep(callbackParam, {open: '', separator: '', close: ''});
        response.body = sep.open + textObject + sep.close;
      }
      else {
        response.body = textObject;
      }
    }
    callback(null, response);
  };
};
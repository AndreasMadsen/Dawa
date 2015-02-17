"use strict";

var q = require('q');
var ZSchema = require('z-schema');
var _ = require('underscore');

var columnMappings = require('../../apiSpecification/replikering/columnMappings');
var csvParse = require('csv-parse');
var resourceImpl = require('../../apiSpecification/common/resourceImpl');

function getResponse(dbClient, resourceSpec, pathParams, queryParams, callback) {
  function withDbClient(callback) {
    callback(null, dbClient, function() {});
  }
  function shouldAbort() {
    return false;
  }
  resourceImpl.resourceResponse(withDbClient, resourceSpec, {params: pathParams, query: queryParams, headers: {}}, shouldAbort, function(err, response) {
    if(err) {
      return callback(err);
    }
    if(response.bodyPipe) {
      response.bodyPipe.toArray(function(err, result) {
        if(err) {
          return callback(err);
        }
        delete response.bodyPipe;
        response.body = result.join('');
        callback(null, response);
      });
    }
    else {
      callback(null, response);
    }
  });
}

// Get the response of a resource as a string
exports.getStringResponse = function(dbClient, resourceSpec, pathParams, queryParams, callback) {
  getResponse(dbClient, resourceSpec, pathParams, queryParams, function(err, res) {
    if(err) {
      return callback(err);
    }
    if(res.status !== 200) {
      return callback(new Error('Unexpected status code: ' + res.status));
    }
    callback(null, res.body);
  });
};

// Get the response of a resource as JSON
exports.getJson = function(dbClient, resourceSpec, pathParams, queryParams, callback) {
  exports.getStringResponse(dbClient, resourceSpec, pathParams, queryParams, function(err, str) {
    if(err) {
      return callback(err);
    }
    var json;
    try {
      json = JSON.parse(str);
    }
    catch(parseError) {
      return callback(parseError);
    }
    callback(null, json);
  });
};

// get the response of a resource and parse as CSV
exports.getCsv = function(dbClient, resourceSpec, pathParams, queryParams, callback) {
  queryParams.format = 'csv';
  exports.getStringResponse(dbClient, resourceSpec, pathParams, queryParams, function(err, str) {
    if(err) {
      return callback(err);
    }
    csvParse(str, {columns: true}, function(err, result) {
      if(err) {
        return callback(err);
      }
      callback(err, result);
    });
  });
};

function jsFieldToCsv(field) {
  if (typeof field === 'string') {
    return field;
  } else if (typeof field === 'number') {
    return '' + field;
  } else if (typeof field === 'boolean') {
    return field ? '1' : '';
  } else if (field instanceof Date) {
    return '' + field.getTime();
  }
  else {
    return '';
  }
}

// Convert a JavaScript array to an array of CSV field values
exports.jsToCsv = function(obj) {
  return _.reduce(obj, function(memo, field, fieldName) {
    memo[fieldName] = jsFieldToCsv(field);
    return memo;
  },{});
};


exports.toSqlModel = function(datamodelName, apiObject) {
  return _.reduce(columnMappings.columnMappings[datamodelName], function (memo, mapping) {
    var sqlColumn = mapping.column || mapping.name;
    memo[sqlColumn] = apiObject[mapping.name];
    return memo;
  }, {});
};

exports.itQ = function (description, func) {
  q.longStackSupport = true;
  it(description, function (done) {
    func().then(done, function (err) {
      expect(err).toBeUndefined();
      if(err) {
        console.log(err.stack);
      }
      done();
    });
  });
};

exports.customMatchers = {
  toMatchSchema: function(util, customEqualityTesters) {
    return {
      compare: function(object, schema) {
        var zSchemaValidator = new ZSchema({
          forceItems: true,
          forceProperties: true
        });

        var result = {
          pass: zSchemaValidator.validate(object, schema)
        };
        if(!result.pass) {
          result.message = JSON.stringify(zSchemaValidator.getLastErrors());
        }
        return result;
      }
    };
  }
}
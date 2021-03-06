"use strict";

var _ = require('underscore');

var parameters = require('./parameters');
var representations = require('./representations');
var sqlModels = require('./sqlModels');
var resourcesUtil = require('../../common/resourcesUtil');
require('../../allNamesAndKeys');
var registry = require('../../registry');
var commonParameters = require('../../common/commonParameters');
var columnMappings = require('../columnMappings').columnMappings;

_.each(Object.keys(columnMappings), function(entityName) {
  var nameAndKey = registry.findWhere({
    entityName: entityName,
    type: 'nameAndKey'
  });
  exports[entityName] = {
    hændelser:   {
      path: '/replikering/' + nameAndKey.plural + '/haendelser',
      pathParameters: [],
      queryParameters: resourcesUtil.flattenParameters({
        sekvensnummer: parameters.sekvensnummer,
        tidspunkt: parameters.tidspunkt,
        keyParameters: parameters.keyParameters[entityName] || [],
        formatParameters: commonParameters.format
      }),
      representations: representations[entityName],
      sqlModel: sqlModels[entityName],
      singleResult: false,
      chooseRepresentation: resourcesUtil.chooseRepresentationForQuery,
      processParameters:  function() {}
    }
  };
});

_.each(exports, function(resources, entityName) {
  registry.add(entityName, 'resource', 'hændelser', resources['hændelser']);
});
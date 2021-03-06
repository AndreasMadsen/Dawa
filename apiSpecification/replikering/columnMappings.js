"use strict";

var kode4String = require('../util').kode4String;
var _ = require('underscore');
var temaer = require('../temaer/temaer');
var tilknytninger = require('../tematilknytninger/tilknytninger');
var additionalFieldsMap = require('../temaer/additionalFields');

var datamodels = require('../../crud/datamodel');
// maps of field names to database column names

var selectIsoTimestamp = require('../common/sql/sqlUtil').selectIsoDate;

exports.columnMappings = {
  vejstykke: [{
    name: 'kode',
    formatter: kode4String
  }, {
    name: 'kommunekode',
    formatter: kode4String
  }, {
    name: 'navn',
    column: 'vejnavn'
  }, {
    name: 'adresseringsnavn'
  }, {
    name: 'oprettet',
    selectTransform: selectIsoTimestamp
  }, {
    name: 'ændret',
    column: 'aendret',
    selectTransform: selectIsoTimestamp
  }],
  postnummer: [{
    name: 'nr',
    formatter: kode4String
  }, {
    name: 'navn'
  },{
    name: 'stormodtager'
  }],
  adgangsadresse: [{
    name: 'id'
  }, {
    name: 'status',
    column: 'objekttype'
  }, {
    name: 'kommunekode',
    formatter: kode4String
  },{
    name: 'vejkode',
    formatter: kode4String
  }, {
    name: 'husnr'
  }, {
    name: 'supplerendebynavn'
  }, {
    name: 'postnr',
    formatter: kode4String
  }, {
    name: 'oprettet',
    selectTransform: selectIsoTimestamp
  }, {
    name: 'ændret',
    column: 'aendret',
    selectTransform: selectIsoTimestamp
  }, {
    name: 'ikrafttrædelsesdato',
    column: 'ikraftfra',
    selectTransform: selectIsoTimestamp
  }, {
    name: 'ejerlavkode'
  }, {
    name: 'matrikelnr'
  }, {
    name: 'esrejendomsnr',
    formatter: function(num) {
      return num ? "" + num : null;
    }
  }, {
    name: 'etrs89koordinat_øst',
    column: 'etrs89oest'
  }, {
    name: 'etrs89koordinat_nord',
    column: 'etrs89nord'
  }, {
    name: 'nøjagtighed',
    column: 'noejagtighed'
  }, {
    name: 'kilde',
    column: 'adgangspunktkilde'
  }, {
    name : 'husnummerkilde'
  }, {
    name: 'tekniskstandard'
  }, {
    name: 'tekstretning'
  }, {
    name: 'esdhreference'
  }, {
    name: 'journalnummer'
  }, {
    name: 'adressepunktændringsdato',
    column: 'adressepunktaendringsdato',
    selectTransform: selectIsoTimestamp
  }],
  adresse: [{
    name: 'id'
  }, {
    name: 'status',
    column: 'objekttype'
  }, {
    name: 'oprettet',
    selectTransform: selectIsoTimestamp
  }, {
    name: 'ændret',
    column: 'aendret',
    selectTransform: selectIsoTimestamp
  }, {
    name: 'ikrafttrædelsesdato',
    column: 'ikraftfra',
    selectTransform: selectIsoTimestamp
  }, {
    name: 'etage'
  }, {
    name: 'dør',
    column: 'doer'
  }, {
    name: 'adgangsadresseid'
  }, {
    name: 'kilde'
  }, {
    name: 'esdhreference'
  }, {
    name: 'journalnummer'
  }
  ],
  ejerlav: [{
    name: 'kode'
  }, {
    name: 'navn'
  }]
};

exports.tables = {};
exports.keys = {};

['vejstykke', 'adgangsadresse', 'adresse', 'postnummer', 'ejerlav'].forEach(function(entityName) {
  exports.tables[entityName] = datamodels[entityName].table;
  exports.keys[entityName] = datamodels[entityName].key;
});

_.keys(tilknytninger).forEach(function(temaNavn) {
  var tema = _.findWhere(temaer, {singular: temaNavn});
  // For now, only tilknytninter with non-composite keys are replicated.
  var keyColumns = tema.key.map(function(keySpec) {
    return "(fields->>'" + keySpec.name + "')::" + keySpec.sqlType;
  });
  var tilknytningKey = (tema.prefix + 'tilknytning');
  var temaKeyFields = tema.key.map(function(keyPart) {
    return _.findWhere(additionalFieldsMap[tema.singular], {name: keyPart.name});
  });
  var keyMappings = temaKeyFields.map(function(temaKeyField, index) {
    return {
      name: tilknytninger[tema.singular].keyFieldNames[index],
      column: keyColumns[index],
      formatter: temaKeyField.formatter
    };
  });
  exports.columnMappings[tilknytningKey] =
    [{
      name: 'adgangsadresseid',
      column: 'adgangsadresse_id'
    }].concat(keyMappings);

  exports.tables[ tilknytningKey] = 'adgangsadresser_temaer_matview';
  exports.keys[tilknytningKey] = _.pluck(exports.columnMappings[tilknytningKey], 'name');
});

// maps column names to field names
exports.columnToFieldName = _.reduce(exports.columnMappings, function(memo, columnSpec, key) {
  memo[key] = _.reduce(columnSpec, function(memo, col) {
    memo[col.column || col.name] = memo[col.name] || col.name;
    return memo;
  }, {});
  return memo;
}, {});

// maps column names to transform function
exports.columnToTransform =  _.reduce(exports.columnMappings, function(memo, columnSpec, key) {
  memo[key] = _.reduce(columnSpec, function(memo, col) {
    memo[col.column || col.name] = col.selectTransform;
    return memo;
  }, {});
  return memo;
}, {});

// maps column names to the select expression used
exports.columnToSelect = _.reduce(exports.columnMappings, function(memo, columnSpec, key) {
  memo[key] = _.reduce(columnSpec, function(memo, col) {

    var columnName = col.column || col.name;
    var select = col.selectTransform ? col.selectTransform(columnName) : columnName;

    memo[columnName] = select;
    return memo;
  }, {});
  return memo;
}, {});

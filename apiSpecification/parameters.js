"use strict";

var columns = require('./columns');
var columnsUtil = require('./columnsUtil');
var common = require('./commonParameterGroups');
var crsParameterSpec = common.crsParameterSpec;
var dagiTemaer = require('./dagiTemaer');
var dbapi = require('../dbapi');
var schema = require('./parameterSchema');

var autocompleteParameterSpec = common.autocompleteParameterSpec;
var geomWithinParameterSpec = common.geomWithinParameterSpec;
var reverseGeocodingParameterSpec = common.reverseGeocodingParameterSpec;
var searchParameterSpec = common.searchParameterSpec;

/**
 * Applies a list of property filter parameters to a query by generating the
 * appropriate where clauses.
 */
function applyParameters(spec, parameterSpec, params, query) {
  var columnSpec = columns[spec.model.name];
  parameterSpec.forEach(function (parameter) {
    var name = parameter.name;
    if (params[name] !== undefined) {
      var parameterAlias = dbapi.addSqlParameter(query, params[name]);
      var column = columnsUtil.getColumnNameForWhere(columnSpec, name);
      query.whereClauses.push(column + " = " + parameterAlias);
    }
  });
}

function propertyFilterParameterGroup(parameters) {
  var result = {
    parameters: parameters
  };
  result.applySql = function(sqlParts, params, spec) {
    return applyParameters(spec, parameters, params, sqlParts);
  };
  return result;
}

exports.adgangsadresse = {
  propertyFilter: propertyFilterParameterGroup([
    {
      name: 'id',
      type: 'string',
      schema: schema.uuid
    },
    {
      name: 'vejkode',
      type: 'integer',
      schema: schema.kode4
    },
    {
      name: 'vejnavn'
    },
    {
      name: 'husnr'
    },
    {
      name: 'supplerendebynavn'
    },
    {
      name: 'postnr',
      type: 'integer',
      schema: schema.postnr
    },
    {
      name: 'kommunekode',
      type: 'integer',
      schema: schema.kode4
    },
    {
      name: 'ejerlavkode',
      type: 'integer'
    },
    {
      name: 'matrikelnr'
    },
    {
      name: 'esrejendomsnr',
      type: 'integer'
    }
  ]),
  search: searchParameterSpec,
  autocomplete: autocompleteParameterSpec,
  crs: crsParameterSpec,
  geomWithin: geomWithinParameterSpec,
  reverseGeocoding: reverseGeocodingParameterSpec
};

exports.adresse = {
  propertyFilter: propertyFilterParameterGroup(exports.adgangsadresse.propertyFilter.parameters.concat([
    {
      name: 'etage'
    },
    {
      name: 'dør'
    },
    {
      name: 'adgangsadresseid'
    }
  ])),
  search: searchParameterSpec,
  autocomplete: autocompleteParameterSpec,
  crs: crsParameterSpec,
  geomWithin: geomWithinParameterSpec
};

exports.supplerendebynavn = {
  propertyFilter: propertyFilterParameterGroup([
    {
      name: 'navn'
    },
    {
      name: 'kommunekode',
      type: 'integer',
      schema: schema.kode4
    },
    {
      name: 'postnr'
    }
  ]),
  search: searchParameterSpec,
  autocomplete: autocompleteParameterSpec
};

exports.vejnavn = {
  propertyFilter: propertyFilterParameterGroup([
    {
      name: 'navn'
    },
    {
      name: 'postnr',
      type: 'integer',
      schema: schema.postnr
    },
    {
      name: 'kommunekode',
      type: 'integer',
      schema: schema.kode4
    }
  ]),
  search: searchParameterSpec,
  autocomplete: autocompleteParameterSpec
};

exports.vejstykke = {
  propertyFilter: propertyFilterParameterGroup([
    {
      name: 'kode'
    },
    {
      name: 'kommunekode',
      type: 'integer',
      schema: schema.kode4
    },
    {
      name: 'navn'
    },
    {
      name: 'postnr',
      type: 'integer',
      schema: schema.postnr
    }
  ]),
  search: searchParameterSpec,
  autocomplete: autocompleteParameterSpec
};

exports.postnummer = {
  propertyFilter: propertyFilterParameterGroup(
    [
      {
        name: 'nr'
      },
      {
        name: 'navn'
      },
      {
        name: 'kommune'
      }
    ]),
  search: searchParameterSpec,
  autocomplete: autocompleteParameterSpec
};

dagiTemaer.forEach(function(tema) {
  exports[tema.singular] = {
    propertyFilter: propertyFilterParameterGroup([
      {
        name: 'navn'
      },
      {
        name: 'kode',
        type: 'integer'
      }
    ]),
    search: searchParameterSpec,
    autocomplete: autocompleteParameterSpec
  };
});
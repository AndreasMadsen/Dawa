"use strict";

var nameAndKey = require('./nameAndKey');
var sqlParameterImpl = require('../common/sql/sqlParameterImpl');
var parameters = require('./parameters');
var sqlUtil = require('../common/sql/sqlUtil');
var assembleSqlModel = sqlUtil.assembleSqlModel;
var selectIsoTimestamp = sqlUtil.selectIsoDate;

var columns = {
  kode: {
    column: 'vejstykker.kode'
  },
  kommunekode: {
    column: 'vejstykker.kommunekode'
  },
  oprettet: {
    select: selectIsoTimestamp('vejstykker.oprettet')
  },
  ændret: {
    select: selectIsoTimestamp('vejstykker.aendret')
  },
  kommunenavn: {
    select: "k.navn",
    where: null
  },
  navn: {
    column: 'vejstykker.vejnavn'
  },
  postnr: {
    select: null,
    where: 'vp2.postnr'
  },
  postnumre: {
    select: 'json_agg(DISTINCT CAST((p.nr, p.navn) AS PostnummerRef))'
  },
  tsv: {
    column: 'vejstykker.tsv'
  }
};

var parameterImpls = [
  sqlParameterImpl.simplePropertyFilter(parameters.propertyFilter, columns),
  sqlParameterImpl.search(columns),
  sqlParameterImpl.autocomplete(columns, ['navn']),
  sqlParameterImpl.paging(columns, nameAndKey.key)
];

var baseQuery = function() {
  return {
    select: [],
    from: ['vejstykker' +
      " LEFT JOIN kommuner k ON vejstykker.kommunekode = k.kode" +
      ' LEFT JOIN vejstykkerPostnumreMat  vp1 ON (vp1.kommunekode = vejstykker.kommunekode AND vp1.vejkode = vejstykker.kode)' +
      ' LEFT JOIN Postnumre p ON (p.nr = vp1.postnr)' +
      ' LEFT JOIN vejstykkerPostnumreMat vp2 ON (vp2.kommunekode = vejstykker.kommunekode AND vp2.vejkode = vejstykker.kode)'],
    whereClauses: [],
    groupBy: 'vejstykker.kode, vejstykker.kommunekode, k.kode, k.navn',
    orderClauses: [],
    sqlParams: []
  };
};

module.exports = assembleSqlModel(columns, parameterImpls, baseQuery);

var registry = require('../registry');
registry.add('vejstykke', 'sqlModel', undefined, module.exports);
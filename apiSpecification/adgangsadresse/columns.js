"use strict";
var dbapi = require('../../dbapi');
var sqlUtil = require('../common/sql/sqlUtil');

var selectIsoTimestamp = sqlUtil.selectIsoDate;

module.exports =  {
  id: {
    column: 'a_id'
  },
  status: {
    column: 'a_objekttype'
  },
  etrs89koordinat_øst: {
    column: 'oest'
  },
  etrs89koordinat_nord: {
    column: 'nord'
  },
  wgs84koordinat_bredde: {
    column: 'ST_Y(ST_Transform(geom, 4326))'
  },
  wgs84koordinat_længde: {
    column: 'ST_X(ST_Transform(geom, 4326))'
  },
  nøjagtighed: {
    column: 'noejagtighed'
  },
  ddkn_m100: {
    select: "'100m_' || (floor(nord / 100))::text || '_' || (floor(oest / 100))::text"
  },
  ddkn_km1: {
    select: "'1km_' || (floor(nord / 1000))::text || '_' || (floor(oest / 1000))::text"
  },
  ddkn_km10: {
    select: "'10km_' || (floor(nord / 10000))::text || '_' || (floor(oest / 10000))::text"
  },
  adressepunktændringsdato: {
    column: selectIsoTimestamp('adressepunktaendringsdato')
  },
  geom_json: {
    select: function(sqlParts, sqlModel, params) {
      var sridAlias = dbapi.addSqlParameter(sqlParts, params.srid || 4326);
      return 'ST_AsGeoJSON(ST_Transform(geom,' + sridAlias + '))';
    }
  },
  oprettet: {
    select: selectIsoTimestamp('a_oprettet')
  },
  ændret: {
    select: selectIsoTimestamp('a_aendret')
  },
  ikrafttrædelse: {
    select: selectIsoTimestamp('a_ikraftfra')
  },
  tsv: {
    column: 'tsv'
  }
};
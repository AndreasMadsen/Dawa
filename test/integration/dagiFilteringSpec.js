"use strict";

var expect = require('chai').expect;
var request = require("request-promise");

var dbapi = require('../../dbapi');
var registry = require('../../apiSpecification/registry');
var resourceImpl = require('../../apiSpecification/common/resourceImpl');
var tema = require('../../temaer/tema');
require('../../apiSpecification/allSpecs');

describe('Filtrering af adresser ud fra DAGI tema kode', function() {
  // der er 390 adgangsadresser inden for denne polygon
  var sampleTema = {
    tema: 'region',
    fields: {
      kode: 10,
      navn: 'Test Region'
    },
    polygons: ['POLYGON((' +
      '725025.18 6166264.37,' +
      '725025.18 6167537.76,' +
      '731289.6 6167537.76,' +
      '731289.6 6166264.37,' +
      '725025.18 6166264.37))']
  };

  var expectedResultsRegion = {
    adgangsadresse: 277,
    adresse: 279
  };
  var expectedResultsZone1 = {
    adgangsadresse: 1,
    adresse: 1
  };
  var expectedResultWithoutRegion = {
    adgangsadresse: 1319,
    adresse: 2801
  };

  var temaSpec = tema.findTema('region');
  ['adgangsadresse', 'adresse'].forEach(function(entityName) {
    var resourceSpec = registry.findWhere({
      entityName: entityName,
      type: 'resource',
      qualifier: 'query'
    });
    it(' for region på '  + entityName, function (done) {
      dbapi.withRollbackTransaction(function (err, client, transactionDone) {
        if (err) { throw err; }
        tema.addTema(client, sampleTema, function (err) {
          if(err) { throw err; }
          tema.updateAdresserTemaerView(client, temaSpec, false).nodeify( function(err) {
            if(err) { throw err; }
            var params = { regionskode: "10" };
            var processedParams = resourceImpl.internal.parseAndProcessParameters(resourceSpec, [], params).processedParams;
            var query = resourceSpec.sqlModel.createQuery(['id'], processedParams);
            dbapi.queryRaw(client, query.sql, query.params, function(err, result) {
              if(err) { throw err; }
              expect(result.length).to.equal(expectedResultsRegion[entityName]);
              transactionDone();
              done();
            });
          });
        });
      });
    });

    it(' for '  + entityName + 'r uden regionstilknytning', function (done) {
      request.get({url: 'http://localhost:3002' + resourceSpec.path + '?regionskode=', json: true}, function(error, response, result) {
        expect(result.length).to.equal(expectedResultWithoutRegion[entityName]);
        done();
      });
    });

    it(' for zone på '  + entityName, function (done) {
      request.get({url: 'http://localhost:3002' + resourceSpec.path + '?zonekode=1', json: true}, function(error, response, result) {
        expect(result.length).to.equal(expectedResultsZone1[entityName]);
        done();
      });
    });

    it(' for '  + entityName + 'r uden zonetilknytning', function (done) {
      request.get({url: 'http://localhost:3002' + resourceSpec.path, json: true}, function(error, response, result) {
        var totalCount = result.length;
        // we know that only associations to zone 1 exists, so the expected count can be computed from totalCount and the expected number of hits for zone 1
        request.get({url: 'http://localhost:3002' + resourceSpec.path + '?zonekode=', json: true}, function(error, response, result) {
          expect(result.length).to.equal(totalCount - expectedResultsZone1[entityName]);
          done();
        });
      });
    });
  });
});

"use strict";

var request = require("request");
var _       = require("underscore");

describe('Autocomplete af adresser', function() {
  it('Should be possible to autocomplete an address', function(done) {
    request.get({url: 'http://localhost:3000/api/pg/adresser/autocomplete?q=Dalve', json: true}, function(error, response, result) {
      expect(response.statusCode).toEqual(200);
      expect(_.isArray(result)).toBe(true);
      var suggestion = result[0];
      expect(suggestion.tekst).toBeDefined();
      expect(suggestion.tekst).toMatch(/Dalve/);
      expect(suggestion.adresse).toBeDefined();
      done();
    });
  });
  it('Should default to a value of 20 for per_side parameter', function(done) {
    request.get({url: 'http://localhost:3000/api/pg/adresser/autocomplete?q=si', json: true}, function(error, response, result) {
      expect(result.length).toBe(20);
      done();
    });
  });

  it('Should accept filtering parameter', function(done) {
    request.get({url: 'http://localhost:3000/api/pg/adresser/autocomplete?q=si&vejkode=0084&kommunekode=0740', json: true}, function(error, response, result) {
      expect(result.length).toBe(13);
      done();
    });
  });

  it('Suggestions should include a valid link id and href for adress', function(done) {
    request.get({url: 'http://localhost:3000/api/pg/adresser/autocomplete?q=si', json: true}, function(error, response, result) {
      var suggestion = result[0];
      var id = suggestion.adresse.id;
      var href = suggestion.adresse.href;
      expect(href).toMatch(new RegExp(id));
      request.get(href, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
  });
});
"use strict";

var request = require("request");
var _       = require('underscore');


describe('Paginering', function () {
  function getJson(uri, cb) {
    request.get(uri, function(error, response, body) {
      if(error) throw error;
      expect(response.statusCode).toBe(200);
      cb(JSON.parse(body));
    });
  }

  it("Should return the specified number of results", function(done) {
    getJson('http://localhost:3000/api/pg/adresser?side=1&per_side=10', function(result) {
      expect(result.length).toBe(10);
      done();
    });
  });
  it("Should return the results for the specified page", function(done) {
    getJson('http://localhost:3000/api/pg/adresser?side=1&per_side=10', function(page1) {
      getJson('http://localhost:3000/api/pg/adresser?side=2&per_side=10', function(page2) {
        getJson('http://localhost:3000/api/pg/adresser?side=1&per_side=20', function(bothPages) {
          expect(page1.length).toBe(10);
          expect(page2.length).toBe(10);
          expect(page1).not.toEqual(page2);
          expect(bothPages.length).toBe(20);
          _.each(page1.concat(page2),
                function(adr, index){
                  expect(adr).toEqual(bothPages[index]);
                });

          done();
        });
      });
    });
  });
  it("side parameter should default to 1 when per_side is specified", function(done) {
    getJson('http://localhost:3000/api/pg/adresser?side=1&per_side=10', function(page1) {
      getJson('http://localhost:3000/api/pg/adresser?per_side=10', function(page2) {
        expect(page1).toEqual(page2);
        done();
      });
    });
  });
  it("per_side parameter should default to 20 when side is specified", function(done) {
    getJson('http://localhost:3000/api/pg/adresser?side=2&per_side=20', function(page1) {
      getJson('http://localhost:3000/api/pg/adresser?side=2', function(page2) {
        expect(page1).toEqual(page2);
        done();
      });
    });
  });
  it("Illegal parameter value for side should result in error", function(done) {
    request.get('http://localhost:3000/api/pg/adresser?side=0&per_side=20', function(error, response) {
      expect(response.statusCode).toBe(400);
      done();
    });
  });
  it("Illegal parameter value for per_side should result in error", function(done) {
    request.get('http://localhost:3000/api/pg/adresser?side=1&per_side=-10', function(error, response) {
      expect(response.statusCode).toBe(400);
      done();
    });
  });
});
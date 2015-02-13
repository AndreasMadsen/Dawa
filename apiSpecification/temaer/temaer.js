"use strict";

module.exports = [
  {
    singular: 'region',
    singularSpecific: 'regionen',
    plural: 'regioner',
    prefix: 'regions',
    key: [{
      name: 'kode',
      type: 'integer'
    }],
    published: true
  },
  {
    singular: 'kommune',
    singularSpecific: 'kommunen',
    plural: 'kommuner',
    prefix: 'kommune',
    key: [{
      name: 'kode',
      type: 'integer'
    }],
    published: true
  },
  {
    singular: 'sogn',
    singularSpecific: 'sognet',
    plural: 'sogne',
    prefix: 'sogne',
    key: [{
      name: 'kode',
      type: 'integer'
    }],
    published: true
  },
  {
    singular: 'politikreds',
    singularSpecific: 'politikredsen',
    plural: 'politikredse',
    prefix: 'politikreds',
    key: [{
      name: 'kode',
      type: 'integer'
    }],
    published: true
  },
  {
    singular: 'retskreds',
    singularSpecific: 'retskredsen',
    plural: 'retskredse',
    prefix: 'retskreds',
    key: [{
      name: 'kode',
      type: 'integer'
    }],
    published: true
  },
  {
    singular: 'opstillingskreds',
    singularSpecific: 'opstillingskredsen',
    plural: 'opstillingskredse',
    prefix: 'opstillingskreds',
    key: [{
      name: 'kode',
      type: 'integer'
    }],
    published: true
  },
  {
    singular: 'postnummer',
    singularSpecific: 'postnummeret',
    plural: 'postnumre',
    prefix: 'postnummer',
    key: [{
      name: 'nr',
      type: 'integer'
    }],

    published: false
  },
  {
    singular: 'zone',
    singularSpecific: 'zonen',
    plural: 'zoner',
    prefix: 'zone',
    key: [{
      name: 'zone',
      type: 'integer'
    }],
    published: false
  },
  {
    singular: 'valglandsdel',
    singularSpecific: 'valglandsdelen',
    plural: 'valglandsdele',
    prefix: 'valglandsdels',
    key: [{
      name: 'bogstav',
      type: 'string'
    }],
    published: true
  },
  {
    singular: 'jordstykke',
    singularSpecific: 'jordstykket',
    plural: 'jordstykker',
    prefix: 'jordstykke',
    key: [{
      name: 'ejerlavkode',
      type: 'integer'
    }, {
      name: 'matrikelnr',
      type: 'string'
    }],
    published: true
  }
];

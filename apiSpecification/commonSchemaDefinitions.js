"use strict";

var dagiTemaer = require('./dagiTemaer');
var schemaUtil = require('./schemaUtil');
var _ = require('underscore');

var schemaObject = schemaUtil.schemaObject;
var nullableType = schemaUtil.nullableType;
var nullable = schemaUtil.nullable;

var definitions = {
  'UUID' : {type: 'string', pattern: '^([0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12})$'},
  'Href' : {
    type: 'string'
  },
  'Etage': {type: 'string', pattern: '^([1-9]|[1-9][0-9]|st|kl[1-9]?)$'},
  'Kode4': {type: 'string', pattern: '^[\\d]{4}$'},
  'UpTo7': {type: 'integer', minimum: 1, maximum: 9999999},
  'DateTime': {
    type: 'string'
  },
  GeoJsonCoordinates: {
    type: 'array',
    items: {
      description: 'koordinat for punktet.',
      type: 'number'
    },
    "minItems": 2,
    "maxItems": 2
  },
  GeoJsonPunkt: schemaObject({
    properties: {
      'type': {
        description: 'Har altid værdien \'Point\'.',
        enum: ['Point']
      },
      coordinates: {
        description: 'koordinateterne for punktet.',
        $ref: '#/definitions/GeoJsonCoordinates'
      }
    },
    docOrder: ['type', 'coordinates']
  }),
  Postnr: {
    type: 'string',
    pattern: "^[\\d]{4}$"
  },
  PostnummerRef: schemaObject({
    properties: {
      href: {
        description: 'Postnummerets unikke URL',
        type: 'string'
      },
      nr: {
        description: 'Postnummer',
        '$ref': '#/definitions/Postnr'
      },
      navn: {
        description: 'Det navn der er knyttet til postnummeret, typisk byens eller bydelens navn. ' +
          'Repræsenteret ved indtil 20 tegn. Eksempel: ”København NV”.',
        type: nullableType('string')
      }
    },
    docOrder: ['href', 'nr', 'navn']
  }),
  KommuneRef: schemaObject({
    properties: {
      href: {
        description: 'Kommunens unikke URL.',
        type: 'string'
      },
      kode: {
        description: 'Kommunekoden. 4 cifre.',
        '$ref': '#/definitions/Kode4'
      },
      navn: {
        description: 'Kommunens navn.',
        type: nullableType('string')
      }
    },
    docOrder: ['href', 'kode', 'navn']
  }),
  VejnavnRef: schemaObject({
    properties: {
      href: {
        description: 'Vejnavnets unikke URL.',
        type: 'string'
      },
      navn: {
        description: 'Vejnavnet.',
        type: 'string'
      }
    },
    docOrder: ['href', 'navn']
  }),
  VejstykkeRef: schemaObject({
    properties: {
      href: {
        description: 'Vejnavnets unikke URL.',
        type: 'string'
      },
      kommunekode: {
        description: 'Kommunekoden. 4 cifre.',
        $ref: '#/definitions/Kode4'
      },
      kode: {
        description: 'Vejkoden. 4 cifre.',
        $ref: '#/definitions/Kode4'
      },
      navn: {
        description: 'Vejnavnet.',
        type: 'string'
      }
    },
    docOrder: ['href', 'kommunekode', 'kode','navn']
  }),
  SupplerendeBynavnRef: schemaObject({
    properties: {
      href: {
        description: 'Det supplerende bynavns unikke URL.',
        type: 'string'
      },
      navn: {
        description: 'Det supplerende bynavn.',
        type: 'string'
      }
    },
    docOrder: ['href', 'navn']
  }),
  AdgangsadresseRef: schemaObject({
    properties: {
      href: {
        description: 'Adgangsadressens unikke URL.',
        type: 'string'
      },
      id: {
        description: 'Adgangsadressens unikke UUID.',
        $ref: '#/definitions/UUID'
      }
    },
    docOrder: ['href', 'id']
  }),
  AdresseRef: schemaObject({
    properties: {
      href: {
        description: 'Adressens unikke URL.',
        type: 'string'
      },
      id: {
        description: 'Adressens unikke UUID.',
        $ref: '#/definitions/UUID'
      }
    },
    docOrder: ['href', 'id']
  }),
  VejstykkeKodeOgNavn: schemaObject({
    properties: {
      href: {
        description: 'Vejstykkets unikke URL.',
        type: 'string'
      },
      kode: {
        description: 'Identifikation af vejstykket. ' +
          'Er unikt indenfor den pågældende kommune. Repræsenteret ved fire cifre. ' +
          'Eksempel: I Københavns kommune er ”0004” lig ”Abel Cathrines Gade”.',
        '$ref': '#/definitions/Kode4'
      },
      navn: {
        description: 'Vejens navn.',
        type: nullableType('string')
      }
    },
    docOrder: ['href', 'kode', 'navn']
  })
};

function dagiSchema(dagiTema) {
  return  {
    'title': dagiTema.singular,
    'properties': {
      'href': {
        description: dagiTema.singularSpecific + 's unikke URL.',
        $ref: '#/definitions/Href'
      },
      'kode': {
        description: 'Fircifret ' + dagiTema.singular + 'kode.',
        $ref: '#/definitions/Kode4'
      },
      'navn': {
        description: dagiTema + dagiTema.singularSpecific + 's navn.',
        type: 'string'
      }
    },
    'docOrder': ['href', 'kode', 'navn']
  };
}

dagiTemaer.forEach(function(dagiTema) {
  definitions[dagiTema.singular + 'Ref'] = schemaObject(dagiSchema(dagiTema));
});

_.each(definitions, function(value, key) {
  definitions['Nullable' + key] = nullable(value);
});


module.exports = definitions;
"use strict";

var _ = require('underscore');

var representationUtil = require('../common/representationUtil');
var fields = require('./fields');
var commonMappers = require('../commonMappers');
var commonSchemaDefinitionsUtil = require('../commonSchemaDefinitionsUtil');
var schemaUtil = require('../schemaUtil');
var dagiTemaer = require('../dagitemaer/dagiTemaer');
var util = require('../util');

var adressebetegnelse = util.adressebetegnelse;
var schemaObject = schemaUtil.schemaObject;
var globalSchemaObject = commonSchemaDefinitionsUtil.globalSchemaObject;
var makeHref = commonMappers.makeHref;
var mapPostnummerRef = commonMappers.mapPostnummerRef;
var mapKommuneRef = commonMappers.mapKommuneRef;
var d = util.d;
var maybeNull = util.maybeNull;


var nullableType = schemaUtil.nullableType;
var kode4String = require('../util').kode4String;

/*
 * flat format
 */
exports.flat = representationUtil.adresseFlatRepresentation(fields);

exports.json = {
  fields: _.where(fields, {selectable: true}),
  schema: globalSchemaObject({
    title: 'Adgangsadresse',
    properties: {
      href: {
        description: 'Adgangsadressens URL.',
        $ref: '#/definitions/Href'
      },
      'id'     : {
        description: 'Universel, unik identifikation af adressen af datatypen UUID. ' +
          'Er stabil over hele adressens levetid (ligesom et CPR-nummer) ' +
          'dvs. uanset om adressen evt. ændrer vejnavn, husnummer, postnummer eller kommunekode. ' +
          'Repræsenteret som 32 hexadecimale tegn. Eksempel: ”0a3f507a-93e7-32b8-e044-0003ba298018”.',
        '$ref': '#/definitions/UUID'
      },
      'vejstykke'    : {
        description: 'Vejstykket som adressen er knyttet til. Udgår og bliver erstattet af Navngiven vej.',
        $ref: '#/definitions/VejstykkeKodeOgNavn'
      },
      'husnr'  : {
        description: 'Husnummer der identificerer den pågældende adresse i forhold til andre adresser med samme vejnavn.' +
          ' Husnummeret består af et tal 1-999 evt. suppleret af et stort bogstav A..Z, og fastsættes i stigende orden, ' +
          'normalt med lige og ulige numre på hver side af vejen. Eksempel: "11", "12A", "187B".',
        type: 'string',
        pattern: '([1-9]|[1-9]\\d|[1-9]\\d{2})[A-Z]?'
      },
      'supplerendebynavn': {
        description: 'Et supplerende bynavn – typisk landsbyens navn – eller andet lokalt stednavn der er fastsat af ' +
          'kommunen for at præcisere adressens beliggenhed indenfor postnummeret. ' +
          'Indgår som en del af den officielle adressebetegnelse. Indtil 34 tegn. Eksempel: ”Sønderholm”.',
        type: nullableType('string'), maxLength: 34
      },
      'postnummer': {
        description: 'Postnummeret som adressen er beliggende i.',
        $ref: '#/definitions/NullablePostnummerRef'
      },
      'kommune':{
        description: 'Kommunen som adressen er beliggende i.',
        $ref: '#/definitions/KommuneRef'
      },
      'ejerlav': schemaObject({
        description: 'Det matrikulære ejerlav som adressen ligger i.',
        nullable: true,
        properties: {
          'kode': {
            description: 'Unik identifikation af det matrikulære ”ejerlav”, som adressen ligger i. ' +
              'Repræsenteret ved indtil 7 cifre. Eksempel: ”170354” for ejerlavet ”Eskebjerg By, Bregninge”.',
            '$ref': '#/definitions/UpTo7'
          },
          'navn': {
            description: 'Det matrikulære ”ejerlav”s navn. Eksempel: ”Eskebjerg By, Bregninge”.',
            type: 'string'
          }
        },
        docOrder: ['kode', 'navn']
      }),
      'matrikelnr': {
        description: 'Betegnelse for det matrikelnummer, dvs. jordstykke, som adressen er beliggende på. ' +
          'Repræsenteret ved Indtil 7 tegn: max. 4 cifre + max. 3 små bogstaver. Eksempel: ”18b”.',
        type: nullableType('string'),
        pattern: '^[0-9a-zæøå]{1,7}$'
      },
      'esrejendomsnr': {
        description: 'Identifikation af den vurderingsejendom jf. Ejendomsstamregisteret, ' +
          'ESR, som det matrikelnummer som adressen ligger på, er en del af. ' +
          'Repræsenteret ved seks cifre. Eksempel ”001388”.',
        type: nullableType('string'),
        pattern: '^[0-9]{1,6}'
      },
      'historik' : schemaObject({
        'description': 'Væsentlige tidspunkter for adressen',
        properties: {
          'oprettet': {
            description: 'Dato og tid for adressens oprettelse. Eksempel: 2001-12-23T00:00:00.',
            '$ref': '#/definitions/NullableDateTime'
          },
          'ikrafttrædelse': {
            description: 'Dato og tid for adressens ikrafttrædelse. Eksempel: 2002-01-01T00:00:00.',
            '$ref': '#/definitions/NullableDateTime'
          },
          'ændret': {
            description: 'Dato og tid hvor der sidst er ændret i adressen. Eksempel: 2002-04-08T00:00:00.',
            type: nullableType('string'),
            '$ref': '#/definitions/NullableDateTime'
          }
        },
        docOrder: ['oprettet', 'ikrafttrædelse', 'ændret']

      }),
      'adgangspunkt': schemaObject({
        description: 'Geografisk punkt, som angiver særskilt adgang fra navngiven vej ind på et areal eller bygning.',
        properties: {
          koordinater: {
            description: 'Adgangspunktets koordinater som array [x,y].',
            $ref: '#/definitions/NullableGeoJsonCoordinates'
          },
          nøjagtighed: {
            description: 'Kode der angiver nøjagtigheden for adressepunktet. ' +
              'Et tegn. ”A” betyder at adressepunktet er absolut placeret på et detaljeret grundkort, ' +
              'tyisk med en nøjagtighed bedre end +/- 2 meter. ”B” betyder at adressepunktet er beregnet – ' +
              'typisk på basis af matrikelkortet, således at adressen ligger midt på det pågældende matrikelnummer. ' +
              'I så fald kan nøjagtigheden være ringere en end +/- 100 meter afhængig af forholdene. ' +
              '”U” betyder intet adressepunkt.',
            type: 'string',
            pattern: '^A|B|U$'
          },
          kilde: {
            description: 'Kode der angiver kilden til adressepunktet. Et tegn. ' +
              '”1” = oprettet maskinelt fra teknisk kort; ' +
              '”2” = Oprettet maskinelt fra af matrikelnummer tyngdepunkt; ' +
              '”3” = Eksternt indberettet af konsulent på vegne af kommunen; ' +
              '”4” = Eksternt indberettet af kommunes kortkontor o.l. ' +
              '”5” = Oprettet af teknisk forvaltning."',
            type: nullableType('integer'), minimum: 1, maximum: 5

          },
          tekniskstandard: {
            description: 'Kode der angiver den specifikation adressepunktet skal opfylde. 2 tegn. ' +
              '”TD” = 3 meter inde i bygningen ved det sted hvor indgangsdør e.l. skønnes placeret; ' +
              '”TK” = Udtrykkelig TK-standard: 3 meter inde i bygning, midt for længste side mod vej; ' +
              '”TN” Alm. teknisk standard: bygningstyngdepunkt eller blot i bygning; ' +
              '”UF” = Uspecificeret/foreløbig: ikke nødvendigvis placeret i bygning."',
            type: nullableType('string'),
            pattern: '^TD|TK|TN|UF$'
          },
          tekstretning: {
            description: 'Angiver en evt. retningsvinkel for adressen i ”gon” ' +
              'dvs. hvor hele cirklen er 400 gon og 200 er vandret. ' +
              'Værdier 0.00-400.00: Eksempel: ”128.34”.',
            type: nullableType('number'),
            minimum: 0,
            maximum: 400
          },
          ændret: {
            description: 'Dato og tid for sidste ændring i adressepunktet. Eksempel: ”1998-11-17T00:00:00”',
            '$ref': '#/definitions/NullableDateTime'
          }
        },
        docOrder: ['koordinater','nøjagtighed','kilde', 'tekniskstandard','tekstretning', 'ændret']
      }),
      'DDKN': schemaObject({
        nullable: true,
        description: 'Adressens placering i Det Danske Kvadratnet (DDKN).',
        properties: {
          'm100': {
            description: 'Angiver betegnelsen for den 100 m celle som adressen er beliggende i. 15 tegn. Eksempel: ”100m_61768_6435”.',
            type: 'string',
            pattern: '^100m_(\\d{5})_(\\d{4})$'
          },
          'km1' : {
            description: 'Angiver betegnelsen for den 1 km celle som adressen er beliggende i. 12 tegn. Eksempel: ”1km_6176_643”.',
            type: 'string',
            pattern:  '^1km_(\\d{4})_(\\d{3})$'
          },
          'km10': {
            description: 'Angiver betegnelsen for den 10 km celle som adressen er beliggende i. 11 tegn. Eksempel: ”10km_617_64”.',
            type: 'string',
            pattern: '^10km_(\\d{3})_(\\d{2})$'
          }
        },
        docOrder: ['m100', 'km1', 'km10']
      }),
      'sogn': schemaObject({
        nullable: true,
        description: 'Sognet som adressen er beliggende i.',
        properties: {
          kode: {
            description: 'Identifikation af sognet',
            $ref: '#/definitions/Kode4'
          },
          navn: {
            description: 'Sognets navn',
            type: 'string'
          }
        },
        docOrder: ['kode', 'navn']
      }),
      'region': schemaObject({
        nullable: true,
        description: 'Regionen som adressen er beliggende i.',
        properties: {
          kode: {
            description: 'Identifikation af regionen',
            $ref: '#/definitions/Kode4'
          },
          navn: {
            description: 'Regionens navn',
            type: 'string'
          }
        },
        docOrder: ['kode', 'navn']
      }),
      'retskreds': schemaObject({
        nullable: true,
        description: 'Retskredsen som adressen er beliggende i.',
        properties: {
          kode: {
            description: 'Identifikation af retskredsen',
            $ref: '#/definitions/Kode4'
          },
          navn: {
            description: 'Retskredsens navn',
            type: 'string'
          }
        },
        docOrder: ['kode', 'navn']
      }),
      'politikreds': schemaObject({
        nullable: true,
        description: 'Politikredsen som adressen er beliggende i.',
        properties: {
          kode: {
            description: 'Identifikation af politikredsen',
            $ref: '#/definitions/Kode4'
          },
          navn: {
            description: 'Politikredsens navn',
            type: 'string'
          }
        },
        docOrder: ['kode', 'navn']
      }),
      'opstillingskreds': schemaObject({
        nullable: true,
        description: 'Opstillingskresen som adressen er beliggende i.',
        properties: {
          kode: {
            description: 'Identifikation af opstillingskredsen.',
            $ref: '#/definitions/Kode4'
          },
          navn: {
            description: 'Opstillingskredsens navn.',
            type: 'string'
          }
        },
        docOrder: ['kode', 'navn']
      })
    },
    docOrder: ['href','id', 'vejstykke', 'husnr','supplerendebynavn',
      'postnummer','kommune', 'ejerlav', 'matrikelnr','esrejendomsnr', 'historik',
      'adgangspunkt', 'DDKN', 'sogn','region','retskreds','politikreds','opstillingskreds']
  }),
  mapper: function (baseUrl){
    return function(rs) {
      function mapDagiTema(tema) {
        return {
          href: makeHref(baseUrl, tema.tema, [tema.kode]),
          kode: kode4String(tema.kode),
          navn: tema.navn
        };
      }
      var adr = {};
      adr.href = makeHref(baseUrl, 'adgangsadresse', [rs.id]);
      adr.id = rs.id;
      adr.vejstykke = {
        href: makeHref(baseUrl, 'vejstykke', [rs.vejkode]),
        navn: maybeNull(rs.vejnavn),
        kode: kode4String(rs.vejkode)
      };
      adr.husnr = rs.husnr;
      adr.supplerendebynavn = maybeNull(rs.supplerendebynavn);
      adr.postnummer = mapPostnummerRef({nr: rs.postnr, navn: rs.postnrnavn}, baseUrl);
      adr.kommune = mapKommuneRef({kode: rs.kommunekode, navn: rs.kommunenavn}, baseUrl);
      if(rs.ejerlavkode) {
        adr.ejerlav = {
          kode: rs.ejerlavkode,
          navn: rs.ejerlavnavn
        };
      }
      else {
        adr.ejerlav = null;
      }
      adr.esrejendomsnr = maybeNull(rs.esrejendomsnr);
      adr.matrikelnr = maybeNull(rs.matrikelnr);
      adr.historik = {
        oprettet: d(rs.oprettet),
        ikrafttrædelse: d(rs.ikrafttrædelse),
        ændret: d(rs.ændret)
      };
      adr.adgangspunkt = {
        koordinater: rs.geom_json ? JSON.parse(rs.geom_json).coordinates : null,
        nøjagtighed: maybeNull(rs.nøjagtighed),
        kilde: maybeNull(rs.kilde),
        tekniskstandard: maybeNull(rs.tekniskstandard),
        tekstretning:    maybeNull(rs.tekstretning),
        'ændret':        d(rs.adressepunktændringsdato)
      };
      adr.DDKN = rs.ddkn_m100 || rs.ddkn_km1 || rs.ddkn_km10 ? {
        m100: maybeNull(rs.ddkn_m100),
        km1:  maybeNull(rs.ddkn_km1),
        km10: maybeNull(rs.ddkn_km10)
      } : null;

      // DAGI temaer
      adr.sogn = null;
      adr.region = null;
      adr.retskreds = null;
      adr.politikreds = null;
      adr.opstillingskreds = null;
      var dagiTemaArray = rs.dagitemaer ? rs.dagitemaer.filter(function(tema) { return util.notNull(tema.tema); }) : [];
      var dagiTemaMap = _.indexBy(dagiTemaArray, 'tema');
      // kommune and postdistrikt are handled differently
      delete dagiTemaMap.kommune;
      delete dagiTemaMap.postdistrikt;
      var mappedDagiTemaer = _.reduce(dagiTemaMap, function(memo, tema, temaNavn) {
        memo[temaNavn] = mapDagiTema(tema);
        return memo;
      }, {});
      _.extend(adr, mappedDagiTemaer);
      return adr;
    };
  }
};

var autocompleteFieldNames = ['id', 'vejnavn', 'husnr', 'supplerendebynavn', 'postnr', 'postnrnavn'];
exports.autocomplete = {
  fields: representationUtil.fieldsWithNames(fields, autocompleteFieldNames),
  schema: globalSchemaObject({
    properties: {
      tekst: {
        description: 'Adgangsadressen på formen {vej} {husnr}, {supplerende bynavn}, {postnr} {postnrnavn}',
        type: 'string'
      },
      adgangsadresse: {
        description: 'Link og id for adgangsadressen.',
        $ref: '#/definitions/AdgangsadresseRef'
      }
    },
    docOrder: ['tekst', 'adgangsadresse']
  }),
  mapper: function(baseUrl) {
    return function (row) {
      function adresseText(row) {
        return adressebetegnelse(row, true).replace(/\n/g, ', ');
      }

      return {
        tekst: adresseText(row),
        adgangsadresse: {
          id: row.id,
          href: makeHref(baseUrl, 'adgangsadresse', [row.id])
        }
      };
    };
  }
};

exports.geojson = representationUtil.geojsonRepresentation(_.findWhere(fields, {name: 'geom_json'}), exports.flat);

var registry = require('../registry');
registry.addMultiple('adgangsadresse', 'representation', module.exports);
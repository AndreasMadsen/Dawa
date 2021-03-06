"use strict";

var _ = require('underscore');

var ddknSchemas = require('./ddknSchemas');
var temaNameAndKeys = require('../temaer/namesAndKeys');
var representationUtil = require('../common/representationUtil');
var fields = require('./fields');
var commonMappers = require('../commonMappers');
var commonSchemaDefinitions = require('../commonSchemaDefinitions');
var commonSchemaDefinitionsUtil = require('../commonSchemaDefinitionsUtil');
var schemaUtil = require('../schemaUtil');
var util = require('../util');

var adressebetegnelse = util.adressebetegnelse;
var schemaObject = schemaUtil.schemaObject;
var globalSchemaObject = commonSchemaDefinitionsUtil.globalSchemaObject;
var makeHref = commonMappers.makeHref;
var mapPostnummerRef = commonMappers.mapPostnummerRef;
var mapKommuneRef = commonMappers.mapKommuneRef;
var d = util.d;

var maybeNull = util.maybeNull;

var normalizedFieldSchemas = require('../replikering/normalizedFieldSchemas');
var normalizedFieldSchema = function(fieldName) {
  return normalizedFieldSchemas.normalizedSchemaField('adgangsadresse', fieldName);
};

var nullableType = schemaUtil.nullableType;
var kode4String = require('../util').kode4String;
var kvhFormat = require('./kvhTransformer').format;
var kvhFieldsDts = require('./kvhTransformer').kvhFieldsDts;

var normalizedDdknSchema = function(fieldName) {
  var field = _.findWhere(ddknSchemas, {name: fieldName});
  var schema = _.clone(field.schema);
  schema.description = field.description;
  return schema;
}

  /*
   * flat format
   */
exports.flat = representationUtil.adresseFlatRepresentation(fields, function(rs) {
  return {
    kvh: kvhFormat(rs)
  };
});

exports.json = {
  fields: _.where(fields, {selectable: true}),
  schema: globalSchemaObject({
    title: 'Adgangsadresse',
    properties: {
      href: {
        description: 'Adgangsadressens URL.',
        $ref: '#/definitions/Href'
      },
      'id'     : normalizedFieldSchema('id'),
      status: normalizedFieldSchema('status'),
      'vejstykke'    : {
        description: 'Vejstykket som adressen er knyttet til.',
        $ref: '#/definitions/VejstykkeKodeOgNavn'
      },
      'husnr'  : normalizedFieldSchema('husnr'),
      'supplerendebynavn': normalizedFieldSchema('supplerendebynavn'),
      'postnummer': {
        description: 'Postnummeret som adressen er beliggende i.',
        $ref: '#/definitions/NullablePostnummerRef'
      },
      stormodtagerpostnummer: {
        description: 'Evt. stormodtagerpostnummer (firmapostnummer) som er tilknyttet adressen.',
        $ref: '#/definitions/NullablePostnummerRef'
      },
      'kommune':{
        description: 'Kommunen som adressen er beliggende i.',
        $ref: '#/definitions/KommuneRef'
      },
      'ejerlav': schemaObject({
        description: 'DEPRECATED. Opdateres ikke længere. Benyt "jordstykke" i stedet. ' +
        'Feltet indeholder den værdi der i sin tid var registreret i BBR. I dag beregnes det tilhørende' +
        ' jordstykke ud fra adgangspunktets placering.',
        nullable: true,
        properties: {
          'kode': normalizedFieldSchema('ejerlavkode'),
          'navn': {
            description: 'Det matrikulære ”ejerlav”s navn. Eksempel: ”Eskebjerg By, Bregninge”.',
            type: 'string'
          }
        },
        docOrder: ['kode', 'navn']
      }),
      'matrikelnr': normalizedFieldSchema('matrikelnr'),
      'esrejendomsnr': normalizedFieldSchema('esrejendomsnr'),
      'historik' : schemaObject({
        'description': 'Væsentlige tidspunkter for adgangsadressen',
        properties: {
          'oprettet': normalizedFieldSchema('oprettet'),
          'ændret': normalizedFieldSchema('ændret')
        },
        docOrder: ['oprettet', 'ændret']

      }),
      'adgangspunkt': schemaObject({
        description: 'Geografisk punkt, som angiver særskilt adgang fra navngiven vej ind på et areal eller bygning.',
        properties: {
          koordinater: {
            description: 'Adgangspunktets koordinater som array [x,y].',
            $ref: '#/definitions/NullableGeoJsonCoordinates'
          },
          nøjagtighed: normalizedFieldSchema('nøjagtighed'),
          kilde: normalizedFieldSchema('kilde'),
          tekniskstandard: normalizedFieldSchema('tekniskstandard'),
          tekstretning: normalizedFieldSchema('tekstretning'),
          ændret: normalizedFieldSchema('adressepunktændringsdato')
        },
        docOrder: ['koordinater','nøjagtighed','kilde', 'tekniskstandard','tekstretning', 'ændret']
      }),
      'DDKN': schemaObject({
        nullable: true,
        description: 'Adressens placering i Det Danske Kvadratnet (DDKN).',
        properties: {
          'm100': normalizedDdknSchema('ddkn_m100'),
          'km1' : normalizedDdknSchema('ddkn_km1'),
          'km10': normalizedDdknSchema('ddkn_km10')
        },
        docOrder: ['m100', 'km1', 'km10']
      }),
      'sogn': {
        description: 'Sognet som adressen er beliggende i. Beregnes udfra adgangspunktet og sogneinddelingerne fra <a href="http://www.gst.dk/emner/frie-data/hvilke-data-er-omfattet/hvilke-data-er-frie/landinddelinger/danmarks-administrative-geografiske-inddelinger-(dagi)/">DAGI</a>',
        $ref: '#/definitions/NullableSogneRef'
      },
      'region': {
        description: 'Regionen som adressen er beliggende i. Beregnes udfra adgangspunktet og regionsinddelingerne fra <a href="http://www.gst.dk/emner/frie-data/hvilke-data-er-omfattet/hvilke-data-er-frie/landinddelinger/danmarks-administrative-geografiske-inddelinger-(dagi)/">DAGI</a>',
        $ref: '#/definitions/NullableRegionsRef'
      },
      'retskreds': {
        description: 'Retskredsen som adressen er beliggende i. Beregnes udfra adgangspunktet og retskredsinddelingerne fra <a href="http://www.gst.dk/emner/frie-data/hvilke-data-er-omfattet/hvilke-data-er-frie/landinddelinger/danmarks-administrative-geografiske-inddelinger-(dagi)/">DAGI</a>',
        $ref: '#/definitions/NullableRetskredsRef'
      },
      'politikreds': schemaObject({
        nullable: true,
        description: 'Politikredsen som adressen er beliggende i. Beregnes udfra adgangspunktet og politikredsinddelingerne fra <a href="http://www.gst.dk/emner/frie-data/hvilke-data-er-omfattet/hvilke-data-er-frie/landinddelinger/danmarks-administrative-geografiske-inddelinger-(dagi)/">DAGI</a>',
        properties: {
          href: {
            description: 'Politikredsens unikke URL',
            type: 'string'
          },
          kode: {
            description: 'Identifikation af politikredsen',
            $ref: '#/definitions/Kode4'
          },
          navn: {
            description: 'Politikredsens navn',
            type: 'string'
          }
        },
        docOrder: ['href', 'kode', 'navn']
      }),
      'opstillingskreds': schemaObject({
        nullable: true,
        description: 'Opstillingskresen som adressen er beliggende i. Beregnes udfra adgangspunktet og opstillingskredsinddelingerne fra <a href="http://www.gst.dk/emner/frie-data/hvilke-data-er-omfattet/hvilke-data-er-frie/landinddelinger/danmarks-administrative-geografiske-inddelinger-(dagi)/">DAGI</a>',
        properties: {
          href: {
            description: 'Opstillingskredsens unikke URL',
            type: 'string'
          },
          kode: {
            description: 'Identifikation af opstillingskredsen.',
            $ref: '#/definitions/Kode4'
          },
          navn: {
            description: 'Opstillingskredsens navn.',
            type: 'string'
          }
        },
        docOrder: ['href', 'kode', 'navn']
      }),
      zone: {
        description: 'Hvilken zone adressen ligger i. "Byzone", "Sommerhusområde" eller "Landzone". Beregnes udfra adgangspunktet og zoneinddelingerne fra <a href="http://naturstyrelsen.dk/planlaegning/plansystemdk/services/wfs/">PlansystemDK</a>',
        enum: [null, 'Byzone', 'Sommerhusområde', 'Landzone']
      },
      jordstykke: schemaObject({
        description: 'Jordstykket, som adressens adgangspunkt ligger på. Dette kan afvige fra det jordstykke der er' +
        ' registreret i BBR.',
        nullable: true,
        properties: {
          href: {
            description: 'Jordstykkets unikke URL',
            type: 'string'
          },
          ejerlav: {
            description: 'Ejerlavet som jordstykket tilhører.',
            $ref: '#/definitions/EjerlavRef'
          },
          matrikelnr: {
            description: 'Jordstykkets matrikelnummer. Udgør sammen med ejerlavet en unik nøgle for jordstykket.' +
            ' Repræsenteret ved Indtil 7 tegn: max. 4 cifre + max. 3 små bogstaver. Eksempel: ”18b”',
            $ref: '#/definitions/matrikelnr'
          },
          esrejendomsnr: {
            description: 'Identifikation af den vurderingsejendom jf. Ejendomsstamregisteret, ESR,' +
            ' som jordstykket er en del af. Repræsenteret ved op til syv cifre. Eksempel ”13606”.',
            schema: commonSchemaDefinitions.Nullableesrejendomsnr
          }
        },
        docOrder: ['href', 'ejerlav', 'matrikelnr', 'esrejendomsnr']
      }),
      kvh: {
        description: 'Sammensat nøgle for adgangsadressen. Indeholder til brug for integration til ældre systemer felter, der tilsammen identificerer adressen. Hvis det er muligt, bør adressens id eller href benyttes til identifikation.<br />' +
                     'KVH-nøglen er sammen således:' +
                     '<dl>' +
                      kvhFieldsDts +
                     '</dl>' +
                     'En adresse på vejstykke 1074 (Melvej) nummer 6 i kommune 420 (Assens) vil altså få KVH-nøgle "042010740006"',
        type: 'string'
      }
    },
    docOrder: ['href','id', 'kvh', 'status', 'vejstykke', 'husnr','supplerendebynavn',
      'postnummer', 'stormodtagerpostnummer','kommune', 'ejerlav', 'matrikelnr','esrejendomsnr', 'historik',
      'adgangspunkt', 'DDKN', 'sogn','region','retskreds','politikreds','opstillingskreds', 'zone', 'jordstykke']
  }),
  mapper: function (baseUrl){
    return function(rs) {
      function mapDagiTema(tema) {
        var result = _.clone(tema.fields);
        // this is a hack, and should be fixed.
        if(result.kode) {
          result.kode = kode4String(result.kode);
        }
        result.href = makeHref(baseUrl, tema.tema, [tema.fields[temaNameAndKeys[tema.tema].key[0]]]);
        return result;
      }
      var adr = {};
      adr.href = makeHref(baseUrl, 'adgangsadresse', [rs.id]);
      adr.id = rs.id;
      adr.kvh = kvhFormat(rs);
      adr.status = rs.status;
      adr.vejstykke = {
        href: makeHref(baseUrl, 'vejstykke', [rs.kommunekode, rs.vejkode]),
        navn: maybeNull(rs.vejnavn),
        adresseringsnavn: maybeNull(rs.adresseringsvejnavn),
        kode: kode4String(rs.vejkode)
      };
      adr.husnr = rs.husnr;
      adr.supplerendebynavn = maybeNull(rs.supplerendebynavn);
      adr.postnummer = mapPostnummerRef({nr: rs.postnr, navn: rs.postnrnavn}, baseUrl);
      if(rs.stormodtagerpostnr) {
        adr.stormodtagerpostnummer = mapPostnummerRef(
          {nr: rs.stormodtagerpostnr, navn: rs.stormodtagerpostnrnavn},
          baseUrl);
      }
      else {
        adr.stormodtagerpostnummer = null;
      }
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
      adr.esrejendomsnr = rs.esrejendomsnr ? "" + rs.esrejendomsnr : null;
      adr.matrikelnr = maybeNull(rs.matrikelnr);
      adr.historik = {
        oprettet: d(rs.oprettet),
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
      adr.region = commonMappers.mapKode4NavnTema('region', rs.regionskode, rs.regionsnavn, baseUrl);
      adr.retskreds = null;
      adr.politikreds = null;
      adr.opstillingskreds = null;
      var includedDagiTemaer = ['sogn', 'retskreds','politikreds','opstillingskreds'];
      var temaer = rs.temaer || [];
      var dagiTemaArray =temaer.filter(function(tema) { return _.contains(includedDagiTemaer, tema.tema); });
      var dagiTemaMap = _.indexBy(dagiTemaArray, 'tema');
      var mappedDagiTemaer = _.reduce(dagiTemaMap, function(memo, tema, temaNavn) {
        memo[temaNavn] = mapDagiTema(tema);
        return memo;
      }, {});
      var zoneTemaer = _.where(temaer, {tema: 'zone'});
      if(zoneTemaer.length <= 1) {
        var zoneTema = zoneTemaer[0];
        var zoneKode = zoneTema ? zoneTema.fields.zone : 3;
        adr.zone = util.zoneKodeFormatter(zoneKode);
      }
      var jordstykkeTemaer = _.where(temaer, {tema: 'jordstykke'});
      if(jordstykkeTemaer.length === 1) {
        var jordstykke = jordstykkeTemaer[0];
        var ejerlavkode = jordstykke.fields.ejerlavkode;
        var matrikelnr = jordstykke.fields.matrikelnr;
        var esrejendomsnr = jordstykke.fields.esrejendomsnr  ?  "" + jordstykke.fields.esrejendomsnr : null;
        var result = {
          href: makeHref(baseUrl, 'jordstykke', [ejerlavkode, matrikelnr]),
          matrikelnr: matrikelnr,
          esrejendomsnr: esrejendomsnr
        };
        result.ejerlav = commonMappers.mapEjerlavRef(ejerlavkode, rs.jordstykke_ejerlavnavn, baseUrl);
        adr.jordstykke = result;
      }
      else {
        adr.jordstykke = null;
      }

      // hvis mere en én zone overlapper, eller ingen, så sætter vi zone til null.
      if(adr.zone === undefined) {
        adr.zone = null;
      }

      _.extend(adr, mappedDagiTemaer);
      return adr;
    };
  }
};

var autocompleteFieldNames = ['id', 'vejnavn', 'husnr', 'supplerendebynavn', 'postnr', 'postnrnavn', 'stormodtagerpostnr', 'stormodtagerpostnrnavn'];
exports.autocomplete = {
  fields: representationUtil.fieldsWithNames(fields, autocompleteFieldNames),
  schema: globalSchemaObject({
    properties: {
      tekst: {
        description: 'Adgangsadressen på formen {vej} {husnr}, {supplerende bynavn}, {postnr} {postnrnavn}',
        type: 'string'
      },
      adgangsadresse: {
        description: 'Udvalgte informationer for adgangsadressen.',
        properties: {
          href: {
            description: 'Adgangsadressens unikke URL.',
            type: 'string'
          },
          id: {
            description: 'Adgangsadressens unikke UUID.',
            $ref: '#/definitions/UUID'
          },
          vejnavn: {
            description: 'Vejnavnet',
            type: nullableType('string')
          },
          husnr: {
            description: 'Husnummer',
            $ref: '#/definitions/husnr'
          },
          supplerendebynavn: {
            $ref: '#/definitions/Nullablesupplerendebynavn'
          },
          postnr: {
            description: 'Postnummer',
            type: nullableType('string')
          },
          postnrnavn: {
            description: 'Det navn der er knyttet til postnummeret, typisk byens eller bydelens navn. ' +
              'Repræsenteret ved indtil 20 tegn. Eksempel: ”København NV”.',
            type: nullableType('string')
          },
          stormodtagerpostnr: {
            description: 'Evt. stormodtagerpostnummer, som er tilknyttet adgangsadressen.',
            type: nullableType('string')
          },
          stormodtagerpostnrnavn: {
            description: 'Stormodtagerpostnummerets navn.',
            type: nullableType('string')
          }
        },
        docOrder: ['id', 'href', 'vejnavn', 'husnr', 'supplerendebynavn', 'postnr', 'postnrnavn', 'stormodtagerpostnr', 'stormodtagerpostnrnavn']
      }
    },
    docOrder: ['tekst', 'adgangsadresse']
  }),
  mapper: function(baseUrl) {
    return function (row) {
      function adresseText(row) {
        return adressebetegnelse(row, true);
      }

      return {
        tekst: adresseText(row),
        adgangsadresse: {
          id: row.id,
          href: makeHref(baseUrl, 'adgangsadresse', [row.id]),
          vejnavn: row.vejnavn,
          husnr: row.husnr,
          supplerendebynavn: row.supplerendebynavn,
          postnr: kode4String(row.postnr),
          postnrnavn: row.postnrnavn,
          stormodtagerpostnr: kode4String(row.stormodtagerpostnr),
          stormodtagerpostnrnavn: row.stormodtagerpostnrnavn
        }
      };
    };
  }
};

exports.geojson = representationUtil.geojsonRepresentation(_.findWhere(fields, {name: 'geom_json'}), exports.flat);

var registry = require('../registry');
registry.addMultiple('adgangsadresse', 'representation', module.exports);
DROP VIEW IF EXISTS wfs_adresser CASCADE;

CREATE OR REPLACE VIEW wfs_adresser AS
  SELECT
    e_id::varchar             AS "id",
    e_objekttype AS status,
    etage,
    doer                      AS "dør",
    e_oprettet                AS "oprettet",
    e_ikraftfra               AS "ikrafttrædelsesdato",
    e_aendret                 AS "ændret",
    a_id::varchar             AS "adgangsadresseid",
    kommunekode,
    vejkode,
    vejnavn,
    husnr,
    supplerendebynavn,
    postnr,
    postnrnavn,
    ejerlavkode,
    ejerlavnavn,
    matrikelnr,
    esrejendomsnr,
    a_oprettet                AS "adgangsadresse_oprettet",
    a_ikraftfra               AS "adgangsadresse_ikrafttrædelsesdato",
    a_aendret                 AS "adgangsadresse_ændret",
    a_objekttype AS adgangsadresse_status,
    oest                AS "etrs89koordinat_øst",
    nord                AS "etrs89koordinat_nord",
    noejagtighed              AS "nøjagtighed",
    kilde,
    tekniskstandard,
    tekstretning,
    ddkn_m100,
    ddkn_km1,
    ddkn_km10,
    adressepunktaendringsdato AS "adressepunktændringsdato",
    round((COALESCE(tekstretning, 200) * 0.9 + 360 + 90))::INTEGER % 180 - 90 AS "tekstretninggrader",
    geom
  FROM Adresser;

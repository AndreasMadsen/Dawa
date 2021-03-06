CREATE EXTENSION IF  NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP SEQUENCE IF EXISTS id_sequence CASCADE;
CREATE SEQUENCE id_sequence START 1;

DROP TYPE IF EXISTS PostnummerRef CASCADE;
CREATE TYPE PostnummerRef AS (
  nr integer,
  navn varchar
);

DROP TYPE IF EXISTS KommuneRef CASCADE;
CREATE TYPE KommuneRef AS (
  kode integer,
  navn varchar
);

DROP TYPE IF EXISTS tema_type CASCADE;
CREATE TYPE tema_type AS
ENUM ('kommune', 'region', 'sogn', 'opstillingskreds',
  'politikreds', 'retskreds', 'afstemningsomraade', 'postnummer',
  'danmark', 'menighedsraadsafstemningsomraade',
  'samlepostnummer', 'storkreds', 'supplerendebynavn', 'valglandsdel', 'zone', 'jordstykke');

DROP TYPE IF EXISTS tema_data CASCADE;
CREATE TYPE tema_data AS (
  tema tema_type,
  fields json
);

DROP TYPE IF EXISTS husnr CASCADE;
CREATE TYPE husnr AS (
  tal smallint,
  bogstav varchar(1)
);

CREATE TYPE husnr_range AS RANGE (
  subtype = husnr
);

DROP   TEXT SEARCH CONFIGURATION IF EXISTS adresser;
CREATE TEXT SEARCH CONFIGURATION adresser (copy=simple);
ALTER  TEXT SEARCH CONFIGURATION adresser ALTER MAPPING FOR asciiword,word,numword,asciihword,hword,numhword WITH simple;

DROP   TEXT SEARCH CONFIGURATION IF EXISTS adresser_query;
CREATE TEXT SEARCH CONFIGURATION adresser_query (copy=simple);
ALTER  TEXT SEARCH CONFIGURATION adresser_query ALTER MAPPING FOR asciiword,word,numword,asciihword,hword,numhword WITH simple;

\set ON_ERROR_STOP on
\set ECHO queries


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

DROP TYPE IF EXISTS DagiTemaType CASCADE;
CREATE TYPE DagiTemaType AS
  ENUM ('kommune', 'region', 'sogn', 'opstillingskreds', 'politikreds', 'retskreds', 'afstemningsområde', 'postdistrikt');

DROP TYPE IF EXISTS DagiTemaRef CASCADE;
CREATE TYPE DagiTemaRef AS (
  tema DagiTemaType,
  kode integer,
  navn varchar(255)
);
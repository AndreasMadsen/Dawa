DROP TABLE IF EXISTS stormodtagere;
CREATE TABLE IF NOT EXISTS stormodtagere (
  nr integer NOT NULL,
  navn VARCHAR(20) NOT NULL,
  adgangsadresseid UUID NOT NULL
);

-- This set of triggers will ensure that the postnumre table is always
-- consistent with the stormodtagere table.  The stormodtagere tables
-- is expected to be small, under 100 rows.


-- Delete all stormodtager rows in postnumre that do not have a
-- corresponding row in stormodtagere.
DROP FUNCTION IF EXISTS stormodtager_delete_trigger() CASCADE;
CREATE FUNCTION stormodtager_delete_trigger() RETURNS trigger AS
$$
  BEGIN
    DELETE FROM postnumre p WHERE p.stormodtager = true AND p.nr in (select nr from stormodtagere);
    RETURN NULL;
  END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER stormodtager_delete_trigger AFTER DELETE ON stormodtagere
FOR EACH STATEMENT EXECUTE PROCEDURE stormodtager_delete_trigger();

-- Insert will first delete all "stormodtager" rows in the postnumre
-- table, and then re-insert every stormodtager again.  The
-- stormodtager table being quite small, this approach is feasible.
DROP FUNCTION IF EXISTS stormodtager_insert_trigger() CASCADE;
CREATE FUNCTION stormodtager_insert_trigger() RETURNS trigger
LANGUAGE plpgsql AS
$$
  BEGIN
    PERFORM stormodtagere_init();
    RETURN NULL;
  END;
$$;
CREATE TRIGGER stormodtager_insert_trigger AFTER INSERT ON stormodtagere
FOR EACH STATEMENT EXECUTE PROCEDURE stormodtager_insert_trigger();

-- Updates to the stormodtagere table is not allowed.  Stormodtagere
-- will be changed only through the use of a script, so if any updates
-- happen, this is an error.
DROP FUNCTION IF EXISTS stormodtager_update_trigger() CASCADE;
CREATE FUNCTION stormodtager_update_trigger() RETURNS trigger AS $$
  BEGIN
    RAISE 'ERROR: UPDATE not allowed for table stormodtagere. Use DELETE and INSERT instead!';
  END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER stormodtager_update_trigger AFTER UPDATE ON stormodtagere
FOR EACH ROW EXECUTE PROCEDURE stormodtager_update_trigger();


-- Init function
DROP FUNCTION IF EXISTS stormodtagere_init() CASCADE;
CREATE FUNCTION stormodtagere_init() RETURNS void
LANGUAGE plpgsql AS
$$
  BEGIN
    DELETE FROM postnumre p WHERE p.stormodtager = true;
    INSERT INTO postnumre (nr, navn, stormodtager)
      SELECT nr, max(navn), true FROM stormodtagere GROUP BY nr;
  END;
$$;
-- Clear existing DAWA tables
DELETE FROM vejstykker;
DELETE FROM vejstykker_history;
DELETE FROM adgangsadresser;
DELETE FROM adgangsadresser_history;
DELETE FROM enhedsadresser;
DELETE FROM enhedsadresser_history;
DELETE FROM adgangsadresser_temaer_matview;
DELETE FROM adgangsadresser_temaer_matview_history;
DELETE FROM transaction_history WHERE entity IN ('vejstykke', 'adgangsadresse', 'adresse', 'adgangsadresse_tema');


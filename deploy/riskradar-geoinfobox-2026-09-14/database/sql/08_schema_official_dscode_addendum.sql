-- ---------------------------------------------------------------------------
-- schema_official_dscode_addendum.sql            Stage 1.15 | 14 August 2026
--
-- Re-key ds_division from the generated codes (CEN-001, EAS-045 ...) to the
-- OFFICIAL Survey Department codes carried by DS_Boundary.shp (New_DS_Cod:
-- KA1, AM8, GA14 ...), and register the divisions that shapefile adds.
--
-- Closes SRS §11.3 [O-5] (official codes not adopted) and [O-12] (the official
-- count stood at 340 against a register of 331).
--
-- WHY AN UPDATE AND NOT A RELOAD.  ds_division.id is referenced by
-- indicator_value, vulnerability_result, community_rating and the toolbox
-- result tables.  Deleting and re-inserting would either cascade those away or
-- fail on the foreign keys, and would hand new ids to divisions that have not
-- changed.  Renaming the business key in place keeps every id, so this is safe
-- whether or not values have been loaded.
--
-- SAFE TO RE-RUN.  Every statement is guarded; a second run is a no-op.
--
-- TWO PATHS, AND IT MUST BE CORRECT ON BOTH:
--   * COLD BUILD (`apply_native.ps1 -Reset`) - ds_division is empty when this
--     runs, because the register loads at step 9/9 afterwards.  Everything here
--     is then a no-op except adding the legacy_code column, which is right:
--     there is no legacy on a database that never had one.
--   * EXISTING DATABASE - re-keys the divisions that carry forward, retires the
--     two with no successor, and adds the ones the 2025 revision created.
-- It must run BEFORE load_spatial either way: on an existing database, loading
-- the register first would insert 340 official-coded rows alongside the old
-- generated-code rows instead of renaming them.
--
-- ORDER MATTERS.  All renames happen before any insert, in one transaction.
-- 'NU1' is a NEW code, but on a half-migrated database it could collide with a
-- rename still pending; doing the renames first closes that window.
-- ---------------------------------------------------------------------------

BEGIN;

-- 0. Keep the old code addressable.  A report, a saved URL or a spreadsheet
--    written in the last three weeks refers to CEN-001; after this migration
--    that string resolves to nothing.  Holding it means a stale reference can
--    be diagnosed rather than silently returning no rows.
ALTER TABLE ds_division ADD COLUMN IF NOT EXISTS legacy_code TEXT;

COMMENT ON COLUMN ds_division.legacy_code IS
  'Generated pre-2026-08-14 code (CEN-001 style). Retained so stale references resolve. Never a join key.';

CREATE UNIQUE INDEX IF NOT EXISTS ds_division_legacy_code_key
  ON ds_division (legacy_code) WHERE legacy_code IS NOT NULL;

-- 1. Re-key the 329 divisions that carry forward, preserving id.
UPDATE ds_division AS d
   SET code = v.new_code, legacy_code = v.old_code
  FROM (VALUES
    ('CEN-001', 'KA1'),  -- Akurana
    ('CEN-002', 'KA2'),  -- Deltota
    ('CEN-003', 'KA3'),  -- Doluwa
    ('CEN-004', 'KA4'),  -- Ganga Ihala Korale
    ('CEN-005', 'KA5'),  -- Gangawata Korale
    ('CEN-006', 'KA6'),  -- Harispattuwa
    ('CEN-007', 'KA7'),  -- Hatharaliyadda
    ('CEN-008', 'KA8'),  -- Kundasale
    ('CEN-009', 'KA9'),  -- Medadumbara
    ('CEN-010', 'KA10'),  -- Minipe
    ('CEN-011', 'KA11'),  -- Panvila
    ('CEN-012', 'KA12'),  -- Pasbagekorale
    ('CEN-013', 'KA13'),  -- Pathadumbara
    ('CEN-014', 'KA14'),  -- Pathahewaheta
    ('CEN-015', 'KA15'),  -- Poojapitiya
    ('CEN-016', 'KA16'),  -- Tumpane
    ('CEN-017', 'KA17'),  -- Udapalatha
    ('CEN-018', 'KA18'),  -- Ududumbara
    ('CEN-019', 'KA19'),  -- Udunuwara
    ('CEN-020', 'KA20'),  -- Yatinuwara
    ('CEN-021', 'MA1'),  -- Ambanganga
    ('CEN-022', 'MA2'),  -- Dambulla
    ('CEN-023', 'MA3'),  -- Galewela
    ('CEN-024', 'MA4'),  -- Laggala
    ('CEN-025', 'MA5'),  -- Matale
    ('CEN-026', 'MA6'),  -- Naula
    ('CEN-027', 'MA7'),  -- Pallepola
    ('CEN-028', 'MA8'),  -- Rattota
    ('CEN-029', 'MA9'),  -- Ukuwela
    ('CEN-030', 'MA10'),  -- Wilgamuwa
    ('CEN-031', 'MA11'),  -- Yatawatta
    ('CEN-033', 'NU2'),  -- Hanguranketa
    ('CEN-035', 'NU8'),  -- Nuwara Eliya
    ('CEN-036', 'NU10'),  -- Walapane
    ('EAS-001', 'AM1'),  -- Addalaichenai
    ('EAS-002', 'AM2'),  -- Akkaraipattu
    ('EAS-003', 'AM3'),  -- Alayadivembu
    ('EAS-004', 'AM4'),  -- Ampara
    ('EAS-005', 'AM5'),  -- Damana
    ('EAS-006', 'AM6'),  -- Dehiattakandiya
    ('EAS-007', 'AM7'),  -- Irakkamam
    ('EAS-045', 'AM8'),  -- Kalmunai
    ('EAS-046', 'AM20'),  -- Kalmunai Tamil Division
    ('EAS-009', 'AM9'),  -- Karaitivu
    ('EAS-010', 'AM10'),  -- Lahugala
    ('EAS-011', 'AM11'),  -- Mahaoya
    ('EAS-012', 'AM12'),  -- Navithanveli
    ('EAS-013', 'AM13'),  -- Nintavur
    ('EAS-014', 'AM14'),  -- Padiyathalawa
    ('EAS-015', 'AM15'),  -- Pottuvil
    ('EAS-016', 'AM16'),  -- Sainthamaruthu
    ('EAS-017', 'AM17'),  -- Sammanthurai
    ('EAS-018', 'AM18'),  -- Tirukkovil
    ('EAS-019', 'AM19'),  -- Uhana
    ('EAS-020', 'BT1'),  -- Eravur Pattu
    ('EAS-021', 'BT2'),  -- Eravur Town
    ('EAS-022', 'BT3'),  -- Kattankudy
    ('EAS-023', 'BT4'),  -- Koralai Pattu (Valachchenai)
    ('EAS-024', 'BT5'),  -- Koralai Pattu Central
    ('EAS-025', 'BT6'),  -- Koralai Pattu North (Vaharai)
    ('EAS-026', 'BT7'),  -- Koralai Pattu South (Kiran)
    ('EAS-027', 'BT8'),  -- Koralai Pattu West (Oddamavadi)
    ('EAS-028', 'BT9'),  -- Manmunai North
    ('EAS-029', 'BT10'),  -- Manmunai Pattu (Araipattai)
    ('EAS-030', 'BT11'),  -- Manmunai South & Eruvil Pattu
    ('EAS-031', 'BT12'),  -- Manmunai South West
    ('EAS-032', 'BT13'),  -- Manmunai West
    ('EAS-033', 'BT14'),  -- Porativu Pattu
    ('EAS-034', 'TR1'),  -- Gomarankadawala
    ('EAS-035', 'TR2'),  -- Kantale
    ('EAS-036', 'TR3'),  -- Kinniya
    ('EAS-037', 'TR4'),  -- Kuchchaweli
    ('EAS-038', 'TR5'),  -- Morawewa
    ('EAS-039', 'TR6'),  -- Muthur
    ('EAS-040', 'TR7'),  -- Padavi Sri Pura
    ('EAS-041', 'TR8'),  -- Seruvila
    ('EAS-042', 'TR9'),  -- Thambalagamuwa
    ('EAS-043', 'TR10'),  -- Town & Gravets
    ('EAS-044', 'TR11'),  -- Verugal
    ('NCE-001', 'AN1'),  -- Galenbidunuwewa
    ('NCE-002', 'AN2'),  -- Galnewa
    ('NCE-003', 'AN3'),  -- Horowpathana
    ('NCE-004', 'AN4'),  -- Ipalogama
    ('NCE-005', 'AN5'),  -- Kahatagasdigiliya
    ('NCE-006', 'AN6'),  -- Kebithigollewa
    ('NCE-007', 'AN7'),  -- Kekirawa
    ('NCE-008', 'AN8'),  -- Mahawilachchiya
    ('NCE-009', 'AN9'),  -- Medawachchiya
    ('NCE-010', 'AN10'),  -- Mihinthale
    ('NCE-011', 'AN11'),  -- Nachchaduwa
    ('NCE-012', 'AN12'),  -- Nochchiyagama
    ('NCE-013', 'AN13'),  -- Nuwaragam Palatha Central
    ('NCE-014', 'AN14'),  -- Nuwaragam Palatha East
    ('NCE-015', 'AN15'),  -- Padaviya
    ('NCE-016', 'AN16'),  -- Palagala
    ('NCE-017', 'AN17'),  -- Palugaswewa
    ('NCE-018', 'AN18'),  -- Rajanganaya
    ('NCE-019', 'AN19'),  -- Rambewa
    ('NCE-020', 'AN20'),  -- Thalawa
    ('NCE-021', 'AN21'),  -- Thambuththegama
    ('NCE-022', 'AN22'),  -- Thirappane
    ('NCE-023', 'PO1'),  -- Dimbulagala
    ('NCE-024', 'PO2'),  -- Elahera
    ('NCE-025', 'PO3'),  -- Higurakgoda
    ('NCE-026', 'PO4'),  -- Lankapura
    ('NCE-027', 'PO5'),  -- Medirigiriya
    ('NCE-028', 'PO6'),  -- Thamankaduwa
    ('NCE-029', 'PO7'),  -- Welikanda
    ('NOR-001', 'JA1'),  -- Delft
    ('NOR-002', 'JA2'),  -- Islands North(kayts)
    ('NOR-003', 'JA3'),  -- Islands South(velanai)
    ('NOR-004', 'JA4'),  -- Jaffna
    ('NOR-005', 'JA5'),  -- Karainagar
    ('NOR-006', 'JA6'),  -- Nallur
    ('NOR-007', 'JA7'),  -- Thenmaradchi(chavakachcheri)
    ('NOR-008', 'JA8'),  -- Vadamaradchchi East
    ('NOR-009', 'JA9'),  -- Vadamaradchchi South-west(karaveddy)
    ('NOR-010', 'JA10'),  -- Vadamaradchi North(point Pedro)
    ('NOR-011', 'JA11'),  -- Valikamam East(kopay)
    ('NOR-012', 'JA12'),  -- Valikamam North(thllippalai)
    ('NOR-014', 'JA13'),  -- Valikamam South West(sandilipay)
    ('NOR-013', 'JA14'),  -- Valikamam South(uduvil)
    ('NOR-015', 'JA15'),  -- Valikamam West(chankanai)
    ('NOR-016', 'KI1'),  -- Kandavalai
    ('NOR-017', 'KI2'),  -- Karachchi
    ('NOR-018', 'KI3'),  -- Pachchilaipalli
    ('NOR-019', 'KI4'),  -- Poonakary
    ('NOR-020', 'MN1'),  -- Madhu
    ('NOR-021', 'MN2'),  -- Mannar Town
    ('NOR-022', 'MN3'),  -- Manthai West
    ('NOR-023', 'MN4'),  -- Musali
    ('NOR-024', 'MN5'),  -- Nanaddan
    ('NOR-025', 'MU1'),  -- Manthai East
    ('NOR-026', 'MU2'),  -- Maritimepattu
    ('NOR-027', 'MU3'),  -- Oddusuddan
    ('NOR-028', 'MU4'),  -- Puthukkudiyiruppu
    ('NOR-029', 'MU5'),  -- Thunukkai
    ('NOR-030', 'MU6'),  -- Welioya
    ('NOR-031', 'VA1'),  -- Vavuniya
    ('NOR-032', 'VA2'),  -- Vavuniya North
    ('NOR-033', 'VA3'),  -- Vavuniya South
    ('NOR-034', 'VA4'),  -- Vengalacheddikulam
    ('NWE-001', 'KU1'),  -- Alawwa
    ('NWE-002', 'KU2'),  -- Ambanpola
    ('NWE-003', 'KU3'),  -- Bamunakotuwa
    ('NWE-004', 'KU4'),  -- Bingiriya
    ('NWE-005', 'KU5'),  -- Ehetuwewa
    ('NWE-006', 'KU6'),  -- Galgamuwa
    ('NWE-007', 'KU7'),  -- Ganewatta
    ('NWE-008', 'KU8'),  -- Giribawa
    ('NWE-009', 'KU9'),  -- Ibbagamuwa
    ('NWE-010', 'KU10'),  -- Kobeigane
    ('NWE-011', 'KU11'),  -- Kotawehera
    ('NWE-012', 'KU12'),  -- Kuliyapitiya East
    ('NWE-013', 'KU13'),  -- Kuliyapitiya West
    ('NWE-014', 'KU14'),  -- Kurunegala
    ('NWE-015', 'KU15'),  -- Maho
    ('NWE-016', 'KU16'),  -- Mallawapitiya
    ('NWE-017', 'KU17'),  -- Maspotha
    ('NWE-018', 'KU18'),  -- Mawathagama
    ('NWE-019', 'KU19'),  -- Narammala
    ('NWE-020', 'KU20'),  -- Nikaweratiya
    ('NWE-021', 'KU21'),  -- Panduwasnuwara East
    ('NWE-022', 'KU22'),  -- Panduwasnuwara West
    ('NWE-023', 'KU23'),  -- Pannala
    ('NWE-024', 'KU24'),  -- Polgahawela
    ('NWE-025', 'KU25'),  -- Polpitigama
    ('NWE-026', 'KU26'),  -- Rasnayakapura
    ('NWE-027', 'KU27'),  -- Rideegama
    ('NWE-028', 'KU28'),  -- Udubaddawa
    ('NWE-029', 'KU29'),  -- Wariyapola
    ('NWE-030', 'KU30'),  -- Weerabugedara
    ('NWE-031', 'PU1'),  -- Anamaduwa
    ('NWE-032', 'PU2'),  -- Arachchikattuwa
    ('NWE-033', 'PU3'),  -- Chilaw
    ('NWE-034', 'PU4'),  -- Dankotuwa
    ('NWE-035', 'PU5'),  -- Kalpitiya
    ('NWE-036', 'PU6'),  -- Karuwalagaswewa
    ('NWE-037', 'PU7'),  -- Madampe
    ('NWE-038', 'PU8'),  -- Mahakumbukkadawala
    ('NWE-039', 'PU9'),  -- Mahawewa
    ('NWE-040', 'PU10'),  -- Mundel
    ('NWE-041', 'PU11'),  -- Nattandiya
    ('NWE-042', 'PU12'),  -- Nawagattegama
    ('NWE-043', 'PU13'),  -- Pallama
    ('NWE-044', 'PU14'),  -- Puttalam
    ('NWE-045', 'PU15'),  -- Vanathavilluwa
    ('NWE-046', 'PU16'),  -- Wennappuwa
    ('SAB-001', 'KE1'),  -- Aranayake
    ('SAB-002', 'KE2'),  -- Bulathkohipitiya
    ('SAB-003', 'KE3'),  -- Dehiowita
    ('SAB-004', 'KE4'),  -- Deraniyagala
    ('SAB-005', 'KE5'),  -- Galigamuwa
    ('SAB-006', 'KE6'),  -- Kegalle
    ('SAB-007', 'KE7'),  -- Mawanella
    ('SAB-008', 'KE8'),  -- Rambukkana
    ('SAB-009', 'KE9'),  -- Ruwanwella
    ('SAB-010', 'KE10'),  -- Warakapola
    ('SAB-011', 'KE11'),  -- Yatiyantota
    ('SAB-012', 'RA1'),  -- Ayagama
    ('SAB-013', 'RA2'),  -- Balangoda
    ('SAB-014', 'RA3'),  -- Eheliyagoda
    ('SAB-015', 'RA4'),  -- Elapatha
    ('SAB-016', 'RA5'),  -- Embilipitiya
    ('SAB-017', 'RA6'),  -- Godakawela
    ('SAB-018', 'RA7'),  -- Imbulpe
    ('SAB-019', 'RA8'),  -- Kahawattha
    ('SAB-020', 'RA9'),  -- Kalawana
    ('SAB-021', 'RA11'),  -- Kiriella
    ('SAB-022', 'RA12'),  -- Kolonna
    ('SAB-023', 'RA13'),  -- Kuruvita
    ('SAB-024', 'RA14'),  -- Nivithigala
    ('SAB-025', 'RA15'),  -- Opanayake
    ('SAB-026', 'RA16'),  -- Pelmadulla
    ('SAB-027', 'RA17'),  -- Ratnapura
    ('SAB-028', 'RA18'),  -- Weligepola
    ('SOU-001', 'GA1'),  -- Akmeemana
    ('SOU-002', 'GA2'),  -- Ambalangoda
    ('SOU-003', 'GA3'),  -- Baddegama
    ('SOU-004', 'GA4'),  -- Balapitiya
    ('SOU-005', 'GA5'),  -- Bentota
    ('SOU-006', 'GA6'),  -- Bope-poddala
    ('SOU-007', 'GA7'),  -- Elpitiya
    ('SOU-008', 'GA8'),  -- Galle4gravets
    ('SOU-009', 'GA9'),  -- Gonapinuwala
    ('SOU-010', 'GA10'),  -- Habaraduwa
    ('SOU-011', 'GA11'),  -- Hikkaduwa
    ('SOU-012', 'GA12'),  -- Imaduwa
    ('SOU-013', 'GA13'),  -- Karandeniya
    ('SOU-014', 'GA15'),  -- Nagoda
    ('SOU-015', 'GA16'),  -- Neluwa
    ('SOU-016', 'GA17'),  -- Niyagama
    ('SOU-017', 'GA19'),  -- Thawalama
    ('SOU-018', 'GA21'),  -- Welivitiya-divitura
    ('SOU-019', 'GA22'),  -- Yakkalamulla
    ('SOU-020', 'HA1'),  -- Ambalantota
    ('SOU-021', 'HA2'),  -- Angunakolapelessa
    ('SOU-022', 'HA3'),  -- Beliatta
    ('SOU-023', 'HA4'),  -- Hambantota
    ('SOU-024', 'HA5'),  -- Katuwana
    ('SOU-025', 'HA6'),  -- Lunugamwehera
    ('SOU-026', 'HA7'),  -- Okewela
    ('SOU-027', 'HA8'),  -- Sooriyawewa
    ('SOU-028', 'HA9'),  -- Tangalle
    ('SOU-029', 'HA10'),  -- Thissamaharama
    ('SOU-030', 'HA11'),  -- Walasmulla
    ('SOU-031', 'HA12'),  -- Weeraketiya
    ('SOU-032', 'MT1'),  -- Akuressa
    ('SOU-033', 'MT2'),  -- Athuraliya
    ('SOU-034', 'MT3'),  -- Devinuwara
    ('SOU-035', 'MT4'),  -- Dikwella
    ('SOU-036', 'MT5'),  -- Hakmana
    ('SOU-037', 'MT6'),  -- Kaburupitiya
    ('SOU-038', 'MT7'),  -- Kirinda Puhulwella
    ('SOU-039', 'MT8'),  -- Kotapola
    ('SOU-040', 'MT9'),  -- Malimbada
    ('SOU-041', 'MT10'),  -- Matara Four Gravets
    ('SOU-042', 'MT11'),  -- Mulatiyana
    ('SOU-043', 'MT12'),  -- Pasgoda
    ('SOU-044', 'MT13'),  -- Pitabaddara
    ('SOU-045', 'MT14'),  -- Thihagoda
    ('SOU-046', 'MT15'),  -- Weligama
    ('SOU-047', 'MT16'),  -- Welipitiya
    ('UVA-001', 'BA1'),  -- Badulla
    ('UVA-002', 'BA2'),  -- Bandarawela
    ('UVA-003', 'BA3'),  -- Ella
    ('UVA-004', 'BA4'),  -- Haldummulla
    ('UVA-005', 'BA5'),  -- Hali-ela
    ('UVA-006', 'BA6'),  -- Haputale
    ('UVA-007', 'BA7'),  -- Kandeketiya
    ('UVA-008', 'BA8'),  -- Lunugala
    ('UVA-009', 'BA9'),  -- Mahiyanganaya
    ('UVA-010', 'BA10'),  -- Meegahakiula
    ('UVA-011', 'BA11'),  -- Passara
    ('UVA-012', 'BA12'),  -- Rideemaliyadda
    ('UVA-013', 'BA13'),  -- Soranathota
    ('UVA-014', 'BA14'),  -- Uvaparanagama
    ('UVA-015', 'BA15'),  -- Welimada
    ('UVA-016', 'MO1'),  -- Badalkumbura
    ('UVA-017', 'MO2'),  -- Bibile
    ('UVA-018', 'MO3'),  -- Buttala
    ('UVA-019', 'MO4'),  -- Katharagama
    ('UVA-020', 'MO5'),  -- Madulla
    ('UVA-021', 'MO6'),  -- Medagama
    ('UVA-022', 'MO7'),  -- Monaragala
    ('UVA-023', 'MO8'),  -- Sevanagala
    ('UVA-024', 'MO9'),  -- Siyambalanduwa
    ('UVA-025', 'MO10'),  -- Thanamalwila
    ('UVA-026', 'MO11'),  -- Wellawaya
    ('WES-001', 'CO1'),  -- Colombo
    ('WES-002', 'CO2'),  -- Dehiwala
    ('WES-003', 'CO3'),  -- Homagama
    ('WES-004', 'CO4'),  -- Kaduwela
    ('WES-005', 'CO5'),  -- Kesbewa
    ('WES-006', 'CO6'),  -- Kolonnawa
    ('WES-007', 'CO7'),  -- Maharagama
    ('WES-008', 'CO8'),  -- Moratuwa
    ('WES-009', 'CO9'),  -- Padukka
    ('WES-010', 'CO10'),  -- Ratmalana
    ('WES-011', 'CO11'),  -- Seethawaka
    ('WES-012', 'CO12'),  -- Sri Jayawardanapura Kotte
    ('WES-013', 'CO13'),  -- Thimbirigasyaya
    ('WES-014', 'GP1'),  -- Attanagalla
    ('WES-015', 'GP2'),  -- Biyagama
    ('WES-016', 'GP3'),  -- Divulapitiya
    ('WES-017', 'GP4'),  -- Dompe
    ('WES-018', 'GP5'),  -- Gampaha
    ('WES-019', 'GP6'),  -- Ja Ela
    ('WES-020', 'GP7'),  -- Katana
    ('WES-021', 'GP8'),  -- Kelaniya
    ('WES-022', 'GP9'),  -- Mahara
    ('WES-023', 'GP10'),  -- Minuwangoda
    ('WES-024', 'GP11'),  -- Mirigama
    ('WES-025', 'GP12'),  -- Negombo
    ('WES-026', 'GP13'),  -- Wattala
    ('WES-027', 'KT1'),  -- Agalawatta
    ('WES-028', 'KT2'),  -- Bandaragama
    ('WES-029', 'KT3'),  -- Beruwala
    ('WES-030', 'KT4'),  -- Bulathsinhala
    ('WES-031', 'KT5'),  -- Dodangoda
    ('WES-032', 'KT6'),  -- Horana
    ('WES-033', 'KT7'),  -- Ingiriya
    ('WES-034', 'KT8'),  -- Kalutara
    ('WES-035', 'KT9'),  -- Madurawala
    ('WES-036', 'KT10'),  -- Matugama
    ('WES-037', 'KT11'),  -- Millaniya
    ('WES-038', 'KT12'),  -- Palindanuwara
    ('WES-039', 'KT13'),  -- Panadura
    ('WES-040', 'KT14')  -- Walallawita
  ) AS v(old_code, new_code)
 WHERE d.code = v.old_code
   AND NOT EXISTS (SELECT 1 FROM ds_division x WHERE x.code = v.new_code);

-- 1b. RETIRE the two divisions that have no successor.
--
--     Ambagamuwa (CEN-032) became Ambagamuwa Korale + Norwood; Kothmale
--     (CEN-034) became Kothmale East + Kothmale West.  Unlike Hikkaduwa or
--     Balangoda -- which lost territory but still exist -- these two names are
--     gone from the official register entirely, so there is no row to re-key.
--
--     They are DELETED rather than kept as an alias, deliberately.  The
--     precedent is EAS-008 "Kalmunai" on 10 Aug 2026: a retired code must fail
--     loudly, because the alternative is a stale reference quietly resolving to
--     roughly half the area it used to mean.  A `legacy_code` alias would do
--     exactly that quiet resolution, so neither successor inherits one.
--
--     GUARDED: if either division holds any data, this raises instead of
--     deleting.  Splitting a division that already has values is a remapping
--     exercise (which child gets what), not a migration -- and it is not one to
--     do silently at 2am.  Today they are empty, so this passes.
DO $$
DECLARE n BIGINT; retired TEXT[] := ARRAY['CEN-032','CEN-034'];
BEGIN
  IF to_regclass('indicator_value') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM indicator_value iv JOIN ds_division d ON d.id = iv.ds_division_id
              WHERE d.code = ANY($1)' INTO n USING retired;
    IF n > 0 THEN
      RAISE EXCEPTION 'Ambagamuwa/Kothmale hold % indicator value(s). Splitting a division that already has data needs an explicit remapping decision - do not delete.', n;
    END IF;
  END IF;

  DELETE FROM ds_division WHERE code = ANY(retired);
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'ok   % superseded division(s) retired (Ambagamuwa, Kothmale)', n;
END $$;

-- 2. The divisions DS_Boundary.shp adds.  Each is carved out of an existing
--    division -- the parent is named on each line and held in the register's
--    split_from column.
--
--    THEY START WITH NO VALUES.  Copying the parent's would double-count every
--    count and extent variable across the pair; this is the rule the Kalmunai
--    split established on 10 Aug 2026.  Geometry arrives from load_spatial.ps1;
--    this statement only guarantees the row exists if that has not run yet.
--    GUARDED ON A NON-EMPTY TABLE.  On a cold `-Reset` build this addendum runs
--    BEFORE step 9/9 loads the register, so ds_division is empty here and there
--    is nothing to top up: load_spatial inserts all of them straight from
--    dsd_register.csv, which already carries the official codes.  Inserting
--    them here as well would create rows with no geometry ahead of the real
--    load and report a misleading count.  So this only runs when there is an
--    existing register to migrate.
INSERT INTO ds_division (code, name, district_name, province_id)
SELECT v.code, v.name, v.district, p.id
  FROM (VALUES
    ('NU1', 'Ambagamuwa Korale', 'Nuwara Eliya', 'Central'),  -- from Ambagamuwa (CEN-032)
    ('NU3', 'Kothmale East', 'Nuwara Eliya', 'Central'),  -- from Kothmale (CEN-034)
    ('NU4', 'Kothmale West', 'Nuwara Eliya', 'Central'),  -- from Kothmale (CEN-034)
    ('NU5', 'Mathurata', 'Nuwara Eliya', 'Central'),  -- from Hanguranketa (CEN-033)
    ('NU6', 'Nildandahinna', 'Nuwara Eliya', 'Central'),  -- from Walapane (CEN-036)
    ('NU7', 'Norwood', 'Nuwara Eliya', 'Central'),  -- from Ambagamuwa (CEN-032)
    ('NU9', 'Thalawakele', 'Nuwara Eliya', 'Central'),  -- from Nuwara Eliya (CEN-035)
    ('RA10', 'Kalthota', 'Ratnapura', 'Sabaragamuwa'),  -- from Balangoda (SAB-013)
    ('GA14', 'Madampagama', 'Galle', 'Southern'),  -- from Hikkaduwa (SOU-011)
    ('GA18', 'Rathgama', 'Galle', 'Southern'),  -- from Hikkaduwa (SOU-011)
    ('GA20', 'Wanduramba', 'Galle', 'Southern')  -- from Baddegama (SOU-003)
  ) AS v(code, name, district, province)
  JOIN province p ON p.name = v.province
 WHERE EXISTS (SELECT 1 FROM ds_division)
   AND NOT EXISTS (SELECT 1 FROM ds_division x WHERE x.code = v.code);

-- 3. Prove it landed.  Relationships, not literals: the register is the
--    authority for the count, and a number hardcoded here would go stale the
--    way 330 and 331 both did.
DO $$
DECLARE n BIGINT;
BEGIN
  SELECT count(*) INTO n FROM ds_division WHERE code ~ '^[A-Z]{2,3}-[0-9]{3}$';
  IF n > 0 THEN
    RAISE EXCEPTION '% division(s) still carry a generated code - the re-key did not complete', n;
  END IF;

  SELECT count(*) INTO n FROM ds_division WHERE province_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION '% division(s) have no province', n; END IF;

  SELECT count(*) INTO n FROM ds_division;
  IF n = 0 THEN
    -- Cold build: the register has not loaded yet.  Saying "0 divisions
    -- registered" here would read as a failure when it is the normal path.
    RAISE NOTICE 'ok   schema ready for official codes; divisions load at step 9/9';
  ELSE
    RAISE NOTICE 'ok   % divisions on official codes (verify the total with smoke_test)', n;
  END IF;
END $$;

COMMIT;

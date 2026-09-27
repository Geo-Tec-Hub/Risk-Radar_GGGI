"""Per-layer states for the map and the PDF export (27 Sep 2026)."""
from app.maps.layers import band_of, layer_value


def test_vulnerability_unchanged():
    assert layer_value("assessed", 0.3, 0.8, 0.2, "vulnerability") == ("assessed", 0.3)
    assert layer_value("not_applicable", None, 0.8, 0.0, "vulnerability") == ("not_applicable", None)


def test_hazard_shown_even_where_sector_absent():
    assert layer_value("not_applicable", None, 0.8, 0.0, "hazard") == ("assessed", 0.8)


def test_exposure_keeps_sector_not_present():
    assert layer_value("not_applicable", None, 0.8, 0.0, "exposure") == ("not_applicable", None)
    assert layer_value("assessed", 0.3, 0.8, 0.2, "exposure") == ("assessed", 0.2)


def test_unscored_stays_unscored_on_every_layer():
    for layer in ("vulnerability", "hazard", "exposure"):
        assert layer_value("unassessed", None, None, None, layer) == ("unassessed", None)
        assert layer_value("pending", None, None, None, layer) == ("pending", None)


def test_bands_fixed_quarters():
    assert [band_of(v) for v in (0, 0.2499, 0.25, 0.5, 0.75, 1.0)] == [1, 1, 2, 3, 4, 4]
    assert band_of(None) is None

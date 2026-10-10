"""The provincial scale of H x E is set by the divisions the map SHOWS.

Live QA, 10 Oct 2026: a sector-absent division is withheld as `not_applicable`,
but its product (0) still set the province's lower bound, so 10 profiles
published no visible 0.000 -- Inland Fishery CEN's lowest shown division read
0.0232. `product_bounds` now leaves absent divisions out. No database needed.
"""

from __future__ import annotations

from app.engine.vulnerability import _rescale, product_bounds


def test_absent_division_does_not_anchor_the_minimum():
    products = {1: 0.0, 2: 0.04, 3: 0.20, 4: 0.50}
    absent = {1: True, 2: False, 3: False, 4: False}
    lo, hi = product_bounds(products, absent)
    assert (lo, hi) == (0.04, 0.50)
    shown = [_rescale(products[d], lo, hi) for d in products if not absent[d]]
    # Exactly one 0.000 and one 1.000 among the divisions on the map.
    assert min(shown) == 0.0 and max(shown) == 1.0


def test_absent_division_rescales_below_zero_and_is_clamped_by_the_engine():
    lo, hi = product_bounds({1: 0.0, 2: 0.04, 3: 0.5}, {1: True, 2: False, 3: False})
    assert _rescale(0.0, lo, hi) < 0  # why compute_profile clamps to [0, 1]


def test_no_absent_divisions_is_unchanged():
    products = {1: 0.01, 2: 0.3, 3: 0.9}
    assert product_bounds(products, {}) == (0.01, 0.9)
    assert product_bounds(products, {1: False, 2: False, 3: False}) == (0.01, 0.9)


def test_every_division_absent_falls_back_to_all():
    products = {1: 0.0, 2: 0.0}
    assert product_bounds(products, {1: True, 2: True}) == (0.0, 0.0)

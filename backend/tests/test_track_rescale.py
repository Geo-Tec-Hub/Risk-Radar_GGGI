"""Own-track normalisation of the present exposure index (client NOTED-13).

No database: a fake connection records the bounds rescale_track_profile picks.
"""
import asyncio

from app.engine.track import rescale_track_profile


class _Conn:
    def __init__(self, ext, base):
        self.ext, self.base, self.updated = ext, base, None

    async def fetchrow(self, sql, *args):
        return self.base if "source = 'data'" in sql else self.ext

    async def execute(self, sql, *args):
        self.updated = args[-2:]


def _run(ext, base):
    c = _Conn(ext, base)
    out = asyncio.run(rescale_track_profile(c, 1, "expert", 2021, 2025))
    return out, c.updated


def test_uses_the_tracks_own_range_not_the_official_one():
    # Uva coconut drought: experts 0.0177-0.5636, official 0-0.70
    out, upd = _run({"lo": 0.0177, "hi": 0.5636}, {"lo": 0.0, "hi": 0.70})
    assert out == (0.0177, 0.5636) and upd == (0.0177, 0.5636)


def test_one_expert_division_falls_back_to_official_bounds():
    out, _ = _run({"lo": 0.3, "hi": 0.3}, {"lo": 0.0, "hi": 0.6})
    assert out == (0.0, 0.6)


def test_nothing_to_scale_against_leaves_raw_product():
    out, upd = _run({"lo": 0.3, "hi": 0.3}, {"lo": None, "hi": None})
    assert out is None and upd is None

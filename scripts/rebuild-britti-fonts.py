"""Instantiate Britti Sans variable → static TTFs with valid name tables for Expo."""

from __future__ import annotations

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "fonts" / "_britti_var.woff2"
OUT_DIR = ROOT / "assets" / "fonts"

WEIGHTS = [
    ("Regular", 400),
    ("Medium", 500),
    ("SemiBold", 600),
    ("Bold", 700),
]


def set_names(font: TTFont, family: str, subfamily: str) -> None:
    name = font["name"]
    name.names = []
    full = family
    for plat, enc, lang in ((1, 0, 0), (3, 1, 0x409)):
        name.setName(family, 1, plat, enc, lang)
        name.setName(subfamily, 2, plat, enc, lang)
        name.setName(full, 4, plat, enc, lang)
        name.setName(family, 6, plat, enc, lang)
        name.setName(family, 16, plat, enc, lang)
        name.setName(subfamily, 17, plat, enc, lang)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source font: {SRC}")

    for label, wght in WEIGHTS:
        font = TTFont(str(SRC))
        instantiateVariableFont(font, {"wght": wght}, inplace=True, overlap=True)
        family = f"BrittiSans-{label}"
        set_names(font, family, label)
        out = OUT_DIR / f"BrittiSans-{label}.ttf"
        font.save(str(out))
        verify = TTFont(str(out))
        print(
            out.name,
            "->",
            verify["name"].getDebugName(1),
            "/",
            verify["name"].getDebugName(6),
            "bytes",
            out.stat().st_size,
        )

    SRC.unlink(missing_ok=True)
    print("done")


if __name__ == "__main__":
    main()

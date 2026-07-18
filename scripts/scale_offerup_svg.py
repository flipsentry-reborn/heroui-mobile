#!/usr/bin/env python3
"""Scale the OfferUp logo SVG by 10% around the viewBox center and save it."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from lxml import etree

SCALE = 1.10
ROOT = Path(__file__).resolve().parents[1]
SVG_PATH = ROOT / "assets" / "images" / "platforms" / "offerup.svg"
PLATFORM_ICON = ROOT / "src" / "components" / "icons" / "PlatformIcon.tsx"

NUMBER_RE = re.compile(r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")
OFFERUP_CONST_RE = re.compile(
    r"const OFFERUP_SVG = `[\s\S]*?`;",
    re.MULTILINE,
)


def parse_viewbox(svg: etree._Element) -> tuple[float, float, float, float]:
    raw = svg.get("viewBox")
    if not raw:
        raise ValueError("SVG is missing a viewBox")
    parts = [float(p) for p in raw.replace(",", " ").split()]
    if len(parts) != 4:
        raise ValueError(f"Invalid viewBox: {raw!r}")
    return parts[0], parts[1], parts[2], parts[3]


def path_numbers(d: str) -> list[float]:
    return [float(m.group(0)) for m in NUMBER_RE.finditer(d)]


def bbox(nums: list[float]) -> tuple[float, float, float, float]:
    xs = nums[0::2]
    ys = nums[1::2]
    if not xs or not ys or len(xs) != len(ys):
        raise ValueError("Path data does not contain paired x/y coordinates")
    return min(xs), min(ys), max(xs), max(ys)


def scale_path_d(d: str, cx: float, cy: float, scale: float) -> str:
    """Scale absolute path coordinates around (cx, cy)."""
    nums = path_numbers(d)
    if len(nums) % 2 != 0:
        raise ValueError("Odd number of path coordinates; expected x/y pairs")

    scaled: list[str] = []
    for i in range(0, len(nums), 2):
        x, y = nums[i], nums[i + 1]
        sx = cx + (x - cx) * scale
        sy = cy + (y - cy) * scale
        scaled.append(format_num(sx))
        scaled.append(format_num(sy))

    out: list[str] = []
    idx = 0
    last = 0
    for match in NUMBER_RE.finditer(d):
        out.append(d[last : match.start()])
        out.append(scaled[idx])
        idx += 1
        last = match.end()
    out.append(d[last:])
    if idx != len(scaled):
        raise RuntimeError("Failed to rewrite all path numbers")
    return "".join(out)


def format_num(value: float) -> str:
    text = f"{value:.6f}".rstrip("0").rstrip(".")
    return text if text else "0"


def scale_svg(svg_text: str, scale: float = SCALE) -> tuple[str, dict]:
    root = etree.fromstring(svg_text.encode("utf-8"))
    min_x, min_y, vb_w, vb_h = parse_viewbox(root)
    cx = min_x + vb_w / 2
    cy = min_y + vb_h / 2

    paths = root.xpath(".//*[local-name()='path']")
    if not paths:
        raise ValueError("No <path> elements found")

    before = path_numbers(paths[0].get("d") or "")
    before_box = bbox(before)

    for path in paths:
        # Drop any prior scale wrapper effects by operating on path data only
        d = path.get("d")
        if not d:
            continue
        path.set("d", scale_path_d(d, cx, cy, scale))
        # Remove transform if present — geometry is baked in
        if "transform" in path.attrib:
            del path.attrib["transform"]

    # Unwrap a sole scale group if present (from earlier manual edits)
    for g in root.xpath(".//*[local-name()='g']"):
        transform = g.get("transform") or ""
        if "scale(" in transform and len(list(g)) == 1:
            child = g[0]
            parent = g.getparent()
            if parent is not None:
                index = list(parent).index(g)
                parent.remove(g)
                parent.insert(index, child)

    after = path_numbers(paths[0].get("d") or "")
    after_box = bbox(after)

    before_w = before_box[2] - before_box[0]
    before_h = before_box[3] - before_box[1]
    after_w = after_box[2] - after_box[0]
    after_h = after_box[3] - after_box[1]

    stats = {
        "center": (cx, cy),
        "scale": scale,
        "before_bbox": before_box,
        "after_bbox": after_box,
        "width_ratio": after_w / before_w,
        "height_ratio": after_h / before_h,
    }

    out = etree.tostring(root, encoding="unicode")
    if not out.startswith("<?xml"):
        out = '<?xml version="1.0" encoding="UTF-8"?>\n' + out
    if not out.endswith("\n"):
        out += "\n"
    return out, stats


def update_platform_icon(svg_body: str) -> None:
    """Embed the scaled SVG string into PlatformIcon.tsx."""
    # Strip XML declaration / comments — react-native-svg SvgXml is picky
    body = re.sub(r"^<\?xml[^>]*>\s*", "", svg_body)
    body = re.sub(r"<!--.*?-->\s*", "", body, flags=re.DOTALL)
    body = body.strip()
    replacement = f"const OFFERUP_SVG = `{body}`;"
    text = PLATFORM_ICON.read_text(encoding="utf-8")
    updated, count = OFFERUP_CONST_RE.subn(replacement, text, count=1)
    if count != 1:
        raise RuntimeError("Could not find OFFERUP_SVG constant in PlatformIcon.tsx")
    PLATFORM_ICON.write_text(updated, encoding="utf-8")


def verify(stats: dict, tolerance: float = 1e-3) -> None:
    expected = SCALE
    for key in ("width_ratio", "height_ratio"):
        actual = stats[key]
        if abs(actual - expected) > tolerance:
            raise AssertionError(
                f"{key} expected ~{expected}, got {actual} (delta={abs(actual - expected)})"
            )
    print("Verification passed:")
    print(f"  scale factor : {stats['scale']}")
    print(f"  width ratio  : {stats['width_ratio']:.6f}")
    print(f"  height ratio : {stats['height_ratio']:.6f}")
    print(f"  before bbox  : {stats['before_bbox']}")
    print(f"  after bbox   : {stats['after_bbox']}")


def main() -> int:
    if not SVG_PATH.exists():
        print(f"Missing SVG: {SVG_PATH}", file=sys.stderr)
        return 1

    original = SVG_PATH.read_text(encoding="utf-8")

    # If the file was already scaled (baked), refuse silent double-scale unless --force
    force = "--force" in sys.argv
    already = "scaled +10%" in original
    if already and not force:
        print("SVG already marked as scaled (+10%). Use --force to scale again.")
        return 0

    # Strip prior marker comments before scaling
    source = re.sub(r"<!--.*?-->\s*", "", original, flags=re.DOTALL)
    scaled, stats = scale_svg(source, SCALE)
    # Comment marker only (no custom attrs — SvgXml rejects dotted attr names)
    if scaled.startswith("<?xml"):
        scaled = scaled.replace(
            "?>\n",
            "?>\n<!-- scaled +10% around viewBox center -->\n",
            1,
        )
    else:
        scaled = "<!-- scaled +10% around viewBox center -->\n" + scaled

    verify(stats)
    SVG_PATH.write_text(scaled, encoding="utf-8")
    print(f"Wrote {SVG_PATH}")

    update_platform_icon(scaled)
    print(f"Updated {PLATFORM_ICON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

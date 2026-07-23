#!/usr/bin/env python3
"""Create deterministic overlay/diff artifacts and a compact JSON result."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("reference", type=Path)
    parser.add_argument("actual", type=Path)
    parser.add_argument("overlay", type=Path)
    parser.add_argument("diff", type=Path)
    parser.add_argument("report", type=Path)
    parser.add_argument("--threshold", type=int, default=16)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    reference = Image.open(args.reference).convert("RGBA")
    actual = Image.open(args.actual).convert("RGBA")
    if reference.size != actual.size:
        raise SystemExit(
            f"image size mismatch: reference={reference.size}, actual={actual.size}"
        )

    for path in (args.overlay, args.diff, args.report):
        path.parent.mkdir(parents=True, exist_ok=True)

    Image.blend(reference, actual, 0.5).save(args.overlay)

    raw_diff = ImageChops.difference(reference.convert("RGB"), actual.convert("RGB"))
    pixels = list(raw_diff.get_flattened_data())
    changed = [max(pixel) > args.threshold for pixel in pixels]
    changed_count = sum(changed)
    total = len(changed)
    absolute_sum = sum(sum(pixel) for pixel in pixels)

    dimmed = ImageEnhance.Brightness(actual.convert("RGB")).enhance(0.28)
    highlight = Image.new("RGB", actual.size, (255, 42, 42))
    mask = Image.new("L", actual.size)
    mask.putdata([255 if value else 0 for value in changed])
    Image.composite(highlight, dimmed, mask).save(args.diff)

    bbox = raw_diff.getbbox()
    result = {
        "reference": str(args.reference),
        "actual": str(args.actual),
        "width": reference.width,
        "height": reference.height,
        "threshold": args.threshold,
        "changedPixels": changed_count,
        "totalPixels": total,
        "changedPercent": round(changed_count / total * 100, 6),
        "meanAbsoluteChannelDifference": round(absolute_sum / (total * 3), 6),
        "differenceBoundingBox": list(bbox) if bbox else None,
    }
    args.report.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()

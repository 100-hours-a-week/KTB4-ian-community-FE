#!/usr/bin/env python3
"""Generate required visual artifacts for every feed-create Modal state."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
VISUAL = ROOT / "tests" / "visual"
CANONICAL = VISUAL / "reference" / "feed-create-modal.png"
COMPARE = VISUAL / "scripts" / "compare_visual.py"
STATES = (
    "feed-create-modal",
    "feed-create-modal-no-image",
    "feed-create-modal-validation",
    "feed-create-modal-body-only",
    "feed-create-modal-image-and-body",
    "feed-create-modal-image-removed",
    "feed-create-modal-pending",
    "feed-create-modal-failure",
)


def compare(state: str, reference: Path | None = None) -> None:
    supplied_reference = reference is not None
    reference = reference or VISUAL / "reference" / f"{state}.png"
    if state != "feed-create-modal" and not supplied_reference:
        shutil.copyfile(CANONICAL, reference)
    subprocess.run(
        [
            sys.executable,
            str(COMPARE),
            str(reference.relative_to(ROOT)),
            str((VISUAL / "actual" / f"{state}.png").relative_to(ROOT)),
            str((VISUAL / "overlay" / f"{state}.png").relative_to(ROOT)),
            str((VISUAL / "diff" / f"{state}.png").relative_to(ROOT)),
            str((VISUAL / "report" / f"{state}.json").relative_to(ROOT)),
        ],
        cwd=ROOT,
        check=True,
    )


def main() -> None:
    Image.open(CANONICAL).crop((720, 281, 1200, 799)).save(
        VISUAL / "reference" / "feed-create-modal-crop.png"
    )
    for state in STATES:
        compare(state)
    compare(
        "feed-create-modal-crop",
        VISUAL / "reference" / "feed-create-modal-crop.png",
    )
    compare(
        "feed-create-modal-long",
        VISUAL / "reference" / "feed-create-modal-long.png",
    )


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Generate overlay, diff, and JSON artifacts for profile-edit Modal states."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
VISUAL = ROOT / "tests" / "visual"
CANONICAL = VISUAL / "reference" / "profile-edit-modal.png"
COMPARE = VISUAL / "scripts" / "compare_visual.py"
STATES = (
    "profile-edit-modal",
    "profile-edit-modal-preview",
    "profile-edit-modal-pending",
    "profile-edit-modal-failure",
)


def compare(state: str, reference: Path | None = None) -> None:
    supplied_reference = reference is not None
    reference = reference or VISUAL / "reference" / f"{state}.png"
    if state != "profile-edit-modal" and not supplied_reference:
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
    crop_reference = VISUAL / "reference" / "profile-edit-modal-crop.png"
    Image.open(CANONICAL).crop((720, 287, 1200, 791)).save(crop_reference)
    for state in STATES:
        compare(state)
    compare("profile-edit-modal-crop", crop_reference)


if __name__ == "__main__":
    main()

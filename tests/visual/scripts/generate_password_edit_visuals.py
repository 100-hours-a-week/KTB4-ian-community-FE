#!/usr/bin/env python3
from __future__ import annotations
import shutil, subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
VISUAL = ROOT / "tests" / "visual"
CANONICAL = VISUAL / "reference" / "password-edit-modal.png"
COMPARE = VISUAL / "scripts" / "compare_visual.py"
STATES = ("password-edit-modal", "password-edit-modal-validation", "password-edit-modal-enabled", "password-edit-modal-pending", "password-edit-modal-failure")

def compare(state: str, reference: Path | None = None) -> None:
    supplied = reference is not None
    reference = reference or VISUAL / "reference" / f"{state}.png"
    if state != "password-edit-modal" and not supplied:
        shutil.copyfile(CANONICAL, reference)
    subprocess.run([sys.executable, str(COMPARE), str(reference.relative_to(ROOT)), str((VISUAL / "actual" / f"{state}.png").relative_to(ROOT)), str((VISUAL / "overlay" / f"{state}.png").relative_to(ROOT)), str((VISUAL / "diff" / f"{state}.png").relative_to(ROOT)), str((VISUAL / "report" / f"{state}.json").relative_to(ROOT))], cwd=ROOT, check=True)

def main() -> None:
    crop = VISUAL / "reference" / "password-edit-modal-crop.png"
    Image.open(CANONICAL).crop((720, 370, 1200, 710)).save(crop)
    for state in STATES: compare(state)
    compare("password-edit-modal-crop", crop)

if __name__ == "__main__": main()

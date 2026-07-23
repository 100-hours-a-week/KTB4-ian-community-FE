#!/usr/bin/env python3
"""Generate the four required artifacts for every implemented signup state.

Figma exposes one canonical signup frame (544:2271), so every state keeps an
exact byte-for-byte copy of that retrieved frame as its design reference. The
state delta is intentionally visible in the generated overlay and diff.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
VISUAL = ROOT / "tests" / "visual"
CANONICAL = VISUAL / "reference" / "signup-default.png"
COMPARE = VISUAL / "scripts" / "compare_visual.py"
STATES = (
    "signup-default",
    "signup-empty",
    "signup-focus",
    "signup-validation-error",
    "signup-complete",
    "signup-pending",
    "signup-email_already_exists",
    "signup-nickname_already_exists",
    "signup-submit-hover",
    "signup-submit-focus",
    "signup-submit-active",
)


def main() -> None:
    for state in STATES:
        reference = VISUAL / "reference" / f"{state}.png"
        if state != "signup-default":
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


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Run the Borscht Public Edition API + SPA host."""

import argparse
import sys
from pathlib import Path

PACKAGES = Path(__file__).resolve().parents[2] / "packages"
if str(PACKAGES) not in sys.path:
    sys.path.insert(0, str(PACKAGES))

from borscht.api import serve  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description="Borscht Public Edition API")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8799)
    args = ap.parse_args()
    serve(host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

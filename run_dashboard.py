"""
PricePilot AI — Dashboard Launcher Script
=========================================

Convenience runner to start the Streamlit forecasting & pricing dashboard.

Usage:
    python run_dashboard.py [--port 8501] [--browser]
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
DASHBOARD_PATH = ROOT_DIR / "eda" / "dashboard.py"

try:
    from dotenv import load_dotenv
    load_dotenv(ROOT_DIR / ".env", override=False)
    load_dotenv(override=False)
except ImportError:
    pass


def main():
    parser = argparse.ArgumentParser(description="PricePilot AI Dashboard Launcher")
    parser.add_argument("--port", type=int, default=8501, help="Port to run Streamlit on (default: 8501)")
    parser.add_argument("--browser", action="store_true", help="Automatically open default web browser")
    args = parser.parse_args()

    if not DASHBOARD_PATH.exists():
        print(f"Error: Dashboard script not found at {DASHBOARD_PATH}", file=sys.stderr)
        sys.exit(1)

    cmd = [
        sys.executable,
        "-m",
        "streamlit",
        "run",
        str(DASHBOARD_PATH),
        "--server.port",
        str(args.port),
        "--server.headless",
        "false" if args.browser else "true",
    ]

    print("=" * 70)
    print("Launching PricePilot AI - Dynamic Pricing & Revenue Intelligence")
    print(f"Script: {DASHBOARD_PATH}")
    print(f"Local URL: http://localhost:{args.port}")
    print("=" * 70)

    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nDashboard stopped by user.")


if __name__ == "__main__":
    main()

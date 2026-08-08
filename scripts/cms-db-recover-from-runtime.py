#!/usr/bin/env python3
"""CMS DB recovery using Cursor Cloud Runtime Secrets only. Never prints secrets."""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def require(name: str) -> str:
    val = os.environ.get(name, "").strip()
    if not val:
        print(f"ERROR: missing runtime secret {name}", file=sys.stderr)
        sys.exit(1)
    print(f"  OK: {name}")
    return val


def run(cmd: list[str] | str, *, cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess:
    if isinstance(cmd, str):
        return subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True, check=check)
    return subprocess.run(cmd, cwd=cwd, text=True, capture_output=True, check=check)


def main() -> int:
    print("=== CMS DB recovery (runtime secrets) ===\n")
    print("Runtime secrets check:")
    db_host = require("DB_HOSTNAME")
    db_user = require("DB_USERNAME")
    db_pass = require("DB_PASSWORD")
    db_name = require("DB_DATABASE")
    table_prefix = os.environ.get("TABLE_PREFIX", "wp_")
    rootdir = os.environ.get("ROOTDIR", "https://cms.growmedica.cz")

    # Bootstrap gitignored env files
    r = run(["bash", str(ROOT / "scripts/bootstrap-runtime-secrets-env.sh")], check=False)
    if r.returncode != 0:
        print(r.stderr or r.stdout)
        return r.returncode
    print(r.stdout)

    # Local MySQL probe from VM (WebSupport remote DB)
    host = db_host.split(":")[0]
    port = db_host.split(":")[1] if ":" in db_host else "3306"
    mysql_cmd = (
        f"mysql -h {host} -P {port} -u {db_user} -p'{db_pass}' {db_name} -e 'SELECT 1 AS ok' 2>&1"
    )
    print("\n=== MySQL probe (from VM) ===")
    mr = run(mysql_cmd, check=False)
    out = (mr.stdout or mr.stderr or "").replace(db_pass, "***")
    print(out.strip()[:400])
    if mr.returncode != 0 or "ERROR" in out:
        print("FAIL: MySQL probe from VM")
        return 1
    print("PASS: MySQL probe")

    ssh_pass = os.environ.get("WEBSUPPORT_SSH_PASS", "").strip()
    ssh_port = os.environ.get("WEBSUPPORT_SSH_PORT", "26728").strip()
    ssh_host = os.environ.get("WEBSUPPORT_SSH_HOST", "shell.r1.websupport.sk").strip()
    ssh_user = os.environ.get("WEBSUPPORT_SSH_USER", "uid6438887").strip()

    if not ssh_pass:
        print("\nWARN: WEBSUPPORT_SSH_PASS not in runtime secrets — skipping wp-config sync")
        print("CMS may still fail until wp-config.php DB_* matches runtime secrets.")
    else:
        print("\n=== SSH wp-config sync ===")
        try:
            import paramiko
        except ImportError:
            subprocess.run([sys.executable, "-m", "pip", "install", "paramiko", "-q"], check=True)
            import paramiko

        wp_path = "growmedica.cz/sub/cms"
        db_host_cfg = db_host if ":" in db_host else f"{db_host}:3306"

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            ssh_host,
            port=int(ssh_port),
            username=ssh_user,
            password=ssh_pass,
            timeout=30,
            allow_agent=False,
            look_for_keys=False,
        )

        def wp_cli(args: str) -> tuple[int, str]:
            cmd = f"cd {wp_path} && wp {args} 2>&1"
            _, stdout, _ = client.exec_command(cmd, timeout=90)
            text = stdout.read().decode("utf-8", "replace")
            code = stdout.channel.recv_exit_status()
            return code, text.replace(db_pass, "***")

        for name, val in [
            ("DB_NAME", db_name),
            ("DB_USER", db_user),
            ("DB_PASSWORD", db_pass),
            ("DB_HOST", db_host_cfg),
        ]:
            # Escape single quotes for shell
            safe = val.replace("'", "'\\''")
            code, text = wp_cli(f"config set {name} '{safe}' --type=constant")
            print(f"wp config set {name}: exit={code}")
            if code != 0:
                print(text[:300])
                client.close()
                return 1

        code, text = wp_cli("db check")
        print("wp db check:", text.strip()[:200])
        client.close()
        if code != 0:
            print("FAIL: wp db check after sync")
            return 1
        print("PASS: wp-config synced")

    # Full HTTP / smoke tests
    print("\n=== Full connection tests ===")
    tr = run(["bash", str(ROOT / "scripts/test-cms-connection-full.sh")], check=False)
    print(tr.stdout)
    if tr.stderr:
        print(tr.stderr[:500])
    return tr.returncode


if __name__ == "__main__":
    raise SystemExit(main())

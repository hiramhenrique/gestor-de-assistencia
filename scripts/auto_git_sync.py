import subprocess
import time
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POLL_SECONDS = 5


def run_git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=str(REPO),
        text=True,
        capture_output=True,
    )


def has_changes() -> bool:
    result = run_git("status", "--porcelain")
    return bool(result.stdout.strip())


def main() -> None:
    print(f"[auto-sync] monitorando: {REPO}")
    while True:
        try:
            if has_changes():
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] mudanças detectadas")

                add = run_git("add", "-A")
                if add.returncode != 0:
                    print(f"[auto-sync] git add falhou: {add.stderr.strip()}")
                    time.sleep(POLL_SECONDS)
                    continue

                status_after_add = run_git("status", "--porcelain")
                if not status_after_add.stdout.strip():
                    time.sleep(POLL_SECONDS)
                    continue

                message = f"auto: sync changes {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                commit = run_git("commit", "-m", message)
                if commit.returncode != 0:
                    if "nothing to commit" not in commit.stderr.lower():
                        print(f"[auto-sync] git commit falhou: {commit.stderr.strip()}")
                    time.sleep(POLL_SECONDS)
                    continue

                push = run_git("push", "origin", "HEAD")
                if push.returncode != 0:
                    print(f"[auto-sync] git push falhou: {push.stderr.strip()}")
                else:
                    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] push concluído")
        except Exception as exc:
            print(f"[auto-sync] erro: {exc}")

        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()

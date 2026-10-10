"""Version: V1.0 (2026-10-10) — scripts/common/skylog.py — V1.0
Shared error codes and logging for the SkyTech Python scripts (lead builders, document builders, prompt book).

Purpose : the same SKY-<AREA>-<NNN> codes and log format as the Admin site, so a failure in any script can be
          looked up in docs/architecture/SkyTech_Troubleshooting_Guide.html.
Use     : import skylog  (scripts add the scripts/common folder to sys.path first)
            log = skylog.get("build_tech_stack")
            log.info("wrote file", path=out)
            skylog.fail("SKY-DOC-002", "Cannot read the diagram source", path=p)   # prints code + fix, exits 1
            with skylog.guard("build_tech_stack"): main()   # turns any crash into a coded, logged failure
            skylog.install("build_tech_stack", "SKY-DOC-002")  # same, for scripts written as plain top-level code
Outputs : logs/runtime/scripts-YYYY-MM-DD.log (one JSON object per line; secrets redacted).
Errors  : if the log folder cannot be written, logging continues on screen only (SKY-SYS-003).
"""
import datetime, json, os, re, sys, traceback
from contextlib import contextmanager

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LOG_DIR = os.environ.get("LOG_DIR") or os.path.join(ROOT, "logs", "runtime")
CATALOG_FILE = os.path.join(ROOT, "config", "error-codes.json")
SENSITIVE = re.compile(r"pass(word)?|hash|secret|token|cookie|authorization|csrf", re.I)
GUIDE = "docs/architecture/SkyTech_Troubleshooting_Guide.html"


def _catalog():
    """Loads config/error-codes.json once; returns {code: entry} (empty if the file is missing)."""
    try:
        with open(CATALOG_FILE, encoding="utf-8") as f:
            return {c["code"]: c for c in json.load(f)["codes"]}
    except Exception:
        return {}


CATALOG = _catalog()


def _redact(fields):
    """Replaces values of sensitive keys (passwords, tokens…) with [redacted]."""
    return {k: ("[redacted]" if SENSITIVE.search(k) else v) for k, v in fields.items()}


class Logger:
    """Writes JSON lines to logs/runtime/scripts-<date>.log and short lines to the screen."""

    def __init__(self, script):
        self.script = script
        self.file_ok = True
        try:
            os.makedirs(LOG_DIR, exist_ok=True)
        except OSError as e:
            self.file_ok = False
            print(f"[SKY-SYS-003] Log folder {LOG_DIR} cannot be written ({e}); logging to screen only.", file=sys.stderr)

    def write(self, level, msg, **fields):
        """Records one event. level: info | warn | error."""
        entry = {"ts": datetime.datetime.utcnow().isoformat(timespec="milliseconds") + "Z", "level": level,
                 "category": self.script, "msg": msg, **_redact(fields)}
        if self.file_ok:
            try:
                path = os.path.join(LOG_DIR, f"scripts-{datetime.date.today().isoformat()}.log")
                with open(path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(entry, default=str) + "\n")
            except OSError:
                self.file_ok = False
        if level != "info":
            tag = f" [{fields['code']}]" if fields.get("code") else ""
            print(f"{level.upper()} {self.script}{tag}: {msg}", file=sys.stderr)

    def info(self, msg, **f): self.write("info", msg, **f)
    def warn(self, msg, **f): self.write("warn", msg, **f)
    def error(self, msg, **f): self.write("error", msg, **f)


_loggers = {}


def get(script):
    """Returns the logger for a script name (one per name)."""
    return _loggers.setdefault(script, Logger(script))


def fail(code, msg, script=None, **fields):
    """Logs the failure with its SkyTech code, prints the first fix step and the guide link, and exits with code 1."""
    script = script or os.path.splitext(os.path.basename(sys.argv[0] or "script"))[0]
    get(script).error(msg, code=code, **fields)
    fix = (CATALOG.get(code, {}).get("fix") or [""])[0]
    print(f"\n[{code}] {msg}" + (f"\nFix: {fix}" if fix else "") + f"\nGuide: {GUIDE}#{code}", file=sys.stderr)
    sys.exit(1)


@contextmanager
def guard(script, code="SKY-SYS-001"):
    """Wraps a script's main work: missing modules → SKY-DOC-001, missing files → SKY-DOC-002 (or the given code),
    disk full → SKY-SYS-002, anything else → the given code. The full traceback goes to the log only."""
    try:
        yield get(script)
    except SystemExit:
        raise
    except ModuleNotFoundError as e:
        fail("SKY-DOC-001", f"Python package missing: {e.name} (pip install {e.name})", script)
    except FileNotFoundError as e:
        fail(code if code != "SKY-SYS-001" else "SKY-DOC-002", f"File not found: {e.filename}", script)
    except OSError as e:
        fail("SKY-SYS-002" if getattr(e, "errno", 0) == 28 else code, f"{type(e).__name__}: {e}", script)
    except Exception as e:
        get(script).error("traceback", code=code, trace=traceback.format_exc()[-3000:])
        fail(code, f"{type(e).__name__}: {e}", script)

def install(script, code="SKY-SYS-001"):
    """For scripts written as top-level code: any uncaught error becomes a coded, logged failure (see guard)
    and a start line is logged. Call once, right after the imports."""
    get(script).info("start", argv=sys.argv[1:])

    def hook(kind, err, tb):
        if issubclass(kind, (KeyboardInterrupt, SystemExit)):
            return sys.__excepthook__(kind, err, tb)
        try:
            with guard(script, code):
                raise err.with_traceback(tb)
        except SystemExit as e:
            os._exit(e.code if isinstance(e.code, int) else 1)
    sys.excepthook = hook

# Version: V1.0 (2026-10-10) — scripts/common/skylog.py — V1.0

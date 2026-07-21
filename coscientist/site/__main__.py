from __future__ import annotations

import argparse
import json
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

from .publisher import PublicationError, asset_budget, publish_run, rebuild_index, validate_content


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(prog="python -m coscientist.site")
    commands = root.add_subparsers(dest="command", required=True)
    publish = commands.add_parser("publish-run")
    publish.add_argument("--run-root", type=Path, required=True)
    publish.add_argument("--portal-root", type=Path, required=True)
    publish.add_argument("--visibility", required=True)
    validate = commands.add_parser("validate-content")
    validate.add_argument("--portal-root", type=Path, required=True)
    validate.add_argument("--public-build", action="store_true")
    rebuild = commands.add_parser("rebuild-index")
    rebuild.add_argument("--portal-root", type=Path, required=True)
    preview = commands.add_parser("preview-site")
    preview.add_argument("--portal-root", type=Path, required=True)
    preview.add_argument("--port", type=int, default=4173)
    budget = commands.add_parser("asset-budget")
    budget.add_argument("--portal-root", type=Path, required=True)
    return root


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        if args.command == "publish-run":
            result = publish_run(args.run_root, args.portal_root, args.visibility)
        elif args.command == "validate-content":
            result = validate_content(args.portal_root, public_build=True if args.public_build else None)
            if result["status"] != "PASS":
                print(json.dumps(result, ensure_ascii=False, indent=2))
                return 1
        elif args.command == "rebuild-index":
            result = rebuild_index(args.portal_root)
        elif args.command == "asset-budget":
            result = asset_budget(args.portal_root)
            if result["status"] == "BLOCK":
                print(json.dumps(result, indent=2))
                return 1
        else:
            directory = args.portal_root.resolve() / "out"
            if not directory.exists():
                raise PublicationError("out/ does not exist; run the static build first")
            handler = lambda *handler_args, **kwargs: SimpleHTTPRequestHandler(*handler_args, directory=str(directory), **kwargs)
            print(f"Previewing {directory} at http://127.0.0.1:{args.port}")
            ThreadingHTTPServer(("127.0.0.1", args.port), handler).serve_forever()
            return 0
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except PublicationError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

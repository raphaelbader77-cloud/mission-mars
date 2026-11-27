"""Serve the bundled game on this computer. Run with Python 3."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
import webbrowser

BUILD = Path(__file__).resolve().parent / "dist"
PORT = 8084


def main():
    if not (BUILD / "index.html").is_file():
        sys.exit("The game build is missing. Run npm ci and npm run build first.")
    handler = partial(SimpleHTTPRequestHandler, directory=str(BUILD))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    except OSError as error:
        sys.exit(f"Could not open port {PORT}. Close another local copy and retry. {error}")
    url = f"http://127.0.0.1:{PORT}/"
    print(f"Mission Mars: {url}\nPress Ctrl+C to stop.", flush=True)
    webbrowser.open(url)
    with server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()


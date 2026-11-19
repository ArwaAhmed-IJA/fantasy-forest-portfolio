"""
CS50P Final Project – Fantasy Forest Portfolio
project.py

Loads portfolio data from data/skills.json, validates it, generates
hotspot HTML fragments, and renders Jinja2 templates into the output/
directory as a fully static website.

Run:  python project.py          → build the site into output/
      python project.py --serve  → build + open in browser via http.server
"""

import json
import os
import re
import shutil
import sys
import http.server
import threading
import webbrowser
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, TemplateNotFound


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent
DATA_FILE = ROOT / "data" / "skills.json"
TEMPLATES_DIR = ROOT / "templates"
STATIC_DIR = ROOT / "static"
OUTPUT_DIR = ROOT / "output"


# ---------------------------------------------------------------------------
# load_skills
# ---------------------------------------------------------------------------
def load_skills(path: str | Path) -> dict:
    """
    Read and validate the portfolio data file.

    Args:
        path: Path to a JSON file containing portfolio data.

    Returns:
        Parsed data dict.

    Raises:
        FileNotFoundError: if the file does not exist.
        ValueError: if required top-level keys are missing, if any shelf is
                    missing required fields, or if hotspot coordinates are
                    outside [0, 100].
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {path}")

    with open(path, encoding="utf-8") as fh:
        try:
            data = json.load(fh)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON in {path}: {exc}") from exc

    # Required top-level keys
    required_keys = {"owner", "shelves", "projects", "about"}
    missing = required_keys - data.keys()
    if missing:
        raise ValueError(f"Data file missing required keys: {missing}")

    # Validate shelves
    shelf_required = {"id", "label", "hotspot", "skills"}
    for shelf in data["shelves"]:
        missing_shelf = shelf_required - shelf.keys()
        if missing_shelf:
            raise ValueError(
                f"Shelf '{shelf.get('id', '?')}' missing fields: {missing_shelf}"
            )
        if not shelf["skills"]:
            raise ValueError(f"Shelf '{shelf['id']}' has an empty skills list.")
        _validate_hotspot(shelf["hotspot"], context=f"shelf '{shelf['id']}'")

    # Validate projects
    project_required = {"id", "title", "hotspot", "description"}
    for project in data["projects"]:
        missing_proj = project_required - project.keys()
        if missing_proj:
            raise ValueError(
                f"Project '{project.get('id', '?')}' missing fields: {missing_proj}"
            )
        _validate_hotspot(project["hotspot"], context=f"project '{project['id']}'")

    # Validate about hotspot
    _validate_hotspot(data["about"]["hotspot"], context="about")

    return data


def _validate_hotspot(hotspot: dict, context: str = "") -> None:
    """
    Ensure hotspot has top/left/width/height, all in [0, 100].

    Raises:
        ValueError on any violation.
    """
    required = {"top", "left", "width", "height"}
    missing = required - hotspot.keys()
    if missing:
        raise ValueError(
            f"Hotspot for {context} missing coordinate keys: {missing}"
        )
    for key in required:
        val = hotspot[key]
        if not isinstance(val, (int, float)):
            raise ValueError(
                f"Hotspot coord '{key}' for {context} must be numeric, got {type(val).__name__}."
            )
        if not (0 <= val <= 100):
            raise ValueError(
                f"Hotspot coord '{key}' for {context} must be in [0, 100], got {val}."
            )


# ---------------------------------------------------------------------------
# generate_hotspots
# ---------------------------------------------------------------------------
def generate_hotspots(skills_data: dict) -> list[dict]:
    """
    Convert the loaded skills data into a flat list of hotspot dicts ready
    for the Jinja2 template.

    Each dict has:
        id        – unique string identifier
        top       – CSS top % string, e.g. "28%"
        left      – CSS left % string
        width     – CSS width % string
        height    – CSS height % string
        label     – human-readable aria-label / tooltip
        kind      – "shelf" | "project" | "about"
        color     – accent colour for the glow ring

    Args:
        skills_data: dict as returned by load_skills().

    Returns:
        List of hotspot dicts.
    """
    hotspots: list[dict] = []

    for shelf in skills_data["shelves"]:
        hs = shelf["hotspot"]
        hotspots.append(
            {
                "id": f"hs-{shelf['id']}",
                "top": f"{hs['top']}%",
                "left": f"{hs['left']}%",
                "width": f"{hs['width']}%",
                "height": f"{hs['height']}%",
                "label": shelf["label"],
                "kind": "shelf",
                "color": shelf.get("color", "#c0843a"),
                "data_target": shelf["id"],
            }
        )

    for project in skills_data["projects"]:
        hs = project["hotspot"]
        hotspots.append(
            {
                "id": f"hs-{project['id']}",
                "top": f"{hs['top']}%",
                "left": f"{hs['left']}%",
                "width": f"{hs['width']}%",
                "height": f"{hs['height']}%",
                "label": project["title"],
                "kind": "project",
                "color": project.get("color", "#7b5ea7"),
                "data_target": project["id"],
            }
        )

    about_hs = skills_data["about"]["hotspot"]
    hotspots.append(
        {
            "id": "hs-about",
            "top": f"{about_hs['top']}%",
            "left": f"{about_hs['left']}%",
            "width": f"{about_hs['width']}%",
            "height": f"{about_hs['height']}%",
            "label": "About Me",
            "kind": "about",
            "color": "#d4a853",
            "data_target": "about",
        }
    )

    return hotspots


# ---------------------------------------------------------------------------
# render_page
# ---------------------------------------------------------------------------
def render_page(template_name: str, context: dict[str, Any], out_path: str | Path) -> Path:
    """
    Render a Jinja2 template to an HTML file.

    Args:
        template_name: Filename inside templates/, e.g. "index.html".
        context:       Dict of variables passed to the template.
        out_path:      Destination file path.

    Returns:
        Resolved Path of the written file.

    Raises:
        TemplateNotFound: if the template file does not exist.
        OSError: if the output directory cannot be created.
    """
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=True,
    )

    try:
        template = env.get_template(template_name)
    except TemplateNotFound:
        raise TemplateNotFound(f"Template '{template_name}' not found in {TEMPLATES_DIR}")

    html = template.render(**context)

    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    return out_path.resolve()


# ---------------------------------------------------------------------------
# validate_contact
# ---------------------------------------------------------------------------
def validate_contact(name: str, email: str, message: str) -> tuple[bool, str]:
    """
    Validate a contact-form submission.

    Args:
        name:    Sender's name.
        email:   Sender's e-mail address.
        message: Body of the message.

    Returns:
        (True, "")         on success.
        (False, reason)    when validation fails, where reason is a
                           human-readable error string.
    """
    name = name.strip()
    email = email.strip()
    message = message.strip()

    if not name:
        return False, "Name is required."
    if len(name) < 2:
        return False, "Name must be at least 2 characters."

    if not email:
        return False, "Email is required."
    email_pattern = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    if not email_pattern.match(email):
        return False, "Email address is not valid."

    if not message:
        return False, "Message is required."
    if len(message) < 10:
        return False, "Message must be at least 10 characters."

    return True, ""


# ---------------------------------------------------------------------------
# _copy_static
# ---------------------------------------------------------------------------
def _copy_static() -> None:
    """Copy everything in static/ into output/static/."""
    src = STATIC_DIR
    dst = OUTPUT_DIR / "static"
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
def main() -> None:
    """
    Build the portfolio site:
      1. Load & validate data/skills.json.
      2. Generate hotspot dicts.
      3. Render index.html (door) and library.html into output/.
      4. Copy static assets.
      5. Optionally serve with http.server when --serve flag is passed.
    """
    serve = "--serve" in sys.argv

    # 1. Load data
    print("Loading portfolio data…")
    data = load_skills(DATA_FILE)

    # 2. Generate hotspots
    print("Generating hotspots…")
    hotspots = generate_hotspots(data)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 3. Render door page
    print("Rendering door page…")
    render_page(
        "index.html",
        {"owner": data["owner"], "page": "door"},
        OUTPUT_DIR / "index.html",
    )

    # 4. Render library page
    print("Rendering library page…")
    render_page(
        "library.html",
        {
            "owner": data["owner"],
            "shelves": data["shelves"],
            "projects": data["projects"],
            "about": data["about"],
            "certificates": data.get("certificates", []),
            "experience": data.get("experience", []),
            "contact": data.get("contact", {}),
            "section_books": data.get("section_books", []),
            "hotspots": hotspots,
            "page": "library",
        },
        OUTPUT_DIR / "library.html",
    )

    # 5. Copy static assets
    print("Copying static assets…")
    _copy_static()

    print(f"\n✅  Site built → {OUTPUT_DIR / 'index.html'}")

    # 6. Optional dev server
    if serve:
        port = 8000
        os.chdir(OUTPUT_DIR)

        handler = http.server.SimpleHTTPRequestHandler
        httpd = http.server.HTTPServer(("", port), handler)

        url = f"http://localhost:{port}"
        print(f"🌐  Serving at {url}  (Ctrl+C to stop)")

        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        webbrowser.open(url)

        try:
            thread.join()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            httpd.shutdown()


if __name__ == "__main__":
    main()

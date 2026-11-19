"""
CS50P Final Project – Fantasy Forest Portfolio
test_project.py

pytest test suite for the core functions in project.py:
  - load_skills
  - generate_hotspots
  - render_page
  - validate_contact

CS50P Requirement:
  At least 3 top-level functions matching test_<function_name> must be defined.
  Here, all 4 custom functions are rigorously tested.
"""

import json
import copy
from pathlib import Path

import pytest
from jinja2 import TemplateNotFound

from project import (
    generate_hotspots,
    load_skills,
    render_page,
    validate_contact,
)


# ---------------------------------------------------------------------------
# Test Fixtures / Mock Data
# ---------------------------------------------------------------------------

SAMPLE_DATA = {
    "owner": {
        "name": "Test Adventurer",
        "title": "Software Engineer",
        "github": "testuser",
        "edx": "testuser",
        "city": "Boston",
        "country": "USA",
        "email": "test@example.com",
        "bio": "A passionate developer exploring the digital wilderness.",
        "resume_url": "#",
    },
    "shelves": [
        {
            "id": "languages",
            "label": "Languages",
            "shelf_number": 1,
            "color": "#c0843a",
            "hotspot": {"top": 28, "left": 18, "width": 22, "height": 10},
            "skills": [
                {"name": "Python", "level": 90, "icon": "🐍"},
                {"name": "JavaScript", "level": 80, "icon": "🌐"},
            ],
        },
        {
            "id": "web",
            "label": "Web & Frameworks",
            "shelf_number": 2,
            "color": "#7b5ea7",
            "hotspot": {"top": 41, "left": 18, "width": 22, "height": 10},
            "skills": [
                {"name": "Flask", "level": 82, "icon": "🧪"},
            ],
        },
    ],
    "projects": [
        {
            "id": "cs50p-portfolio",
            "title": "Fantasy Portfolio",
            "subtitle": "Interactive portfolio generator",
            "tech": ["Python", "Jinja2", "CSS"],
            "description": "A mystical fantasy forest portfolio website generator.",
            "github_url": "https://github.com/testuser/portfolio",
            "demo_url": "https://testuser.github.io/portfolio",
            "color": "#c0843a",
            "hotspot": {"top": 72, "left": 58, "width": 20, "height": 18},
        }
    ],
    "about": {
        "hotspot": {"top": 30, "left": 55, "width": 26, "height": 18},
        "paragraphs": [
            "Curious coder walking through ancient digital woods.",
            "Building robust Python and web applications.",
        ],
    },
}


# ---------------------------------------------------------------------------
# Top-level test functions (Strict CS50P Requirement: test_<func_name>)
# ---------------------------------------------------------------------------

def test_load_skills(tmp_path):
    """
    Test load_skills():
      - Correctly parses valid JSON and preserves data structures.
      - Raises FileNotFoundError on nonexistent files.
      - Raises ValueError on invalid JSON syntax.
      - Raises ValueError on missing top-level keys.
      - Raises ValueError on coordinates out of [0, 100].
      - Raises ValueError on empty skills list.
    """
    # 1. Valid data
    valid_file = tmp_path / "valid_skills.json"
    valid_file.write_text(json.dumps(SAMPLE_DATA), encoding="utf-8")
    loaded = load_skills(valid_file)
    assert isinstance(loaded, dict)
    assert loaded["owner"]["name"] == "Test Adventurer"
    assert len(loaded["shelves"]) == 2
    assert len(loaded["projects"]) == 1
    assert "about" in loaded

    # 2. Nonexistent file raises FileNotFoundError
    with pytest.raises(FileNotFoundError):
        load_skills(tmp_path / "does_not_exist.json")

    # 3. Invalid JSON syntax raises ValueError
    bad_json = tmp_path / "syntax_error.json"
    bad_json.write_text("{malformed_json: true,", encoding="utf-8")
    with pytest.raises(ValueError, match="Invalid JSON"):
        load_skills(bad_json)

    # 4. Missing required top-level key
    missing_key_data = copy.deepcopy(SAMPLE_DATA)
    del missing_key_data["shelves"]
    missing_key_file = tmp_path / "missing_shelves.json"
    missing_key_file.write_text(json.dumps(missing_key_data), encoding="utf-8")
    with pytest.raises(ValueError, match="missing required keys"):
        load_skills(missing_key_file)

    # 5. Out of range coordinates (> 100)
    bad_coord_data = copy.deepcopy(SAMPLE_DATA)
    bad_coord_data["shelves"][0]["hotspot"]["top"] = 125
    bad_coord_file = tmp_path / "bad_coord.json"
    bad_coord_file.write_text(json.dumps(bad_coord_data), encoding="utf-8")
    with pytest.raises(ValueError, match=r"must be in \[0, 100\]"):
        load_skills(bad_coord_file)

    # 6. Negative coordinates (< 0)
    neg_coord_data = copy.deepcopy(SAMPLE_DATA)
    neg_coord_data["projects"][0]["hotspot"]["left"] = -10
    neg_coord_file = tmp_path / "neg_coord.json"
    neg_coord_file.write_text(json.dumps(neg_coord_data), encoding="utf-8")
    with pytest.raises(ValueError, match=r"must be in \[0, 100\]"):
        load_skills(neg_coord_file)

    # 7. Empty skills list
    empty_skills_data = copy.deepcopy(SAMPLE_DATA)
    empty_skills_data["shelves"][0]["skills"] = []
    empty_skills_file = tmp_path / "empty_skills.json"
    empty_skills_file.write_text(json.dumps(empty_skills_data), encoding="utf-8")
    with pytest.raises(ValueError, match="empty skills list"):
        load_skills(empty_skills_file)


def test_generate_hotspots():
    """
    Test generate_hotspots():
      - Returns a list with count = shelves + projects + 1 (about).
      - Each hotspot contains required keys: id, top, left, width, height, label, kind.
      - Coordinate values are formatted as CSS percentage strings (e.g., '28%').
      - Correctly maps kinds: 'shelf', 'project', and 'about'.
      - Assigns correct ID prefixes.
    """
    hotspots = generate_hotspots(SAMPLE_DATA)
    assert isinstance(hotspots, list)

    expected_count = len(SAMPLE_DATA["shelves"]) + len(SAMPLE_DATA["projects"]) + 1
    assert len(hotspots) == expected_count

    required_keys = {"id", "top", "left", "width", "height", "label", "kind", "color", "data_target"}
    for hs in hotspots:
        assert required_keys.issubset(hs.keys())
        assert hs["top"].endswith("%")
        assert hs["left"].endswith("%")
        assert hs["width"].endswith("%")
        assert hs["height"].endswith("%")

    # Shelves
    shelf_spots = [h for h in hotspots if h["kind"] == "shelf"]
    assert len(shelf_spots) == 2
    assert shelf_spots[0]["id"] == "hs-languages"
    assert shelf_spots[0]["top"] == "28%"
    assert shelf_spots[0]["left"] == "18%"

    # Projects
    project_spots = [h for h in hotspots if h["kind"] == "project"]
    assert len(project_spots) == 1
    assert project_spots[0]["id"] == "hs-cs50p-portfolio"
    assert project_spots[0]["label"] == "Fantasy Portfolio"

    # About
    about_spots = [h for h in hotspots if h["kind"] == "about"]
    assert len(about_spots) == 1
    assert about_spots[0]["id"] == "hs-about"
    assert about_spots[0]["data_target"] == "about"


def test_render_page(tmp_path):
    """
    Test render_page():
      - Renders Jinja2 template and writes to output file.
      - Successfully passes and interpolates context variables.
      - Automatically creates missing parent directories.
      - Returns absolute resolved Path.
      - Raises TemplateNotFound for missing templates.
    """
    import project as proj

    test_tmpl_dir = tmp_path / "custom_templates"
    test_tmpl_dir.mkdir()
    (test_tmpl_dir / "door.html").write_text(
        "<html><title>{{ owner.name }}</title><body>{{ page }}</body></html>",
        encoding="utf-8",
    )

    original_templates_dir = proj.TEMPLATES_DIR
    proj.TEMPLATES_DIR = test_tmpl_dir
    try:
        dest_file = tmp_path / "build" / "nested" / "output.html"
        res_path = render_page(
            "door.html",
            {"owner": {"name": "Morgan Le Fay"}, "page": "entrance"},
            dest_file,
        )

        assert dest_file.exists()
        assert res_path == dest_file.resolve()

        content = dest_file.read_text(encoding="utf-8")
        assert "<title>Morgan Le Fay</title>" in content
        assert "<body>entrance</body>" in content

        # Nonexistent template
        with pytest.raises(TemplateNotFound):
            render_page("nonexistent.html", {}, tmp_path / "fail.html")
    finally:
        proj.TEMPLATES_DIR = original_templates_dir


def test_validate_contact():
    """
    Test validate_contact():
      - Returns (True, "") for valid contact form submissions.
      - Rejects empty or too-short names (< 2 chars).
      - Rejects empty, missing '@', or missing domain in email.
      - Rejects empty or too-short messages (< 10 chars).
      - Strips surrounding whitespace before validation.
    """
    # 1. Valid inputs
    ok, err = validate_contact("Linus Torvalds", "linus@kernel.org", "I love the fantasy forest portfolio!")
    assert ok is True
    assert err == ""

    # 2. Empty / short name
    ok, err = validate_contact("", "user@example.com", "Valid message text here.")
    assert ok is False
    assert "Name is required" in err

    ok, err = validate_contact("A", "user@example.com", "Valid message text here.")
    assert ok is False
    assert "at least 2 characters" in err

    # 3. Email validation
    ok, err = validate_contact("Alice", "", "Valid message text here.")
    assert ok is False
    assert "Email is required" in err

    ok, err = validate_contact("Alice", "notanemail", "Valid message text here.")
    assert ok is False
    assert "valid" in err.lower()

    ok, err = validate_contact("Alice", "alice@", "Valid message text here.")
    assert ok is False
    assert "valid" in err.lower()

    ok, err = validate_contact("Alice", "alice@domain", "Valid message text here.")
    assert ok is False
    assert "valid" in err.lower()

    # 4. Message validation
    ok, err = validate_contact("Alice", "alice@example.com", "")
    assert ok is False
    assert "Message is required" in err

    ok, err = validate_contact("Alice", "alice@example.com", "Too short")
    assert ok is False
    assert "at least 10 characters" in err

    # 5. Whitespace handling
    ok, err = validate_contact("   ", "alice@example.com", "Valid message text here.")
    assert ok is False
    assert "Name is required" in err

    ok, err = validate_contact("Alice", "alice@example.com", "         ")
    assert ok is False
    assert "Message is required" in err

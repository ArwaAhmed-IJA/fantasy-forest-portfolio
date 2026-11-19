# Fantasy Forest Portfolio Generator
#### Video Demo: <URL HERE>
#### Description:

The **Fantasy Forest Portfolio Generator** is a Python-powered static website builder and interactive portfolio application designed for software engineers and submitted as a CS50P (CS50's Introduction to Programming with Python) final project. Rather than treating a personal portfolio as a hand-crafted, static HTML document, this project treats the portfolio website as compiled output generated from a structured, validated data source. 

The software takes a data file (`data/skills.json`) specifying the engineer's profile, categorized technical skills, featured software projects, narrative background, and coordinates for interactive visual hotspots. The Python engine validates this data structure with rigorous boundary and schema checks, compiles interactive hotspot elements, renders responsive Jinja2 templates, copies static assets (CSS, JavaScript, and background art), and outputs an accessible, high-performance static website ready for production hosting.

The generated web experience immerses the visitor in a mystical fantasy realm:
1. **The Entrance (Landing Scene):** An ancient arched wooden door set deep into a massive tree trunk amidst twisted mossy roots, draped wisteria vines, lantern glow, and ambient floating fireflies. Visitors can click the door or press the keyboard to activate an authentic CSS 3D door swing animation (`perspective`, `rotateY`), releasing a warm flood of candlelit amber light before transitioning into the interior.
2. **The Library (Portfolio Scene):** A cozy fantasy library nook nestled in the woods, flanked by misty forest trees and overlooking a hazy tranquil lake with a swan. On the wooden shelves, antique floral-spined books represent categorized skill sets (Languages, Web & Frameworks, Data & Machine Learning, Tools & Operations). On the foreground wooden table, stacks of aged leather books represent featured engineering projects and an "About Me" chronicle.
3. **Parchment Panels:** Clicking any shelf, table book, or hotspot opens an illuminated parchment scroll modal displaying skill proficiency bars, project descriptions with external repository/demo links, or personal biographical information.

---

### Project File Structure & Components

Here is a breakdown of every file in the project repository and its specific responsibility:

* **`project.py`**: The core Python program and entry point for the project. Defined at the top level are `main()` and four custom functions:
  * `load_skills(path)`: Reads and parses `data/skills.json`. Enforces strict schema integrity: validates required top-level keys (`owner`, `shelves`, `projects`, `about`), checks that each shelf and project contains required metadata, ensures that skill lists are not empty, and confirms that all visual hotspot coordinates (`top`, `left`, `width`, `height`) are numeric values strictly within the `[0, 100]` percentage interval.
  * `generate_hotspots(skills_data)`: Transforms validated raw skill and project data into a flattened list of hotspot dictionaries. Each dictionary is populated with formatted CSS percentage strings, unique identifiers, ARIA labels, target modal dialog identifiers, and color accents.
  * `render_page(template_name, context, out_path)`: Initializes a Jinja2 template environment with autoescaping enabled, renders the specified template with the given context dictionary, ensures parent directories exist, and writes the output HTML to disk, returning the absolute resolved `Path`.
  * `validate_contact(name, email, message)`: Validates contact form submissions using string normalization and regular expressions to enforce valid email formats, non-empty names, and minimum message lengths.
  * `main()`: Orchestrates the pipeline—loading and validating data, generating hotspots, compiling `index.html` and `library.html`, synchronizing static assets, and supporting an optional `--serve` flag to spin up a local `http.server` with automatic browser launching.

* **`test_project.py`**: The pytest automated test suite. Satisfies the CS50P requirement with top-level test functions (`test_load_skills`, `test_generate_hotspots`, `test_render_page`, and `test_validate_contact`). Tests cover both successful execution paths and exception cases, including `FileNotFoundError`, malformed JSON syntax, out-of-range coordinates, negative percentages, empty collections, Jinja2 `TemplateNotFound` errors, and invalid email regex patterns.

* **`requirements.txt`**: Specifies the pip-installable dependencies (`jinja2`, `pillow`, `pytest`), one per line, enabling clean installation in any Python 3 virtual environment.

* **`data/skills.json`**: The single source of truth for the portfolio. Contains owner metadata, categorized skill lists with emoji icons and proficiency percentages, featured software projects with URLs and tech stack badges, personal bio paragraphs, and bounding hotspot coordinates.

* **`templates/index.html`**: Jinja2 template for the entrance landing page. Contains semantic markup for the 3D wooden door, tree arch, lantern, light flood overlay, skip link, and particle containers.

* **`templates/library.html`**: Jinja2 template for the interactive fantasy library. Dynamically iterates over shelves, skill items, and projects to generate the bookshelf rows, table book stacks, hotspot triggers, and accessible modal parchment panels.

* **`static/css/door.css`**: Styles the entrance page. Implements pure CSS art for the forest background, tree trunk, door planks, hinges, lantern flame animation, and 3D door swing perspective.

* **`static/css/library.css`**: Styles the library scene. Defines the layout for the bookshelf, wooden planks, individual book spines, glowing candlelight, mist, floating fireflies, and parchment-style modal dialogs with animated proficiency bars.

* **`static/js/door.js`**: Controls client-side interaction on the door page: binds click and keyboard events (`Enter`, `Space`), spawns randomized floating fireflies and petals, triggers the opening animation and light flood, safely checks `prefers-reduced-motion`, and navigates to the library.

* **`static/js/library.js`**: Handles modal dialog interactions: opens corresponding parchment panels on hotspot/book clicks, traps focus, listens for `Escape` or backdrop clicks to dismiss panels, safely interacts with `localStorage` within `try...catch` blocks, and generates animated firefly particles.

* **`static/images/`**: Contains generated fantasy artwork assets (`door.jpg` and `library.jpg`) depicting the ancient wooden door and library nook in the woods.

* **`output/`**: The target directory where the compiled website is published. Contains the generated `index.html`, `library.html`, and copied static folders.

---

### Architectural & Design Choices

#### 1. Static Generation from JSON vs. Hardcoded HTML
A central question during initial design was whether to build static HTML pages directly or create a Python generator. Choosing Python static site generation was motivated by software engineering best practices:
- **Separation of Concerns:** Profile data, styling, and structural presentation are decoupled. An engineer updating their skills or adding a new project only modifies `data/skills.json`; the Python pipeline automatically handles rendering, validation, and layout.
- **Fail-Fast Data Integrity:** The validator in `load_skills()` ensures that invalid coordinates, missing project links, or malformed data are caught at build time with descriptive exceptions, rather than rendering a broken UI in production.
- **Reusability and Portability:** The compiled `output/` directory is 100% static, meaning it can be hosted cost-free on GitHub Pages, Cloudflare Pages, Netlify, or AWS S3 without needing a persistent backend server.

#### 2. Percentage-Based Hotspots vs. Fixed Pixels
Interactive hotspots on both the door and the bookshelf are calculated strictly as percentages (`top: 28%`, `left: 18%`, `width: 22%`, `height: 10%`). Using relative CSS percentages ensures that hotspots scale fluidly across varied screen sizes, aspect ratios, and high-DPI displays without desynchronizing from the underlying visual elements.

#### 3. Lightweight CSS 3D Animations vs. Heavy Video Assets
Instead of embedding a pre-rendered 20MB video or heavy 3D WebGL framework (such as Three.js), the door transition is rendered entirely with hardware-accelerated CSS properties (`transform: perspective(1200px) rotateY(-75deg)` and `transition: opacity .6s ease`). This approach achieves a lightweight initial download (< 50KB total CSS/JS payload), instantaneous rendering, 60fps animations on mobile devices, and zero external runtime dependencies.

#### 4. Accessibility First (a11y)
Immersive fantasy aesthetics must never compromise accessibility. The following features ensure that recruiters and screen-reader users can access all content without friction:
- **Skip Links:** Every page includes an invisible `<a class="skip-link">` that appears on tab focus, allowing keyboard users to bypass the visual scene directly to content.
- **Keyboard Navigation:** The entrance door and all library books are `<button>` elements with clear `aria-label` attributes and keyboard event listeners for `Enter` and `Space`.
- **Focus Management:** When a parchment modal opens, focus automatically shifts to its close button; pressing `Escape` closes the panel and restores focus to the triggering element.
- **Motion Sensitivity:** Scripts check `window.matchMedia('(prefers-reduced-motion: reduce)')` to instantly navigate without triggering motion-intensive animations for users sensitive to vestibular motion.
- **Storage Resilience:** Any interaction with browser `localStorage` is wrapped in `try...catch` blocks to ensure compatibility with private browsing modes and strict browser privacy sandboxes.

---

### Installation & Usage

#### Prerequisites
- Python 3.10 or higher
- pip (Python package manager)

#### 1. Setup Virtual Environment
```bash
python -m venv venv
# On Windows PowerShell:
venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate
```

#### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 3. Run Automated Tests
Execute the pytest suite to verify all core functions:
```bash
pytest
# or
python -m pytest
```

#### 4. Build the Portfolio
Compile the website into the `output/` directory:
```bash
python project.py
```

#### 5. Local Development Server
To build the site and immediately preview it in your default web browser:
```bash
python project.py --serve
```

---

### Video Demo & Submission Checklist

For CS50P submission compliance:
1. **Video Demo:** Upload a screencast (under 3 minutes) to YouTube (flagged Unlisted). The video must open with:
   - Project Title: *Fantasy Forest Portfolio Generator*
   - Your Full Name: *Arwa Ahmed*
   - Your GitHub and edX usernames
   - Your City and Country
   - Date of Recording
2. Update the `#### Video Demo: <URL HERE>` placeholder at the top of this `README.md` with your video link.
3. Submit via terminal:
   ```bash
   submit50 cs50/problems/2022/python/project
   ```
4. Verify your score and feedback on [cs50.me/cs50p](https://cs50.me/cs50p).

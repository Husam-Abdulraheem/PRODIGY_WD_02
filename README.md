# Prodigy InfoTech — Web Development Internship
## Task 02: Precision Stopwatch Web Application

![Prodigy InfoTech Task-02](https://img.shields.io/badge/PRODIGY__WD__02-Task--02-6366f1?style=for-the-badge&logo=target)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

A modern, high-precision, responsive **Stopwatch Web Application** designed and implemented using semantic **HTML5**, modern **CSS3**, and modular **JavaScript (ES6+)**. Engineered with monotonic high-resolution timestamps, fluid SVG dial animations, comprehensive lap analytics, Web Audio API sound synthesis, and full keyboard accessibility.

---

## 🌟 Key Features

### 1. High-Precision Monotonic Engine
- Powered by `performance.now()` with millisecond and centisecond accuracy.
- **Drift-proof**: Eliminates interval lag and timer drift caused by browser thread throttling and background tab suspension through hybrid animation frame (`requestAnimationFrame`) and background heartbeat updates.

### 2. Interactive SVG Dial & Digital Readout
- Animated circular progress ring with radial glow stroke (`stroke-dasharray` and `stroke-dashoffset`) cycling smoothly every 60 seconds.
- Non-jittering digital time readout using tabular figures (`font-variant-numeric: tabular-nums`) displaying `HH:MM:SS.cs` (Hours, Minutes, Seconds, and Centiseconds).
- Real-time current lap split counter displaying active lap duration alongside total elapsed time.

### 3. Lap Tracking & Statistical Analysis
- **Split & Cumulative Timing**: Records individual lap split duration, overall elapsed time, and split delta compared to the previous lap.
- **Smart Badges**: Dynamically identifies and highlights the **Fastest Lap** (emerald green badge) and **Slowest Lap** (amber badge).
- **Statistical Summary Grid**: Real-time cards calculating:
  - Total Laps Recorded
  - Fastest Lap time & ID
  - Slowest Lap time & ID
  - Average Lap duration across all intervals

### 4. Data Export & Utilities
- **Copy to Clipboard**: Formats recorded laps into an aligned tabular text summary ready to paste into notes or spreadsheets.
- **Export CSV**: Generates and downloads a `.csv` file containing lap numbers, formatted split times, formatted overall times, and raw millisecond measurements.
- **Clear Laps**: Dedicated option to clear lap history without interrupting an ongoing timing session.

### 5. Multi-Theme Glassmorphism UI (Light & Dark Collections)
- **Light Themes**:
  - **Nordic Frost**: Crisp, frosted minimalist white with royal blue accents.
  - **Sakura Rose**: Warm porcelain blush with vibrant rose-pink and sunset coral.
  - **Sage Emerald**: Botanical crisp green with fresh jade and mint highlights.
  - **Warm Sunlight**: Gentle cream amber with golden honey and warm espresso tones.
  - **Lilac Breeze**: Soft pastel lavender with electric violet and lilac accents.
  - **Coastal Sky**: Bright ice-blue with vivid ocean cyan and deep navy contrast.
- **Dark Themes**:
  - **Cyber Indigo (Default)**: Deep cosmic violet matching the Prodigy InfoTech brand.
  - **Midnight OLED**: High-contrast pitch black with neon emerald and glacier blue.
  - **Matrix Emerald**: Deep obsidian forest with glowing neon mint.
  - **Sunset Crimson**: Velvet noir with fiery crimson and sunset orange.
  - **Solar Amber**: Deep warm charcoal with radiant amber gold.
  - **Neon Amethyst**: Cosmic plum with electric violet and fuchsia.
  - **Ocean Abyss**: Deep oceanic navy with electric cyan highlights.
- Categorized interactive dropdown selector and keyboard cycling (<kbd>T</kbd>) with automatic `localStorage` persistence.

### 6. Built-in Web Audio API Sound Effects
- Synthesized audio tones (chimes and clicks for Start, Pause, Lap, and Reset) without external audio file dependencies.
- Toggleable sound mute button with persistent state and status announcements.

### 7. Accessibility (A11y) & Screen Reader Support
- Semantic HTML elements (`<main>`, `<section>`, `<header>`, `<footer>`, `<dialog>`, `<button>`).
- Dedicated `aria-live="polite"` live announcer to notify screen reader users of critical state changes (Start, Pause, Lap, Reset) without flooding them on every high-frequency millisecond tick.
- High-contrast `:focus-visible` navigation outlines.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> or <kbd>Enter</kbd> | Start / Pause / Resume Stopwatch |
| <kbd>L</kbd> | Record Lap Time |
| <kbd>R</kbd> | Reset Stopwatch |
| <kbd>M</kbd> | Toggle Sound Effects (Mute / Unmute) |
| <kbd>T</kbd> | Switch Theme (Cycles across 8 distinct color themes) |
| <kbd>C</kbd> | Copy Laps to Clipboard |
| <kbd>?</kbd> | Open Keyboard Shortcuts Modal |
| <kbd>Esc</kbd> | Close Modal |

---

## 📁 Repository Structure

```
PRODIGY_WD_02/
├── index.html              # Main semantic HTML5 markup & dialog modal
├── styles.css              # Master stylesheet entrypoint importing modular CSS
├── css/
│   ├── themes.css          # Design tokens & 13 color themes (6 Light & 7 Dark)
│   ├── base.css            # Reset, typography, ambient lighting & base layout
│   ├── dial.css            # Circular SVG progress ring & digital time readout
│   ├── components.css      # Header, theme menu, controls, stats, laps & modal
│   └── responsive.css      # Fluid mobile and tablet responsive media queries
├── app.js                  # DOM controller, Web Audio synthesis, and UI event listeners
├── stopwatch.js            # Pure stopwatch timing engine, statistics & CSV export logic
├── package.json            # Node.js configuration and verification scripts
├── scripts/
│   ├── lint.js             # HTML/CSS integrity & JavaScript syntax validator
│   └── build-check.js      # Production asset integrity and bundle checker
```

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Google Chrome, Firefox, Safari, Microsoft Edge).
- (Optional for running verification checks) Node.js v18 or higher.

### Running Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/Husam-Abdulraheem/PRODIGY_WD_02.git
   cd PRODIGY_WD_02
   ```

2. Open `index.html` directly in your browser:
   ```bash
   # On Linux:
   xdg-open index.html

   # On macOS:
   open index.html

   # Or serve with any static server:
   npx serve .
   ```

---

## 🧪 Verification & Linting

Run the automated integrity and linting checks:

```bash
# Run syntax and HTML linting
npm run lint

# Run asset and build integrity check
npm run build

# Run all checks
npm run check
```

---

## 👨‍💻 Author

**Husam Abdulraheem**
- GitHub: [@Husam-Abdulraheem](https://github.com/Husam-Abdulraheem)
- Internship Track: Prodigy InfoTech — Web Development

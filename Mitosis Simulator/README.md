# Mitosis Simulator

A comprehensive mitosis simulation built with Web Components, featuring real-time chromosome visualization and interactive learning tools.

## Files Structure

- `index.html` - Main HTML file that loads the mitosis simulator
- `mitosis.css` - All CSS styles for the simulator
- `mitosis.js` - Complete JavaScript logic and Web Component
- `mitosis.html` - Original single-file version (backup)
- `mitosis-backup.html` - Backup of the original file

## Features

### 🧬 **Real-time Mitosis Simulation**
- **6 Chromosomes** with accurate phase-specific behavior
- **Live View** showing exactly what's happening in each phase
- **Phase-specific positioning** and chromosome condensation
- **Sister chromatid separation** during anaphase
- **Microtubule attachments** and kinetochore dynamics

### 📚 **Educational Content**
- **Interactive Quiz System** with phase-specific questions
- **Real-time molecular status** (ATP, oxygen, proteins, etc.)
- **Detailed phase descriptions** and processes
- **Visual indicators** for each phase of mitosis

### 🎮 **Interactive Controls**
- **Play/Pause** simulation
- **Phase selection** and navigation
- **Speed control** (0.25x to 3x)
- **Experimental controls** (microtubule block, checkpoint override, etc.)
- **Keyboard shortcuts** for all major functions

### 🔬 **Advanced Features**
- **Cell type selection** (normal, cancer, senescent)
- **Environmental effects** (temperature, nutrients, DNA damage)
- **Molecular dynamics** simulation
- **Screenshot and sharing** capabilities
- **Sandbox mode** for chromosome manipulation

## Usage

1. Open `index.html` in a web browser
2. Use the controls to navigate through mitosis phases
3. Click "Start Quiz" to test your knowledge
4. Use keyboard shortcuts for quick navigation:
   - **Space**: Play/Pause
   - **←/→**: Previous/Next Phase
   - **R**: Reset
   - **S**: Screenshot
   - **Q**: Quiz

## Technical Details

- **Web Components** with Shadow DOM for encapsulation
- **Canvas API** for all visual rendering
- **Modular architecture** with separate CSS and JS files
- **Real-time animation** using requestAnimationFrame
- **Responsive design** that works on all screen sizes

## Development

The simulator is built as a single Web Component that can be embedded in any web page. The modular structure makes it easy to:

- Customize styling by editing `mitosis.css`
- Modify behavior by editing `mitosis.js`
- Embed in other projects by including the files

## Browser Support

- Modern browsers with Web Components support
- Canvas API support required
- ES6+ JavaScript features used

## Changelog & Biological Notes (added Sep 2025)

This section documents recent changes made to improve biological accuracy, labeling, and embedding.

- Spindle poles now use a canonical top/bottom orientation rather than Left/Right aliases. Code uses `poleTop` and `poleBottom` consistently.
- Kinetochore attachment logic now computes world-space positions from chromatid geometry. Spindle fibers connect `poleTop`->sister0 and `poleBottom`->sister1 to reflect correct pole-specific attachments.
- Sister chromatid orientation updated: chromatids are drawn as rods oriented perpendicular to the spindle during metaphase/anaphase, and relaxed (perpendicular) during interphase/prophase. This models kinetochore facing toward poles.
- Labels (centromere, kinetochore, poles) are rendered at 50% opacity with leader lines pointing to the feature and positioned further away for readability. This reduces visual clutter while remaining legible.
- Phase timing: each phase is modeled with a nominal duration of 3.0 seconds for animation and teaching purposes. This is parameterized in `getPhaseProgress()` and the main loop; it's intentionally short for interactive demos.

Calculations / assumptions
- Pole positions: placed at center ± radius*0.78 on the Y axis with a small X jitter for realism. See `poleTop`/`poleBottom` assignment in `mitosis.js`.
- Chromatid rod orientation: set to 0 radians (horizontal) during metaphase/anaphase/telophase so kinetochores naturally face toward poles. During interphase/prophase, rods are rotated 90° to appear relaxed.
- Kinetochore world coordinates: computed by rotating local kinetochore offsets by the chromatid rod angle (basic 2D rotation). This yields coordinates used for leader lines and spindle fiber endpoints.

Labeling rules
- Labels use RGBA white at 50% opacity (rgba(255,255,255,0.5)).
- Leader lines are thin (1px) strokes connecting label anchor to the feature.
- Labels are offset by ~18–34px from the feature to avoid overlap.

Next steps / future improvements
- Add adjustable biological timing controls (real-time vs. teaching-speed) and expose phase durations via UI.
- Implement tension-based coloring of kinetochore attachments to visualize proper bi-orientation vs. misattachment.
- Add small tests for drawing math (unit tests for rotation/translation helpers).
- Document provenance for heuristics and parameters (radius fractions, offsets) and allow configuration via attributes.

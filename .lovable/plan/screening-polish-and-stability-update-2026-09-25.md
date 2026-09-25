# Screening polish and stability update

## What will change

- Fix the level-transition glitch by making each completed level submit exactly once, then returning cleanly to that activity’s level picker.
- Add a visible 35-second countdown to each standard question and each Flip & Match board. If time runs out, record it as skipped and move on with neutral feedback. Keep Focus Challenge’s intentionally rapid per-stimulus timing, while showing a 35-second round clock.
- Strengthen dark mode across dashboards, game states, status colours, cards, text, controls, and navigation so contrast remains clear without becoming harsh.
- Enlarge and refine the shared identity in the public header, signed-in navigation, and mobile header with a distinctive DUT-inspired emblem and the full system name.
- Redesign the welcome page into a more human, editorial experience: strong real-student imagery, clearer hierarchy, warmer copy, restrained interaction, and a visible preview of the six activities.
- Preserve the ethical boundary throughout: screening indicators only, never diagnosis.

## Visual direction

- A confident university-service look using deep ink, warm gold, crisp off-white, and accessible green accents.
- Real campus/student photography rather than abstract AI-style decoration.
- Editorial spacing, clear typography, subtle linework, and contained motion rather than gradients, floating blobs, or excessive cards.
- A larger custom emblem based on learning, guidance, and forward progress; it will not imitate DUT’s official crest.

## Technical details

- Guard completion callbacks in shared and custom game flows to prevent repeated state updates.
- Introduce one reusable countdown control and timeout behaviour across question-based games.
- Extend semantic colour tokens for dark surfaces, hero treatment, muted text, borders, and status states.
- Update the public welcome route and shared signed-in shell without changing authentication, roles, scoring rules, or stored screening data.
- Verify level completion, timeout behaviour, dark-mode dashboard readability, desktop/mobile layouts, and the main signed-in flow in the browser.

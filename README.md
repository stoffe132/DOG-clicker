# DOG EMPIRE — DOG CLICKER

Rebuilt clicker game with responsive controls and a dedicated game engine.

## Play
Open the GitHub Pages site: https://stoffe132.github.io/DOG-clicker/

If the page appears stuck after an update, reload it fully. The game engine uses a versioned URL so browsers fetch the newest file.

## Systems
- Clickable dog using `dog.jpg` with a visible emoji fallback
- Six upgrade categories with scalable prices and levels
- Eight passive producer types
- Eight collectible dog companions
- Prestige, star dust and permanent research
- Critical clicks, golden dog events and timed boosts
- Daily quests, achievements and statistics
- Offline earnings and autosaving
- Import/export and reset controls
- Central delegated button handling so dynamically rendered shop buttons keep working

## Files
- `index.html` — page structure and script loading
- `style.css` — responsive layout and dog hit area
- `game.js` — game logic, event handling, economy and saves
- `dog.jpg` — main dog image
- `click.mp3`, `buy.mp3` — sound effects

Game progress is stored in this browser's local storage. Export a backup before clearing browser data or changing devices.

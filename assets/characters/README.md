# Anime character assets (Frieren)

Drop image files here with these EXACT names (png or jpg, square works best ~400x400+):

| File | Used for |
|------|----------|
| `frieren.png` | Member avatar — Frieren (also the workspace-home hero portrait) |
| `fern.png`    | Member avatar — Fern |
| `stark.png`   | Member avatar — Stark |
| `himmel.png`  | Member avatar — Himmel |
| `heiter.png`  | Member avatar — Heiter |

Notes
- Filenames referenced by `app.js` (`ANIME_CHARS` / `WH_HERO`). Keep names identical.
- Square portrait/bust art works best — avatars crop to a circle, hero crops to a rounded square.
- Hero reuses `frieren.png` (change `WH_HERO` in app.js to use a different one).
- If a file is missing the app falls back (initials avatar / hero hidden) — nothing breaks.
- These are your own supplied art; commit only if you have the right to.

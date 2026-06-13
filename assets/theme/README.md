# Theme background assets (Ghibli landscapes)

Drop your own background images here with these EXACT names (jpg, landscape orientation):

| File | Used for | Best crop |
|------|----------|-----------|
| `banner.jpg`  | Workspace home cover (the wide strip up top) | wide landscape, focal point centered |
| `header.jpg`  | Top bar background (very subtle, heavily tinted) | wide landscape |
| `sidebar.jpg` | Left sidebar background (subtle, heavily tinted) | tall/portrait works too |
| `login.jpg`   | Login screen background (full screen) | large, ~1600px wide |

Notes
- Names must match exactly, and be **.jpg**. Referenced by `styles.css` + `app.js`.
- Only shown when the **anime theme is ON** (toggle in profile menu).
- If a file is missing: header/sidebar/banner fall back to the green tint gradient (no broken box); login falls back to its gradient.
- Bigger = sharper but heavier. ~1200–1600px wide, compressed JPG (q~75) is plenty.
- These are your own supplied images; commit only if you have the right to.

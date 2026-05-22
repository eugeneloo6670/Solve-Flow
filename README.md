# Quik Math

Quik Math is a calm, browser-based rapid-fire math practice app. It focuses on basic addition, subtraction, multiplication, and whole-number division with a low-stress interface, supportive feedback, and a visible streak tracker.

## Features

- Single-screen rapid-fire math practice
- Addition, subtraction, multiplication, and division
- No negative answers or fraction answers
- Automatic answer checking as you type
- Difficulty increases every 20 answered questions
- Manual difficulty increase/decrease controls
- Current score and streak tracking
- Supportive feedback from a small teacher avatar
- Soft raindrop-style button sounds
- Mobile-friendly keypad and desktop keyboard support

## Run Locally

This is a static app. Open `index.html` in a browser, or serve the folder locally:

```powershell
python -m http.server 4174 --bind 127.0.0.1
```

Then visit:

```text
http://127.0.0.1:4174/
```

## Files

- `index.html` - app structure and avatar SVG
- `styles.css` - visual design and responsive layout
- `app.js` - game loop, problem generation, scoring, difficulty, and sound
- `favicon.svg` - browser tab icon

## Deployment

The site is configured for GitHub Pages using `.github/workflows/pages.yml`.

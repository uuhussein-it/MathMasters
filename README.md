# QuestLearn

A gamified quiz and practice platform for **Grades 9–12 math** (ASP, Advanced, General) and **SAT preparation**. Students pick a hero (Sage, Warrior or Explorer), earn XP, level up and keep streaks while they practice.

- **School Curriculum:** filter by Grade → Track → Term, choose topics, then **Practice** (instant feedback, hints, skills, explanations) or **Quiz** (timed, results at the end).
- **SAT Prep:** a timed **SAT Simulator** (Reading & Writing + Math sections, navigator, mark-for-review, scaled 200–800 scores) and **Topics Practice**.
- **Heroes:**
  - **Sage:** *Arcane Insight* removes two wrong answers and shows a deep hint. Hints never cost XP.
  - **Warrior:** *War Cry* doubles XP on the next correct answer. Streak multiplier grows to ×3.
  - **Explorer:** *Compass* reveals the category and your mastery, plus +30 s. +20% time on every timed mode.
- Progress (level, XP, score, streak, topic mastery, history) is saved in the browser's localStorage. No accounts or database needed.

It's plain HTML, CSS and JavaScript modules with no build step, so it runs anywhere.

---

## Project structure

```
quiz-platform/
├── public/                     ← everything the browser loads (this is the static site)
│   ├── index.html              ← app shell
│   ├── css/styles.css          ← all styles (design tokens at the top)
│   ├── js/
│   │   ├── app.js              ← entry point: HUD + route registration
│   │   ├── router.js           ← tiny hash router
│   │   ├── state.js            ← player profile, XP/levels, persistence
│   │   ├── characters.js       ← hero definitions and hero-specific rules
│   │   ├── scoring.js          ← XP, points, streak multipliers, SAT scaling
│   │   ├── data.js             ← loads question banks, shuffles options
│   │   ├── ui.js               ← DOM helper h(), toasts, effects
│   │   └── screens/            ← select, hub, curriculum, sat, play, simulator, results
│   ├── data/
│   │   ├── curriculum/index.json        ← list of courses and topics
│   │   ├── curriculum/g10-advanced-t1.json  ← one file per grade/track/term
│   │   └── sat.json                      ← SAT topics and questions
│   └── assets/                 ← character art, favicon
├── scripts/check-banks.js      ← validates the question JSON (npm run check)
├── server.js                   ← optional Express server (Render Web Service)
├── render.yaml                 ← Render Blueprint (static site)
├── package.json
└── .gitignore
```

## Run it locally

You need [Node.js 18+](https://nodejs.org).

```bash
npm install
npm start
```

Open http://localhost:3000. (`npm run dev` restarts automatically when you edit `server.js`.)

---

## Step 1: Push to GitHub

1. Create an empty repository on GitHub (for example `questlearn`). Don't add a README or .gitignore there, since this project already has them.
2. In a terminal, inside this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: QuestLearn quiz platform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/questlearn.git
   git push -u origin main
   ```

   Replace `<your-username>` with your GitHub username. If Git asks you to sign in, use a [personal access token](https://github.com/settings/tokens) as the password, or GitHub Desktop.

## Step 2: Deploy on Render

### Option A (recommended): Static Site, free and never sleeps

1. Sign in at [render.com](https://render.com) with your GitHub account.
2. Click **New → Blueprint**, choose your `questlearn` repository and click **Apply**. Render reads `render.yaml` and creates the site.

   Or set it up by hand: **New → Static Site**, pick the repo, then:
   - **Build Command:** `npm run check`
   - **Publish Directory:** `public`
3. Wait for the deploy to finish and open the `https://questlearn.onrender.com`-style URL Render gives you.

### Option B: Node Web Service (use this if you add API routes later)

1. **New → Web Service**, pick the repo.
2. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/healthz`
3. Create the service. Free web services sleep after inactivity, so the first visit after a while can take ~30 seconds.

Every `git push` to `main` redeploys automatically.

---

## Editing questions

Questions live in `public/data/`. Each question looks like this:

```json
{
  "id": "g10-advanced-t1-polynomials-1",
  "q": "Find the product of (4h + 5) and (h − 6).",
  "options": ["5h − 1", "4h² − 19h − 30", "4h² − 24h − 30", "4h² − 30"],
  "answer": 1,
  "hint": "Use FOIL: First, Outer, Inner, Last.",
  "explanation": "4h·h = 4h², 4h·(−6) = −24h, …",
  "source": "course"
}
```

- `answer` is the index of the correct option (0 = first). Options are shuffled when shown, so order doesn't matter.
- `source` is `"course"` for questions taken from the course practice papers and `"original"` for added ones. Course questions show a "Course bank" tag.
- Use Unicode for math: `x²`, `√`, `π`, `≤`, `θ`, `−`.

**Add a topic:** add it to the course file and to the matching course in `curriculum/index.json` (with its question `count`).

**Add Term 2 or Term 3:** create `public/data/curriculum/g11-asp-t2.json` (same shape as the Term 1 files) and add an entry to `courses` in `index.json`. The term chip unlocks automatically.

Run `npm run check` after editing; it reports any malformed question or out-of-date count.

## Question sources

- **Term 1 course questions** were taken from the multiple-choice items in the MAT40A–MAT71 practice answer keys. Items that depend on a graph or figure, or whose maths didn't survive PDF extraction, were left out. Where a topic had too few usable items, original questions in the same style were added (marked `"source": "original"`).
- **SAT questions** are original practice items in the style of the digital SAT. The simulator times each section at the real SAT pace per question (71 s Reading & Writing, 95 s Math); the scaled score is an estimate, not an official conversion.

## Tweaking the game

- XP per answer, completion bonuses and SAT scaling: `public/js/scoring.js`
- Level curve: `xpToNext()` in `public/js/state.js`
- Hero abilities, skill charges, streak multipliers, time bonus: `public/js/characters.js`
- Quiz time per question: `SECONDS_PER_QUIZ_QUESTION` in `public/js/screens/curriculum.js`
- Colors and fonts: the `:root` tokens at the top of `public/css/styles.css`

Keyboard shortcuts while playing: **1–4** or **A–D** to answer, **Enter** for next, **H** for a hint, **S** for your hero skill.

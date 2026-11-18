# 트쌤 (T-SAM) — 나만의 밀착 건강 트레이너

Personal trainer web app for two people (the owner: male, 90 kg / 171 cm, losing weight; and his
girlfriend). Complete beginner → intermediate. Korean UI (해요체), black & white, square edges, one
point color (`--hot` #FF4F12) only for what matters. Read README.md for the feature tour.

## How it is built
- Plain HTML/CSS/JS, no build step, no framework. Classic scripts under the global `window.F`
  namespace, loaded in order by `index.html` (data → engine → UI → `app.js`).
- Hash router with plain names only (`#home`, `#plan`, `#ex-db-rdl`, `#learn-rir`, …) because the
  claude.ai artifact viewer only passes `#name` hashes. Views are `F.V.<name>`; actions use
  event delegation: `data-act="x"` → `F.act.x(el)`, `data-change="x"` for inputs.
- `[data-mode="mobile"]` (portrait, gym use, big exercise images) vs `[data-mode="pc"]`
  (≥1024px landscape, 16:9 information dashboard).
- State: `F.S` (see `F.defaultState()` in js/core.js), saved with `F.save()`.
  - Inside claude.ai: `js/sync.js` syncs a private doc per person (`data/users/<uid>/app` +
    sessions/inbody sub-collections) and a shared `members/<uid>` summary; Claude answers coach
    questions and reads InBody photos via the `sample` capability.
  - Anywhere else (Vercel, local file): localStorage only, with local profiles and backup files.
- Never use `alert/confirm/prompt` (blocked in claude.ai): use `F.ask()` / `F.askText()`.

## Files
| file | what |
|---|---|
| js/core.js | utils, storage, profiles, icons, brand (`F.logo`), sheets, `F.ask` |
| js/engine.js | targets, diet day, meal times, splits & rotation, swaps, level-ups, prescriptions, progression (assisted machine inverted), condition plans (`E.sessionPlan`), session builder, XP |
| js/data.exercises.js | 39 exercises; `cues[i]` match the numbered markers 1–3 drawn in `assets/img/ex/<id>_<m|f>.webp` (`mark` = which panel has them) |
| js/data.program.js | phases, templates (FA/FB/FC, UA/LA/UB/LB, PU/PL/LG, CC), split cycles, movement ladders (`F.GROUPS`), sore-area swaps |
| js/data.coach.js | trainers, intro slides, 12 articles, FAQ, condition/sore texts, coach lines |
| js/data.supp.js | 35 supplements with best-time slots, gym slots, split doses, "don't take together" pairs |
| js/data.diet.js | easy diet: S/M/L portions, 3 options per meal, rules, checks |
| js/data.homefit.js | 40 curated Korean home-workout videos (YouTube ids) in 4 groups |
| js/data.reco.js | researched picks: extra videos, channels, chicken-breast brands, zero drinks (Coupang search by sales) |
| js/ui.day.js | home timeline (`E.dayPlan`), supplement schedule (`E.suppSchedule`), banner + reminders, 내 영양제, diet styles, product picks, home-workout page + in-app landscape player |
| js/ui.session.js | guided workout: condition check → warm-up → per-exercise form check → sets/rest/rating → cardio → cool-down |
| js/ui.coach.js | intro + trainer pick, ask-the-trainer chat, articles, split guide |
| tools/build_artifact.py | packages the claude.ai artifact (`python3 tools/build_artifact.py <out_dir>`) |
| tests/ | Playwright checks (see below) |

## Run and test
```bash
python3 -m http.server 8765        # app at http://127.0.0.1:8765
node tests/v4test.js               # day timeline, supplements, diet styles (phone + PC)
node tests/playertest.js           # home-workout list + in-app player
node tests/supptest.js             # supplement timing rules
node tests/enginetest.js           # splits, swaps, level-ups, condition plans
node tests/chattest.js             # ask-the-trainer (mock claude.ai + offline)
node tests/synctest.js             # cloud sync paths against tests/mockclaude.js
node tests/v3smoke.js              # every screen at 390×844 and 1920×1080
```
`BASE` and `SHOTS` env vars change the server URL and screenshot folder.

## Where it runs
- claude.ai artifact (sync + Claude coach): https://claude.ai/artifact/AmhJj7uEx16Aj3yts8MkM5 — republish
  with the Artifact tool using that URL, from `tools/build_artifact.py` output, capabilities
  `db` (rules: members read view / write owner; members/{self} read view / write interact),
  `user` (scopes profile), `assets`, `sample` (images), `downloads`. In claude.ai, embedded videos
  are not allowed, so videos open YouTube there.
- Vercel (static, `vercel.json`): planned project name `t-sam`; not deployed yet.

## Rules for images
All images are generated with GPT Image 2.5 through Figma (never Higgsfield). Exercise images:
stacked START/FINISH panels, male and female mannequin figures, orange target muscles, numbered
markers 1–3 that match the exercise `cues`.

# Believe in Taste — Restaurant Grader

**Free 15-question digital visibility check for restaurant owners and operators.**

Answer 15 questions. Get your score. See exactly what's costing you customers — and what to fix first.

---

## What it does

The Restaurant Grader gives you a 0–100 score across four areas of your restaurant's digital presence:

- **Digital Presence** — Google Business Profile, website, online menu, ordering, photos, hours
- **Reputation** — Google rating, review count, review response rate, Yelp
- **Social Media** — Activity and consistency
- **Operations** — Email list, competitor awareness, service standards

The score shows you where you stand. A Believe in Taste consultation shows you the root cause, the fix, and the revenue impact.

---

## How to use it

Open `index.html` in any modern browser. No server, no build step, no internet connection required.

Candidate release: `v1.0.1-accessibility` (local review only; not deployed).

---

## Files

| File | Purpose |
|---|---|
| `index.html` | The grader application |
| `bit360-grader-engine.js` | Grader-only scoring engine (15 questions, 0–100) |
| `react.production.min.js` | React runtime (local, no CDN) |
| `react-dom.production.min.js` | ReactDOM runtime (local, no CDN) |
| `test-public-grader.js` | 118-check regression and accessibility test suite |
| `ACCESSIBILITY_PATCH_v1.0.1.md` | Scope and change record for this candidate |

---

## About Believe in Taste

Believe in Taste is a chef consulting and culinary coaching practice built on discipline, real data, and operational clarity. We work with restaurant owners who want to know the truth about their business — and have a clear plan to fix it.

**Jose O. Rivera** — Chef Consultant & Culinary Coach | Port St. Lucie, FL

---

## Scoring methodology

Instrument: `lead_grader_v1.1`  
Questions: 15  
Scale: 0–100  
No external data sources. No server. No tracking.

Accessibility: question-specific control names, grouped answer semantics, labeled numeric fields, and progress semantics.

---

*This tool is the public entry point. The full Believe in Taste 360 Audit is a private professional assessment available through direct consultation.*

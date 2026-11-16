# BeatNote — 4-minute demo script

Spoken words total ≈ 550 (~140 wpm ≈ 3:55). Cues are what to click on screen.
Leave the demo cases loaded before you start; keep the browser at desktop width.

**Before you start**

- App running, backend up (so the alert and Nemotron note paths are live). If the backend is
  down the app still works: it falls back to local thresholds and a template note, and shows
  "Backend unreachable" — use the fallback lines below instead of pretending.
- The Yale admission model file is gitignored. If it is missing, the "Admission risk" row and
  the sentence about it simply do not appear — skip that phrase.

---

## 0:00 – 0:20 · Hook

**Say:** Every ED patient gets an ECG. The read is fast; the triage around it isn't. BeatNote
turns that ECG into three things in seconds — a traffic-light read, a clinician alert when it
matters, and a drafted note.

## 0:20 – 0:55 · Normal case, and the legend

**Do:** "Routine check" selected.

**Say:** Start with a routine check: 34-year-old, walk-in, ESI 4. Heart rate 72, sinus rhythm,
normal vitals. Everything is green — all measurements in normal range, no notification
needed. Above the numbers is the legend: green is good, yellow is caution, red is bad. Each
row shows the range we call normal and the caution limit we allow before it goes red — heart
rate, for example, is normal from 60 to 100 and stays caution out to 50 to 120.

## 0:55 – 1:45 · Critical case

**Do:** Click "Suspected STEMI".

**Say:** Now the suspected STEMI: 67-year-old, arrived by ambulance, chest pain, ESI 2. Watch
what changes. The overall status goes red. The signal chart circles the beats that cross a
caution or critical threshold — here, the ST segments. The banner turns red: clinician
notification required, and it names the reason, ST deviation at or above 0.10 millivolts,
possible ischemia. Because that's critical, the alert went out automatically — you can see the
confirmation, the alert number, and that it's deduplicated so the same clinician isn't paged
twice in ten minutes.

## 1:45 – 2:25 · The note

**Do:** Click "Generate Note". Wait for the draft (a few seconds).

**Say:** A flag alone doesn't help — clinicians need the paperwork. One tap drafts a SOAP note
from the same measurements: subjective, objective with heart rate, rhythm, ST deviation and
QT, the assessment with the risk score and the flags, and a plan. It's editable, and one click
puts it on the clipboard for the EHR. That's where the time back comes from: review and edit
instead of typing from scratch.

## 2:25 – 3:00 · Caution is not critical

**Do:** Click "Irregular rhythm".

**Say:** Third case: 72-year-old with an irregular rhythm. Heart rate 118, high rate
variability — the chart circles the irregular R-R intervals. Notice we separate yellow from
red: caution means outside normal but inside the caution limit, so it asks for review rather
than paging someone. Every assessment stores its threshold version, so the team can audit
which flags were right and tune the cut-offs to cut false alarms.

## 3:00 – 3:35 · How it's built / how it scales

**Do:** Stay on the page; no clicking.

**Say:** Under the hood: a FastAPI service, a gradient-boosting admission model trained on Yale
ED data, thresholds in code and versioned per assessment. Alerts are a local SQLite store today
— Postgres and FHIR in production. If real patients are involved, the note model is self-hosted
inside the hospital network, so no PHI goes to a public API, and we'd start in shadow mode:
score silently, compare with clinicians, then switch alerts on.

## 3:35 – 4:00 · Impact and close

**Do:** Scroll to "How BeatNote helps".

**Say:** Three things we're aiming at: critical findings seen sooner, measured accuracy so the
alarms stay trustworthy, and less time on documentation. To be clear — this is a demo:
synthetic data, placeholder thresholds, not clinically validated. What we're showing is the
shape of the workflow. Next step is real cohorts, per-site recalibration, and a shadow-mode
pilot.

---

## Fallback lines

- **Backend down** ("Backend unreachable"): "This build is running the local threshold rules —
  same green/yellow/red logic, but no alert delivery and a template note instead of Nemotron."
- **Note source shows "backend template" instead of "NVIDIA Nemotron"**: "Note drafting here
  uses the template fallback; the live path is Nemotron."
- **No admission-risk row**: don't mention the admission model; the five vitals metrics still
  carry the story.

## Likely questions, one-line answers

- **Is this a medical device?** Not yet — decision support this close to triage needs a
  regulatory check before clinical use.
- **Where do thresholds come from?** Common reference ranges, demo values; they're versioned so
  they can be tuned per site against real outcomes.
- **What if the model is wrong?** It never acts alone: it flags and drafts, a clinician decides,
  and every score is stored with its model and threshold version.
- **Faster than what?** Than a queue read plus a note written from scratch — the thing to
  measure in a pilot, which we haven't yet.

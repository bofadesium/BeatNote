# BeatNote pitch script (4 minutes)

Slides 1-7 take about 3:00 (about 430 words at a calm pace). Switch to the question slide at 3:00 and take questions until 4:00.

## Slide 1: Problem statement (0:00-0:24)
"Team BeatNote is solving the problem of dangerous ECG findings being recognized late, and clinicians losing time to paperwork, for emergency-department triage nurses and physicians. Our solution is BeatNote, an ECG-to-triage assistant that flags critical findings, circles them on the tracing, notifies a clinician, and drafts the note."

## Slide 2: The clinical problem (0:24-0:48)
"For chest pain, the guideline target is a first ECG read within ten minutes of arrival. For a heart attack, it's ninety minutes to reopen the artery. Meanwhile, every patient also needs a written note. So our question wasn't what AI can do. It was: how do we make sure the dangerous ECG is seen first, without more paperwork?"

## Slide 3: Scenario (0:48-1:18)
"Picture 2 a.m., full waiting room. A 67-year-old man arrives by ambulance with chest pain, and an ECG is recorded. Today, that tracing waits for a free clinician, and the note is typed later. With BeatNote, the ST elevation is flagged and circled as soon as the ECG is read, a clinician is notified, and a draft note is ready. The same bottleneck exists in urgent care, ambulances, rural clinics, and telemetry."

## Slide 4: What BeatNote is, with the GIF (1:18-1:44)
"Here's BeatNote running. I pick a suspected heart attack. The banner turns red, a clinician is notified, and the alert is logged. The abnormal ST segments are circled on the ECG. Every measurement is green, yellow or red, with a word and icon, not color alone. One click drafts the note for review. One honest caveat: the ECGs in this demo are synthetic."

## Slide 5: How AI solves it (1:44-2:16)
"So how does AI solve it? We matched each need to the simplest method. Critical ECG findings use signal processing and clinical thresholds, so a clinician can see exactly why something was flagged. Admission risk is a prediction problem: a gradient-boosted model trained on 560,486 Yale emergency visits, with 0.87 AUC on 56,000 held-out visits. Writing the note is a language problem, so a language model drafts it. AI where it fits, plain rules where safety needs transparency."

## Slide 6: Improve patient care (2:16-2:34)
"That improves care directly: a critical finding can't hide in the queue. Normal needs no action. Caution flags for review. Critical means a clinician must be notified now, with an alert that stays open until acknowledged. Thresholds are demo values and need clinical validation."

## Slide 7: Time back and discovery (2:34-2:56)
"It also gives clinicians time back: the note is drafted from the measurements, so they edit instead of typing from scratch. And every assessment and alert is stored, so we can see which flags were right and tune them to cut false alarms. We haven't measured the time saved yet; this is a prototype."

## Slide 8: Questions (3:00-4:00)

**Opening (about 10 seconds):**
"That's BeatNote: start from the problem, use AI where it fits, and be upfront about what's still a prototype. These are the questions we expect, but we're happy to take yours."

**If asked about storage (about 20 seconds):**
"Assessments, alerts and the audit log would go in Postgres. ECG waveforms, datasets and versioned models go in object storage. Today it's just SQLite and synthetic data."

**If asked about scaling (about 25 seconds):**
"Stateless containers behind a load balancer. The rules and the model run in milliseconds, so they stay in-process. The slow language-model step goes on a queue, alerts get retries and escalation, and we'd recalibrate per hospital."

**If asked about false alarms (about 15 seconds):**
"We'd tune thresholds on a validation split, calibrate the scores, and run in shadow mode before anyone relies on it."

## Pacing tips
- **Slide 4:** the GIF loops about every 19 seconds. Start talking as it plays and don't wait for it to finish.
- **If you're running long:** cut slide 6 to its first and last sentences, and drop the final sentence of slide 3.
- **Don't cut:** the synthetic-data caveat on slide 4 and the "not yet measured" line on slide 7. Judges reward the honesty.

Before presenting, confirm the guideline numbers on slide 2 (10 minutes and 90 minutes, AHA/ACC) against the current guidelines.

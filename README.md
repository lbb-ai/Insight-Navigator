# Insight Navigator

Learning Disability Detector and Classifier System (Group 21, DUT)



Build a full-stack web application called **"Learning Disability Detector and Classifier System"** — a gamified early-warning screening and referral platform for Durban University of Technology (DUT), built for the Disability Unit. This is an academic prototype (10-week scope) demonstrating requirements engineering, UML-driven design, and a working screening → risk classification → human-review → referral workflow. It must feel **professional and premium**, like a trustworthy institutional health/wellbeing platform — but the six screening activities themselves must feel like genuinely fun, well-crafted **mini-games**, not a dry quiz. Think "Apple Health meets a polished mobile puzzle game," not a clinical form and not a children's app.



## 1. Purpose and non-negotiable boundary



The system screens for possible risk indicators of dyslexia, dyscalculia, working-memory difficulty, executive-function difficulty, and attention-related difficulty. **It never diagnoses.** Every screen that shows a result must make it visually and textually clear this is a risk indicator for staff review, not a medical or academic verdict. Disability Unit staff review flagged (medium/high risk) students and decide on support or formal referral. Bake this boundary into copywriting throughout — it's an ethical requirement from the project brief, not just a legal disclaimer.



## 2. Users and roles (role-based access)



Build three roles with distinct dashboards and permissions:



1. **Student** — registers/logs in, gives informed consent, plays the six screening games, views their own supportive (non-diagnostic) results and next steps, can request support or re-screening.

2. **Disability Unit Staff** — logs in, views a queue of flagged (medium/high risk) students, opens a student's explainable risk profile (game-level signal breakdown, not a black-box score), records a support/referral decision and outcome, filters/exports reports.

3. **Administrator** — manages user accounts, configures the six games and risk-threshold settings, views system-wide reports, manages access/security settings.



Use Supabase (Lovable's native backend) for auth and role-based access control (RLS policies per role). A fourth "actor" — Academic Staff — only appears as a recipient of consented support recommendations; it does not need its own portal in this prototype (mark as future scope in the admin settings page, out of scope for now).



## 3. Core user flow (from the UML activity diagram)



1. **Access:** Student registers/logs in → sees and accepts an informed-consent screen (POPIA-aligned: explains what data is collected, why, who sees it, retention). No game can start until consent is recorded and timestamped.

2. **Screening:** Student completes six short games in one guided session, target ≤ 20 minutes total, with a visible progress tracker across all six.

3. **Capture:** For every game, capture accuracy %, average response time, skipped items, repeated-error patterns, and difficulty progression.

4. **Analysis:** On completion, the system computes a risk band — **Low / Medium / High** — per indicator area (not one single score), using transparent, rule-based scoring (not a hidden ML black box) so it stays explainable.

5. **Result to student:** Student sees a warm, supportive, non-labelling summary and clear next steps (never raw diagnostic language).

6. **Human review:** Medium/High risk profiles appear in the Disability Unit Staff queue with the specific game-level signals that drove the flag, so staff understand *why*, not just *what*.

7. **Follow-up:** Staff record a decision (e.g., monitor / recommend support / refer for formal assessment) and an outcome; this is visible to the student as their "next steps," never as a raw label.

8. **Admin layer:** Runs in parallel — user management, game/threshold configuration, reports, audit logs.



## 4. The six screening games



Build each as a distinct, well-designed mini-game (2–4 minutes each), sharing one consistent visual language (same card style, same feedback animations, same iconography) so the set feels like one cohesive, high-production product rather than six unrelated demos.



| Game | What it captures | Risk area it feeds |

|---|---|---|

| **Number Challenge** | Arithmetic accuracy, sequencing, number sense | Dyscalculia indicators |

| **Word Challenge** | Spelling, word recognition, vocabulary | Dyslexia indicators |

| **Memory Match** | Recall under load, working-memory span | Working-memory difficulty |

| **Reading Challenge** | Fluency, comprehension, timed reading | Dyslexia indicators |

| **Logic & Scenario** | Sequencing, reasoning, problem-solving | Executive-function difficulty |

| **Attention Challenge** | Sustained focus, consistency, reaction time | Attention-related indicators |



Every game must record, per session: accuracy %, average response time, skipped items, repeated-error count, difficulty progression, and completion status. Give each game a short "why am I playing this?" one-liner before it starts (supportive framing, not clinical framing), a live but unobtrusive progress indicator, and a satisfying, low-key completion animation (avoid anything that feels like a "pass/fail" game-over screen — this is screening, not scoring students against each other).



## 5. Visual and interaction design direction



This is the part the rubric weighs most heavily (25% each on look-and-feel, interaction/navigation, feedback quality, understandability, and consistency), so be deliberate:



- **Tone:** Professional and quietly premium first, playful second. Think a polished institutional wellbeing product (calm, confident, trustworthy) that happens to contain genuinely well-made mini-games — not a gamified app that happens to have a login screen.

- **Palette:** Deep navy/indigo or deep purple as the primary (nod to DUT's brand purple) paired with a warm, muted gold/amber accent for highlights, progress, and success states, on a clean off-white/light-grey base for readability. Avoid saturated primary-colour "kids app" palettes; keep the games' colour bursts contained to game-specific accents so the overall shell still reads as professional.

- **Typography:** A confident, modern sans-serif for headings (slightly geometric, institutional) and a highly legible, dyslexia-friendly body font (generous letter-spacing, avoid tightly-kerned serif faces) — this matters given the product's own subject matter.

- **Consistency:** One shared design system across all three roles — same spacing scale, same card/button/badge components, same iconography set (use a single icon library throughout, no mixing styles) — so the interface itself demonstrates the "consistency" and "understandability" the app is about.

- **Feedback:** Every action gets immediate, calm micro-feedback (button states, subtle transitions, toast confirmations) — target perceived responsiveness under 200ms for in-game interactions, as specified in the non-functional requirements below. Never use harsh red "wrong answer" treatment in the games; use gentle, neutral, encouraging feedback language throughout, matching the "no labelling" ethical stance.

- **Navigation:** Persistent, role-aware navigation shell (sidebar or top nav depending on role) with a clear "you are here" state, breadcrumbs for staff drill-downs (queue → student → session → signal detail), and a always-visible progress bar during the screening flow.

- **Mobile-first:** The student-facing screening flow especially must work excellently on a phone (many students will use one) — demonstrate genuine mobile-platform characteristics (touch-friendly game controls, offline-tolerant session saving if a game is interrupted, responsive layouts), not just a shrunk desktop site.

- **Accessibility:** Build to WCAG 2.2 Level AA — full keyboard navigation, visible focus states, sufficient colour contrast, resizable text, alt text on all icons/imagery, and simple plain-language instructions throughout (this is a stated non-functional requirement, not optional polish).



## 6. Information architecture / pages to build



**Public / auth**

- Landing page explaining the initiative (calm, institutional, DUT-branded tone) with a clear "this is screening, not diagnosis" statement

- Register / Login (student, staff, admin — role selection or role assigned by admin)

- Informed consent screen (must be accepted + timestamped before screening begins)



**Student portal**

- Dashboard: screening status, progress, past sessions, "your next steps"

- Screening flow: six game screens + a shared intro/progress shell

- Results/summary screen: supportive, risk-band-aware but non-diagnostic language, next-steps CTA

- Support/re-screening request page



**Disability Unit Staff portal**

- Flagged-students queue (filterable by risk band, faculty, date, referral status)

- Student risk-profile detail view: per-game signal breakdown with plain-language explanation of *why* it was flagged (explainability is a stated requirement — never show a single opaque score)

- Referral/decision recording form + outcome tracking

- Reports view with filters and export (CSV/PDF)



**Administrator portal**

- User management (CRUD on accounts and roles)

- Game and risk-threshold configuration (CRUD on the six games' settings)

- System reports / aggregate anonymised trends

- Audit log viewer (who accessed what, for POPIA accountability)



## 7. Data model (build in Supabase; this is the minimum)



- `users` (id, role: student/staff/admin, name, faculty, contact, auth link)

- `consents` (user_id, consent_text_version, accepted_at)

- `screening_sessions` (id, user_id, started_at, completed_at, status)

- `game_results` (id, session_id, game_type, accuracy, avg_response_time_ms, skipped_items, repeated_errors, difficulty_progression, completed)

- `risk_profiles` (id, session_id, area [dyslexia/dyscalculia/working-memory/executive-function/attention], risk_band [low/medium/high], contributing_signals jsonb)

- `referrals` (id, session_id, staff_id, decision, notes, outcome, created_at, updated_at)

- `audit_logs` (id, user_id, action, target, timestamp)



Implement full CRUD on users, game/threshold configuration, and referrals (the rubric explicitly tests Create/Read/Update/Delete), with row-level security so students only ever see their own data and staff only see flagged profiles plus their own referral records.



## 8. Non-functional requirements to implement (from the project's own spec — be literal about these)



- **Accessibility:** WCAG 2.2 AA, full keyboard navigation, readable fonts, simple instructions.

- **Usability:** First screening completable in ≤ 20 minutes with no staff assistance needed to understand instructions.

- **Performance:** Game feedback ≤ 200ms perceived latency; staff report generation ≤ 5 seconds.

- **Security & privacy:** Consent gate before any screening, strict role-based access, encrypted data in transit and at rest (Supabase defaults), audit logging of access to sensitive records — align copy and settings with POPIA (South Africa's Protection of Personal Information Act).

- **Reliability:** Design for high availability and simple backup/recovery patterns (this is a prototype, but reflect the intent in the admin settings/status page).

- **Scalability:** UI and data model should not assume single-user testing — build list/queue views (e.g., staff queue, reports) to paginate/filter cleanly since the brief targets hundreds of concurrent users at scale.



## 9. Explainability requirement (important, don't skip)



Anywhere a risk band is shown to staff, show the specific contributing signals in plain language (e.g., "Flagged Medium for Dyslexia indicators: reading accuracy 61% (below threshold), average response time 2.3x peer baseline, 4 repeated word-recognition errors"). Never present staff with a bare "High Risk" tag with no supporting detail — the project's literature review explicitly calls out black-box results as unsafe.



## 10. Explicit out-of-scope (don't build these — keep the prototype focused)



Clinical diagnosis/treatment features, replacing psychologists/specialists, a full medical-records system, automatic accommodations without human review, full multilingual rollout, and deep integration with other DUT systems. Keep placeholders/notes in the admin area at most, but don't build functionality for these.



## 11. What "done" looks like for this prototype



A working, navigable app covering: consent → six playable games with real data capture → automatic explainable risk-band generation → student results screen → staff queue and referral workflow with full CRUD → admin user/game/threshold management with full CRUD → reports with filters/export → a consistent, accessible, premium-feeling design system applied across all of it on both desktop and mobile.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/14c06a05-ae9b-4572-b2a2-1209422bbb89).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

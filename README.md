# UG Student Portal (modern frontend)

A modern, responsive replacement for the University of Ghana **STS**
(Student Self-Service) portal at <https://sts.ug.edu.gh>. It talks to the
existing Laravel backend through a **same-origin server-side proxy**, so the
browser never calls the upstream origin directly and no CORS/session tricks are
needed.

> **Unofficial.** All student data comes from the official STS backend. This is
> a personal frontend project, not an official university product.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`) with a custom slate/indigo design system
- `cheerio` for server-side parsing of upstream HTML pages
- No database — sessions live in relayed cookies

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
# or
npm run build && npm start
```

Environment (`.env.local`):

```ini
STS_BASE=https://sts.ug.edu.gh/services
```

## How it works

```
Browser ──same-origin──► Next.js server ──HTTPS──► sts.ug.edu.gh/services
   ▲                          │
   └──── Set-Cookie relay ◄───┘  (sts_session, XSRF-TOKEN)
```

- **Login** (`POST /api/auth/login`) performs the two-step Laravel login
  server-side (fetch CSRF token → `POST /services/authenticate`), relays the
  upstream cookies to this origin, and sets our own `sts_auth` marker cookie
  (used by `src/middleware.ts`). The student's display name is scraped from
  `/welcome` and stored in a `sts_name` cookie for the chrome.
- **Generic proxy** (`/api/sts/[...path]`) forwards GET/POST/PUT/DELETE,
  relays session cookies, and auto-injects a fresh `_token` into form posts
  (JSON, urlencoded, or multipart). Upstream `302` responses become
  `401 {unauthenticated:true}` so the UI can bounce to `/login`. Binary
  responses (PDF receipts) pass through.
- **Parsed pages**: `/api/profile`, `/api/payments`, `/api/welcome` fetch the
  server-rendered upstream pages and parse them with cheerio.
- **Payment orchestration** (`POST /api/pay/initiate`) mirrors the upstream
  `/pay` JavaScript: scrape session material → `setdetails` → engine-specific
  init (`myghpay-create-auth`, `zenithinit`, `calpay/initiate`,
  `access/initiate`, `quipucheckoutbefore`, `stanbiccheckoutbefore`).

## Routes

| Path | Purpose |
| --- | --- |
| `/login` | Student/staff sign-in |
| `/forgot-pin` | Public Student ID / PIN recovery form |
| `/dashboard` | Greeting, upstream alerts, shortcuts |
| `/profile` | Personal & academic details |
| `/notifications` | Announcements from STS |
| `/exams` | Exam timetable (graceful empty state) |
| `/calendar` | Academic calendar grouped by year |
| `/faq` | FAQ accordion (sanitized upstream HTML) |
| `/pay` | Make a fee payment (see warning below) |
| `/payments` | Payment history + receipt PDFs |
| `/evaluation` | Course evaluation (graceful "not open" state) |
| `/complaints` | IT complaint + email-your-college forms |
| `/exam-complaint` | Exam issue report with evidence uploads |
| `/suggestions` | Suggestion box |
| `/pin-reset` | PIN recovery info & support contacts |
| `/services` | Service hub — registration, certificates, finance, welfare |
| `/services/<slug>` | An individual rebuilt service (see below) |

API routes live under `src/app/api/`: `auth/login`, `auth/logout`,
`auth/forgot-pin`, `sts/[...path]`, `service/[slug]`, `courses`, `profile`,
`payments`, `welcome`, `pay/initiate`.

## Long-tail services

The services that used to be external links are now rebuilt in-app. Each one
is declared in `src/lib/services.ts` (upstream page, submit endpoint, form
fields) and rendered by `src/components/service-form.tsx`:

| Service | Upstream page | Submits to |
| --- | --- | --- |
| Course Specialisation | `/provide-specialization` | `save-specialization` |
| Deferment Request | `/deferment` | `savedeferment` |
| Withdrawal Request | `/requestrefund` | `saverefundrequest` |
| Matriculation Registration | `/matriculation` | `savematriculation` |
| Verify Course & Lecturer | `/cle-leturer-select` | `save-cle-lecturer` |
| Certificate Booking | `/request-certificate` | `save-cert-request` |
| Internship Letter | `/internship-payments` | `generate-internship-letter` |
| WES Transcript Request | `/wes/home` | `wes/submit` |
| Request a Refund | `/refundrequest` | `saverefundrequest` |
| Student Loan Consent | `/studentloan` | `sendconsent` |
| STARLife Consent | `/starlife` | `starlifesendconsent` |

**How it stays faithful:** hidden values carried by the original form (student
id, name, programme, level, college, fees…) are scraped server-side by
`/api/service/[slug]` and replayed on submit, so no university data is
hard-coded. Real `<select>` option lists are scraped the same way; a couple of
fields (course lists, examiners) load from dedicated endpoints instead.
Adding a service is a spec entry — no new page or route.

Anything not rebuilt yet (medical examination, transcript ordering, COVID
assessment, psychosocial checklist, national service verification, HERC/UGRC,
UG Hospital E-Consult) is listed on `/services` with a clear note that it opens
on another system.

## ⚠️ Mutating flows are implemented but **untested**

By design, no mutating request was sent to the real backend while building
this. The following are wired to the documented upstream contracts and show a
warning banner in the UI:

- fee payments (`/pay`) — reserves a reference and starts a gateway session
- complaints (`complaint/submit`, `sendmailtocollege`)
- exam complaints (`save-exam-complaint`, with file uploads)
- suggestions (`suggestions`)
- PIN recovery (`saveforgotpin`)
- the `/services/<slug>` forms: specialisation, deferment, withdrawal,
  matriculation, certificate booking, internship letter, WES, refund, student
  loan consent, STARLife consent, course/lecturer verification

Test these against a throwaway account before relying on them.

## Security notes

- Upstream session cookies are relayed as `HttpOnly` where the upstream intends
  it; `sts_auth` is `HttpOnly`.
- The generic proxy only accepts relative paths from our own client and always
  targets `STS_BASE`.
- Upstream HTML fragments (FAQ answers, notification bodies) are sanitized
  before rendering (`src/lib/sanitize.ts` server-side, `sanitize-client.ts` in
  the browser).
- `fetchcoursesforcomplaints` returns a `pin` field upstream. The portal never
  exposes it: `/api/courses` strips the PIN server-side and the generic proxy
  result is only used to build `<option>`s.
- `FINDINGS.md` documents the reverse-engineering analysis (contracts, fields,
  payment engines).

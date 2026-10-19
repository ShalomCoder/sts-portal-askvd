# STS (https://sts.ug.edu.gh) — REA Analysis Findings

> Reverse-engineered with REA browser scenarios + raw HTTP inspection on 2026-10-19.
> Evidence IDs: `ev_7f1a2a88…` (landing), `ev_0435db66…` (landing capture), `ev_a5a26400…` (network map), `ev_2d009623…` (login flow → `/services/welcome`).
> Account used: a private student account (read-only exploration; no mutating POSTs were ever sent).

## 1. Stack (observed)

- **Backend:** Laravel (PHP) on Apache/2.4.29 (Ubuntu), server-rendered pages + jQuery AJAX.
- **Session:** encrypted cookies `sts_session` (httponly) + `XSRF-TOKEN` (Laravel-encrypted, `path=/`, 6h), plus per-session `_token` (CSRF) embedded in every form as `<input name="_token">`. **No `csrf-token` meta tag.**
- **Root:** `GET /` → 302 → `/services` → 301 → `/services/` (login page, title "Students/Staff Services").
- Analytics: GA4 `G-PL0XW1LEF4`.

## 2. Auth contract

```
POST https://sts.ug.edu.gh/services/authenticate
Content-Type: application/x-www-form-urlencoded
Cookie: sts_session=…; XSRF-TOKEN=…
Body: _token=<csrf>&loginas=student|staff&student_id=<id>&pin=<pin>

→ 200 {"status":"success","message":"Authentication Succesful",
       "responseurl":"https://sts.ug.edu.gh/services/welcome"}
→ 200 {"status":"…","message":"<error text>"}   (on failure)
```

- Client JS: `$.post(authenticate, $(form).serialize())` → on success `window.location.href = responseurl`.
- Session-protected URLs answer **302 → `/services/login`** when unauthenticated (e.g. `fetchimage`, `fetchcoursesforcomplaints`, `evaluation`).
- `GET /services/logout` ends the session.
- SSO route exists: `/services/sso/login` (links to iEnabler/MISWeb `ienabler.ug.edu.gh`).

## 3. Routes (authenticated unless noted)

| Route | Purpose |
|---|---|
| `/services/welcome` | Dashboard: greeting, alert boxes, service grid |
| `/services/profile` | Profile + medical-history card (server-rendered) |
| `/services/viewnotification` | Notifications accordion |
| `/services/timetable` | My Exam Schedules |
| `/services/calender` | Academic Calendar |
| `/services/history` | Payment History table + print receipt |
| `/services/pay` | Make Payment (academic/residential/internship/services/idcard) |
| `/services/resit` | Resit Registration (302 → evaluation → transcript-land for this account) |
| `/services/evaluation` | Course/Lecturer Evaluation (302 for this account now) |
| `/services/complaint/submit` | Submit a Complaint |
| `/services/submit-exam-complaint` | Exam Complaint |
| `/services/faq` | FAQ |
| `/services/cle-leturer-select` | Verify registered courses & lecturers |
| `/services/transcript-land`, `/services/wes/home`, `/services/deferment`, `/services/medical-start`, `/services/studentloan`, `/services/request-certificate`, `/services/emp-letter`, … | Long-tail services |
| `/timetable` (outside `/services/`) | General timetable link |

## 4. JSON API contracts (all GET unless noted; `data` shapes verified live)

| Endpoint | Response |
|---|---|
| `fetchcoursesforcomplaints` | `{"data":[{student_id, student_name, dob, email, gender, hall, nationality, programme, school, college, department, level, year, semester, course_code, course_title, credits, grade, lect_id, lect_name, outstand_fees, pin, …}]}` — 6 records (one per registered course). ⚠️ contains `pin` field — never display/log it. |
| `fetchnotification` | `{"status":"success","data":[{title, body, data?}]}` |
| `fetchtimetable` | `{"courses":[{course_code,…}], "data":"<JSON string>"}` → parsed: `[{course_code,title,day,month,venue_id:[],exam_date,exam_time,index_range:[],status,student_no}]`; `{"status":"notfound"}` when no exams |
| `pullcalender` | `{"status":"success","data":{"2022-2023":[{id,title,start_date,end_date,…}]}}` |
| `fetchfaq` | `{"status":"success","data":[{title, body(html)}]}` |
| `fetchvenues` | `{"data":[{name}]}` |
| `fetchcurrentcourses` | `{"data":[]}` |
| `fetchimage` | `{"status":"success","stdimage":url}` or `{"status":"error"}` |
| `fetchevaluationcourses` | `{"status":"error","type":"03"}` (unavailable windows) |
| `fetch-phone-numbers` | `{"status":"success","phones":[]}` |
| `cert-grad-status` | `{"status":"success","graduated":false}` |
| `check-emp-letter`, `gov_scholarship` | `{"status":"success","data":null}` |
| `firstgeneration`, `check-medical-booking` | `{"data":null}` |
| `checkacademicrecords`, `checkforidcard`, `medical-exam-status`, `pullprofileinfofrommedical` | `{"status":"error"}` (no record) |
| `check-specialization-list` | `{"status":"success","data":false}` |
| `setdetails` (GET) | `{"status":"success","refcode":…}` — payment ref reservation |

Other server-rendered HTML routes: `welcome`, `profile`, `history`, `pay`, `faq`… (parsed server-side in this frontend).

## 5. Payment flow (documented, NOT executed)

```
GET  setdetails?amount&fee_code&fee_name&refcode&paymentengine&PHONE → {status, refcode}
POST myghpay-create-auth   {_token, amount, fee_code, fee_name, clientref, paymentengine, phone, student_name}
POST zenithinit            (form serialize) → {status:"success", url} → redirect to gateway; callback → /services/mpgssuccess/<ref>
POST calpay/initiate       {_token, student_id, student_name, amount, fee_code, fee_name, refcode, phone, email, …}
POST access/initiate       (same shape)
```
Receipt printing: `GET /services/printpayment/<student_id>/<ref>`.

## 6. Forms that mutate (implemented but deliberately untested)

- `sendmailtocollege` — complaint (sends email to college)
- `save-exam-complaint` — exam complaint
- `suggestions` (public), `saveforgotpin` (public), `saveprogramme`, `savedeferment`, `sendconsent`, `save-balloting`, `save-clothes`, `saveidcarddate`, `save-medical-booking`, `save-device-token`, `savefirstgeneration`, `savepickaday`

## 7. Frontend architecture (this repo)

Next.js (App Router) with a **same-origin proxy** — the browser never talks to sts.ug.edu.gh directly (no CORS), cookies are relayed by the server:

- `POST /api/auth/login` → performs the two-step Laravel login upstream, relays `sts_session`/`XSRF-TOKEN` cookies to the browser.
- `GET/POST /api/sts/[...path]` → generic pass-through proxy for JSON APIs; auto-injects a fresh `_token` (scraped from an HTML page) into form POSTs; upstream 302 → our `401 {unauthenticated}`.
- `GET /api/profile`, `GET /api/payments` → fetch server-rendered HTML upstream and parse to JSON (cheerio).

## 8. Unknowns / limitations

- `fetchevaluationcourses` success shape unknown (evaluation window closed for this account).
- Staff login (`loginas=staff`) untested.
- Payment gateway redirects/end-to-end untested by design.
- SSO (`/services/sso/login`) flow not traced.
- Notification item `data` field shape unobserved (no notifications on account).
- Attendance-style features were not present — this portal is services/payments oriented.

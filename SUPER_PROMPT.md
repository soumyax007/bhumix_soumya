# Bhumix — Land Record Verification System
## Build Prompt: Phase 1 (Field Officer Dashboard) + Phase 2 (Super Admin Dashboard)

You are building on top of an existing project called **Bhumix** (SIH 26018 —
Land Record Digitization and Validation System). Two backend microservices
are already built and live in production. A partial frontend already exists
as plain HTML/CSS/JS — you will port its working logic into a proper React
app rather than continue in vanilla JS. Your job is to build a multi-page,
role-based **React** system, wired up to Supabase for data persistence,
following the exact spec below.

**Stack:** React (Vite), TypeScript preferred. No custom Node.js/Express
backend — Supabase's client SDK (`@supabase/supabase-js`) talks directly to
the database, storage, and (later) auth from the browser, so a server-side
API layer isn't needed for CRUD. The only backend services in this project
are the two already-deployed FastAPI microservices below, called directly
from the frontend via `fetch`.

**Do not rebuild the scan/translate services — they're done and live.
Port the existing frontend's working logic into React components; don't
silently drop functionality or re-derive it from scratch.** Everything you
need to know about both is in this document.

---

## 1. What already exists (read this before writing any code)

### 1a. Two live backend APIs (already deployed on Render — do not modify)

**Scanner** — `https://bhumix-scan.onrender.com`

```
POST /extract
Content-Type: multipart/form-data
Body field: "file"  (the uploaded image/PDF — jpg, jpeg, png, tif, tiff, pdf)
```

Returns:
```json
{
  "owner_name": { "value": "...", "confidence": 0.97 },
  "khasra_no": { "value": "...", "confidence": 0.99 },
  "khata_no": { "value": "...", "confidence": 0.99 },
  "survey_no": { "value": null, "confidence": 0.0 },
  "village": { "value": "...", "confidence": 0.95 },
  "tehsil": { "value": "...", "confidence": 0.95 },
  "district": { "value": "...", "confidence": 0.95 },
  "plot_area": { "value": "...", "confidence": 0.99 },
  "land_classification": { "value": "...", "confidence": 0.9 },
  "document_language": "Hindi",
  "notes": "..."
}
```
Any field can be `null`/`0.0` if illegible — handle that in the UI (show "—").

**Translator** — `https://bhumix-traslation.onrender.com`

```
POST /translate
Content-Type: application/json
Body: {
  "scan_result": { ...the full JSON object from /extract... },
  "source_lang": "hi-IN",
  "target_lang": "bn-IN"
}
```

Returns the same object with a `translated_value` added to every field,
plus `notes_translated` and `target_language` at the top level.

Supported codes: `en-IN, hi-IN, bn-IN, ta-IN, te-IN, mr-IN, gu-IN, kn-IN,
ml-IN, pa-IN, od-IN`

Both services have CORS enabled for all origins already. Both are on
Render's free tier — first request after idle can take 30-50s (cold
start). Always show a patient loading state, never assume a slow response
is broken. Both return errors as a JSON body (`{"error": "..."}` or
`{"detail": "..."}`) with a non-2xx status — always check `res.ok` before
treating a response as success.

### 1b. Existing repo structure (current — to be restructured)

```
bhumix-main/
├── README.md
├── backend/
│   ├── scan/         (app.py, Dockerfile, requirements.txt — deployed, don't touch)
│   └── translate/     (app.py, Dockerfile, requirements.txt — deployed, don't touch)
├── frontend/
│   ├── index.html     (see below — reference logic to port into React, not to keep editing)
│   └── styles.css
└── docs/
```

Replace `frontend/` with a proper Vite React app. Suggested shape (adjust
as the stack warrants, per the accompanying short prompt):

```
frontend/
├── index.html              (Vite entry point, not the old one)
├── package.json
├── vite.config.ts
├── .env.local.example      (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
│                             VITE_SCAN_URL, VITE_TRANSLATE_URL)
├── src/
│   ├── main.tsx
│   ├── App.tsx              (routing: /field-officer, /super-admin)
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   ├── scanApi.ts        (wraps /extract)
│   │   └── translateApi.ts   (wraps /translate)
│   ├── types/
│   │   └── landRecord.ts     (shared types for extracted_data shape, etc.)
│   ├── pages/
│   │   ├── FieldOfficer/
│   │   │   ├── FieldOfficerPage.tsx
│   │   │   └── MySubmissions.tsx
│   │   └── SuperAdmin/
│   │       ├── SuperAdminPage.tsx
│   │       ├── GenerateKey.tsx
│   │       └── SearchRecords.tsx
│   └── components/
│       ├── Stepper.tsx
│       ├── LanguageSelect.tsx
│       ├── UploadDropzone.tsx
│       └── ExtractedRecordReview.tsx
└── ...
```

### 1c. What's already built in `frontend/index.html` — port this to React

This existing plain-JS file is your **reference implementation**, not a
file to keep editing directly. It already implements, and works:
- Source/target language dropdowns
- Drag-and-drop file upload
- A 4-step visual stepper (Language & upload -> Scan -> Review -> Approve)
- Calls to `/extract` then `/translate` in sequence, with loading states
  for each
- A review screen showing each field's original value (editable textarea)
  next to its translated value, plus a notes field
- An "Approve record" button and a "Start over" button

Port this into React as something like a `<DocumentUploadFlow />`
component (or split further — e.g. `<LanguageSelect />`,
`<UploadDropzone />`, `<ExtractedRecordReview />`, `<Stepper />` — your
call on decomposition, just keep it sensibly componentized rather than
one giant component). Preserve the state machine (`input -> scanning ->
translating -> review -> approved`), the field labels/order constants,
and the exact fetch calls to both APIs — these are working and tested,
don't redesign them, just re-house them in React state (`useState`/
`useReducer`) instead of manually mutating the DOM.

**What's missing / needs fixing (build this new, it didn't exist before):**
- "Approve record" currently just shows a local "Approved" banner and
  **does not persist anything anywhere**. Wire it to actually submit the
  record to Supabase (see Section 3).
- There is no "My Submissions" view showing past submissions and their
  status.
- There is no navigation/dashboard shell (sidebar, header) matching the
  reference design (see Section 5).
- "Start over" is a local form-reset, not a rejection — don't confuse the
  two. Rejection is a Tehsildar action (out of scope for these two phases,
  see Section 6), not something the Field Officer does to their own submission.

Keep the same field-name constants (`FIELD_LABELS`, `FIELD_ORDER`), the
same API URL constants, and the same language code list when porting —
these are shared "vocabulary" the rest of the app depends on, so
reinventing them under different names would just create inconsistency
across components.

---

## 2. Critical bug you must NOT reproduce

A reference demo (`friend-request-demo`) was used to prototype the
request -> decision logic. It has a real, confirmed bug you must actively
avoid:

**The bug:** in the demo's `db.js`, `updateStatus(id, status)` only
flips a `status` field to `"accepted"` or `"rejected"` — the full record
(JSON payload + uploaded image reference) is inserted once on creation
and is **never removed**, regardless of the decision. This means a
**rejected** request still has its full data sitting permanently in the
database, identical to an accepted one except for a status label.

**The requirement:** rejection must mean the data is **not retained**.
Specifically, for this project:

- **Approved** -> the record (all extracted/translated fields + the
  uploaded document) is permanently stored. This is the only path to
  permanent storage.
- **Rejected** -> the record's extracted data and uploaded document must
  be deleted, not merely status-flagged. Do not keep the payload sitting
  in the database under a `status = 'rejected'` label indefinitely.

This means: on approval, `UPDATE` the row's status (data stays). On
rejection, `DELETE` the row (which cascades to delete its linked document
row — see FK below) **and** delete the actual file from Supabase Storage
(deleting the row alone leaves an orphaned file in the bucket — you must
explicitly call storage delete too).

This bug fix applies to the Tehsildar's approve/reject action (Phase 3,
not built in this prompt) — but the **database schema and storage logic
you build now in Phases 1-2 must be designed to support this correctly**,
so flag this now rather than requiring a schema change later.

---

## 3. Supabase — schema and storage

Supabase credentials: the **project URL is still needed** (not yet
provided — get it from Supabase dashboard -> Settings -> API before
starting) and the **API key has been provided** as a `sb_publishable_...`
key (Supabase's newer publishable-key format — safe to use client-side,
equivalent to the old "anon key"). Do not hardcode either value in
source files — read them from `SUPABASE_URL` / `SUPABASE_ANON_KEY` (or
your framework's env convention), set in an untracked `.env` file.

### 3a. No login in these two phases — but the schema still uses `user_id`

Phases 1 and 2 have **no authentication**. There is no `profiles` table
and no real user accounts yet — that's a later phase. However, the
`land_records` table uses a `user_id` column (per the confirmed schema
below), not a made-up placeholder name — this keeps the schema
future-compatible with real auth later.

**Important distinction:** with no login, `user_id` cannot be a real
foreign key to an auth table yet — treat it as a **free-text identifier**
for now (e.g. the officer's name or a self-chosen short ID), not a
`uuid references auth.users(id)`. Mirror the pattern used in the
reference demo (hardcoded `user1`/`user2`, no auth): each dashboard has a
simple text field the person fills in once (e.g. stored in
`localStorage` so they don't retype it every visit) whose value gets
written into `user_id`. When real login is added in a later phase, this
column's meaning upgrades to the real authenticated user's ID without
needing a schema change — only the value population changes.

Do not build a login page, signup page, or invite-code redemption flow
in this phase — that comes later. You are, however, building the
**Super Admin's key-generation feature itself** (the codes get written
to the DB now; nothing consumes them yet).

### 3b. Run this SQL in Supabase (SQL editor)

The base columns below match the confirmed `land_records` /
`land_documents` structure exactly. A few columns are marked `-- ADDED`
— these are required for the approve/reject workflow and for keeping
confidence scores + translated values (flat columns alone would lose
that data); they weren't in the original column list but nothing works
without them, so they're included here rather than left as a gap.

```sql
-- Land records: one row per submitted document
create table land_records (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,              -- free-text for now, see 3a — not a real auth FK yet
  owner_name text,
  khasra_no text,
  khata_no text,
  survey_no text,
  village text,
  tehsil text,
  district text,
  plot_area text,
  land_classification text,
  document_language text,
  target_language text,               -- ADDED: which language it was translated into
  extracted_data jsonb not null,      -- ADDED: full raw scan+translate response (confidence, translated_value, notes)
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),  -- ADDED: required for approve/reject workflow
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz             -- ADDED
);

-- Uploaded documents linked to a record.
-- ON DELETE CASCADE matters: deleting a rejected land_record
-- automatically removes its document row too.
create table land_documents (
  id uuid primary key default gen_random_uuid(),
  land_record_id uuid not null references land_records(id) on delete cascade,
  file_name text not null,
  file_path text not null,   -- path inside the 'land-documents' storage bucket
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

-- ADDED: not in the original two-table list, but required for the
-- Super Admin "Generate Unique Key" feature (Phase 2) to have somewhere
-- to write codes to. Codes aren't consumed until login exists.
create table invite_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  role text not null check (role in ('field_officer', 'tehsildar')),
  is_used boolean not null default false,
  generated_by text,
  created_at timestamptz not null default now()
);

create index idx_land_records_status on land_records(status);
create index idx_land_records_owner_name on land_records(owner_name);
create index idx_land_records_village on land_records(village);
create index idx_land_records_khasra_no on land_records(khasra_no);
```

### 3c. Storage bucket

Create a bucket named `land-documents`. Use this path convention (per the
confirmed spec):

```
{user_id}/{land_record_id}/{original_filename}
```

Since `user_id` is currently a free-text label (no real auth — see 3a),
this still works as a namespacing convention; it just won't be
security-enforceable via real auth-scoped storage policies until login
exists. For now, make the bucket policies permissive enough for the
publishable key to upload/read/delete — but leave a clear
`-- TODO: tighten storage policies once login/auth exists` comment
wherever this is configured, since permissive-for-everyone is a
deliberate, temporary tradeoff, not the end state.

---

## 4. Phase 1 — Field Officer Dashboard

Build the ported `<DocumentUploadFlow />` (from Section 1c) into a full
page. Route: `/field-officer`.

**Features:**

1. **Upload & scan** (already built — keep as-is): language selection ->
   file upload -> `/extract` -> `/translate` -> editable review screen.
2. **Submit for approval** (fix the "Approve record" button): on click,
   insert a new row into `land_records` with:
   - all the flat fields from the (possibly user-edited) extracted data
   - `extracted_data` = the full final JSON (with `translated_value`s)
   - `status = 'pending'`
   - `user_id` = the officer's identifier text (from Section 3a)

   Then upload the original file to the `land-documents` bucket at
   `{user_id}/{land_record_id}/{filename}`, and insert a row into
   `land_documents` linking it. Only after both succeed, show the
   "submitted" confirmation — if either fails, show a clear error and
   don't leave a half-created record (i.e. if the file upload fails after
   the DB row was created, either roll back the row or retry the upload
   — don't silently leave a record with no attached document).
3. **My Submissions** (new page/section): a list of this officer's past
   submissions with their current `status` (pending / approved /
   rejected badge) — pulled from `land_records` filtered by `user_id`.
   Since rejected records are deleted per Section 2, a "rejected" badge
   will only appear for the brief window between rejection and the list
   refreshing — that's expected behavior, not a bug; make sure the UI
   doesn't error out if a previously-listed pending record disappears on
   refresh.

---

## 5. Phase 2 — Super Admin Dashboard

New page. Route: `/super-admin`.

**Features (matching the reference mockup):**

1. **Generate Unique Key** — an email input + "Generate Code" button.
   Generates a random 6-digit numeric code, inserts a row into
   `invite_codes` (email, code, role — default to letting the admin pick
   `field_officer` or `tehsildar` in the UI, `generated_by` = the admin's
   identifier text from Section 3a), and displays the code back with a
   "share this with the user" message. No email is actually sent — just
   display it on screen for the admin to copy/share manually.
2. **Search Records** — a search form (name / village number / khasra
   number, any combination) that queries `land_records` where
   `status = 'approved'` only (pending/rejected records shouldn't be
   searchable here — pending isn't finalized yet, and rejected records no
   longer exist per Section 2). Results table: name, village no., khasra no.,
   "View" links for extracted data and the source document.
3. **View Extracted Data & Document** — clicking a search result shows
   the full extracted (and translated, if applicable) field set plus a
   link/preview to the stored document (fetch its `file_path` from
   `land_documents` and generate a Supabase Storage public/signed URL).
   Include a "Download PDF" / download-original-file action.

---

## 6. Explicitly out of scope for this prompt

Do not build these now — they're later phases:

- Login / signup pages for any role
- Invite-code redemption (actually consuming the codes generated in
  Phase 2)
- The Tehsildar dashboard (pending requests, approve/reject, verify &
  store) — this is where the approve/reject logic from Section 2 actually gets
  triggered by a human; for now, if you need to test the delete-on-reject
  behavior, you can add a temporary/internal way to flip a record's
  status for testing, but don't build the real reviewer UI/workflow yet.
- Row Level Security policies scoped to real users (no real users exist
  yet)
- Audit logging / version history on corrections after approval

---

## 7. Visual design reference

A reference mockup image is provided showing all three dashboards
(Super Admin = blue accent, Field Officer = green accent, Tehsildar =
purple accent — Tehsildar not built in this phase, but keep the same
visual language: card-based panels, a dark sidebar nav per role, numbered
step sections, status badges). Match this general layout and color
convention for the two dashboards you are building, adapted to the
existing `styles.css` design tokens already in the repo rather than
introducing a new design system.

---

## 8. Definition of done for this prompt

- [ ] Field Officer can upload a document, see it scanned + translated,
      edit fields, and submit — creating a real `land_records` +
      `land_documents` row in Supabase, with the file actually in Storage
- [ ] Field Officer has a working "My Submissions" list reflecting live
      Supabase data
- [ ] Super Admin can generate a 6-digit code tied to an email + role,
      written to `invite_codes`, and see it displayed
- [ ] Super Admin can search approved records by name/village/khasra and
      view both the extracted data and the original document
- [ ] Schema and storage logic are structured so that, when reject logic
      is added in Phase 3, rejecting a record is a clean `DELETE` (row +
      storage file) rather than a status flag on retained data — nothing
      in Phases 1-2 should make that harder to implement correctly later
- [ ] No login/auth was built; a simple name-label mechanism stands in
      for identity per Section 3a

# Frontend Integration Guide — Land Record Scan + Translate

Two independent backend APIs, hosted separately on Render. The frontend
calls them in sequence: scan first, then translate. There is no direct
connection between the two services — the frontend is the one that passes
the scan's output into the translate call.

## API 1 — Scanner

**Base URL:** `https://bhumix-scan.onrender.com`

### `POST /extract`

Upload a scanned land record (image or PDF), get back structured JSON.

- **Content-Type:** `multipart/form-data`
- **Body field:** `file` (the uploaded image/PDF)
- **Accepted formats:** `.jpg`, `.jpeg`, `.png`, `.tif`, `.tiff`, `.pdf`

**Example request (JS `fetch`):**
```javascript
const formData = new FormData();
formData.append("file", fileObject); // fileObject from an <input type="file">

const res = await fetch("https://bhumix-scan.onrender.com/extract", {
  method: "POST",
  body: formData,
});
const scanResult = await res.json();
```

**Response shape:**
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

Any field can have `value: null` and `confidence: 0.0` if that field
wasn't found/legible in the document — handle that case in the UI (e.g.
show "—" instead of blank).

---

## API 2 — Translator

**Base URL:** `https://bhumix-traslation.onrender.com`

### `POST /translate`

Takes the scan's JSON output plus source/target language codes, returns
the same JSON with a `translated_value` added to every field.

- **Content-Type:** `application/json`

**Request body:**
```json
{
  "scan_result": { ...the full JSON object returned by /extract... },
  "source_lang": "hi-IN",
  "target_lang": "bn-IN"
}
```

**Example request (JS `fetch`):**
```javascript
const res = await fetch("https://bhumix-traslation.onrender.com/translate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    scan_result: scanResult,   // output from /extract, unmodified
    source_lang: sourceLang,   // e.g. "hi-IN"
    target_lang: targetLang,   // e.g. "bn-IN"
  }),
});
const finalResult = await res.json();
```

**Response shape:** same as the scan output, but each field object now
also has `translated_value`, plus two new top-level keys:
```json
{
  "owner_name": { "value": "...", "confidence": 0.97, "translated_value": "..." },
  "...": "...same pattern for every field...",
  "notes_translated": "...",
  "target_language": "bn-IN"
}
```

**Supported language codes:** `en-IN`, `hi-IN`, `bn-IN`, `ta-IN`, `te-IN`,
`mr-IN`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `od-IN`

---

## The exact flow to implement

1. **User selects source and target language** — two dropdowns using the
   codes above. Store both in component state. Nothing is sent yet.
2. **User uploads the document** — a file input. Once they click submit,
   show a loading state — this next step is the slow one (Gemini reading
   the document; several seconds, longer if the scan service has been
   idle and needs to cold-start).
3. **Call the scan API** — `POST` the file to `/extract` as described
   above. Get back the structured JSON.
4. **Call the translate API** — `POST` that JSON, plus the `source_lang`
   and `target_lang` from step 1, to `/translate`.
5. **Render the result** — show `value` and `translated_value` together
   for each field (original + translation side by side), so nothing is
   silently hidden. This matters for legal/audit accuracy.

A full working reference implementation of this exact flow (plain
HTML/JS, no framework, so it's easy to port into React/Vue/whatever
you're using) is in `index.html` alongside this guide.

---

## Things to watch for

- **Error handling:** both APIs return a JSON body with an error message
  on failure (scan: `{"error": "..."}` with HTTP 500; translate:
  `{"detail": "..."}` with HTTP 500). Always check `res.ok` before
  parsing the body as a success result, and surface the error message to
  the user rather than failing silently.
- **Cold starts:** both services are on Render's free tier. If they've
  been idle, the first request can take 30-50 seconds while the
  container spins up. Don't assume a slow response means something is
  broken — show a patient loading message.
- **CORS:** both APIs already have CORS enabled for all origins, so
  browser-based requests from any frontend domain will work out of the
  box. Once the frontend has a fixed production domain, ask the backend
  owner to restrict `allow_origins` to that domain for tighter security.
- **File field name:** the scan API expects the multipart field to be
  named exactly `file` — this matches FastAPI's `File(...)` parameter
  name on the backend. Using a different field name will cause a 422
  error.
- **Don't hardcode the URLs** in production code — put
  `SCAN_URL`/`TRANSLATE_URL` in environment variables so they can be
  changed without a code deploy.

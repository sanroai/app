# The textbook, on a deployed site

The chapter textbook is read as **page images inside the app**. It is never handed
to the system PDF viewer: Android's WebView cannot render a PDF at all, and
`Linking.openURL` on a PDF URL only downloads it (Chrome shows *"cannot display
PDF"*). A link to `ncert.nic.in` fails the same way, which is what students
reported as "cannot display pdf, cannot be opened".

So a chapter needs **images**, and a deployment has to be able to serve them.

## Why local worked and production did not

`books/` is git-ignored (521 MB of PDFs, 3.0 GB of page PNGs), so it exists only
on a developer machine. Locally the API read the pages from disk and everything
worked. On Render the same code found no files, `/pages` answered
`{ count: 0 }`, and both clients fell back to the NCERT URL — which cannot be
displayed. That was the whole difference.

## What ships instead

`scripts/qa/publish-textbook-cdn.mjs` renders every extracted page to a
1240 px JPEG (quality 70) and writes a plain directory tree:

```
<CHAPTER_CODE>/pNNN.jpg        e.g. SCI-10-4/p010.jpg
<CHAPTER_CODE>/p001.jpg ...
_headers                       Cache-Control: immutable, CORS: *
```

| | |
|---|---|
| Chapters | **233** (212 real chapters + 21 prelims/answers folders) |
| Pages | **5,058** |
| Size | **~666 MB** (from 3.0 GB of PNGs) |
| Host | Cloudflare Pages project `sanro-books` |
| URL | **https://books.sanroai.com** (CNAME -> `sanro-books.pages.dev`, proxied) |
| Cost | free — Pages has no bandwidth charge and no egress fee |

The manifest `apps/api/src/common/books/chapter-pages-manifest.json` maps
`CHAPTER_CODE -> [page numbers]`. It is 15 KB and **committed**, so the API knows
a chapter's page count without touching a disk.

`chapterPageRemoteUrls(code)` turns that into
`https://books.sanroai.com/<CODE>/pNNN.jpg`. Override the base with
`TEXTBOOK_CDN_URL` to point at a staging deployment.

## The API contract

`GET /learning/chapters/:chapterId/pages` (authenticated, grade-checked):

```json
{
  "count": 16,
  "expiresAt": null,
  "pages": [{ "index": 1, "path": "https://books.sanroai.com/SCI-10-1/p001.jpg" }]
}
```

- **Book files on disk** (a local checkout): signed, short-lived API URLs
  (`/learning/pdf/:id/pages/:page?exp&sig`) and a real `expiresAt`.
- **No book files** (every deployment): public CDN URLs and `expiresAt: null`.

Both clients already pass an absolute URL through unchanged
(`resolveApiPath` on web, `absoluteApiUrl` on mobile), which is why the **shipped
APK started working with no rebuild** — the fix is entirely server-side.

`POST /learning/chapters/:id/pdf-link` also falls back to the official NCERT PDF
when there is no local file, so "Download PDF" still yields a real file.

## Primary classes (1-4)

Their English chapters are exactly the units of the NCERT Marigold books, one
seeded chapter per unit, so the official chapter PDF is the right textbook:

```bash
node scripts/qa/publish-primary-textbook.mjs
# ENG-1-1 <- aemr101.pdf ... ENG-4-5 <- desa105.pdf  (20 chapters, 233 pages)
```

`ncert.nic.in` resets Node's TLS, so download the PDFs with PowerShell first into
`artifacts/qa/<date>/ncert-cache/`; the script reuses the cache.

**Classes 1-4 Science and Mathematics are not NCERT chapters** — they are our own
lesson sets ("Numbers up to 10000", "The World of Plants"), so mapping them onto a
random NCERT chapter would show the wrong pages. Those 17 chapters, and classes
1-2 which have no NCERT science book at all, correctly report no textbook.

## Publishing a change

```bash
node scripts/qa/publish-textbook-cdn.mjs --quality 70
# 4,825 pages, ~6 minutes, writes the manifest too

$env:CLOUDFLARE_EMAIL="..."; $env:CLOUDFLARE_API_KEY="..."
npx wrangler pages deploy artifacts/qa/2026-11-02/textbook-cdn \
  --project-name=sanro-books --branch=main --commit-dirty=true
# re-runs upload only the new files ("N already uploaded")
```

Then commit the manifest. No API redeploy is needed if only page images changed;
redeploy the API when the manifest changed.

## Guards

| Check | What it proves |
|---|---|
| `node artifacts/qa/2026-11-02/probe-ai-speed.mjs` | live `/pages` returns CDN URLs, not an empty list |
| `apps/api/test/chapter-pages.e2e-spec.ts` | auth, grade scoping, signed-path or CDN-path contract, 404/401 cases |
| `node scripts/qa/probe-chapter-pages.mjs` | traversal, range, HEAD, forged signatures |

## Known limitations

- The page images are public. They are NCERT's own public textbook pages, and a
  plain `<img>` cannot send a bearer token, so signing them would buy nothing.
- Only classes 5-10 are extracted into `books/`, plus class 1-4 English from the
  NCERT site.
- Publishing needs the local book tree; CI cannot regenerate the images.

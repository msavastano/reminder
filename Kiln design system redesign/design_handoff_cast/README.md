# Handoff: Cast — document-to-Markdown converter (Kiln redesign)

## Overview
**Cast** is a redesign of the existing `doc2md` web app — a tool that converts uploaded documents (PDF, DOCX, PPTX, HTML, TXT, images) into clean Markdown. The user drops a file, watches a live conversion log stream, then downloads or previews the resulting `.md`. This redesign restyles the original dark-glassmorphism UI into the **Kiln design system** (a warm, tactile "claymation" aesthetic) and restructures it into a full app shell (sidebar + topbar + workspace) instead of a single centered card.

The product name was changed from `doc2md` to **Cast** ("pour any document in, cast clean Markdown out") to fit Kiln's tactile workshop voice. Rename is optional — keep `doc2md` if preferred.

## About the design files
The files in this bundle are **design references created in HTML** — a prototype showing the intended look and behavior. They are **not production code to copy directly**.

`Cast.dc.html` is authored as a "Design Component": its markup is the body between `<x-dc>` tags and its logic is a `class Component extends DCLogic` (a thin React-class wrapper). The Kiln components (`Button`, `Card`, `Badge`, `Spinner`) are mounted from a prebuilt bundle. **Do not try to reuse the DCLogic/x-import machinery** — it is specific to this prototyping environment.

Your task: **recreate this design in the real `doc2md` codebase.** That codebase (see the original `toMarkdown` project) is a **vanilla HTML/CSS/JS frontend** (`public/index.html`, `public/style.css`, `public/app.js`) talking to a Node/TypeScript backend over `POST /api/convert` and an SSE stream at `/api/logs`. Recreate the visuals and interactions there using plain HTML/CSS/JS — keep the existing backend wiring (the prototype only *simulates* the conversion; the real app already has working endpoints). If you prefer to migrate to a framework, that's a separate decision — the design maps cleanly to any.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, shadows, and interaction states are all specified below and come from the Kiln design system tokens. Recreate the UI pixel-faithfully. All token values are listed in the Design Tokens section so you do not need the Kiln bundle to implement it — you can hard-code the values or port the token CSS.

---

## Screens / Views

There is **one screen** (the Convert workspace) that moves through four **phases**, plus one **modal**. The app shell (sidebar + topbar) is constant across all phases.

### App shell (always visible)

**Layout:** Full-viewport flex row, `height: 100vh; overflow: hidden`.
- **Sidebar** — fixed `width: 252px`, `flex: none`, vertical flex column, `padding: 22px 18px`, `gap: 28px`. Background `--surface-card` (`#F6F2EA`), `box-shadow: --shadow-clay-md`, sits above main (`z-index: 2`).
- **Main column** — `flex: 1`, vertical flex column. Contains the topbar (fixed height) and a scrolling content area.

**Page background:** `--surface-page` (`#ECE6DA`) plus two faint radial washes:
```css
background-image:
  radial-gradient(circle at 12% 8%, rgba(194,105,63,0.06), transparent 42%),
  radial-gradient(circle at 92% 96%, rgba(79,127,196,0.05), transparent 46%);
```

**Sidebar contents (top → bottom):**
1. **Brand row** (`display:flex; align-items:center; gap:11px; padding:4px 6px`):
   - Logo tile: `38×38px`, `border-radius:12px`, background = **accent** color (default terracotta `#C2693F`), `box-shadow: --shadow-clay-sm`. Inside: a white (`#FFF6EF`) "cast/pour" glyph — a downward arrow over a baseline (Lucide-style: vertical line, chevron-down, horizontal underline; stroke 2.2).
   - Wordmark "Cast": font `Fredoka` (display), `font-weight:600; font-size:21px`, color `--text-strong` (`#251F18`), `letter-spacing:-0.01em`, `margin-right:auto`.
   - Badge "beta": Kiln Badge, `variant="brand"` (terracotta-soft pill).
2. **Nav** (`display:flex; flex-direction:column; gap:3px`). Three items, each a full-width left-aligned button, `padding:11px 13px`, `border-radius:14px`, `font-family: Plus Jakarta Sans`, `font-size:15px`, icon (19px, Lucide) + label, `gap:12px`:
   - **Convert** (active): `font-weight:600`, background `--cast-accent-soft` (default terracotta-100 `#F4D6C7`), color `--brand-soft-fg` (`#864226`), `box-shadow: --shadow-clay-xs`. Icon: file with checkmark.
   - **History**: `font-weight:500`, transparent bg, color `--text-muted` (`#76654E`). Icon: clock-with-rewind-arrow. Hover: background `--clay-100`, color `--text-body`.
   - **Settings**: same idle style. Icon: gear.
   - (History & Settings are decorative in the prototype — wire them to real routes as needed.)
3. **User chip** (pushed to bottom via `margin-top:auto`): `display:flex; align-items:center; gap:11px; padding:10px; border-radius:14px; background:--clay-100`. Round 34px avatar (`background:--blue-500 #4F7FC4`, white initials "MO", Fredoka 600 14px), name "Mara Okafor" (13px, 600, `--text-strong`), sub "acme · pro" (11px, `--text-subtle #98856A`, monospace).

**Topbar** (`display:flex; align-items:flex-start; justify-content:space-between; gap:24px; padding:26px 34px 14px`):
- Left: `<h1>` "Convert to Markdown" (Fredoka 600, `27px`, `--text-strong`, `letter-spacing:-0.02em`); below it a `<p>` "Pour any document in. Cast clean, portable Markdown out." (`14px`, `--text-muted`, `margin-top:4px`).
- Right: Kiln Button `variant="secondary"` labeled "View Markdown" with a leading eye icon (16px). Opens a file picker for a local `.md`/`.markdown` file, then opens the preview modal with its contents.

**Content area** (`flex:1; overflow-y:auto; padding:14px 34px 40px`): a CSS grid, `grid-template-columns: minmax(0,1fr) 300px; gap:24px; align-items:start; max-width:1180px`. Left column = the **workspace Card**; right column = the **recent rail** (hidden when the `showRecent` option is off, in which case the right column collapses to `0px`).

---

### Workspace Card (left column)

A Kiln **Card** (`background:--surface-card`, `border-radius:--radius-lg` 22px, `box-shadow:--shadow-clay-md`, `padding:--space-6` 24px). Inner content is a vertical flex column, `gap:20px`. It shows **one** of four phase blocks, and the terminal block appears in the last two phases.

#### Phase 1 — Idle (default)
- **Drop zone**: clickable + drag-and-drop target. `border:2px dashed --border-strong (#C7B89F)`, `border-radius:--radius-lg`, `padding:52px 32px`, `text-align:center`, `background:--surface-sunken (#E0D7C6)`, `cursor:pointer`. Transition border-color/background/transform `220ms`. **Hover/drag-over:** `border-color:` accent, `background:--clay-50 (#F6F2EA)`, `transform:translateY(-2px)`.
  - Inside (centered column, `gap:14px`, `pointer-events:none`): a `62×62px` raised tile (`border-radius:18px`, `background:--surface-raised #FFF`, `box-shadow:--shadow-clay-sm`, icon color = accent) holding a 30px upload-cloud icon; then a heading "Drop a document to begin" (Fredoka 600, 18px, `--text-strong`) and sub "or click to browse your files" (14px, `--text-muted`).
- **Format chips** below the drop zone (`display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:18px`): six pills with text `PDF, DOCX, PPTX, HTML, TXT, Images`. Each: monospace, `font-size:11px; font-weight:500; letter-spacing:0.02em`, color `--text-muted`, `background:--clay-100`, `padding:4px 10px`, `border-radius:--radius-pill`.
- A hidden `<input type="file">` (accept `.pdf,.docx,.pptx,.html,.htm,.txt,.md,.markdown,.png,.jpg,.jpeg`) is triggered by clicking the drop zone.

#### Phase 2 — Staged (after a file is chosen)
Enter animation: `castIn` (fade + 10px rise, `220ms ease-out`).
- **File chip**: `display:flex; align-items:center; gap:14px; padding:16px 18px; border-radius:--radius-md; background:--surface-sunken; box-shadow:--shadow-clay-pressed` (inset/sunken look).
  - 46px accent tile (`border-radius:12px`, color `#FFF6EF`, `box-shadow:--shadow-clay-xs`) with a document icon.
  - File name (15px, 600, `--text-strong`, ellipsis-truncated) over meta line `"<EXT> · <size>"` (13px, `--text-subtle`, monospace, e.g. `PPTX · 240 KB`).
  - Remove button (right): 34px, transparent, `border-radius:10px`, `--text-subtle`. Hover: `background:--clay-200`, color `--coral-600 (#B14730)`. Icon: × (stroke 2.2). Resets to Idle.
- **Primary action**: full-width Kiln Button `variant="primary"` (block) "Cast to Markdown" with a leading cast/pour glyph. `margin-top:18px`.

#### Phase 3 — Processing
- **Status row** (`display:flex; align-items:center; gap:14px`): Kiln **Spinner** `size="sm"` (~22px) + a heading "Casting `<filename>`" (15px, 600, `--text-strong`) over a live hint line (13px, `--text-muted`) that updates per step ("Uploading document…", "Parsing document structure…", "Extracting text content…", "Reconstructing tables and images…", "Formatting Markdown…").
- **Stepper** (`display:flex; flex-wrap:wrap; gap:16px`): five steps — `Upload, Parse, Extract text, Tables & images, Format`. Each = a `9px` dot + label (13px, 500). Dot/label color by state:
  - done → dot `--green-500 (#4E9E57)`, label `--text-muted`
  - active → dot = accent, label `--text-strong`
  - pending → dot `--clay-700 (#574A39)`, label `#8A7B62`
- The **terminal block** (below) is visible.

#### Phase 4 — Done
Enter animation `castIn`. Vertical flex, `gap:20px`.
- **Success row**: 46px tile `background:--success (#4E9E57)`, white check icon (24px, stroke 2.4), `box-shadow:--shadow-clay-sm`; heading "Markdown is ready" (Fredoka 600, 18px) over the output filename (13px, `--text-muted`, monospace, e.g. `Q3-strategy-deck.md`).
- **Stat tiles** (`display:flex; gap:10px`): three equal tiles (`flex:1; padding:13px 14px; border-radius:--radius-md; background:--clay-100`). Each: big value (Fredoka 700, 20px, `--text-strong`, `line-height:1`) over a label (12px, `--text-subtle`, `margin-top:5px`). Values in prototype: `1,240 words`, `3 images`, `28 KB size`. (Wire these to real conversion output.)
- **Action row** (`display:flex; gap:10px; flex-wrap:wrap`):
  - **Download .md** — Kiln Button `variant="primary"` rendered as an `<a download>` pointing at the generated blob URL; leading download icon.
  - **Preview** — Kiln Button `variant="secondary"`, leading eye icon; opens the preview modal with the result Markdown.
  - **Convert another** — Kiln Button `variant="ghost"`; resets to Idle.
- The **terminal block** stays visible.

#### Terminal block (phases 3 & 4) — Kiln CodeBlock terminal style
- Container: `border-radius:--radius-lg; background:--clay-900 (#251F18); box-shadow:--shadow-clay-md; overflow:hidden`.
- **Title bar**: `display:flex; align-items:center; gap:10px; padding:11px 16px; background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.07)`. Three 11px "traffic light" dots — `#D15F45`, `#E0B33D`, `#4E9E57` — then a monospace label "conversion.log" (12px, `--clay-300 #CFC2AB`).
- **Log body**: `padding:14px 18px; max-height:200px; overflow-y:auto`, monospace `12.5px`, `line-height:1.65`. Auto-scrolls to bottom on each new line. Custom scrollbar: 9px, thumb `rgba(255,255,255,0.14)` rounded.
- **Each log line** (`display:flex; gap:10px; align-items:baseline; padding:1px 0`): timestamp (`#8A7B62`, e.g. `16:21:19`), a 7px status dot, then the message (`#ECE6DA`, wraps). Dot color by level: INFO `#6A9BDC`, OK `#6BB86F`, WARN `#ECC359`, ERROR `#E07B62`.
- While processing, a blinking caret follows the last line: 8px × 14px block, `background:--terracotta-300 (#DE9070)`, `animation: castBlink 1s steps(1) infinite`.

---

### Recent rail (right column, optional)
Two stacked Kiln Cards (`pad="sm"` → `padding:--space-4` 16px), `gap:16px`.
1. **Recent** card: header (clock-rewind icon 16px `--text-muted` + "Recent" in Fredoka 600 15px). Then a list of entries, each a clickable row (`display:flex; align-items:center; gap:11px; padding:10px 8px; border-radius:12px`; hover `background:--clay-100`). Row = a 30px tinted document tile (tints cycle `--blue-500`, `--green-500`, `--yellow-500`) + name (13px, 500, `--text-body`, ellipsis) over relative time (11px, `--text-subtle`, monospace). Prototype entries: `Q3-strategy-deck.pptx · 2 hours ago`, `onboarding-guide.docx · yesterday`, `research-paper.pdf · Mon`. Clicking opens the preview modal with that doc's Markdown.
2. **Tip** card: a lightbulb icon (18px, accent) + paragraph (13px, `line-height:1.55`, `--text-muted`): "Tables, headings, and code blocks are preserved. Images are extracted with generated alt text."

---

### Markdown preview modal
- **Scrim**: `position:fixed; inset:0; z-index:1000; background:rgba(37,31,24,0.42); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:32px; animation:castScrim 130ms ease-out`. Clicking the scrim (outside the panel) closes it. `Escape` also closes.
- **Panel**: `width:100%; max-width:780px; max-height:86vh; display:flex; flex-direction:column; background:--surface-card; border-radius:--radius-xl (30px); box-shadow:--shadow-clay-xl; overflow:hidden; animation:castPop 220ms --ease-clay` (pop = scale 0.96→1.01→1 with the clay overshoot easing).
  - **Header** (`display:flex; align-items:center; gap:14px; padding:18px 24px; border-bottom:1px solid --border-soft`): document icon (18px, `--text-muted`) + filename (monospace 14px, `--text-strong`, ellipsis, `margin-right:auto`) + close button (34px, `background:--clay-100`, `border-radius:10px`, `--text-muted`; hover `background:--clay-200`, color `--coral-600`; × icon).
  - **Body** (`padding:28px 32px; overflow-y:auto; flex:1`): rendered Markdown HTML. Use a Markdown renderer (the original app already loads `marked`). Typography rules below.

**Rendered-Markdown typography** (scoped to the modal body, `font-family: Plus Jakarta Sans`, `color:--text-body`, `line-height:1.7`, `font-size:15px`):
- `h1/h2/h3/h4`: Fredoka, `--text-strong`, `font-weight:600`, `line-height:1.25`, `margin:1.6em 0 0.5em`, `letter-spacing:-0.01em`. Sizes: h1 `1.7rem`; h2 `1.32rem` with `border-bottom:1px solid --border-soft` + `padding-bottom:0.3em`; h3 `1.1rem`. First child `margin-top:0`.
- `p`: `margin:0 0 1em`.
- `a`: color `--text-link (#A8552F)`, no underline, `border-bottom:1px solid --terracotta-200 (#E9B49B)`; hover border `--terracotta-500`.
- `ul/ol`: `margin:0 0 1em; padding-left:1.4em`; `li` `margin-bottom:0.4em`.
- `blockquote`: `margin:1em 0; padding:0.5em 1.1em; background:--clay-100; border-left:3px solid --brand; border-radius:0 --radius-sm --radius-sm 0; color:--text-muted`.
- inline `code`: JetBrains Mono, `0.86em`, `background:--clay-200`, color `--clay-800`, `padding:0.12em 0.4em`, `border-radius:--radius-xs`.
- `pre`: `background:--clay-900; border-radius:--radius-md; padding:16px 18px; overflow-x:auto; margin:0 0 1.2em; box-shadow:--shadow-clay-sm`. `pre code`: transparent bg, color `#ECE6DA`, `0.84em`, `line-height:1.6`.
- `table`: `width:100%; border-collapse:collapse; margin:0 0 1.2em; font-size:0.92em`. `th/td`: `border:1px solid --border-soft; padding:8px 12px; text-align:left`. `th`: `background:--clay-100; font-weight:600; --text-strong`.
- `hr`: `border-top:1px solid --border-soft; margin:1.8em 0`.

---

## Interactions & behavior
- **Drag & drop:** `dragover`/`dragleave`/`drop` on the drop zone, all `preventDefault()`. On drop, take `dataTransfer.files[0]` → stage it. Clicking the drop zone opens the hidden file input.
- **Stage a file:** record name, size, and uppercased extension; switch to the Staged phase; clear any prior logs and revoke any prior download blob URL.
- **Remove / Convert another:** clear timers, revoke the blob URL, return to Idle.
- **Cast (start conversion):** switch to Processing, clear logs, then advance through the scripted timeline (below). In the real app, replace the scripted timeline with the actual `POST /api/convert` request and the `/api/logs` SSE stream (the original `app.js` already implements this — keep that wiring and just render the log lines / steps / terminal in the new styling).
- **On completion:** build the output `.md`, create an object URL for the download anchor, set the success stats, switch to Done. (In the real app the server returns the file; read the filename from `content-disposition` as the original code does.)
- **View Markdown (topbar):** open a `.md` picker, read as text, open the modal with the rendered result.
- **Preview / Recent click:** open the modal with the relevant Markdown.
- **Modal close:** close button, scrim click, or `Escape`.

### Animations
- `castIn` — `opacity 0→1` + `translateY(10px→0)`, `220ms ease-out`. Used on Staged and Done blocks.
- `castPop` — `scale 0.96→1.01→1`, `opacity 0→1`, `220ms` with `--ease-clay` (`cubic-bezier(.34,1.56,.64,1)`). Modal panel entrance.
- `castScrim` — `opacity 0→1`, `130ms ease-out`. Modal scrim.
- `castBlink` — `opacity` 1/0 toggle, `1s steps(1) infinite`. Processing caret.
- Button press = squish (`translateY(1px) scale(0.96–0.98)`, shadow collapses to `--shadow-clay-pressed`); hover = lift (`translateY(-1px…-3px)`, deeper shadow). These come from the Kiln Button styles — replicate them.

### Prototype conversion timeline (replace with real backend in production)
Delays below are at `normal` speed; the prototype multiplies them by `1.7` (calm) or `0.5` (quick). Each step pushes log lines and advances the stepper:
- 0ms — INFO "Uploading `<name>`"; step → Upload (active)
- 600ms — OK "Upload complete · `<size>`"; step → Parse; INFO "Parsing document structure"
- 1250ms — INFO "Detected 4 headings, 2 tables, 3 images"; step → Extract text; INFO "Extracting text content"
- 1950ms — OK "Extracted 1,240 words across 6 sections"; step → Tables & images; INFO "Mapping tables to Markdown grids"
- 2650ms — WARN "2 images missing alt text — generating descriptions"; step → Format; INFO "Normalizing headings and lists"
- 3400ms — OK "Conversion complete → `<name>.md`"; finish → Done

## State management
State variables needed (names from the prototype):
- `phase`: `"idle" | "staged" | "processing" | "done"` — drives which block renders.
- `fileName`, `fileSize` (bytes), `fileExt` (uppercased).
- `logs`: array of `{ time, level, msg, dot }` — appended as conversion progresses; render newest at bottom and auto-scroll.
- `steps`: array of `{ label, dotColor, textColor }` — recomputed as the active step advances.
- `phaseHint`: current status sub-line during processing.
- `downloadUrl` (object URL) + `outName` (output filename) — set on completion; **revoke the URL** on reset/unmount.
- `modalOpen`, `modalTitle`, `previewMd` — preview modal.
- Refs/handles to: the file input, the `.md` input, the rendered-Markdown container (set its `innerHTML` from the renderer), and the terminal scroll container.
- Timers for the scripted timeline must be cleared on reset/unmount (not needed once wired to the real SSE stream).

**Configurable options exposed in the prototype** (treat as build-time/theme choices, not necessarily user settings):
- `accent`: `terracotta | blue | green` — recolors the logo tile, active nav, drop-zone hover border, drop-zone icon, staged tile, and active stepper dot. Implemented via a CSS custom property `--cast-accent` (+ `--cast-accent-soft`) set on the root; all accent spots read `var(--cast-accent, #C2693F)`. Color/soft pairs: terracotta `#C2693F`/`#F4D6C7`, blue `#4F7FC4`/`#DBE7F6`, green `#4E9E57`/`#DCEFDD`.
- `speed`: timeline multiplier (prototype only).
- `showRecent`: show/hide the right rail (collapses the grid's right column to `0px`).

---

## Design tokens (Kiln)
All values are hard-codeable; or port `tokens/*.css` from the Kiln system.

**Colors — clay neutrals**
| Token | Hex |
|---|---|
| `--clay-50` | `#F6F2EA` |
| `--clay-100` | `#ECE6DA` |
| `--clay-200` | `#E0D7C6` |
| `--clay-300` | `#CFC2AB` |
| `--clay-400` | `#B7A488` |
| `--clay-500` | `#98856A` |
| `--clay-600` | `#76654E` |
| `--clay-700` | `#574A39` |
| `--clay-800` | `#3B3228` |
| `--clay-900` | `#251F18` |

**Colors — terracotta (brand)**
`--terracotta-100 #F4D6C7`, `-200 #E9B49B`, `-300 #DE9070`, `-500 #C2693F` (**brand**), `-600 #A8552F`, `-700 #864226`.

**Colors — accents / semantic**
`--blue-500 #4F7FC4`, `--green-500 #4E9E57` (success), `--yellow-500 #E0B33D` (warning), `--coral-500 #D15F45` / `--coral-600 #B14730` (danger), `--pink-500 #E194A8`.

**Semantic aliases**
`--surface-page #ECE6DA`, `--surface-card #F6F2EA`, `--surface-sunken #E0D7C6`, `--surface-raised #FFFFFF`; `--text-strong #251F18`, `--text-body #3B3228`, `--text-muted #76654E`, `--text-subtle #98856A`, `--text-on-brand #FFF6EF`, `--text-link #A8552F`; `--brand #C2693F`, `--brand-soft #F4D6C7`, `--brand-soft-fg #864226`; `--border-soft #DDD3C2`, `--border-strong #C7B89F`.

**Radii**
`--radius-xs 8px`, `--radius-sm 12px`, `--radius-md 16px`, `--radius-lg 22px`, `--radius-xl 30px`, `--radius-pill 999px`.

**Shadows (the signature "clay" look — drop shadow + inner top highlight)**
```css
--shadow-clay-xs: 0 1px 2px rgba(55,42,28,.12), inset 0 1px 0 rgba(255,255,255,.45);
--shadow-clay-sm: 0 3px 6px -1px rgba(55,42,28,.16), inset 0 1.5px 0 rgba(255,255,255,.5);
--shadow-clay-md: 0 8px 18px -5px rgba(55,42,28,.22), inset 0 2px 2px rgba(255,255,255,.45);
--shadow-clay-lg: 0 18px 38px -10px rgba(55,42,28,.28), inset 0 2px 3px rgba(255,255,255,.5);
--shadow-clay-xl: 0 30px 64px -16px rgba(55,42,28,.34), inset 0 3px 4px rgba(255,255,255,.5);
--shadow-clay-pressed: inset 0 3px 6px rgba(55,42,28,.26), inset 0 1px 0 rgba(255,255,255,.12);
--shadow-brand: 0 10px 22px -6px rgba(168,85,47,.45), inset 0 2px 2px rgba(255,255,255,.32);
```

**Spacing scale** (used: 4xs→): `--space-1 4px`, `--space-2 8px`, `--space-3 12px`, `--space-4 16px`, `--space-5 20px`, `--space-6 24px`, `--space-8 32px` (Kiln scale; verify against `tokens/spacing.css`).

**Motion**
`--ease-clay cubic-bezier(.34,1.56,.64,1)`, `--ease-out cubic-bezier(.16,1,.3,1)`; `--dur-fast 130ms`, `--dur-base 220ms`, `--dur-slow 360ms`.

**Typography**
- Display: **Fredoka** (headings, brand, numbers/stats) — tight tracking `-0.01em…-0.02em` on headings.
- Body/UI: **Plus Jakarta Sans**.
- Mono: **JetBrains Mono** (timestamps, filenames, code, chips, log lines).
- All three are Google Fonts. Sentence case everywhere. No emoji.

## Assets
- **Icons:** Lucide (https://lucide.dev). Icons used: upload-cloud, file/file-text, file-check, clock-rewind (history), settings (gear), eye, download, x (close), check, lightbulb, cast/pour glyph (custom: vertical line + chevron-down + underline). In the prototype these are inline SVGs; in the real app load Lucide from CDN or your icon set. Stroke ~2 (2.2–2.4 for small/check glyphs).
- **Logo:** no Cast logo exists — the brand mark is a clay tile (accent background) + the cast glyph, with "Cast" set in Fredoka. Replace with a real mark if available. The Kiln system's own `assets/logo-mark.svg` / `logo-wordmark.svg` are for "Kiln", not "Cast".
- **Fonts:** Fredoka, Plus Jakarta Sans, JetBrains Mono (Google Fonts).
- No raster imagery is used.

## Files
- `Cast.dc.html` — the design prototype (all four phases + modal + recent rail). Open it to see every state and interaction live. It uses the Kiln component bundle for `Button`, `Card`, `Badge`, `Spinner`; everything else is inline-styled with the tokens above.
- Original app for reference (in the `toMarkdown` source folder, not bundled here): `public/index.html`, `public/style.css`, `public/app.js` (frontend), `src/server.ts` (`/api/convert`, `/api/logs` SSE), `src/converter.ts`. **Recreate the Cast design in `public/` and keep the existing `src/` backend.**

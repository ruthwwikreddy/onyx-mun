# ONYX MUN Website

Official website for ONYX MUN.

This is a static HTML/CSS/JS project (no framework build pipeline).  
Primary goals:
- Showcase the conference brand and committees
- Collect delegate/OC/EB/priority applications
- Handle UPI payment instructions in form flows
- Provide policy and allocation information

---

## Tech Stack

- **HTML**: page templates and content
- **CSS**:
  - `assets/onyx.css` (core design system + layout + responsive)
  - `assets/onyx-hifi.css` (visual polish layer)
  - `assets/onyx-forms.css` (form experience + wizard UI)
- **JavaScript**:
  - `assets/onyx.js` (navigation, interactions, reveal animations, hero behavior)
  - `assets/onyx-upi.js` (UPI link + QR generation for payment panels)
- **Supabase JS CDN** on form pages for submissions

No npm, no bundler, no transpilation required.

---

## Project Structure

```text
/onyx
  index.html                  # Homepage
  committees.html             # Committee overview cards
  allocations.html            # Allocation lookup/list view
  policy.html                 # Code of conduct + delegate policy

  round-1.html                # Delegate application (wizard)
  oc-application.html         # Organising Committee application (wizard)
  eb-application.html         # EB application
  priority-round.html         # Priority round application

  admin.html                  # Admin dashboard (Supabase-backed)
  404.html

  /committees
    disec.html
    ccc.html
    unhrc.html
    uncsw.html
    loksabha.html
    press.html
    illuminati.html
    hcc.html                  # Placeholder/new file

  /embed
    promo.html                # Remotion promo iframe (390×780, scene query param)

  /assets
    onyx.css
    onyx-hifi.css
    onyx-forms.css
    onyx-embed.css            # Promo embed styles
    onyx-embed.js             # Promo scene + postMessage API
    onyx.js
    onyx-upi.js
    ...images...

  aether.png                  # The Aether Organisation logo
```

---

## Promo embed (marketing / Remotion)

Fixed **390×780** iframe for Gathrly video promos. Not indexed (`robots.txt` blocks `/embed/`).

Base URL: `https://onyxmunhyd.in/embed/promo?scene=<scene>`

Scenes: `landing`, `checkout`, `checkout-processing`, `success`, `dashboard`

Optional: `amount=2840`, `currency=INR`, `theme=dark`, `chrome=1`

Parent can drive scenes via `postMessage({ type: 'gathrly-promo', scene: 'checkout' })`.

---

## Current Content and Branding Notes

- Main partnership section on homepage: **ONYX × Resolve**
- Social section: **THROWDOWN**, tied to **The Aether Organisation**
- Event dates currently set to: **12–14 June 2026**
- Footer credits are intentionally not shown on form pages (as requested)

---

## Styling System

### 1) Core system (`assets/onyx.css`)

Defines:
- Design tokens (`:root`): colors, typography, radii, spacing, shadows
- Global reset + layout utilities (`.onyx-wrap`, section rhythm)
- Header/nav system (`.onyx-header`, `.onyx-nav`, mobile menu)
- Hero layout and overlays (`.ox-hero*`)
- Reusable surfaces/cards (`.ox-surface`, partner cards, committee cards, venue, team)
- Footer system (`.ox-footer*`)
- Responsive behavior (`@media max-width: 960px` and `520px`)

Key conventions:
- Gold accents for action/brand emphasis
- Serif display font (`Cormorant Garamond`) for headings and identity
- Sans UI font (`Outfit`) for interaction and body copy
- Utility-like semantic section classes (`.ox-section`, `.ox-section--divider`, `.ox-section--tight`)

### 2) Hi-fi polish layer (`assets/onyx-hifi.css`)

Enhances visuals without changing structural semantics:
- Ambient orbs and section index numerals (`data-num`)
- Hero shine and panel effects
- Marquee styling
- Surface gloss/highlight interactions
- Additional committee/venue/partner polish

### 3) Form UI layer (`assets/onyx-forms.css`)

Used by application pages:
- Sticky form headers and mobile-first step indicators
- Multi-step wizard styles (`.form-step`, `.onyx-progress`, `.onyx-form-footer`)
- Payment card and UPI components
- Field validation visuals and success states

---

## JavaScript Behavior

### `assets/onyx.js`

Main frontend behaviors:
- Sticky/scrolled header states
- Scroll progress bar
- Hero background parallax transform
- Mobile menu open/close and escape handling
- Smooth scrolling for anchor links
- FAQ accordion interactions
- Reveal-on-scroll animation via `IntersectionObserver`
- Scroll-to-top button
- Loader hide transition
- Automatic active section highlight in nav (`.is-active`)

### `assets/onyx-upi.js`

UPI utility for payment cards:
- Builds `upi://pay` links
- Generates QR image URLs (via qrserver)
- Populates panel elements marked with `data-upi-*`
- Reusable panel initialization (`window.ONYX_UPI`)

---

## Forms and Data Flow

Form pages:
- `round-1.html` (delegate)
- `oc-application.html`
- `eb-application.html`
- `priority-round.html`

Submission model:
- Supabase client initialized in-page using CDN
- Payload assembled from form fields
- Inserted into corresponding tables (`delegate_applications`, `oc_applications`, `eb_applications`, etc.)

Payment flow:
- UPI cards use `data-upi-panel` attributes
- `assets/onyx-upi.js` fills QR/link/UPI ID automatically

---

## SEO + Structured Data

Homepage (`index.html`) includes:
- Meta title/description/OG tags
- FAQ schema
- Organization schema
- Event schema (currently June 12–14, 2026)
- Breadcrumb schema

If dates change, update both visible copy and JSON-LD schema together.

---

## Navigation and Section IDs

Homepage nav anchors map to section IDs:
- `#partnership`
- `#social-night`
- `#about`
- `#committees`
- `#venue`
- `#secretariat`
- `#faq`

If sections are renamed/reordered, keep IDs and nav links in sync.

---

## Editing Guidelines

1. **Preserve layer intent**
- Structural changes in `onyx.css`
- Visual-only enhancements in `onyx-hifi.css`
- Form-only work in `onyx-forms.css`

2. **Keep accessibility intact**
- Keep `aria-label`, `aria-hidden`, meaningful `alt`
- Maintain visible focus styles (`:focus-visible`)

3. **Respect responsive breakpoints**
- Test at desktop, tablet, and narrow mobile widths
- Ensure nav/menu and hero copy remain readable

4. **Do not hardcode duplicate logic**
- Reuse existing classes/components before introducing new variants

---

## Local Usage

Since this is static:
- Open `index.html` directly in browser, or
- Serve with any static server for cleaner routing and asset behavior

Example (Python):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

---

## Known Operational Notes

- Some pages use external CDNs (Google Fonts, Supabase, QR generation)
- UPI/transaction handling is client-side UI + DB insert; no backend validation in this repo
- `committees/hcc.html` currently appears to be a minimal/placeholder page

---

## Suggested Next Improvements

- Add a shared partial strategy (or templating) to avoid repeated header/footer edits across many pages
- Add image optimization/lazy strategy for committee and hero assets
- Add basic automated link checks and HTML validation in CI
- Move Supabase keys/config to safer environment-driven loading strategy where possible

---

For content or style updates, start with `index.html` + the matching CSS layer and keep cross-page consistency with existing class patterns.

---

## Credits

- **Founded by** [Ruthwik Reddy](https://www.ruthwikreddy.live/) — conference web platform & technology
- **Powered by** [Gathrly](https://www.gathrly.in/) — registration, UPI payments, and admin dashboard


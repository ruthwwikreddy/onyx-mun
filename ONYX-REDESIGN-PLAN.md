# ONYX Frontend Redesign Plan

## Objective
Redesign ONYX frontend pages to feel modern, clean, and significantly improved across mobile and desktop while preserving the existing ONYX brand language (black/gold premium aesthetic), routes, SEO structure, and existing backend/business logic.

---

## 1) Codebase Understanding (Step 1 audit)

### Current page structure
- `index.html`: Main landing page with hero, partnership block, mission/about cards, committees preview, venue, secretariat, FAQ, and CTA footer.
- `round-1.html`: Multi-step delegate application flow (with UPI QR payment step and Supabase submission).
- `priority-round.html`: Priority application form (currently closed via frontend flag), includes committee+portfolio selection and UPI QR payment.
- `oc-application.html`: OC application form with UPI QR payment and Supabase submission.
- `eb-application.html`: EB application form and Supabase submission (no payment UI).
- `committees.html`: Committee listing hub page.
- `committees/*.html`: Individual committee detail pages (`disec`, `unhrc`, `loksabha`, `press`, `hcc`, `uncsw`) with similar layout.
- `allocations.html`: Searchable allocations display by committee.
- `policy.html`: Delegate policy and code of conduct content page.
- `admin.html`: Internal admin dashboard UI for EB/delegate/priority/OC submissions.
- `delegate-application.html`: Redirect page to `round-1`.
- `social-round1-post.html`, `social-venue-post.html`: social export utilities (PNG generator pages).

### Shared patterns/partials (implicit, not componentized)
- Repeated visual language across pages:
  - same color tokens (`--onyx`, `--surface`, `--gold`, white, glass borders)
  - noise overlays + glassmorphism cards + rounded pill buttons
  - Playfair Display + Inter / Plus Jakarta Sans typography
  - fixed/sticky nav variants and prominent hero-first sections
- Most pages are standalone HTML with embedded CSS/JS (no centralized shared partials/components yet).

### Navigation/layout patterns
- Landing page has primary navigation with section anchors and mobile menu.
- Form pages use dedicated focused layouts (hero + single-form container).
- Committee pages use fixed top nav + content/sidebar layout.
- Some pages intentionally remove nav for "focus mode" (noted in comments).
- Mixed URL styles (`/round-1`, `round-1.html`, and redirects/clean URLs).

### Current responsive behavior
- Responsive rules are mostly embedded per file with breakpoints around:
  - `1024px`, `900px`, `768px`, `640px`, `480px`, and some narrow-edge handling.
- Mobile behavior exists but is inconsistent between pages (spacing, typography scale, nav treatment, and CTA density vary page-to-page).

### QR/payment-related UI locations
- `round-1.html`: UPI QR image, UPI ID copy button, transaction ID required, fee shown.
- `priority-round.html`: UPI QR image, UPI ID text, transaction ID required, fee shown.
- `oc-application.html`: UPI QR image, UPI ID text, transaction ID required, fee shown.
- `admin.html`: Displays fee + UPI transaction fields for priority/OC/delegate tabs.
- Scope note: Current flow is already UPI QR-based in frontend; redesign will retain and improve this UX only.

---

## 2) Proposed Redesign Checklist (grouped by page/file)

## `index.html`
- [ ] Redesign information architecture for clearer scan order: hero -> quick actions -> committees -> venue -> trust/contact -> FAQ.
- [ ] Rebuild nav/header behavior for consistency (desktop + mobile menu state, clearer CTA hierarchy).
- [ ] Replace excessive inline styles with cleaner reusable utility/class structure in-page.
- [ ] Modernize section spacing, card rhythm, and typography scale for better readability.
- [ ] Improve committee cards and links (visual consistency + fix obvious route typo references where needed without breaking routes).
- [ ] Improve CTA/footer hierarchy and reduce visual clutter while preserving existing destinations.
- [ ] Improve accessibility (focus states, contrast consistency, reduced motion guardrails, semantic heading flow).
- [ ] Keep all SEO-critical meta/schema/canonical structure intact.

## `committees.html`
- [ ] Modernize committee grid cards (more consistent hierarchy, improved readability, stronger mobile stacking).
- [ ] Normalize committee naming/copy presentation and card CTA affordances.
- [ ] Improve nav and "Apply" action prominence with better responsive behavior.

## `committees/disec.html`
- [ ] Redesign content layout to improve readability (hero + agenda + framework + sidebar alignment).
- [ ] Upgrade typography/spacing for long-form reading on mobile.
- [ ] Improve sticky/stack behavior for sidebar on tablet/mobile.

## `committees/unhrc.html`
- [ ] Apply same upgraded layout system and spacing standards as above.

## `committees/loksabha.html`
- [ ] Apply same upgraded layout system and spacing standards as above.

## `committees/press.html`
- [ ] Apply same upgraded layout system and spacing standards as above.

## `committees/hcc.html`
- [ ] Apply same upgraded layout system and spacing standards as above.

## `committees/uncsw.html`
- [ ] Apply same upgraded layout system and spacing standards as above.

## `round-1.html`
- [ ] Refine multi-step UX (clearer progress, stronger field grouping, cleaner spacing, better validation messaging visibility).
- [ ] Modernize payment step UI while preserving UPI QR-only flow and submission payload fields.
- [ ] Improve sticky footer actions and mobile ergonomics (thumb reach, button clarity, field density).
- [ ] Improve accessibility labels/help text consistency and error presentation.
- [ ] Preserve existing Supabase payload schema and non-breaking form behavior.

## `priority-round.html`
- [ ] Redesign form section hierarchy and field grouping (especially preference blocks) for clearer completion flow.
- [ ] Improve committee/portfolio selection UX for mobile.
- [ ] Refresh UPI payment panel design (UPI QR-only retained).
- [ ] Preserve current closed/open flag behavior and existing payload keys.

## `oc-application.html`
- [ ] Refresh form layout and readability with consistent ONYX design system.
- [ ] Modernize payment panel and transaction input treatment (UPI QR-only retained).
- [ ] Preserve existing submission behavior and payload keys.

## `eb-application.html`
- [ ] Visual redesign for consistency with improved form usability and mobile spacing.
- [ ] Keep existing submission behavior and schema unchanged.

## `allocations.html`
- [ ] Redesign search + committee chips + card density for cleaner browsing on mobile and desktop.
- [ ] Improve navigation between sections and empty/no-result state clarity.
- [ ] Preserve current data rendering/search/filter behavior.

## `policy.html`
- [ ] Redesign reading experience (better section hierarchy, spacing, typography, and anchorability if needed).
- [ ] Keep policy text intact unless formatting-only improvements are required.

## `admin.html` (frontend-only visual pass, no data logic changes)
- [ ] Improve layout consistency, spacing, and controls readability.
- [ ] Clean up tab, filter, and card visual hierarchy for faster admin scanning.
- [ ] Preserve all existing admin actions and Supabase operations.

## `social-round1-post.html` and `social-venue-post.html`
- [ ] Optional light visual polish for consistency with refreshed brand system (no workflow changes).
- [ ] Keep export flow and prompt-copy behavior unchanged.

## `delegate-application.html`
- [ ] Keep redirect behavior unchanged.
- [ ] Optional minimal copy/markup cleanup only if needed.

---

## 3) Practical suggestions (improvements)
- Introduce a lightweight shared design-token layer (consistent spacing, typography scale, button/input variants) inside existing files to reduce style drift.
- Standardize responsive breakpoints and component behavior so nav/forms/cards behave predictably across pages.
- Reduce inline style sprawl where practical to improve maintainability and future edits.
- Add consistent keyboard/focus treatment and ensure interactive controls meet target size on touch devices.
- Optimize perceived performance: reduce heavy motion where unnecessary, keep loaders brief, and improve first-content readability.
- Keep canonical/meta/schema as-is unless correcting obvious mismatches.
- Fix obvious frontend inconsistencies (naming typos, inconsistent labels) without changing backend contracts.

---

## 4) Will Change / Won't Change

### Will change
- Frontend HTML/CSS/JS structure and presentation patterns.
- Visual hierarchy, content blocks, spacing, responsive behavior, and accessibility polish.
- UPI QR payment panel UI design and UX clarity (not payment method).
- Non-breaking route/link consistency fixes if clearly needed.

### Won't change
- No QR-based check-in features.
- No payment gateway integrations.
- No replacement of UPI QR payment flow.
- No backend/business logic rewrites or schema changes (except minimal non-breaking frontend dependency adjustments if required).
- No route architecture rewrites that break current links.

---

## 5) QR/Payment Scope Mapping (UPI QR-only)

### Identified payment UIs
- `round-1.html` (delegate fee + UPI QR + transaction ID)
- `priority-round.html` (priority fee + UPI QR + transaction ID)
- `oc-application.html` (OC fee + UPI QR + transaction ID)
- `admin.html` (display/management of transaction IDs and fee fields)

### Planned update approach
- Keep all payment interactions strictly UPI QR-based.
- Improve payment panel clarity:
  - clearer amount/payee/UPI ID presentation
  - clearer "scan/pay/enter transaction ID" sequence
  - stronger transaction input helper text and validation messaging
- Preserve payload fields and Supabase table interactions exactly as currently expected.

---

## 6) Risk / Impact Notes (major changes)
- **Global visual system alignment (`index.html` + key forms + committee pages)**  
  Risk: medium.  
  Impact: high UX gain; needs careful cross-page consistency checks.

- **Navigation and responsive behavior standardization**  
  Risk: medium.  
  Impact: high; can affect discoverability and link behavior, so route/link validation required.

- **Form UX redesign for `round-1`, `priority-round`, `oc-application`, `eb-application`**  
  Risk: medium-high.  
  Impact: very high; must preserve submission payloads, required fields, and user flow.

- **Payment panel UX cleanup (UPI QR-only)**  
  Risk: low-medium.  
  Impact: high conversion/readability benefit; must not alter payment method/scope.

- **Admin UI visual cleanup (`admin.html`)**  
  Risk: medium.  
  Impact: medium-high; must avoid breaking JS selectors and action handlers.

- **SEO-sensitive page refresh (`index.html`, `committees*`, `policy.html`)**  
  Risk: low-medium.  
  Impact: high visibility value; preserve meta/schema/canonical structures.

---

## 7) Final Approval Checklist

- [ ] I approve this redesign plan and scope.
- [ ] Proceed with implementation across approved files.
- [ ] Keep UPI QR-only payment flow exactly within stated scope.
- [ ] Do not add QR check-in or payment gateway integrations.
- [ ] Preserve backend/business logic except minimal non-breaking frontend dependencies.


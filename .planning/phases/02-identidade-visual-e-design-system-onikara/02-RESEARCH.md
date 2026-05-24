# Phase 2: Identidade Visual e Design System Onikara - Research

**Researched:** 2026-05-24
**Domain:** Vanilla HTML/CSS design system, brand kit, accessibility validation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `.planning/sketches/onikara-logotipo.png` is the official Onikara logo and the canonical visual source.
- Logo usage should be institutional first: header, login, internal documents, loading, restricted screens and authority states.
- Palette: black, crimson and old gold. Graphite is supporting only, not dominant.
- Typography: brand serif for mark/special headings plus operational sans for dense UI.
- Admin, player and master must be visually distinct but unified by Onikara brand tokens.
- Portal is common; shells are separate: `/admin`, `/play`, future `/master`.
- Admin is a premium minimal panel, not a generic SaaS or cinematic command center.
- Player is a registered hunter HUD.
- Master is present in Phase 2 as a full visual mode: operational narrator console plus tactical director.
- Master sees campaign player sheets read-only and is never platform admin.
- Tokens are two-level: base visual tokens plus semantic aliases.
- Required components: button, input, select, modal, tabs, table, badge, toast, stat bar and command/action toolbar.
- Delivery: Markdown docs, CSS tokens/components and static HTML preview.
- Accessibility must include contrast, visible focus, labels, touch targets, keyboard navigation, reduced motion and documented manual tests.

### the agent's Discretion
- Final CSS token names.
- Final operational sans and brand-adjacent serif if the logo font is unavailable.
- Exact HTML preview structure, as long as admin/player/master are separate and validable.

### Deferred Ideas (OUT OF SCOPE)
- Real master campaign permissions.
- Complete campaign tools, scene/mob/space editing and campaign effects on player sheets.
- Expanded ritual asset kit beyond the minimum official kit.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Brand rules and asset usage | Planning docs/static assets | Browser/Client | Phase defines the visual contract before product UI implementation. |
| CSS tokens | Browser/Client | Planning docs | Vanilla CSS custom properties are the source of truth for future HTML/CSS/JS UI. |
| Component preview | Browser/Client | Planning docs | A static HTML preview is sufficient for current stack and avoids Storybook scope. |
| Accessibility checks | Browser/Client | Planning docs | Keyboard, focus, contrast and motion behavior are validated in the preview. |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 2 should use a document-first, preview-backed design system. Because the stack is HTML/CSS/JS without a UI framework, the standard approach is to define CSS custom properties for tokens, layered component classes for reusable controls, and a static preview page that demonstrates states and mode-specific compositions.

The official logo gives a strong foundation: institutional black, crimson threat/authority and old gold prestige. The design system should protect the logo as a seal, not use it as decoration. The preview should prove three separate modes: admin premium minimal, player hunter HUD and master campaign command.

Accessibility should target WCAG 2.2 AA-compatible practices where applicable. W3C lists WCAG 2.2 as a W3C Recommendation published on 2023-10-05, including new focus and target-size guidance. MDN documents `prefers-reduced-motion` as the CSS media feature for honoring reduced motion preferences.

**Primary recommendation:** Create `BRAND.md`, `tokens.css`, `components.css`, `preview.html` and `ACCESSIBILITY-REVIEW.md` under `.planning/design-system/`, with the official logo copied into `.planning/design-system/assets/`.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| HTML5 | platform | Static preview and semantic component examples | Matches current stack and requires no build system. |
| CSS custom properties | platform | Base and semantic design tokens | Native, portable, easy to reuse in future UI. |
| Vanilla CSS | platform | Component classes and responsive layouts | Current project convention; no framework dependency. |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| CSS media queries | Responsive layout and reduced motion | Required for mobile-first preview and `prefers-reduced-motion`. |
| Markdown | Brand and accessibility docs | Human-readable and GSD-friendly. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static preview | Storybook | Better component catalog, but too much scope for current stack. |
| CSS custom properties | JSON design tokens | JSON is useful later; CSS is directly executable now. |
| Local font files | Web font imports | Avoid external dependency; choose system fallbacks first. |

**Installation:** No new dependencies required.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```text
.planning/design-system/
  BRAND.md                 # Brand rules, logo usage, palette, typography
  tokens.css               # Base and semantic CSS custom properties
  components.css           # Component class definitions using semantic tokens
  preview.html             # Static admin/player/master preview
  ACCESSIBILITY-REVIEW.md  # Manual audit checklist and findings
  assets/
    README.md              # Asset kit rules and inventory
    onikara-logotipo.png   # Official logo copy
```

### Pattern 1: Two-Level Tokens
**What:** Define raw color/space/type values as base tokens and mode/domain aliases as semantic tokens.
**When to use:** Any component styling.
**Example:**
```css
:root {
  --oni-black-950: #050505;
  --oni-crimson-700: #8b1118;
  --oni-gold-500: #b19052;

  --color-surface-page: var(--oni-black-950);
  --color-action-danger: var(--oni-crimson-700);
  --color-rarity-legendary: var(--oni-gold-500);
}
```

### Pattern 2: Mode Skins via Container Attribute
**What:** Use a wrapper attribute/class to shift mode intensity while keeping component APIs stable.
**When to use:** Admin/player/master preview sections.
**Example:**
```html
<section class="mode-shell" data-mode="master">
  <button class="ok-button ok-button--primary">Open scene</button>
</section>
```

### Pattern 3: State Matrix in Preview
**What:** Every base component preview shows normal, hover/focus where possible, loading, disabled, error and success examples.
**When to use:** Component validation.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component documentation app | Custom Storybook clone | Static `preview.html` | Keeps Phase 2 scoped and executable. |
| Dynamic accessibility tooling | Custom JS auditor | Manual review doc plus semantic HTML/CSS checks | Better fit for static preview and no dependencies. |
| Font identification engine | Guess exact logo font | Document brand-adjacent serif and fallbacks | Logo font may be custom/generated. |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Logo Overuse
**What goes wrong:** The logo becomes decoration everywhere and loses authority.
**How to avoid:** Treat logo as institutional seal with documented placement and clear-space rules.

### Pitfall 2: One Palette for Every Mode
**What goes wrong:** Admin, player and master become visually indistinguishable.
**How to avoid:** Keep common base tokens but add mode semantics for density, intensity and focus.

### Pitfall 3: Dark UI with Weak Contrast
**What goes wrong:** Crimson/gold on black can fail readability when used for body text or focus states.
**How to avoid:** Use high-contrast text tokens and reserve crimson/gold for accents, alerts, hierarchy and rarity.

### Pitfall 4: Preview Without Interaction States
**What goes wrong:** Components look polished but fail in real forms/tables.
**How to avoid:** Preview disabled, focus, loading, success, error and empty states for each relevant component.
</common_pitfalls>

<sota_updates>
## State of the Art (2024-2026)

| Area | Current Guidance | Impact |
|------|------------------|--------|
| Accessibility baseline | WCAG 2.2 is the current W3C Recommendation; use AA-compatible contrast, target size and keyboard expectations. | Phase 2 should document and manually test accessibility, not only state intent. |
| Motion preferences | `prefers-reduced-motion` is the CSS media feature for reduced motion. | Component CSS should include reduced-motion overrides. |
| Design tokens | CSS custom properties remain the simplest native token system for framework-free apps. | Avoid build-time token pipelines until a framework/build step exists. |
</sota_updates>

<open_questions>
## Open Questions

1. **Exact brand serif**
   - What we know: the official wordmark is serifed, spaced and premium.
   - What's unclear: the exact font may be custom/generated.
   - Recommendation: choose a close serif fallback and document that it is brand-adjacent, not the logo source font.

2. **Asset derivation method**
   - What we know: the official logo exists as PNG.
   - What's unclear: whether source vector exists.
   - Recommendation: produce docs and practical copies now; avoid pretending a perfect vector extraction exists unless manually supplied later.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `.planning/phases/02-identidade-visual-e-design-system-onikara/02-CONTEXT.md` - Locked product and visual decisions.
- `.planning/sketches/onikara-logotipo.png` - Official logo.
- W3C WAI, "What's New in WCAG 2.2" - WCAG 2.2 Recommendation date and focus/target updates: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- MDN, `prefers-reduced-motion` CSS media feature: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

### Secondary (MEDIUM confidence)
- `.planning/sketches/MANIFEST.md`, sketch READMEs and `.planning/STORYTELLING.md` - Product-specific visual direction.

### Tertiary (LOW confidence)
- None.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: HTML/CSS design system without framework.
- Patterns: CSS custom property tokens, static preview, mode skins, accessibility doc.
- Pitfalls: logo overuse, dark contrast, mode collapse, missing interaction states.

**Confidence breakdown:**
- Standard stack: HIGH - project already uses framework-free HTML/CSS/JS.
- Architecture: HIGH - static design system docs are sufficient for planning artifacts.
- Accessibility: HIGH - based on W3C/MDN guidance and roadmap constraints.

**Research date:** 2026-05-24
**Valid until:** 2026-06-24
</metadata>

---

*Phase: 02-identidade-visual-e-design-system-onikara*
*Research completed: 2026-05-24*
*Ready for planning: yes*

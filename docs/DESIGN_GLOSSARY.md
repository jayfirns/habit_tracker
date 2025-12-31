## Audit: `.js-category` Dependencies (read-only, no changes applied)

- **JavaScript**
  - backend/frontend/ui/habitsView.js:61 – `querySelector(".js-category").textContent = habit.category || "Uncategorized";` clones habit template nodes and writes category label into the `.js-category` element; write access to `textContent` plus DOM selection via `querySelector`.
- **HTML / Templates**
  - backend/frontend/index.html:456 – `<p class="eyebrow js-category"></p>` inside `#habit-template`; defines the category eyebrow element rendered per habit card; displayed content populated by JS.
- **CSS**
  - No CSS rules, animations, or selectors target `.js-category`.
- **Tests**
  - No test fixtures, snapshots, or assertions reference `.js-category`.

## Glossary Legend

- **Eyebrow**: Uppercase accent label (11px, letter-spacing 0.08em, color `--accent2`), sits above headings for context.
- **Pill**: Rounded metadata chip (6px × 10px padding, radius 12px, 1px border `--border`); filled by default, muted variant via `.pill.subtle`.
- **Badge**: Highlighted numeric/status element (e.g., `.streak`, `.badge__value`); heavier weight, often gradient or larger size to draw focus.
- **H1 / H2 / H3**: Heading levels using display/body font (base.css); h1 > h2 (~24px default) > h3 (~20px) for hierarchy, 6px vertical margins.
- **Ghost Button**: Transparent/outlined button (`.button.ghost`); 1px border `--border`, inherits text color, no shadow; `.small` uses 8px × 12px padding and 13px font.
- **Subtle**: Muted treatment (color `--muted` or color-mix reductions) for secondary/meta info; applies to text, pills (`.pill.subtle`), and labels.

# UI Design Glossary (New Habit & Habit Board)

- **Detailed Panel Documentation**: For comprehensive design objectives and enhancement matrices of individual UI panels (e.g., Energy Mix Panel, Milestone Dashboard Panel), refer to the dedicated files in the `docs/panels/` directory, indexed by [UI_PANELS_DOCUMENTATION.md](UI_PANELS_DOCUMENTATION.md).

| Element Name | Description | Text Example | Panel | Style Controlled By | Conforms? | Fix Recommendation |
|--------------|-------------|--------------|-------|---------------------|-----------|---------------------|
| PanelShell | Panel container; background `--panel` (#111f33 default theme), 1px border `--border` (#23344e), radius `--radius` 16px, padding 18/18/14, shadow `--shadow` (0 18px 40px rgba(0,0,0,0.35)) | — | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css → `.panel` (vars from themes.css) | ✅ | — |
| PanelHeader | Flex row aligning title/status; 12px gap, 8px bottom margin | — | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css → `.panel__header` | ✅ | — |
| PanelEyebrow | Accent eyebrow; 11px, uppercase, 0.08em tracking, color `--accent2` (#3cc9d6 default), 4px bottom margin | Create | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css → `.eyebrow`; vars from themes.css | ✅ | — |
| PanelTitle | Main heading; h2 inherits browser default 1.5em (~24px at 16px root), 6px vertical margin, display font family | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | New Habit | base.css headings (no explicit size) | ⚠️ Browser default size (not set in CSS); scales with root font. | — |
| StatusText | Muted status; 13px, color `--muted` (#a6b7d4 default) | Ready | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css → `.status` | ✅ | — |
| FormGrid | Responsive form grid; repeat auto-fit minmax(220px,1fr), 12px gap, align-items start | — | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | base.css → `.form` plus components.css alignment | ✅ | — |
| CategoryLabel | Field label; 13px, color `--muted`, normal weight | Category | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css global `label` | ✅ | — |
| CategoryInput | Text input; 11px×12px padding, radius `--radius-sm` 12px, 1px border `--border` (#23344e), bg color-mix of `--bg1`/`--bg0`, focus outline 2px `--accent` (#ff7a6e default) + `--focus-ring` | Focus, Health, Growth | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css `input`/`:focus` | ✅ | — |
| NameLabel | Same as CategoryLabel | Name | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css global `label` | ✅ | — |
| NameInput | Same as CategoryInput | Daily write, Walk, Meditate | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css `input` | ✅ | — |
| TagsLabel | Same as CategoryLabel | Tags (comma-separated) | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css global `label` | ✅ | — |
| TagsInput | Same as CategoryInput | focus, health, deep-work | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css `input` | ✅ | — |
| PrimaryCTAButton | Full-width CTA; bg `--accent` (#ff7a6e default), text `--bg0` (#0f1b2c), padding 12px×16px, radius 12px, weight 700, shadow `--shadow-strong` (0 22px 60px rgba(0,0,0,0.38)), hover lift | Add Habit | [New Habit](UI_PANELS_DOCUMENTATION.md#newhabitpanel) | components.css → `.button` + `.full`; vars from themes.css | ✅ | — |
| PanelShell | Same panel container as reference (theme vars apply) | — | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.panel` (vars from themes.css) | ✅ | — |
| PanelHeader | Flex header; 12px gap, 8px bottom margin | — | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.panel__header` | ✅ | — |
| PanelEyebrow | Accent eyebrow; 11px, uppercase, 0.08em tracking, color `--accent2` | Track | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.eyebrow`; vars from themes.css | ✅ | — |
| PanelTitle | Section title; h2 browser default 1.5em (~24px at 16px), 6px margin | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | Habit Board | base.css headings (no explicit size) | ⚠️ Browser default size (not set in CSS). | — |
| ActiveTagPill | Subtle pill; padding 6×10, radius 12px, border #23344e, weight 600, color `--muted`, background color-mix on `--pill` | Filter: #focus | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.pill` + `.subtle` | ✅ | — |
| RefreshButton | Header ghost button; lacks `.button` class, so inherits browser padding; `.panel__header .ghost` sets bg `--pill`, 1px border `--border`, text `--text` | Refresh | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.panel__header .ghost`; no `.button` styles applied | ❌ Styled as filled pill with default padding, not transparent ghost/small. | Add `.button` class or adjust styling separately. |
| CategoryHeading | Category header; `.category-title` sets 18px font-size, margin 8/0/0; inherits h2 display font | Wellness | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.category-title` | ⚠️ Size explicitly 18px (not 24px); close to card title size. | Reduce further or restyle to avoid competing with card titles. |
| HabitCard | Card shell; padding 14px, radius 16px, border #23344e, bg color-mix on `--panel`/`--bg1`, gap 10px, shadow `--shadow` | — | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.habit-card` | ✅ | — |
| HabitCardHeader | Top row flex clickable toggle; gap 8px, cursor pointer | — | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.habit-card__top` | ✅ | — |
| HabitCategoryEyebrow | Accent eyebrow inside card; 11px uppercase, color `--accent2` | Wellness | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.eyebrow` | ✅ | Presence duplicates category; consider removal. |
| HabitNameTitle | Card title; h3 browser default 1.17em (~18.7px at 16px), 6px margin, display font | TV off by Midnight | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | base.css headings (no explicit size) | ⚠️ Browser default size; near `.category-title` size. | — |
| HabitLastMeta | Muted meta line; color `--muted`, inherits ~16px size | Last: 2024-05-01 | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | base.css `.meta` | ✅ | — |
| StreakBadge | Gradient badge; 54×54, radius 12px, font-size 18px, weight 800, gradient background (accent2→accent), color `--bg0` | 12 | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.streak` | ✅ | — |
| ChevronIcon | Muted caret; font-size 18px, color `--muted`, rotates when collapsed | ▾ | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.chevron` | ✅ | — |
| CompletionStatsPill | Solid pill; padding 6×10, weight 600, border #23344e, bg `--pill`, color `--text` | 8 completions | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.pill` | ✅ | — |
| HabitIdPill | Subtle pill; muted text, border #23344e, weight 600, bg color-mix on `--pill` | ID 3 | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.pill.subtle` | ✅ | Hide for end-users or demote to 12px meta text. |
| TagChip | Tag pill; weight 600 (inherits `.pill`), padding 6×10, border #23344e; clickable to filter | #focus | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.pill` | ✅ | — |
| EmptyTagChip | Subtle pill; muted text, padding 6×10, border #23344e | No tags | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.pill.subtle` | ✅ | — |
| CompletionDateField | Inline label + date input; label 13px muted (global `label`), input uses global input styling; inside `.complete-inline` grid (auto-fit minmax 140px, gap 8px, align end) | Date | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css `label`/`input`; base.css `.complete-inline` | ✅ | — |
| MarkDoneButton | Small primary button; bg `--accent`, text `--bg0`, padding 8×12, font-size 13px, weight 700 | Mark done | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.button.small` | ✅ | — |
| CompletionNoteField | Inline label + text input; global input styling | Optional completion note | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css `label`, `input` | ✅ | — |
| FocusTimeText | Meta text with bold inline value; color `--muted`, inherits ~16px; `<strong>` uses default bold | Focus time: 0m today | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | base.css `.meta` | ✅ | — |
| TimerToggleButton | Ghost small button; transparent bg, 1px border `--border`, padding 8×12, font-size 13px | Start timer | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.button.ghost.small` | ✅ | — |
| TimerIndicatorPill | Subtle pill indicator; base pill padding 6×10, plus `.timer-indicator` inline-flex, gap 6, padding-inline 10, radius 12; muted text until running | Timer off | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.pill.subtle` + `.timer-indicator` | ✅ | — |
| AdjustTimeButton | Ghost small button; transparent bg, 1px border, padding 8×12, font-size 13px | Adjust | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.button.ghost.small` | ✅ | — |
| EditButton | Ghost small button; transparent bg, 1px border | Edit | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.button.ghost.small` | ✅ | — |
| DeleteButton | Ghost small button; transparent bg, 1px border; same treatment as neutral | Delete | [Habit Board](UI_PANELS_DOCUMENTATION.md#habitboardpanel) | components.css → `.button.ghost.small` | ✅ | Style to destructive state (accent outline/red text) to differentiate. |

## Validation Notes

- Missing definitions
  - `small` sizing does not apply to `Refresh` because the button lacks the `.button` class; only `.button.small` defines the 8×12 padding and 13px font.
- Conflicting definitions
  - Root tokens (`--accent`, `--accent2`, `--shadow`, `--focus-ring`, `--radius`, etc.) are defined in `base.css` and overridden in `themes.css` (themes.css wins because it loads last). Default theme values: `--accent` #ff7a6e, `--accent2` #3cc9d6, `--shadow` 0 18px 40px rgba(0,0,0,0.35), `--shadow-strong` 0 22px 60px rgba(0,0,0,0.38), `--radius` 16px, `--radius-sm` 12px.
  - `--focus-ring` differs between `base.css` (accent 60%) and `themes.css` (accent 55%) for the default theme.
- Style variables needing clarification or hardcoding
  - Heading sizes (h1/h2/h3) rely on browser defaults; consider setting explicit font sizes in CSS to lock hierarchy.
  - Theme tokens vary per `data-theme` (`cyberpunk`, `enterprise`, `terminal`) altering radii, shadows, and colors; if the glossary should point to fixed values, specify the intended theme or hardcode per-panel tokens.
  - Border and surface tokens used throughout: `--panel` #111f33, `--border` #23344e, `--pill` #1e2d44, `--muted` #a6b7d4, `--text` #e6edf7, `--bg0` #0f1b2c, `--bg1` #17253c (default theme).

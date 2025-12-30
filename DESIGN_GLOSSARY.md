## Glossary Legend

- **Eyebrow**: Uppercase accent label (11px, letter-spacing 0.08em, color `--accent2`), sits above headings for context.
- **Pill**: Rounded metadata chip (6px × 10px padding, radius 12px, 1px border `--border`); filled by default, muted variant via `.pill.subtle`.
- **Badge**: Highlighted numeric/status element (e.g., `.streak`, `.badge__value`); heavier weight, often gradient or larger size to draw focus.
- **H1 / H2 / H3**: Heading levels using display/body font (base.css); h1 > h2 (~24px default) > h3 (~20px) for hierarchy, 6px vertical margins.
- **Ghost Button**: Transparent/outlined button (`.button.ghost`); 1px border `--border`, inherits text color, no shadow; `.small` uses 8px × 12px padding and 13px font.
- **Subtle**: Muted treatment (color `--muted` or color-mix reductions) for secondary/meta info; applies to text, pills (`.pill.subtle`), and labels.

# UI Design Glossary (New Habit & Habit Board)

| Element Name | Description | Text Example | Panel | Style Controlled By | Conforms? | Fix Recommendation |
|--------------|-------------|--------------|-------|---------------------|-----------|---------------------|
| PanelShell | Panel container; dark panel #111f33, 1px border #23344e, radius 16px, padding 18/18/14, shadow | — | New Habit | components.css → `.panel` | Yes | — |
| PanelHeader | Flex row aligning title/status; 12px gap, 8px bottom margin | — | New Habit | components.css → `.panel__header` | Yes | — |
| PanelEyebrow | Accent eyebrow; 11px, uppercase, 0.08em tracking, color #36c2cf, 4px bottom margin | Create | New Habit | components.css → `.eyebrow` | Yes | — |
| PanelTitle | Main heading; h2 ~24px, body font, 6px vertical margin | New Habit | New Habit | base.css headings | Yes | — |
| StatusText | Muted status; 13px, color #a6b7d4, right-aligned in header | Ready | New Habit | components.css → `.status` | Yes | — |
| FormGrid | Responsive form grid; min 220px columns, 12px gap | — | New Habit | base.css → `.form` | Yes | — |
| CategoryLabel | Field label; 13px, color #a6b7d4, normal weight | Category | New Habit | components.css global `label` | Yes | — |
| CategoryInput | Text input; 11px×12px padding, radius 12px, 1px border #23344e, dark fill, accent outline on focus | Focus, Health, Growth | New Habit | components.css `input` | Yes | — |
| NameLabel | Same as CategoryLabel | Name | New Habit | components.css global `label` | Yes | — |
| NameInput | Same as CategoryInput | Daily write, Walk, Meditate | New Habit | components.css `input` | Yes | — |
| TagsLabel | Same as CategoryLabel | Tags (comma-separated) | New Habit | components.css global `label` | Yes | — |
| TagsInput | Same as CategoryInput | focus, health, deep-work | New Habit | components.css `input` | Yes | — |
| PrimaryCTAButton | Full-width CTA; accent #ff6f61, dark text, 12px×16px padding, radius 12px, weight 700, strong shadow, slight hover lift | Add Habit | New Habit | components.css → `.button.full` | Yes | — |
| PanelShell | Same panel container as reference | — | Habit Board | components.css → `.panel` | Yes | — |
| PanelHeader | Flex header; 12px gap, 8px bottom margin | — | Habit Board | components.css → `.panel__header` | Yes | — |
| PanelEyebrow | Accent eyebrow; 11px, uppercase, color #36c2cf | Track | Habit Board | components.css → `.eyebrow` | Yes | — |
| PanelTitle | Section title; h2 ~24px | Habit Board | Habit Board | base.css headings | Yes | — |
| ActiveTagPill | Subtle pill; padding 6×10, radius 12px, border #23344e, muted text | Filter: #focus | Habit Board | components.css → `.pill.subtle` | Yes | — |
| RefreshButton | Ghost small button; transparent bg, 1px border #23344e, 8×12 padding, 13px font | Refresh | Habit Board | components.css → `.button.ghost.small` | Yes | — |
| CategoryHeading | Category header above grid; h2 default (~24px) with `.category-title` 18px override | Wellness | Habit Board | base.css headings + components.css `.category-title` | No | Reduce prominence (16–18px max) or convert to pill/tag to avoid competing with panel title/card names. |
| HabitCard | Card shell; padding 14px, radius 16px, border #23344e, dark mix bg, 10px gaps, shadow | — | Habit Board | components.css → `.habit-card` | Yes | — |
| HabitCardHeader | Top row flex clickable toggle; gap 8px | — | Habit Board | components.css → `.habit-card__top` | Yes | — |
| HabitCategoryEyebrow | Accent eyebrow inside card; 11px uppercase accent2 | Wellness | Habit Board | components.css → `.eyebrow` | No | Remove or demote to muted 12px meta; category already shown in section header. |
| HabitNameTitle | Card title; h3 ~20px, body font, 6px margin | TV off by Midnight | Habit Board | base.css headings | Yes | — |
| HabitLastMeta | Muted meta line; default 16px, color #a6b7d4 | Last: 2024-05-01 | Habit Board | base.css `.meta` | Yes | — |
| StreakBadge | Gradient badge; 54px square, radius 12px, 18px weight 800, accent2→accent gradient | 12 | Habit Board | components.css → `.streak` | Yes | — |
| ChevronIcon | Muted caret; 18px, color #a6b7d4, rotates on collapse | ▾ | Habit Board | components.css → `.chevron` | Yes | — |
| CompletionStatsPill | Solid pill; padding 6×10, weight 600, border #23344e | 8 completions | Habit Board | components.css → `.pill` | Yes | — |
| HabitIdPill | Subtle pill; muted text, border #23344e, weight 600 | ID 3 | Habit Board | components.css → `.pill.subtle` | No | Hide for end-users or restyle as 12px muted text to reduce noise. |
| TagChip | Tag pill; weight 700, padding 6×10, border #23344e; clickable to filter | #focus | Habit Board | components.css → `.pill` | Yes | — |
| EmptyTagChip | Subtle pill; muted text indicating absence | No tags | Habit Board | components.css → `.pill.subtle` | Yes | — |
| CompletionDateField | Inline label + date input; label 13px muted, input styled globally, within responsive inline grid | Date | Habit Board | components.css `label`, `input`; base.css `.complete-inline` | Yes | — |
| MarkDoneButton | Small primary button; accent bg, 8×12 padding, weight 700 | Mark done | Habit Board | components.css → `.button.small` | Yes | — |
| CompletionNoteField | Inline label + text input; global input styling | Optional completion note | Habit Board | components.css `label`, `input` | Yes | — |
| FocusTimeText | Meta text with bold inline value; color #a6b7d4 | Focus time: 0m today | Habit Board | base.css `.meta` | Yes | — |
| TimerToggleButton | Ghost small button; transparent bg, 1px border | Start timer | Habit Board | components.css → `.button.ghost.small` | Yes | — |
| TimerIndicatorPill | Subtle pill indicator; muted text, padding 6×10; hidden until shown | Timer off | Habit Board | components.css → `.pill.subtle.timer-indicator` | Yes | — |
| AdjustTimeButton | Ghost small button; transparent bg, 1px border | Adjust | Habit Board | components.css → `.button.ghost.small` | Yes | — |
| EditButton | Ghost small button; neutral action | Edit | Habit Board | components.css → `.button.ghost.small` | Yes | — |
| DeleteButton | Ghost small button; visually same as neutral actions | Delete | Habit Board | components.css → `.button.ghost.small` | No | Apply destructive styling (accent outline or red text) to differentiate. |

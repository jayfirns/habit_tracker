# Frontend guide

Layering to keep files small and testable:

- Pure helpers: `time-utils.js`, `date-utils.js`, `storage.js`.
- Services: `api.js` (fetch wrapper).
- UI modules: `ui/habitsView.js`, `ui/dashboardView.js`.
- Orchestrator: `app.js` wires state, services, and UI callbacks.

Local tooling for consistency:

- `npm install` in `backend/frontend/` to pull dev deps.
- `npm run lint` for ESLint (browser ES modules with import rules).
- `npm run format` to check Prettier; `npm run format:write` to apply.

Coding notes:

- Keep DOM-only code in `ui/`, data shaping in helpers/services.
- Prefer passing callbacks/state into renderers instead of importing globals.
- Avoid non-ASCII in code unless already present.

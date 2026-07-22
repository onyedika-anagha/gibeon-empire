---
description: Auto-generate slugs and codes in the backend — never expose them as user inputs
globs: **/*.{ts,js,tsx,jsx,py,go,php,rb,java,cs}
alwaysApply: true
---

# Auto-Generate Slug & Code — Never Ask the User

## Core Rule

**Slugs and codes must always be generated automatically on the backend.**
Never render an input, field, or UI element that allows a user to view, type, or edit a slug or code.

---

## Backend — Generation Rules

### Slug Generation

- Derive slugs from a human-readable field (e.g. `name`, `title`) using a slugify utility.
- Append a short unique suffix (nanoid / cuid / uuid fragment) to guarantee uniqueness.
- Regenerate the suffix on collision — never ask the user to resolve it.
- Slugs are **immutable after creation** unless explicitly re-derived server-side.

## Frontend — UI Rules

- **No `<input>`, `<textarea>`, or editable field** for slug or code — ever.
- Slug/code may be displayed as read-only text (e.g. in a detail view or copy-to-clipboard chip), but never inside a form control.
- Remove slug/code from all form state, validation schemas (Zod/Yup/Joi), and form submission payloads.

## Anti-Patterns — Never Do These

| ❌ Anti-pattern                       | ✅ Correct approach                           |
| ------------------------------------- | --------------------------------------------- |
| `<input name="slug" />` in any form   | Generate slug server-side from `name`/`title` |
| Accepting `slug` in create/update DTO | Strip it before saving                        |
| Letting users "customize" their slug  | Auto-derive + unique suffix                   |
| Showing an editable code field        | Display code as read-only text only           |
| Generating slug/code in the frontend  | Always generate in the backend service        |

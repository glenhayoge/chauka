# Chauka Design System

Based on Uncodixfy principles. Think Linear, GitHub, Stripe — functional, not decorative.

## Color Palette

| Role | Token | Usage |
|------|-------|-------|
| Background | `bg-white` | Page backgrounds, form containers |
| Surface | `bg-gray-50` | Disabled inputs, subtle differentiation |
| Border | `border-gray-200` | Card borders, section dividers |
| Border hover | `border-gray-300` | Input borders, interactive borders |
| Text primary | `text-gray-900` | Headings, names, primary content |
| Text secondary | `text-gray-600` | Labels, descriptions |
| Text muted | `text-gray-500` | Helper text, secondary links |
| Text disabled | `text-gray-400` | Placeholders, timestamps, disabled |
| Button primary | `bg-gray-900 hover:bg-gray-800` | Primary actions |
| Button text | `text-white` | On primary buttons |
| Link | `text-gray-700 hover:text-gray-900` | Navigation links (not blue) |
| Focus ring | `ring-gray-400 border-gray-400` | Input focus states |
| Status: ok | `text-ok` / `#16a34a` | On track, success |
| Status: warning | `text-warning` / `#f59e0b` | Caution, attention |
| Status: danger | `text-danger` / `#dc2626` | Off track, errors, delete |
| Header | `bg-gray-900` | App header bar |

## Typography

- Body: 14px (`text-sm`) — default for all content
- Labels: 14px (`text-sm text-gray-600`) — form labels, no font-medium
- Headings: 14px medium (`text-sm font-medium text-gray-900`) — page/section titles
- Small: 12px (`text-xs text-gray-400`) — timestamps, hints, meta

No `text-2xl`, no `font-bold` on page headings. No uppercase labels.

## Spacing

- Form gaps: `space-y-3` (12px)
- Section gaps: `mb-8` or border-top separator
- Input padding: `px-3 py-2`
- Button padding: `px-4 py-1.5` (compact) or `py-2` (full-width)

## Components

### Inputs
```
border border-gray-300 rounded-md px-3 py-2 text-sm
focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400
```

### Buttons (primary)
```
bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800
disabled:opacity-50 transition-colors
```

### Buttons (secondary)
```
border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50
```

### Cards
```
border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors
```
No shadow. No border-color change on hover. Max radius 8px (rounded-lg).

### Links
```
text-gray-700 hover:text-gray-900
```
Not blue. Not underlined by default.

### Sections
Separated by `border-t border-gray-200 pt-6` — no cards, no headings.

### Error/success messages
Inline next to the action button, not in separate colored blocks.
- Error: `text-sm text-red-600`
- Success: `text-sm text-gray-500`

## What NOT to do

- No `shadow-md`, `shadow-lg`, or `shadow-sm` on cards/containers
- No `bg-blue-600` buttons (use `bg-gray-900`)
- No `focus:border-blue-500` (use `focus:ring-gray-400`)
- No `text-blue-600` links (use `text-gray-700`)
- No `rounded-lg` on inputs (use `rounded-md`)
- No `text-2xl font-bold` page headings
- No uppercase section labels
- No decorative copy ("Create your account", "Enter your details below")
- No centered text on forms
- No floating cards with shadows
- No `bg-gray-50` page backgrounds (use `bg-white`)

---
name: extract-page-json
description: >-
  Extract page composer JSON from any React page component in the MLflow codebase.
  Use whenever the user wants to convert a page to page-composer format, extract
  page JSON, load a page into the composer, create a composer layout from existing
  code, capture a page's structure as importable JSON, or prototype a page layout.
  Triggers on: "page composer", "composer JSON", "extract JSON for", "load into
  composer", "Puck JSON", "page layout JSON", or any request involving translating
  a React page into the drag-and-drop page composer format.
---

# Extract Page Composer JSON

Converts a React page component into a Puck-format JSON file that can be imported
into the MLflow Page Composer (`/#/page-composer` > Import JSON).

The page composer uses the Puck editor and has a fixed component library. Your job
is to read a real page's source, understand its visual structure, and express that
structure using the composer's available components with representative sample data.

## Step 1 — Load the component catalog

Read `mlflow/server/js/src/page-composer/schema-reference.json`. This is the
authoritative list of every component the composer supports, its props, and its
slot definitions. Do not invent components that aren't in this file.

## Step 2 — Read the target page

Read the React component the user identifies. Follow imports into sub-components
that contribute visible content sections (tables, version rails, form sections,
etc.). You're mapping the **visual output**, not the code structure, so focus on:

- The top-to-bottom visual hierarchy (header, subtitle, filters, content, footer)
- Layout primitives (flex rows/columns, CSS grid, two-panel splits)
- Design system components (`Typography`, `Table`, `Button`, `Tag`, `Breadcrumb`, …)
- Slot patterns (buttons inside a header, items inside a list, inputs inside form fields)
- Empty / loading / error states (pick the happy-path populated state)

## Step 3 — Map to composer components

Translate each visual section to the closest composer component. Common mappings:

| Page code                              | Composer component                                    |
|----------------------------------------|-------------------------------------------------------|
| `Typography.Title`                     | `DuBoisTypography` variant `"title"`, set `level`     |
| `Typography.Paragraph`                 | `DuBoisTypography` variant `"paragraph"`              |
| `Typography.Text`                      | `DuBoisTypography` variant `"text"`                   |
| `Button`                               | `DuBoisButton`                                        |
| `Table` with column definitions        | `DuBoisTable` with `columns` array                    |
| `Breadcrumb` / `Breadcrumb.Item`       | `DuBoisBreadcrumb` (inside `DuBoisHeader` breadcrumbs)|
| `Tag`                                  | `DuBoisTag` — match `color` to actual usage           |
| `Pagination`                           | `DuBoisPagination`                                    |
| `Input`                                | `DuBoisInput`                                         |
| `Empty`                                | `DuBoisEmpty`                                         |
| `Modal`                                | `DuBoisModal`                                         |
| `DropdownMenu` (with trigger button)   | `OverflowMenu` with empty `items` (see Pitfalls)      |
| `Tooltip`                              | `DuBoisTooltip`                                       |
| Icon + bold text header pattern        | `IconLabel`                                           |
| CSS grid of label–value pairs          | `KeyValueGrid` (string-only values)                   |
| `<pre>` / monospace code blocks        | `CodeBlock`                                           |
| Horizontal flex `div`                  | `FlexRow`                                             |
| Vertical flex `div`                    | `FlexColumn`                                          |
| Two-panel master–detail layout         | `ListDetailLayout`                                    |
| Selectable list rows                   | `ListItem`                                            |
| Page header (breadcrumb + title + btns)| `DuBoisHeader` with slot props                        |
| `<hr>` / border dividers              | `Divider`                                             |
| Spacing between sections               | `DuBoisSpacer` (`xs` / `sm` / `md` / `lg`)           |
| `Card`                                 | `DuBoisCard`                                          |
| Tabbed content                         | `DuBoisTabs`                                          |
| Labeled form field with hint/error     | `DuBoisFormField` with `input` slot                   |
| Two-column grid layout                 | `TwoColumns` with `left` / `right` slots              |
| `FormUI.Label` / `FormUI.Hint` / etc.  | Props on `DuBoisFormField` or inline `DuBoisTypography`|

When the page uses something with no direct composer equivalent, approximate it
with the closest available component and fill in representative sample data.

## Step 4 — Build the JSON

Produce a valid Puck `Data` object:

```json
{
  "root": { "props": {} },
  "content": [
    {
      "type": "ComponentName",
      "props": {
        "id": "unique-id",
        "...other props..."
      }
    }
  ]
}
```

Rules:

- **`id` is required** — every component needs a unique `props.id` string.
- **Slots are arrays** — props like `content`, `left`, `right`, `buttons`,
  `breadcrumbs`, `titleAddOns`, `list`, `detail`, `input` hold arrays of
  nested `{ type, props }` objects.
- **Use exact type names** from the schema reference (e.g. `DuBoisButton`,
  not `Button`).
- **Populate with realistic data** — use sample values that reflect what the
  real page shows (table column names, tag labels, breadcrumb text, metadata
  key-value pairs). The JSON should look like a plausible populated state of
  the page.
- **Add spacing** — use `DuBoisSpacer` between sections to match the page's
  visual rhythm. `xs` for tight gaps, `sm` for small, `md` for standard
  section breaks, `lg` for major divisions.
- **Match button variants** — primary, tertiary, link, danger all have
  corresponding props on `DuBoisButton`.

## Step 5 — Save and report

Save the JSON to a `.json` file. Default location is next to the page component
file unless the user specifies otherwise. Use a descriptive name based on the
page (e.g. `skills.json`, `experiment-detail.json`, `model-list.json`).

Tell the user:
- Where the file was saved
- How to import it: open the Page Composer at `/#/page-composer`, click
  **Import JSON**, and paste the contents or upload the file
- A brief summary of what sections are represented

## Tips

- When a page has conditional sections (e.g. tags only shown when present),
  include them in the JSON with sample data — the composer shows the
  populated view.
- For tables, set `rows` to a representative count (3–5) and list all column
  headers.
- For master–detail layouts, populate both the list and detail sides with
  sample items.
- Modals and drawers that appear on user action can be included as separate
  top-level content items if the user wants to capture them, but skip them
  by default — they're secondary to the page's main layout.

## Pitfalls

These are things that look wrong in the composer if you're not careful:

- **Dropdown / overflow menus render items inline.** `OverflowMenu` and
  `DuBoisDropdownMenu` display their menu items directly on the canvas
  (the composer can't hide them behind a click). To show just the kebab
  trigger icon without the items, use `OverflowMenu` with an empty
  `"items": []`. This renders the dot-menu icon cleanly without inline
  menu items cluttering the layout.
- **`KeyValueGrid` is string-only.** The real page may render tags, code
  blocks, or links inside metadata value cells, but the composer's
  `KeyValueGrid` only accepts plain text strings. Flatten rich values to
  readable text (e.g. `"champion → v3, latest → v3"` for alias tags,
  the URL string for links). This is a known fidelity limitation of the
  composer — don't try to decompose into `Columns` rows as a workaround,
  since `Columns` only supports equal-width columns with no split ratio.
- **`Columns` is equal-width only.** The component is registered as
  `Columns` (not `TwoColumns` or `ThreeColumns`) with `col1`–`col6` slots
  and a `count` prop. All columns are `1fr` — there is no split-ratio
  option.
- **Danger buttons need explicit `type`.** When a button is destructive
  (like "Delete version"), set both `"danger": true` **and** `"type": "primary"`
  so it renders with the correct filled-danger style. Leaving `type` as `""`
  (default) produces a muted outline that doesn't match the real page.

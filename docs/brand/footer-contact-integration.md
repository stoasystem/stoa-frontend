# Footer Contact Integration

## Source

- Company homepage reference: `/Users/zhdeng/newweb`
- Access mode: read-only
- Source status observed before Phase 119: `img/team/.DS_Store` was already modified before this work and was not touched.

## Integrated Information

The learning platform footer now uses the stable brand contact details observed in the main website footer and contact page:

- Email: `info@stoaedu.ch`
- Phone: `+41 78 332 37 96`
- Locations: `Zürich · Schindellegi (SZ) · Würenlos (AG)`
- Main website link: `https://stoaedu.ch`

These values are centralized in `src/lib/brandContact.ts` and rendered through `AppFooter`, `FooterContactInfo`, and `FooterLegalLinks`.

## Adaptation Rules

- The learning platform keeps a compact product footer rather than copying the homepage footer layout.
- Company facts are reused as factual information; homepage components are not copied.
- Labels are localized in `common.json` for English, German, French, and Italian.
- Legal links point to platform routes: `/privacy`, `/terms`, and `/contact`.

## QA Notes

- Footer avoids development, demo, mock, or placeholder wording.
- Address and contact links are accessible through semantic `address`, `mailto`, and `tel` markup.
- The footer includes a language switcher so localized footer labels can be verified directly.

# Performance Sanity Check

## Build Command

```text
npm run build
```

Result:

```text
✓ built
```

## Bundle Snapshot

Latest build output:

| Asset | Size | Gzip |
| --- | ---: | ---: |
| `dist/index.html` | 0.89 kB | 0.37 kB |
| `dist/assets/index-Dh9pm7l3.css` | 61.28 kB | 10.93 kB |
| `vendor-router-state` | 41.72 kB | 15.17 kB |
| `vendor-http` | 42.33 kB | 16.60 kB |
| `vendor-i18n` | 49.21 kB | 16.10 kB |
| `vendor-ui` | 110.48 kB | 29.81 kB |
| `vendor` | 117.59 kB | 33.91 kB |
| `vendor-react` | 194.29 kB | 60.69 kB |
| app entry | 314.45 kB | 78.74 kB |

## Assessment

- Contact form and footer integration did not add a heavy dependency.
- Logo implementation is CSS/markup based and does not add image payload.
- Locale additions are modest and loaded through the existing i18n resource setup.
- Current app entry remains acceptable for a Vite SPA at this stage.

## Follow-Up

- Consider route-level code splitting before broader launch.
- Add Lighthouse checks once browser automation is available in the target QA environment.
- Keep screenshot tests separate from normal dev flow if they add runtime cost.

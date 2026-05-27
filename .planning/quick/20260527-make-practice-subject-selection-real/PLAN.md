---
status: complete
created: "2026-05-27"
task: "Make Practice subject selection real"
---

# Quick Task: Make Practice Subject Selection Real

## Goal

Fix `/practice` so students first choose a subject. Math-specific Practice Path, current lesson, roadmap, and review content should appear only after Mathematics is selected.

## Scope

- Add multiple subject choices to the Practice overview mock data.
- Keep Mathematics as the only available demo path for now.
- Mark other subjects as coming soon and prevent them from loading the Mathematics roadmap.
- Keep the initial `/practice` view subject-first, without math path content.

## Verification

- `npm run lint`
- `npm run build`
- Browser check initial `/practice`, Mathematics selection, another subject selection, and mobile layout.

## Result

Complete. `/practice` now starts with real subject choices. Mathematics is the only currently available demo path, and Math-specific path/lesson/roadmap content appears only after Mathematics is selected. Other subjects show a prepared-state message instead of loading the Math roadmap.

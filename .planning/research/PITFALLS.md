# Project Research: Pitfalls For v4.0 Home V2 Skeleton

**Milestone:** v4.0 新版路由与组件骨架
**Date:** 2026-07-04
**Scope:** Common mistakes when adding the Home V2 route and skeleton to the existing STOA frontend.

## Pitfall 1: Accidentally Replacing `/`

Risk:

- User explicitly asked to preserve the existing homepage and open the new design separately.

Prevention:

- Add `/home-v2` only.
- Do not redirect `/` to `/home-v2`.
- Do not modify `HomePage` or `src/components/home/` unless a narrow shared primitive is explicitly justified.

## Pitfall 2: Skeleton Too Empty To Evaluate

Risk:

- User selected previewable skeleton, not route-only empty shells.

Prevention:

- Build visible section rhythm, placeholder visuals, CTA placement, and responsive containers.
- Use real section headings and provisional copy through i18n.
- Reserve stable image/proof slots for later assets.

## Pitfall 3: Premature Final Design

Risk:

- v4.0 can sprawl into images, animation, copywriting, and screenshot QA.

Prevention:

- Use placeholder/prototype surfaces.
- Keep final crop optimization and full animation out of scope.
- Add only basic motion/reveal if it is lightweight and respects reduced motion.

## Pitfall 4: i18n Retrofitting Later

Risk:

- If `homeV2` starts with hard-coded English text, final multilingual work will require structural rework.

Prevention:

- Add the `homeV2` namespace in v4.0.
- Include EN/DE/FR/IT provisional resources.
- Keep copy short enough to expose German/French layout pressure early.

## Pitfall 5: Route Inventory Drift

Risk:

- Adding a route in `AppRouter` but not in `routeGroups.public` creates inconsistent navigation/inventory docs.

Prevention:

- Update both files in the same phase.
- Add smoke verification for route access.

## Pitfall 6: Using Candidate Images As Final Assets

Risk:

- Candidate files are large, not optimized for production, and some are not final-approved.

Prevention:

- v4.0 should avoid final asset insertion.
- If a candidate is used for preview only, document that it is non-final.
- Defer WebP/AVIF/crop/alt text to a later asset implementation milestone.

## Pitfall 7: Current App Design Leaks Into Public Luxury Page

Risk:

- Reusing dense app card patterns would undermine the 70% Swiss private-school / high-end education service direction.

Prevention:

- Use large section rhythm, editorial split, restrained evidence surfaces, and double-bezel frames.
- Avoid nested cards and generic feature grids.
- Keep app dashboard density out of the public Home V2 skeleton.

## Pitfall 8: Public Claims Outrun Product Capability

Risk:

- Homepage skeleton copy could accidentally imply OCR, instant solving, guaranteed improvement, production live support, or teacher replacement.

Prevention:

- Use education-centered language.
- Say `Learning Assistant`, `teacher-backed support`, and `Start learning`.
- Avoid hero-level AI claims and unsupported guarantees.

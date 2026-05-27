# Phase 33 Homepage Practice Entry QA Checklist

## Homepage Practice Entry

- [x] Homepage has a clear Practice Game / Practice Path entry.
- [x] Entry has a Start Practice button.
- [x] Users can understand this is a short practice entry.
- [x] Users can understand that stuck moments can continue into Learning Chat.
- [x] Practice Entry does not overpower the Hero primary CTA.
- [x] Practice Entry does not make STOA look like only a learning game.

## Navigation

- [x] Unauthenticated Start Practice destination is `/login?next=/practice`.
- [x] Student Start Practice destination is `/practice`.
- [x] Parent Start Practice destination is `/parent`.
- [x] Tutor Start Practice destination is `/tutor`.
- [x] Admin Start Practice destination is `/admin`.
- [x] Student login can honor safe `next=/practice`.
- [x] Student registration flow is documented as `/register?role=student&next=/practice`.

## Layout and Localization

- [x] Desktop Practice Entry layout is clear.
- [x] Mobile Practice Entry layout does not create horizontal overflow.
- [x] English copy includes Practice Game and Start Practice.
- [x] German copy includes Übungsweg and Übung starten.
- [x] French copy includes Parcours d’entraînement and Commencer l’entraînement.
- [x] Italian copy includes Percorso di pratica and Inizia la pratica.
- [x] German and French CTAs fit or wrap safely on mobile.
- [x] Preview topics are concise in all four languages.

## Product Hierarchy

- [x] Practice is presented as one entry into STOA.
- [x] Learning Chat remains the explanation center.
- [x] Professional Teacher Support remains fallback escalation.
- [x] Parent Report remains the visibility layer.
- [x] User-facing copy avoids Duolingo, game-first, XP, streak, heart, gem, shop, and leaderboard language.

## Verification

- [x] Homepage-to-Practice demo flow is documented.
- [x] Browser QA covered EN/DE/FR/IT at 320, 375, 430, 768, 1024, and 1440 px.
- [x] `npm run build` passes.
- [x] Known Phase 34 follow-up is external user testing and funnel feedback.


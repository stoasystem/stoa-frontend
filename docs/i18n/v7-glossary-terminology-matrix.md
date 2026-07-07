# v7 Glossary And Terminology Matrix

**Date:** 2026-07-07
**Status:** Initial planning matrix for v7.1 review

This matrix is the starting point for full-site EN/DE/FR/IT copy. It is not final translation memory. v7.1 should review every term against real route context before implementation.

## Core Rules

- Prefer education language over technical model language.
- Keep parent-facing wording calm, premium, and clear.
- Keep student-facing wording direct and warm.
- Avoid promises that STOA cannot guarantee.
- Do not expose internal implementation labels such as `mock`, `demo`, `provider`, `prompt`, or model names.

## Terminology Matrix

| Concept | EN | DE | FR | IT | Context Notes | Avoid |
|---------|----|----|----|----|---------------|-------|
| STOA product | STOA | STOA | STOA | STOA | Brand name stays unchanged. | translating the brand |
| Learning Assistant | Learning Assistant | Lernassistent | assistant d'apprentissage | assistente all'apprendimento | Use as product concept; public copy should not overexplain AI. | AI tutor, bot |
| learning support | learning support | Lernunterstuetzung | accompagnement d'apprentissage | supporto all'apprendimento | Public and parent-facing support language. | tutoring machine |
| teacher-backed support | teacher-backed support | von Lehrpersonen begleitet | avec l'appui d'enseignants | con supporto degli insegnanti | Use when human professional support is core. | teacher replacement |
| tutor support | tutor support | Tutor Support | accompagnement du tuteur | supporto del tutor | Use on role/product surfaces where tutor is the operating role. | AI teacher |
| Start learning | Start learning | Lernen starten | Commencer a apprendre | Iniziare a studiare | Primary CTA direction. | Try a question |
| Practice | Practice | Ueben | S'exercer | Esercitarsi | Main student learning action. | drills only |
| Practice Path | Practice Path | Uebungspfad | parcours d'exercices | percorso di esercizi | Roadmap/progression module. | training tunnel |
| Practice Library | Practice Library | Uebungsbibliothek | bibliotheque d'exercices | libreria di esercizi | Former question bank user-facing term. | question bank in public UI |
| Question Library | Question Library | Fragenbibliothek | bibliotheque de questions | libreria di domande | Use only where the product concept is question-centric. | database |
| Upload a Question | Upload a Question | Frage hochladen | Importer une question | Caricare una domanda | Photo/PDF handoff. Do not imply automatic solving. | scan and solve |
| Take Photo | Take Photo | Foto aufnehmen | Prendre une photo | Scattare una foto | Upload action. | OCR claim |
| Attach File | Attach File | Datei anhaengen | Joindre un fichier | Allegare un file | File upload action. | process document instantly |
| Online Classroom | Online Classroom | Online-Klassenzimmer | classe en ligne | aula online | Live support surface. | video call only |
| Learning Chat | Learning Chat | Lernchat | chat d'apprentissage | chat di apprendimento | Student workspace. | AI chat bot |
| clear next step | clear next step | klarer naechster Schritt | prochaine etape claire | prossimo passo chiaro | Good STOA product phrase. | instant answer |
| learning activity | learning activity | Lernaktivitaet | activite d'apprentissage | attivita di apprendimento | Parent visibility without surveillance framing. | tracking |
| progress visibility | progress visibility | Lernfortschritt im Blick | visibilite sur les progres | visibilita sui progressi | Parent surfaces. | monitor your child |
| parent dashboard | parent dashboard | Elternuebersicht | espace parents | area genitori | Use where dashboard is a product page. | control center |
| student dashboard | student dashboard | Schueleruebersicht | espace eleve | area studente | Student-facing role page. | command center |
| teacher/tutor dashboard | tutor dashboard | Tutor-Uebersicht | espace tuteur | area tutor | Role copy can choose teacher/tutor according to existing route ownership. | teacher cockpit |
| admin dashboard | admin dashboard | Admin-Uebersicht | tableau de bord admin | dashboard admin | Admin/ops can be more technical and scannable. | marketing language |
| subscription | subscription | Abonnement | abonnement | abbonamento | Billing context. | membership if unclear |
| plan | plan | Tarif | formule | piano | Pricing/product plan. | package if legal meaning unclear |
| trial | trial | Testphase | essai | prova | Free-user trial quota. | free forever |
| quota | quota | Kontingent | quota | quota | Use carefully; prefer user-friendly text in public copy. | limit punishment |
| billing | billing | Abrechnung | facturation | fatturazione | Parent/admin billing. | payment mess |
| refund | refund | Rueckerstattung | remboursement | rimborso | Legal/terms. | guarantee |
| privacy | privacy | Datenschutz | confidentialite | privacy | Use gently in product copy, precise in legal copy. | surveillance |
| personal data | personal data | Personendaten | donnees personnelles | dati personali | Legal/privacy context. | private info |
| retention | retention | Aufbewahrung | conservation | conservazione | Legal/privacy. | storage forever |
| consent | consent | Einwilligung | consentement | consenso | Legal/privacy. | permission if legal precision is required |
| support ticket | support request | Supportanfrage | demande d'assistance | richiesta di supporto | Product support. | complaint only |
| role | role | Rolle | role | ruolo | Auth/admin context. | persona in user UI |
| Login | Login | Login | Connexion | Accesso | Nav/auth. Keep simple. | sign into AI |
| Register | Create account | Konto erstellen | Creer un compte | Crea account | Public/auth. | enroll if not school enrollment |

## Forbidden Or Sensitive Public Terms

Avoid unless a page is explicitly technical, legal, or internal:

- AI homework solver
- artificial intelligence as the main headline claim
- prompt
- model
- provider
- Codex
- demo
- mock
- beta if not product-approved
- guaranteed grades
- guaranteed improvement
- replacement teacher
- surveillance
- monitoring your child
- instant answer
- automatic solving

## Review Notes For v7.1

- Decide where "teacher" and "tutor" must remain distinct.
- Check whether German should use `Lehrperson`, `Tutor`, or `Lehrer` by route.
- Check whether French should use `enseignant`, `tuteur`, or a more neutral expression by route.
- Check whether Italian should use `insegnante`, `tutor`, or a neutral phrase by route.
- Confirm whether `Learning Assistant` remains untranslated in any locale for brand consistency. Current recommendation is localized descriptive terms in body copy and English product label only where visually branded.

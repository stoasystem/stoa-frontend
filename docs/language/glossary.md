# STOA Language Glossary

Phase 16 standardized STOA's user-facing language for English, German, French, and Italian. Phase 17 adds locale-specific copywriting rules so each language can read naturally instead of mirroring English word order.

## Core Terms

| Concept | English | German | French | Italian |
| --- | --- | --- | --- | --- |
| First-response learning help | Learning Assistant | Lernassistent | Assistant d’apprentissage | Assistente all’apprendimento |
| Qualified teacher help | Professional teacher support | Professionelle Unterstützung durch Lehrpersonen | Accompagnement par un enseignant qualifié | Supporto di un insegnante qualificato |
| Learning progress | Learning progress | Lernfortschritt | Progrès d’apprentissage | Progressi di apprendimento |
| Parent area | Parent dashboard | Elternbereich | Espace parents | Area genitori |
| Teacher request | Ask a teacher | Lehrperson fragen | Demander à un enseignant | Chiedi a un insegnante |
| Student entry CTA | Start learning | Lernen starten | Commencer à apprendre | Inizia a studiare |
| Homepage hero title | Learn with clarity. | Lernen. Fragen. Verstehen. | Comprendre avec confiance. | Studiare con più chiarezza. |
| Secondary homepage CTA | How it works | So funktioniert STOA | Comment ça fonctionne | Come funziona |

## Product Sentence

English:
Learning Assistant first. Professional teacher support when needed. Parents stay informed.

German:
Zuerst hilft der Lernassistent. Bei Bedarf unterstützt eine qualifizierte Lehrperson. Eltern bleiben informiert.

French:
L’assistant d’apprentissage aide d’abord. Si nécessaire, un enseignant qualifié prend le relais. Les parents restent informés.

Italian:
Prima aiuta l’assistente all’apprendimento. Se necessario, interviene un insegnante qualificato. I genitori restano informati.

## Avoid In User-Facing Copy

- AI
- Artificial Intelligence
- AI tutor
- AI answer
- chatbot
- bot
- robot tutor
- virtual teacher
- automated teacher
- human backup
- teacher backup
- what we are selling
- buy now
- customers, when `families`, `parents`, `students`, or `teachers` is clearer

Internal code identifiers such as `aiMessagesUsed` can remain where they are API or data model names.

## Phase 17 Copy Rule

Do not force one source sentence into every language. Locales may use different structures when the result is clearer and more stable in the UI.

Example:

- English can use one hero title string: `Learn with clarity.`
- German can use stacked title lines: `Lernen. Fragen. Verstehen.`
- French can keep a confident sentence-like title: `Comprendre avec confiance.`
- Italian can use a warmer title: `Studiare con più chiarezza.`

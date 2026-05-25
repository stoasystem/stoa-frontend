# Phase 16 Terminology Replacement

## Scope

Phase 16 replaces user-visible AI-heavy and developer-facing wording on the STOA frontend. The goal is a calmer Swiss education product voice across English, German, French, and Italian.

## Applied Decisions

- The first-response system is called `Learning Assistant` in English UI copy.
- Qualified human help is called `Professional teacher support`.
- Chat copy says the Learning Assistant prepares an explanation.
- Teacher escalation appears as `Ask a teacher`.
- Pricing explains `The value for families`.
- Billing describes demo limits without mentioning frontend enforcement.

## Source Audit Commands

Run:

```bash
rg "\bAI\b|AI-|AI |Artificial Intelligence|Chatbot|Robot Tutor|Virtual Teacher|Automated Teacher|Human backup|Teacher Backup|teacher backup|human tutor|What STOA is selling|What we are selling|Buy now|Customers|frontend enforce" src/pages src/components src/i18n -n
```

Expected result:

```text
No matches in user-facing source directories.
```

Internal API/data names may still include lower-level identifiers such as `aiMessagesUsed`. Those are not displayed as product language.

# Project Research: Pitfalls for v2.1 Question Bank UI Design

**Milestone:** v2.1 Question Bank UI Design
**Date:** 2026-06-01

## Pitfall 1: Duplicating Practice Path

**Risk:** Question Bank becomes another roadmap/lesson path, confusing students and making the existing Practice Path redundant.

**Prevention:** Keep Question Bank organized around subjects, topics, filters, question sets, and mistakes. Use Practice Path CTAs as related next steps, not embedded roadmap components.

**Phase to address:** Data/design foundation and browse pages.

## Pitfall 2: Turning the UI into an Exam System

**Risk:** Timers, strict scoring, heavy result language, and pass/fail framing make STOA feel like test software instead of a learning platform.

**Prevention:** Use low-pressure copy, immediate feedback, retry/review actions, and Learning Assistant handoff. Avoid timed exam mode in v2.1.

**Phase to address:** Session and result pages.

## Pitfall 3: Overbuilding Backend Architecture

**Risk:** A UI milestone drifts into item authoring, persistence, permissions, curriculum standards, or production analytics.

**Prevention:** Keep mock data deterministic, service boundaries replaceable, and docs explicit about future backend work.

**Phase to address:** Foundation and documentation.

## Pitfall 4: Filter UI Becomes Cluttered

**Risk:** Subject, grade, topic, difficulty, type, status, recommendation, and search controls crowd the page, especially on mobile.

**Prevention:** Use progressive disclosure: high-value filters visible, secondary filters grouped, mobile controls collapsed, active filter chips visible, clear all available. VA.gov's search-filter guidance also notes mobile collapse and clear/reset behavior as important for faceted search.

**Phase to address:** Browse and topic pages.

## Pitfall 5: Accessibility Gaps in Interactive Controls

**Risk:** Custom segmented controls, tabs, filter chips, session navigation, feedback announcements, and result updates are hard to use with keyboard or screen readers.

**Prevention:** Prefer native controls where possible, use proper labels, preserve focus after filtering, announce result count/feedback changes with live regions, and verify keyboard order. W3C APG should guide custom widget semantics.

**Phase to address:** Every UI phase, with final QA gate.

## Pitfall 6: Chat Handoff Exposes Internals

**Risk:** Passing question context into Chat leaks query params, model/provider wording, mock identifiers, or implementation names to the student.

**Prevention:** Use provider-agnostic context labels and sanitize visible copy. Keep technical identifiers in route state/service code only.

**Phase to address:** Session/result handoff.

## Pitfall 7: Parent and Tutor Surfaces Stay Siloed

**Risk:** Students get a useful Question Bank, but parents/tutors cannot tell how it fits with Practice Path, Learning Chat, and teacher support.

**Prevention:** Add concise learning-activity summaries and docs in v2.1. Do not build complex analytics; show enough context for comprehension.

**Phase to address:** Comprehension/docs phase.

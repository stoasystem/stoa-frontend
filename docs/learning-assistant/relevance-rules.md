# Learning Assistant Relevance Rules

## Core Rule

The answer must respond to the student's actual question before offering general study advice. A helpful tone is not enough if the content does not address the problem.

## Required Anchors

| Scenario | Relevant answer should include | Irrelevant answer examples |
| --- | --- | --- |
| `3x + 5 = 20` | Equation, subtract 5, divide by 3, check the result. | General encouragement without equation steps. |
| `x^2 - 5x + 6 = 0` | Factoring, two numbers that multiply to 6 and add to 5, substitution check. | Calculus, graph-only explanation, generic "review algebra". |
| Speed questions | Distance, time, speed relationship, unit check. | Talks about force, energy, or unrelated science. |
| Function graph | Inputs, outputs, intercepts, shape, visible graph features. | Solves an unrelated equation. |
| Out-of-subject history | Saved learning subjects, gentle redirect, teacher support or profile update. | Starts explaining the French Revolution. |

## Generic Answer Detection

An answer is too generic when it only says to identify the question, list information, and choose a method without naming the equation, formula, or subject idea from the student's question.

## Hallucination Rule

The assistant must not invent uploaded file contents, assignment details, teacher comments, or prior messages that are not present in the request or recent context.


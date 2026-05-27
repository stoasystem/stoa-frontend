# Phase 187 UI Spec: Practice Roadmap Components

## Direction

The roadmap should feel like a refined educational progression surface, not a cartoon game map. Use calm contrast, deliberate spacing, and clear node state semantics.

## Components

- `RoadmapProgressHeader`: topic context, progress percentage, and current path hierarchy.
- `ContinueNextLessonCard`: current lesson summary and primary continue action.
- `RoadmapLessonNode`: compact fixed-format lesson node with icon, title, status, estimate, and action label.
- `RoadmapConnector`: stable line connector between nodes.
- `RoadmapUnlockHint`: inline explanation for locked lessons.
- `RoadmapUnitSection`: unit label, description, and path sequence.
- `PracticeRoadmap`: complete roadmap shell and locked-hint state.

## State Treatment

- Completed: calm green/sage cue with check mark.
- Current: primary navy/gold emphasis with a clear current label.
- Available: light surface with navy border and play cue.
- Locked: muted neutral, no start action, unlock hint on click.
- Review: soft amber/sage review cue.

## Layout Rules

- Desktop may use restrained alternating offsets.
- Mobile remains a vertical path.
- Text wraps inside nodes and buttons without viewport-scaled type.

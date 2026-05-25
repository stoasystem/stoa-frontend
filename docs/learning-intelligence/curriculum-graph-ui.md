# Phase 12 Curriculum Graph UI

The curriculum graph uses a deterministic custom SVG/card graph for the Phase 12 demo. React Flow remains optional for a later phase if graph interaction grows.

Routes:

- `/curriculum-graph`
- `/students/:studentId/curriculum-graph`

Displays:

- Topic nodes
- Prerequisite edges
- Topic status
- Topic detail panel
- Recent questions
- Recommendations

Out of scope:

- Real curriculum graph engine
- Graph database
- Automatic topic dependency computation

The current frontend consumes static node and edge data from the API contract or mock fallback.

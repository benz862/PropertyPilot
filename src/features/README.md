# Feature Modules

ENG-001 requires major product capabilities to live behind feature boundaries.
The current implementation predates that layout and keeps most domain logic in
`src/lib`. New feature work should start here and expose only public services,
types, and UI composition points.

Each feature should use this structure:

```text
api/
components/
hooks/
schemas/
services/
types/
utils/
```

Feature internals must not be imported directly by other features. Cross-feature
communication goes through service exports.

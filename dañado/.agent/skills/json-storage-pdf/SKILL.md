---
name: json-storage-pdf
description: Best practices for managing JSON-based application state and preparing complex measurement data for high-fidelity PDF reports.
---

# JSON Storage & PDF Preparation

This skill documents the methodology used to handle the persistent state of the "Bitácora Rúbrica" application and how that state is transformed for scientific report generation.

## Methodology

### 1. State Hub Strategy
The application uses a single "Source of Truth" (`report` state) that follows a deeply nested tree structure.
- **Root**: `Report` object (metadata, rubric, evaluations).
- **Branch**: `dataSeries` array (individual experiments).
- **Leaves**: `measurements` array (raw data, averages, uncertainties).

### 2. Immutability & Deep Updates
Since React state is immutable, updating a leaf node (e.g., a single measurement value) requires cloning the parent branch.
- **Pattern**: `updateActiveSeries` helper.
```typescript
const updateActiveSeries = (updates: Partial<DataSeries>) => {
  setReport(prev => {
    const newSeriesList = [...prev.dataSeries];
    const currentIndex = prev.activeSeriesIndex;
    const current = newSeriesList[currentIndex];
    newSeriesList[currentIndex] = { ...current, ...updates };
    return { ...prev, dataSeries: newSeriesList };
  });
};
```

### 3. Data Transformation for PDF
Before sending data to `jsPDF`, the nested JSON must be flattened into a format suitable for table rendering.
- **Measurement Flattening**: Combining `i` (independent), `d` (dependent), and `others` (extra variables) into a single row object.
- **Unit Normalization**: Ensuring symbols and units are paired correctly using LaTeX placeholders.

## Best Practices
- **UUIDs for Everything**: Use `crypto.randomUUID()` for variables to avoid collisions when swapping positions.
- **Defensive Parsing**: Always use a wrapper like `parseNum(val)` to handle comma/dot decimal separators (critical for scientific accuracy).
- **State Synchronization**: Calculate derived values (like PROM/Average) on-the-fly or via `useEffect` rather than storing them, to avoid stale data.

## Resources
- [types.ts](file:///C:/Users/nelso/Documents/A_UMNG/BitacoraRubrica/types.ts): Core schema definitions.
- `calculateRowAvgs`: Logical helper for data reduction.

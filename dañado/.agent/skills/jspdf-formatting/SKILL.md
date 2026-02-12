---
name: jspdf-formatting
description: Advanced techniques for scientific report generation using jsPDF, including mixed page orientations and automated table scaling for wide data sets.
---

# jsPDF Formatting & Orientation

This skill focuses on generating high-fidelity scientific reports from dynamic web data, ensuring tables and graphs are presented clearly regardless of their width.

## Methodology

### 1. The "Rotate on Demand" Strategy
For scientific reports with many measurements or variables, a standard portrait (A4) layout often fails.
- **Implementation**: Dynamically adding landscape pages only for the data table.
```typescript
const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
// ... render header in portrait ...

if (shouldRotateTable) {
  doc.addPage('a4', 'l'); // Switch to Landscape
  // Render table with width ~280mm
  doc.addPage('a4', 'p'); // Switch back to Portrait
}
```

### 2. High-Fidelity Table Rendering
Instead of manual text positioning, use the `html2canvas` + `doc.addImage` pattern to capture styled HTML components.
- **Benefits**: Preserves complex CSS, LaTeX rendering, and specific color-coding (e.g., Red/Blue academic themes).
- **Optimization**: Use `SCALE: 2` in html2canvas for crisp PDF output without excessive file size.

### 3. Intelligent Chunk-based Pagination
Standard `captureSectionBox` on large sections often causes vertical overflow or excessive scaling.
- **Methodology**: Break the section content into atomic chunks (Text blocks vs. Figures).
- **Loop Logic**:
  1. Capture HTML of a single chunk.
  2. Check `currentY + chunk.height > pageLimit`.
  3. If true, `doc.addPage()` and reset `currentY = 20`.
  4. Render chunk and increment `currentY`.
- **Outcome**: Documents can span hundreds of pages without text truncation or design breakdown.

### 4. Dynamic Header Management
Scientific reports require consistent branding (University Logo, Department Info).
- **Method**: Using a `drawSectionHeader` helper to manage `currentY` and prevent overlapping during sequential rendering.

## Best Practices
- **Coordinate System**: Always use `mm` as the unit for jsPDF for predictable physical printouts.
- **Color Consistency**: Define standard RGB tuples (e.g., UMNG Blue `[0, 75, 135]`) to maintain institutional identity.
- **Vertical Overflow**: Use chunks to manage overflow instead of scaling. Only scale as a last resort for elements taller than a full page.

## Resources
- [handleDownloadPDF](file:///C:/Users/nelso/Documents/A_UMNG/BitacoraRubrica/App.tsx): Main export implementation.
- `addSafeImage`: Helper for handling Base64 and external logo assets.

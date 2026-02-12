---
name: scientific-image-integration
description: Comprehensive strategy for integrating technical diagrams and images into scientific reports, focusing on LaTeX syntax, Base64 optimization, and PDF pagination.
---

# Scientific Image Integration

This skill outlines the professional methodology for embedding images into scientific documents within a reactive web environment, ensuring high visual quality and standard LaTeX layout consistency.

## Methodology

### 1. Images as Data (The Hub Pattern)
Instead of embedding large Base64 strings directly into the markdown/text editor, use a centralized dictionary.
- **Implementation**: Store images in a `Record<string, string>` where keys are generated IDs (e.g., `fig-17707...`) and values are the Base64 data.
- **Benefit**: Keeps the editor text legible and allows multiple sections to reference the same image without redundant storage.

### 2. The LaTeX Figure Environment
Emulate standard scientific typesetting syntax to give users precision control.
- **Structure**:
  ```latex
  \begin{figure}[h]
    \includegraphics[width=0.8\linewidth]{fig-id}
    \caption{Experimental setup description.}
    \label{fig:setup}
  \end{figure}
  ```
- **Robust Rendering**: Parsing logic must handle optional arguments in the `\begin` tag and varying units for the `width` parameter (e.g., `cm`, `px`, `\linewidth`).

### 3. Automated Alignment & Scaling
Ensure images look professional regardless of the source resolution or specified width.
- **CSS Strategy**: Use `object-fit: contain` and `flex justify-center` on the figure wrapper.
- **Constraint**: Set a universal `max-height` (e.g., `9cm`) to prevent a single image from dominating an entire PDF page.

### 4. Fragmented PDF Pagination
Standard section-based PDF capture is brittle. images should trigger logical breaks.
- **Approach**: Desynthesize sections into text segments and figure blocks.
- **Break Logic**: If `remaining_page_space < chunk_height`, move the entire image/caption block to the next page.
- **Visual Continuity**: Maintain the "boxed" section design across page breaks to denote thematic unity.

## Best Practices
- **Default Factors**: Insert images with a default width (e.g., `0.8\linewidth`) to encourage a uniform document appearance.
- **Metadata Prompting**: Prompt for `caption` and `label` immediately upon upload to ensure the figure is scientifically complete.
- **Unit Tolerance**: Logic should treat `1.0\linewidth` as `100%`, `0.5\linewidth` as `50%`, and preserve fixed units like `cm`.

## Resources
- [App.tsx](file:///C:/Users/nelso/Documents/A_UMNG/BitacoraRubrica/App.tsx): `renderLatexToHtml` parsing logic.
- `captureSectionBox`: HTML-to-Image bridge for PDF generation.
- `Section` component: Image upload and LaTeX insertion logic.

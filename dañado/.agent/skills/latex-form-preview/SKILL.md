---
name: latex-form-preview
description: Best practices for implementing interactive LaTeX-enabled forms with real-time previews and optimized media/image placement.
---

# LaTeX Form Editor & Preview

This skill documents the methodology for building scientific editing interfaces that allow users to input complex notation and see instant visual feedback.

## Methodology

### 1. Real-Time LaTeX Rendering
To avoid the overhead of a full LaTeX engine, the application uses **KaTeX** for lightweight, browser-side rendering.
- **Pattern**: `renderLatexToHtml` utility.
```typescript
const renderLatexToHtml = (text: string) => {
  try {
    // Regex to find $...$ segments
    return text.replace(/\$(.*?)\$/g, (match, formula) => {
      return katex.renderToString(formula, { throwOnError: false });
    });
  } catch (e) {
    return text;
  }
};
```
- **UI Integration**: Using `dangerouslySetInnerHTML` for live previews.

### 2. Interactive Precision Guidance
When users edit variables (especially symbols like `\rho` or `\lambda`), the form provides floating contextual help.
- **Symbol Panel**: A dedicated UI component that detects typing Patterns and suggests correct LaTeX syntax.
- **Precision Controls**: Buttons (`+`/`-`) that update the `VariableConfig` objects, instantly reflecting in the table headers.

### 3. Scientific Image Environments (Figure)
To handle technical diagrams properly, the editor supports a subset of the LaTeX `figure` environment.
- **Syntax**: `\begin{figure}[...] \includegraphics[width=...]{id} \caption{...} \label{...} \end{figure}`.
- **Robust Regex**: Use `\begin\s*(?:\[.*?\])?\s*\{figure\}\s*(?:\[.*?\])?` to handle optional parameters and spaces gracefully.
- **Width Parameter**: Support for `0.x\linewidth` and fixed units (`cm`, `px`), defaults to `0.8\linewidth`.
- **Automatic Centering**: Wrap generated HTML in `flex justify-center` to ensure visual balance even with reduced widths.

### 4. Layout Distribution
Scientific reports often require diagrams (e.g., Montaje Experimental).
- **Image Handling**: `FileReader` API to convert uploads to `base64` strings for storage within a central `images` dictionary, referenced by ID to keep the editor text clean.

## Best Practices
- **Atomic Components**: Keep LaTeX inputs as small, focused components to prevent expensive re-renders of the entire table.
- **Fallback Strings**: Always store the raw LaTeX string (`raw`) and only compute the HTML for display.
- **Z-Index Management**: Ensure LaTeX suggestion panels appear above table headers without being clipped by overflow settings.

## Resources
- `renderLatexToHtml`: Main rendering utility.
- `SymbolInput`: (Concept) Shared input logic with LaTeX intelligence.
- [App.css](file:///C:/Users/nelso/Documents/A_UMNG/BitacoraRubrica/index.css): Styling for glassmorphism and preview cards.

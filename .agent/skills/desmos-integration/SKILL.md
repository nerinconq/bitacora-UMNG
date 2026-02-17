---
name: Desmos Integration Strategy
description: Best practices for embedding the Desmos Graphing Calculator API into React applications with two-way data binding and image export capabilities.
---

# Desmos Integration Skill

This skill documents the pattern for deeply integrating the Desmos Graphing Calculator into a React application, enabling data synchronization from the app to the graph, and capturing the graph state as an image for reporting.

## Core Concepts

### 1. Global Declaration & Installation

Desmos is loaded via a script tag in `index.html`. It requires an API Key.

**Script Tag:**
```html
<script src="https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>
```

In TypeScript, extend the Window interface to recognize the global object.

```typescript
declare global {
    interface Window {
        Desmos: any;
    }
}
```

### 2. Component Initialization
Wrap the calculator in a React component (`DesmosGraph.tsx`). Use a `ref` to hold the calculator instance and ensure proper cleanup.

**Key Configuration:**
Enable all relevant tools (keypad, settings, expressions) to ensure accessibility for all users, including those using screen readers or needing visual adjustments.

```typescript
useEffect(() => {
    // ... verification checks ...
    const calculator = window.Desmos.GraphingCalculator(containerRef.current, {
        expressions: true,
        settingsMenu: true,
        zoomButtons: true,
        lockViewport: false,
        expressionsCollapsed: false, // Important: Keep sidebar visible
        images: true, // Allow user to upload images
        folders: true,
        notes: true,
        keypad: true,
        graphpaper: true,
        pasteGraphLink: true
    });
    // ... save instance ...
    return () => calculator.destroy();
}, []);
```

## Data Synchronization (App -> Desmos)

To visualize application data (e.g., experimental measurements) in Desmos, use `setExpression` with a `table` type.

### Scientific Notation Helper
Desmos expects LaTeX formatting for scientific notation.

```typescript
const formatScientific = (num: number, precision: number) => {
    const str = num.toExponential(precision);
    const [base, exp] = str.split('e');
    const cleanExp = exp ? exp.replace('+', '') : '';
    return `${base} \\cdot 10^{${cleanExp}}`; // e.g. 1.23 \cdot 10^{-4}
};
```

### Updating the Table
Run this in a `useEffect` dependent on your data prop.

```typescript
useEffect(() => {
    // ...
    const columns = [
        { latex: 'x_1', values: data.map(d => formatScientific(d.x, 4)) },
        { latex: 'y_1', values: data.map(d => formatScientific(d.y, 4)) }
    ];

    calculator.setExpression({
        id: 'data_table',
        type: 'table',
        columns: columns
    });
}, [data]);
```

## Plotting Regressions
You can overlay regression lines calculated in your app onto the Desmos graph using `latex` expressions.

```typescript
calculator.setExpression({
    id: 'regression_line',
    latex: `y = ${m}x + ${b}`,
    color: '#c74440'
});
```

## Image Export (Desmos -> App)

Since the Desmos canvas is complex, the reliable way to "save" the graph for a PDF report is to use the `screenshot` API.

```typescript
const handleScreenshot = () => {
    const screenshot = calculator.screenshot({
        width: 800,
        height: 600,
        targetPixelRatio: 2 // Better quality for PDF
    });
    // screenshot is a Base64 string (data:image/png...)
    onExport(screenshot);
};
```

## Accessibility & Usability Notes

- **Full Toolbar:** Always keep `expressionsCollapsed: false` so users can see the table and equations.
- **Copy-Paste:** Implement a feature to copy data to the clipboard in TSV (Tab Separated Values) format. This allows users to easily copy data from your app and paste it into an external Desmos window if they prefer the full site.
- **Visual Feedback:** Provide clear feedback when data is exported or copied.

## Common Pitfalls

- **Re-initialization:** Avoid creating a new calculator instance on every render. Use `useEffect` with an empty dependency array `[]` for initialization.
- **Latex Syntax:** Ensure all numbers and variables in `latex` strings are properly formatted (e.g., escaping backslashes).
- **Z-Index:** Desmos popups/modals might conflict with your app's modals. Check `z-index` layering.

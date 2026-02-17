---
name: interactive-pinout-viewer
description: Implementation pattern for an interactive microcontroller pinout viewer with visual editing, online library integration, and export capabilities.
---

# Interactive Pinout Viewer Component

This skill documents the implementation strategy for the `PinoutViewer` component, designed to allow users to visualize, edit, and export microcontroller pinouts.

## Core Concepts

1.  **Hybrid Data Model**: Combines high-quality board images with overlay metadata (pins).
2.  **Visual Interaction**: "Click-to-Add" functionality using percentage-based coordinates for responsiveness.
3.  **External Library**: Integration with GitHub-hosted resources (`GPIOViewer`) for a vast catalog of boards.
4.  **Premium UI**: Dark-themed, glassmorphic design using Tailwind CSS.

## Data Structure

The component relies on two key interfaces:

```typescript
interface Pin {
    pin: number | string;   // GPIO number or label (e.g., "GND")
    name: string;           // Functional name (e.g., "TX", "D2")
    type: 'GPIO' | 'POWER' | 'ADC' | 'UART';
    description: string;
    x?: number;             // X position in % (0-100)
    y?: number;             // Y position in % (0-100)
}

interface Board {
    id: string;
    name: string;
    imageUrl: string;       // Local base64 or Remote URL
    pins: Pin[];
}
```

## Implementation Details

### 1. Visual Editor (Coordinate Capture)

We map click events on the image container to percentage coordinates to ensure pins stay correctly positioned even if the image resizes responsively.

```typescript
const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Store x, y in the form state
    setEditPinForm({ ...editPinForm, x, y });
};
```

### 2. Rendering Overlays

Pins are rendered as absolute positioned elements over the image. We use colored badges to distinguish pin types.

```typescript
<div style={{ top: `${pin.y}%`, left: `${pin.x}%` }} className="absolute ...">
    {pin.name}
</div>
```

### 3. Online Library Integration

We fetch board data directly from the `GPIOViewer` repository to provide a rich catalog without bloating the app bundle.

-   **Source**: `https://thelastoutpostworkshop.github.io/microcontroller_devkit/gpio_viewer_1_5/boards.json`
-   **Image Path correction**: Note that library JSONs might use relative paths. Ensure to construct the full URL correctly (e.g., prepending `devboards_images/`).

### 4. Templates & Pre-loading

To improve UX, we pre-load popular boards (like ESP32-S3) in `useEffect`.

```typescript
useEffect(() => {
    // Check if template exists, if not, push it
    if (!boards.find(b => b.id === 'template-id')) {
        boards.push({ ...templateData });
    }
}, []);
```

## UI/UX Best Practices

-   **Dark Mode**: Use `bg-slate-900` for panels to frame the content elegantly.
-   **Interactive Feedback**:
    -   Hovering a pin on the image highlights it in the list (and vice-versa).
    -   Cursor changes (`cursor-crosshair`) when in edit mode.
    -   "Pulsing" markers for the pin currently being placed.
-   **Export**: Generate LaTeX appendices using the board name and image URL.

## Usage Example

```tsx
<PinoutViewer
    selectedBoardId={currentBoardId}
    onSelectBoard={handleBoardSelect}
    onExportToAppendix={(name, url) => generateAppendix(name, url)}
/>
```

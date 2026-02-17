---
name: Cirkit Designer Integration
description: Standardized workflow for integrating Cirkit Designer schematics into React applications with PDF generation support.
---

# Cirkit Designer Integration Skill

This skill outlines the pattern for embedding Cirkit Designer tooling into a React application, handling image uploads, rendering custom views, and ensuring high-quality PDF exports.

## Core Components

### 1. CirkitEmbed Component
Create a reusable component `components/CirkitEmbed.tsx` that handles the iframe integration and image fallback.

**Key Features:**
- **Iframe Embedding:** Use a resilient loading strategy for the iframe.
- **Project URL Management:** Allow users to update the project URL.
- **Image Upload Fallback:** Since iframes cannot be snapshotted easily due to CORS/security, always provide a drag-and-drop zone for the user to upload an exported image of their schematic.
- **Compression:** Compress uploaded images to avoid `localStorage` quota limits.

```tsx
// components/CirkitEmbed.tsx Pattern
import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
// import compressImage utility...

interface CirkitEmbedProps {
  projectUrl?: string;
  imageUrl?: string;
  onUpdate: (data: { projectUrl?: string; imageUrl?: string }) => void;
}

export const CirkitEmbed: React.FC<CirkitEmbedProps> = ({ projectUrl, imageUrl, onUpdate }) => {
  // Implementation details...
  // 1. Iframe section with default URL fallback
  // 2. Input for updating URL
  // 3. Dropzone for uploading exported image
};
```

### 2. Image Compression Utility
Essential for storing user-uploaded schematics in `localStorage` or state without hitting browser limits.

```typescript
// utils/imageCompression.ts
export const compressImage = async (file: File, maxWidth = 1024, quality = 0.7): Promise<string> => {
  // Canvas-based resizing and compression logic
  // Returns base64 string
};
```

## PDF Generation Strategy (jsPDF)

Since the schematic is often an uploaded image, use the following pattern to render it in the PDF:

### 1. Dynamic Width Parsing
Allow the user to control the image size via HTML/LaTeX attributes in the content editor.

**Pattern:**
- Parse `width=0.8\linewidth` or `width="80%"` from the content string.
- Calculate dynamic dimensions based on page width.

```typescript
// PDF Generation Logic
if (imgMatch) {
  const widthVal = parseWidth(imgMatch[1]); // e.g., 0.8
  const imgWidth = (pageWidth - 2 * margin) * widthVal;
  // ... addImage to PDF
}
```

### 2. Appendices Section
Instead of hardcoding the schematic page, create a flexible "Appendices" section where the user can insert the image tag.

**Insertion Logic:**
```typescript
const imgTag = `\n\\begin{figure}[h]\n  \\includegraphics[width=0.8\\linewidth]{${report.circuitDiagramUrl}}\n  \\caption{Esquema}\n\\end{figure}\n`;
```

## Best Practices

1.  **Iframe Restrictions:** Cirkit Designer doesn't support direct programmatic export via iframe postMessage (as of current version). Always rely on user upload for the final report image.
2.  **State Management:** Keep `projectUrl` and `imageUrl` separate in your state interface (`LabReport`).
3.  **Persisting Data:** Ensure both the URL and the Base64 image are saved (e.g., to LocalStorage or Backend). Avoid saving full-resolution raw images; always compress.
4.  **User Guidance:** Add clear instructions near the component: "Exporta tu diseño como PNG en Cirkit y súbelo aquí para el reporte."

## Common Pitfalls

- **QuotaExceededError:** Trying to save 4MB+ raw PNGs to LocalStorage. **Solution:** Use `compressImage` before saving.
- **Iframe Loading Issues:** Some browsers block mixed content. Ensure internal logic defaults to HTTPS.
- **PDF Layout:** Large vertical schematics may break page flow. **Solution:** Implement automatic page break checks before rendering the image in the PDF generator.

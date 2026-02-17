---
name: Export & Import Data Patterns
description: Best practices for implementing JSON export/import, PDF generation, and reset functionality in React applications with file downloads and state management.
---

# Export & Import Data Patterns

## Overview

This skill documents proven patterns for implementing data export (JSON, PDF), import (JSON), and application reset functionality in React applications. Based on a scientific reporting application that successfully handles complex data structures and file generation.

## Core Patterns

### 1. JSON Export with Programmatic Download

**Use Case:** Export application state as downloadable JSON file with sanitized filename.

**Implementation:**

```typescript
const handleExportJSON = () => {
  try {
    console.log("Iniciando exportación JSON...");
    if (!report) throw new Error("El reporte está vacío");

    // Serialize state to JSON
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create temporary anchor element for download
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);

    // Generate sanitized filename
    const rawName = report.practiceNo || 'Backup';
    const safeName = sanitizeFilename(rawName);
    const fileName = `Informe_Fisica_UMNG_${safeName}.json`;

    downloadAnchorNode.setAttribute("download", fileName);

    // Trigger download
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();

    // Cleanup (with timeout to ensure download starts)
    setTimeout(() => {
      document.body.removeChild(downloadAnchorNode);
      URL.revokeObjectURL(url);
      console.log("Exportación finalizada. Anchor removido.");
    }, 500);

  } catch (err) {
    console.error("Error exportando JSON:", err);
    alert(`Error al exportar: ${(err as Error).message}`);
  }
};

const sanitizeFilename = (name: string) => {
  return name.replace(/[^a-z0-9_-]/gi, '_').substring(0, 50);
};
```

**Key Points:**
- Use `Blob` with correct MIME type (`application/json`)
- Create temporary DOM anchor for download trigger
- Sanitize filenames to avoid filesystem errors
- Add timeout before cleanup to ensure download initiates
- Always cleanup: remove anchor and revoke object URL
- Wrap in try-catch for error handling

### 2. JSON Import with FileReader

**Use Case:** Load previously exported JSON to restore application state.

```typescript
const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const text = ev.target?.result as string;
      const data = JSON.parse(text);
      
      // Validate structure before applying
      if (!data.practiceNo || !data.dataSeries) {
        throw new Error("Formato de archivo inválido");
      }

      // Apply imported data to state
      setReport(data);
      alert("Datos cargados correctamente");
      
    } catch (err) {
      console.error("Error al importar:", err);
      alert(`Error al cargar el archivo: ${(err as Error).message}`);
    }
  };

  reader.readAsText(file);
};
```

**JSX for file input:**
```tsx
<label>
  <FolderOpen /> ABRIR
  <input 
    type="file" 
    className="hidden" 
    accept=".json" 
    onChange={handleImportJSON} 
  />
</label>
```

**Key Points:**
- Use `FileReader.readAsText()` for JSON files
- Validate data structure before applying to state
- Handle errors gracefully with user feedback
- Reset file input after processing (optional)

### 3. Application Reset with Confirmation

**Use Case:** Reset application to initial state with user confirmation.

```typescript
const INITIAL_REPORT: LabReport = {
  practiceNo: '',
  title: '',
  dateDev: new Date().toISOString().split('T')[0],
  // ... other initial values
};

const handleResetReport = () => {
  const confirmReset = window.confirm(
    "¿Estás seguro de que deseas borrar todo el informe? Esta acción no se puede deshacer."
  );
  
  if (confirmReset) {
    setReport({
      ...INITIAL_REPORT,
      dateDev: new Date().toISOString().split('T')[0] // Keep current date
    });
    
    // Reset any refs or auxiliary state
    lastFetchedDesmosId.current = "";
    
    alert("Informe reiniciado correctamente.");
  }
};
```

**Key Points:**
- Always use `window.confirm()` for destructive actions
- Maintain fresh values (e.g., current date) on reset
- Reset all related state including refs
- Provide clear feedback after reset

### 4. PDF Generation with jsPDF

**Use Case:** Generate complex PDF reports with images, tables, and LaTeX rendering.

```typescript
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const handleDownloadPDF = async () => {
  setIsGenerating(true);
  
  try {
    const doc = new jsPDF({ 
      orientation: 'p', 
      unit: 'mm', 
      format: 'a4' 
    });

    const margin = 15;
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Helper: Safe image loading with timeout
    const imageToBase64 = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (url.startsWith('data:')) {
          resolve(url);
          return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        const timeoutId = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeoutId);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            reject(new Error('Canvas context failed'));
          }
        };

        img.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to load: ${url}`));
        };

        img.src = url;
      });
    };

    // Helper: Safe image addition (skip failures)
    const addSafeImage = async (
      data: string | undefined,
      x: number, y: number, w: number, h: number
    ): Promise<boolean> => {
      if (!data) return false;
      
      try {
        let finalData = data;
        if (!data.startsWith('data:')) {
          try {
            finalData = await imageToBase64(data);
          } catch (e) {
            console.warn('Skipping image:', data, e);
            return false;
          }
        }

        let format = 'PNG';
        if (finalData.startsWith('data:image/jpeg')) format = 'JPEG';
        
        doc.addImage(finalData, format, x, y, w, h);
        return true;
      } catch (e) {
        console.error('Error adding image:', e);
        return false;
      }
    };

    // Add content
    await addSafeImage(report.logoUrl, margin, 10, 20, 20);
    
    doc.setFont("helvetica", "bold");
    doc.text('Universidad Militar Nueva Granada', pageWidth / 2, 16, { 
      align: 'center' 
    });

    // ... add more content ...

    // Save with sanitized filename
    const fileName = `Informe_P${sanitizeFilename(report.practiceNo)}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Error al generar PDF. Revise la consola.');
  } finally {
    // CRITICAL: Always reset generating state
    setIsGenerating(false);
  }
};
```

**Key Points:**
- Use `try-catch-finally` to ensure UI state resets
- Implement timeout for image loading (prevent infinite waits)
- Skip failed images gracefully (return `false` from helpers)
- Use CORS proxies for external images if needed
- Always cleanup with `finally` block
- Provide progress feedback with state (`isGenerating`)

### 5. LaTeX Rendering in PDF

**Use Case:** Render mathematical formulas and scientific content.

```typescript
import katex from 'katex';

const renderLatexToHtml = (text: string) => {
  return text.replace(/\$([^$]+)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: false
      });
    } catch (e) {
      return formula; // Return raw on error
    }
  });
};

// Capture HTML section as image for PDF
const captureSectionBox = async (
  htmlContent: string,
  width: number
): Promise<{ data: string, height: number } | null> => {
  const temp = document.createElement('div');
  temp.style.width = `${width}mm`;
  temp.innerHTML = htmlContent;
  document.body.appendChild(temp);

  try {
    const canvas = await html2canvas(temp, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const data = canvas.toDataURL('image/png');
    const height = (canvas.height / canvas.width) * width;
    
    return { data, height };
  } finally {
    document.body.removeChild(temp);
  }
};
```

## Common Pitfalls & Solutions

### Issue 1: Downloads Not Working in Embedded Browsers

**Problem:** File downloads fail silently in embedded/headless browsers (e.g., Electron, WebView, automation tools).

**Solution:**
- Test in external browsers (Chrome, Firefox, Edge)
- Document limitation for users
- Consider server-side generation for production
- Use `window.open()` as fallback for some environments

### Issue 2: CORS Errors with External Images

**Problem:** Cannot load images from external domains for canvas/PDF.

**Solutions:**
```typescript
// Option 1: CORS proxy
const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;

// Option 2: Server-side proxy
const proxiedUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

// Option 3: Set crossOrigin
img.crossOrigin = 'Anonymous';
```

### Issue 3: `window.confirm()` Blocked in Automated Tests

**Problem:** Native dialogs don't work in headless browsers.

**Solution:**
```typescript
// Create custom modal component for production
const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState<(value: boolean) => void>();

  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setIsOpen(true);
      setResolver(() => resolve);
    });
  };

  return { confirm, isOpen, setIsOpen, resolver };
};
```

### Issue 4: Large JSON Files Crash Browser

**Problem:** Exporting huge state objects causes memory issues.

**Solution:**
```typescript
// Stream large files
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode(jsonChunk));
    controller.close();
  }
});

// Or split into chunks
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
if (dataStr.length > MAX_SIZE) {
  alert("Archivo muy grande. Considere eliminar datos innecesarios.");
  return;
}
```

## Testing Considerations

### Manual Testing Checklist

- [ ] JSON export creates valid file with correct extension
- [ ] Filename is sanitized (no special characters)
- [ ] JSON import validates structure before applying
- [ ] Reset shows confirmation dialog
- [ ] PDF generation handles missing images gracefully
- [ ] PDF generation completes even with network errors
- [ ] Button states reset after success/failure
- [ ] Works in multiple browsers (Chrome, Firefox, Safari, Edge)

### Automated Testing

```typescript
// Mock file download
const mockDownload = jest.fn();
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

test('exports JSON with correct structure', () => {
  const { getByText } = render(<App />);
  fireEvent.click(getByText('GUARDAR'));
  
  expect(mockDownload).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'application/json' })
  );
});
```

## Browser Compatibility Notes

| Feature | Chrome | Firefox | Safari | Edge | IE11 |
|---------|--------|---------|--------|------|------|
| Blob download | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| FileReader | ✅ | ✅ | ✅ | ✅ | ✅ |
| jsPDF | ✅ | ✅ | ✅ | ✅ | ❌ |
| html2canvas | ✅ | ✅ | ⚠️ | ✅ | ❌ |

⚠️ = Partial support or requires polyfills
❌ = Not supported

## Related Skills

- `scientific-image-integration` - Advanced image handling for PDFs
- `json-storage-pdf` - Complex state management patterns
- `jspdf-formatting` - Advanced PDF layout techniques

## References

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [File API MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_API)
- [Blob MDN](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

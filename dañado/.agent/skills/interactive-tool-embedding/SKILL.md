---
name: interactive-tool-embedding
description: Standardized pattern for embedding external interactive tools (Desmos, Cirkit Designer, etc.) into the report workflow, focusing on state synchronization, image capture, and PDF integration.
---

# Interactive Tool Embedding & Export

This skill defines the architectural pattern for integrating third-party interactive tools (such as Graphing Calculators, Circuit Designers, or Simulation Canvases) into the PhysicsLab report generator. The goal is to allow students to interact with these tools directly within the app and seamlessly export their work as high-quality images for the PDF report.

## Core Architecture

### 1. Component Encapsulation
Create a dedicated React component (e.g., `DesmosGraph.tsx`, `CirkitEmbed.tsx`) to isolate the external tool's logic.
- **Props**: Receives data to visualize (if applicable) and an `onExport` callback.
- **Lifecycle**: Manages the initialization and destruction of the external tool or Iframe.

### 2. State Management (The "Twin Fields" Pattern)
In the main report state (`LabReport` interface), maintain two distinct fields for every integration:
1.  **Source State/Link**: Stores the live state identifier (URL, ID, or JSON config) to restore the interactive view.
    *   *Example*: `desmosLink: string` (stores the graph ID) or `circuitConfig: string`.
2.  **Captured Artifact**: Stores the static Base64 image data for the report.
    *   *Example*: `graphImageUrl: string`.
    *   *Why*: The PDF generator cannot render React components or Iframes; it needs a static image.

### 3. The "Capture & Preview" Workflow
Do not rely on the tool's native save functionality alone. Implement an explicit "Capture to Report" flow:
- **Button**: A prominent "CAMERA" or "EXPORT" button within the component toolbar.
- **Action**: 
    1.  Trigger the tool's export API (e.g., `calculator.screenshot()`) or use an HTML-to-Canvas library.
    2.  Convert result to Base64 (Data URL).
    3.  Call `onExport(base64)`.
- **Preview**: Immediately display the captured image below the tool in the main UI.
    *   *Visual Feedback*: Show a "Check" icon and a "Delete" button to confirm capture.
    *   *User Confidence*: The user must *see* exactly what will appear in the PDF.

### 4. PDF Generation Integration
The PDF generation logic (`jspdf` + `autotable`) handles the image injection:
- **Condition**: Check if the `Captured Artifact` field is present and not empty.
- **Layout**: 
    1.  Check for remaining page space.
    2.  Add a Section Header (e.g., "REPRESENTACIÓN GRÁFICA").
    3.  Inject the image using `doc.addImage(data, ...)` with standardized margins.
    4.  (Optional) Add a footer link back to the live tool using the `Source State/Link`.

### 5. The "Magic Data Transfer" Pattern (Bridging Embed vs. Full Site)
Some tools have limited APIs in their embedded versions (e.g., no login or save buttons). To bridge this gap:
- **Challenge**: Users want to save their work to their personal accounts on the tool's cloud, but the embedded iframe is restricted.
- **Solution**: 
    1.  Create a button **"Export Data to [Tool]"**.
    2.  Format the app's internal data into a format the tool understands (e.g., TSV for Desmos, CSV, or JSON).
    3.  **Copy to Clipboard** automatically using `navigator.clipboard.writeText()`.
    4.  **Open New Tab** to the tool's full website.
    5.  Instruct user to simply **Paste (Ctrl+V)**.
- **Benefit**: Creates a seamless "magic" feeling without complex OAuth integrations.

## Implementation Guide: Cirkit Designer (Future Use Case)

To apply this skill to **Cirkit Designer** (or similar tools):

1.  **Investigation**:
    *   Does it offer an Embed API? (Check for `<iframe>` support or JS SDK).
    *   If Iframe: Use specific URL parameters to load the user's project.
2.  **Component**: `CirkitEmbed`
    *   Input: `Project ID` or `Share URL`.
    *   Render: `<iframe src="...">`
3.  **Capture Strategy**:
    *   *Direct API*: If Cirkit allows `postMessage` requests to get a screenshot.
    *   *Fallback*: If Cross-Origin policies permit, use `html2canvas` on the container.
    *   *Manual*: Allow user to upload the exported image manually if direct capture is blocked by CORS.
4.  **Report State Update**:
    *   Add `cirkitProjectId` and `circuitDiagramUrl` to `LabReport`.

## Code Pattern Example

```typescript
// Component: ExternalTool.tsx
const ExternalTool = ({ config, onExport }) => {
  const handleCapture = async () => {
    const base64 = await toolApi.capture(); // or html2canvas logic
    onExport(base64);
  };

  return (
    <div className="wrapper">
      <ToolCanvas config={config} />
      <button onClick={handleCapture}>📸 Capture for Report</button>
    </div>
  );
};

// Main App.tsx
<ExternalTool 
  config={report.externalId} 
  onExport={(img) => updateReport({ externalSnapshot: img })} 
/>

// Preview Area
{report.externalSnapshot && <img src={report.externalSnapshot} />}
```

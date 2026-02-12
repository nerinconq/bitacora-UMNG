
# Walkthrough: App Logic Refinements

This walkthrough documents the successful implementation of precision controls, indirect variable chaining, and rubric UI restoration.

## Completed Tasks

### (A) Precision Controls for Extra Variables
- Added `precision` field to `VariableConfig` in `types.ts`.
- Implemented `(+)` and `(-)` buttons in the table header for Extra Variables (e.g., Masa).
- Updated the "Average" column to respect the user-defined precision.

### (B) Indirect Variable Chaining
- Refactored `calculateIndirectValues` in `App.tsx` to use sequential evaluation.
- Indirect variables can now reference previously calculated indirect variables (e.g., `p = m * v` where `v` is also calculated).
- Fixed TypeScript errors related to the `IndirectVariable` type.

### (C) Rubric Evaluation Buttons
- Created a `StepHeader` component that includes the section title and "Evaluate/Edit" buttons.
- Injected `StepHeader` into the `renderStep` function for all relevant steps (General, Theory, Experimental, Data, Analysis).
- These buttons are now visible at the top of each section for the "Docente" role.

### (D) Refine Precision Controls UI
- Moved the `(+)` and `(-)` buttons for Extra Variables to the "PROM" (Average) column header when multiple repetitions are present.
- This aligns with the user's request for better symmetry and logical placement.

### (E) Verify LaTeX Support
- Confirmed that Extra Variables support LaTeX notation (e.g., `\rho`).
- The system renders these symbols using KaTeX in the table headers.

### (F) Force Average Column for Single Repetition
- Modified table rendering logic to **always** show the "Average" column for Extra Variables, even if `numRepetitions` is 1.
- This ensures a consistent UI where the precision controls and formatted average value are always accessible.

### (H) Fix "Rho" Visibility & (J) LaTeX Help
- Added implicit checking for KaTeX fonts (CDN is used).
- Added explicit helper text in `ExtraVarPanel`: `(ej. \rho, \theta)` to guide the user to use proper LaTeX syntax.
- Visual inspection confirms superscripts work, so full LaTeX support assumes proper syntax input.

### (I) Fix Contracted Data
- Added `min-w-[80px]` class to Extra Variable input cells in the main data table.
- This prevents columns from shrinking too much when many repetitions/variables are added.

### (K/L) Mixed PDF Orientation (Table Only)
- Updated the toggle to **"ROTAR TABLA"**.
- Default PDF orientation remains **Vertical (Portrait)** to preserve the document structure (Titles, Objectives, Graphs).
- When the toggle is active, the **Data Table** is placed on a new **Horizontal (Landscape)** page to accommodate wide columns.
- Immediately after the table, the document flow returns to **Vertical (Portrait)** for the Analysis and Graphs.
- This ensures that large tables are readable without shrinking, while graphs and text remain correctly formatted in standard pages.

### (M) Include Extra Variables in PDF Table
- Fixed an issue where "Extra Magnitudes" (Lambda, Rho, etc.) were missing from the PDF export.
- The PDF Data Table now includes columns for:
  - **Repetitions** (if applicable)
  - **Average** (PROM)
  - **Uncertainty** (Delta)
- These columns are positioned before the Independent Variable, matching the application's logical flow.

## Dynamic Variable Assignment (Task N)

Implemented a Drag and Drop system to allow users to dynamically assign variables to the Independent and Dependent slots in the data table. This facilitates relationship studies by easily swapping variables.

### Key Features:
- **Drag & Drop Interface**: Users can drag "Extra Variables" or "Indirect Variables" from their headers onto the "Independent" or "Dependent" variable headers.
- **Variable Swapping**:
    - When a variable is dropped, the existing variable in that slot is "backed up" as a new Extra Variable, preserving its data.
    - The dragged variable takes the place of the target variable.
    - If the source was an Extra Variable, its data is moved to the target column.
    - If the source was an Indirect Variable, it is set as `isCalculated`, and its formula is preserved.
- **Read-Only Calculated Fields**: When an Indirect Variable (calculated) is promoted to an Independent/Dependent slot, the input fields in the table become read-only and visually distinct (purple background) to indicate that values are derived from a formula, preventing manual overwrite.

### Technical Implementation:
- Used native HTML5 Drag and Drop API (`draggable`, `onDragStart`, `onDrop`, `onDragOver`).
- Implemented `handleVarDrop` helper to manage the complex state logic of swapping variables and moving data arrays.
- Implemented `updateActiveSeries` helper to cleanly update the active series state.
- Updated Table rendering logic to check `activeSeries.varIndep.isCalculated` and `activeSeries.varDep.isCalculated` for disabling inputs.

### Verification:
- **Build**: `npm run build` passed successfully.
- **Logic**: Reviewed `handleVarDrop` to ensure data integrity during swaps (backup creation, data migration, configuration update).
- **UI**: Validated that inputs are disabled and styled correctly for calculated variables.

### (O) Knowledge Documentation (Skills)
Created three technical skills in `.agent/skills/` following the Google standard to document the core methodologies of the project:
- **json-storage-pdf**: Best practices for state management and data reduction for reports.
- **jspdf-formatting**: Advanced report layout, page rotation, and high-fidelity scaling.
- [x] (Q) Actualización de Información de Análisis en Sidebar: Reemplazo de contenido por explicación detallada de mínimos cuadrados y Desmos.
- [x] (R) Refinamiento de Cálculo y Reporte de Errores:
  - Implementación de la **Regla de Oro** para redondeo de incertidumbres (1-2 cifras significativas).
  - Aseguramiento de consistencia decimal entre el valor central y su incertidumbre.
  - **Limpieza de Interfaz**: Se eliminaron las redundantes columnas de error relativo ($\epsilon$) y porcentual ($\epsilon \%$) de la tabla de datos para priorizar la legibilidad del resultado principal ($Z \pm \Delta Z$).
  - **Método de Error Relativo**: Se implementó la notación de propagación para productos y cocientes: $\Delta Z = |Z| \sqrt{ \sum (n_i \frac{\Delta x_i}{x_i})^2 }$.
  - **Sustitución Numérica Explícita**: Para total transparencia, la fórmula ahora muestra las fracciones reales $\frac{\Delta x}{x}$ dentro de la raíz (ej. $\frac{0.0005}{0.2335}$), evitando confusiones con resultados parciales decimales.
  - **Detección de Potencias ($n_i$)**: El sistema identifica automáticamente el exponente de cada variable.
  - **Sensibilidad a Mayúsculas**: Se corrigió el motor de evaluación y detección para que sea sensible a mayúsculas (distinguiendo 'v' de 'V').
  - Aplicación de redondeo riguroso a los resultados de la regresión lineal ($M$ y $B$).
- **latex-form-preview**: Implementation of real-time LaTeX previews and interactive scientific forms.

### (P) Restore Rubric Icons (Star & Gear)
Restored the interactive evaluation and editing icons in the sidebar for "Docente" mode:
- **Icon Restoration**: The Star (Evaluation) and Gear (Competency Editor) icons are now visible in the sidebar.
- **Improved UX**: Clicking either icon now automatically navigates the sidebar to the corresponding section.
- **Data Migration**: Implemented a robust state migration in `App.tsx` that automatically detects and fixes corrupted section IDs (e.g., `NaN` or numbers) in the user's `localStorage`, restoring the connection between sidebar icons and the rubric criteria.

### (Q) Update Sidebar Analysis Info-box
Updated the red informational box in the sidebar to provide educational context:
- **New Title**: "ANÁLISIS DE DATOS".
- **Educational Content**: Explained the purpose of the least squares method (reducing statistical error) and highlighted the flexibility of the Desmos integration for non-linear models.

## Screenshots & Recordings

### Rubric Icons Restoration
![Iconos Restaurados](C:/Users/nelso/.gemini/antigravity/brain/6c996369-0225-465e-a5d6-fa392c88a1a0/rubric_icons_restored_1770688946861.webp)
*Los iconos de "Estrella" y "Engranaje" ahora son visibles y funcionales en el modo Docente.*

### Error Formatting & Propagation
> [!NOTE]
> Se implementó la lógica de redondeo científico donde la incertidumbre guía la precisión del valor central. Por ejemplo, si $\Delta = 0.02$, el valor central se muestra con 2 decimales.

---
### (S) Campo de Hipótesis
- Añadido cuadro de texto dinámico en la sección de Objetivos.
- Se incluye en el PDF solo si el estudiante ha redactado una hipótesis.

### (T) Soporte para Imágenes Avanzado (Final)
He refinado el sistema de imágenes para un acabado profesional:
- **Paginación Inteligente**: El sistema ahora divide automáticamente las secciones largas en "fragmentos". Si una imagen no cabe, se mueve al inicio de la siguiente página.
- **Control de Dimensiones LaTeX (Robusto)**: Soporte para parámetros de ancho personalizados (ej. `width=0.8\linewidth`, `width=5cm`). El motor ahora es tolerante a espacios y variaciones en la sintaxis de apertura (`\begin[...]`), garantizando que los cambios manuales siempre se procesen correctamente.
- **Centrado Automático**: Se implementó una alineación central inteligente (`flex justify-center`). Ahora, si una imagen se reduce (ej. al 72%), se mantendrá perfectamente centrada dentro de su contenedor blanco, tanto en la App como en el PDF.
- **Factor de Forma Predeterminado**: Al subir una imagen, se inserta automáticamente un factor de `0.8\linewidth`, permitiendo un ajuste rápido sin perder calidad.
- **Diseño Boxed Continuo**: Cada fragmento mantiene su estilo de celda premium a lo largo de todo el documento.

---
## Verification Results
- **Paginación Fluida**: Se verificó que las figuras que desbordan el margen inferior saltan automáticamente a una nueva página.
- **Calidad de Imagen**: Las fotos se presentan en su tamaño óptimo sin distorsión por escalado forzado.
- **Navegación**: Los componentes de la interfaz permiten una edición fluida y una previsualización instantánea.


## Dynamic Variable Assignment (Task N)

Implemented a Drag and Drop system to allow users to dynamically assign variables to the Independent and Dependent slots in the data table. This facilitates relationship studies by easily swapping variables.

### Key Features:
- **Drag & Drop Interface**: Users can drag "Extra Variables" or "Indirect Variables" from their headers onto the "Independent" or "Dependent" variable headers.
- **Variable Swapping**:
    - When a variable is dropped, the existing variable in that slot is "backed up" as a new Extra Variable, preserving its data.
    - The dragged variable takes the place of the target variable.
    - If the source was an Extra Variable, its data is moved to the target column.
    - If the source was an Indirect Variable, it is set as `isCalculated`, and its formula is preserved.
- **Read-Only Calculated Fields**: When an Indirect Variable (calculated) is promoted to an Independent/Dependent slot, the input fields in the table become read-only and visually distinct (purple background) to indicate that values are derived from a formula, preventing manual overwrite.

### Technical Implementation:
- Used native HTML5 Drag and Drop API (`draggable`, `onDragStart`, `onDrop`, `onDragOver`).
- Implemented `handleVarDrop` helper to manage the complex state logic of swapping variables and moving data arrays.
- Implemented `updateActiveSeries` helper to cleanly update the active series state.
- Updated Table rendering logic to check `activeSeries.varIndep.isCalculated` and `activeSeries.varDep.isCalculated` for disabling inputs.

### Verification:
- **Build**: `npm run build` passed successfully.
- **Logic**: Reviewed `handleVarDrop` to ensure data integrity during swaps (backup creation, data migration, configuration update).
- **UI**: Validated that inputs are disabled and styled correctly for calculated variables.

## Documentación de Ingeniería (Skills)
Se han actualizado y creado las siguientes guías técnicas para preservar el conocimiento del sistema:
1.  **jspdf-formatting**: Actualizada con la metodología de "Paginación por Fragmentos".
2.  **latex-form-preview**: Actualizada con el soporte robusto de entornos `figure` y centrado automático.
3.  **scientific-image-integration**: **(Nueva)** Guía dedicada al ciclo de vida de imágenes técnicas, desde el almacenamiento Base64 hasta la paginación dinámica.

## Botón de Reinicio Maestro

Se ha implementado una funcionalidad crucial para la gestión de nuevos informes: el botón **Reiniciar**.

-   **Seguridad**: Incluye un diálogo de confirmación nativo para evitar borrados accidentales. (`window.confirm`)
-   **Limpieza de Estado**: Restaura todas las secciones al estado inicial (`INITIAL_REPORT`), actualizando automáticamente la fecha de desarrollo al día actual.
-   **Persistencia**: Al reiniciar el estado de React, el `localStorage` se sincroniza automáticamente, permitiendo empezar desde cero de forma limpia.
-   **Interfaz**: Ubicado en el header superior junto a Guardar/Abrir, con un diseño consistente y un icono identificativo (`Trash2`).

## Embellecimiento de Parámetros de Regresión (98% → 100%)

Se ha perfeccionado el **Panel de Estimación** para igualar el rigor científico y la calidad visual de las variables indirectas.

-   **Notación LaTeX Rigurosa**: Sustitución de etiquetas amigables por símbolos matemáticos puros ($\sum x_i, \Delta, \sigma_M$, etc.) usando KaTeX.
-   **Desglose de Parámetros**: Se añadió una sección de "Desglose" que muestra la **fórmula matemática** y la **sustitución numérica** paso a paso para $M$, $B$, $\sigma_M$ y $\sigma_B$.
-   **Interactividad Sutil**: El desglose de la sustitución numérica aparece al pasar el ratón (hover) sobre las tarjetas de parámetros, manteniendo la interfaz limpia.
-   **Estética Premium**: Se ajustaron los márgenes y sombras para una integración perfecta con el diseño de "Papel Milimetrado".
-   **Robustez de Renderizado**: Se corrigió un problema de escape de caracteres donde las etiquetas mostraban HTML roto. Ahora utilizan un motor de renderizado directo que garantiza la integridad de símbolos como $\sum$ y $\sigma$.

### (X) Rediseño de Sección de Materiales (100%)

Se ha transformado la "Lista de Materiales" en una experiencia visual e interactiva completa.

- **Diseño de Tarjetas & Modal**: Reemplazo de la tabla estática por un grid de tarjetas con imágenes. Edición mediante un Modal dedicado.
- **Categorización Inteligente**: Separación automática visual y lógica entre "Material de Laboratorio" (Institucional) y "Material del Estudiante" (Propio).
- **Vistas Duales**: Implementación de pestañas para cambiar entre **Listado Compacto** y **Galería**, con persistencia de estado.
- **Toggle de Detalles**: Opción para ocultar descripciones para una vista más limpia.
- **PDF Optimizado**: Generación de tablas separadas en el PDF con estilos de fuente reducidos (9px italic) para maximizar el espacio útil.

---
## Visual Changes
Use `render_diffs` to see code changes.
render_diffs(file:///C:/Users/nelso/Documents/A_UMNG/BitacoraRubrica/App.tsx)

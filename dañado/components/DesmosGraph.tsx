import React, { useEffect, useRef, useState } from 'react';
import { RegressionRow } from '../types';

declare global {
    interface Window {
        Desmos: any;
    }
}

interface DesmosGraphProps {
    data: RegressionRow[];
    regressionParams?: { m: number; b: number; r2: number };
    onExport?: (imageBase64: string) => void;
    height?: string;
    className?: string;
}

export const DesmosGraph: React.FC<DesmosGraphProps> = ({
    data,
    regressionParams,
    onExport,
    height = "500px",
    className = ""
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const calculatorRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportConfig, setExportConfig] = useState({ size: 'medium', thickness: 'medium' });

    // Initialize Calculator
    useEffect(() => {
        if (!containerRef.current || !window.Desmos || calculatorRef.current) return;

        const elt = containerRef.current;

        // Configuración para simular experiencia completa
        const calculator = window.Desmos.GraphingCalculator(elt, {
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
            lockViewport: false,
            expressionsCollapsed: false, // BARRA LATERAL VISIBLE 
            // Habilitar todas las funcionalidades posibles para accesibilidad y edición
            images: true,
            folders: true,
            notes: true,
            links: true,
            keypad: true,
            graphpaper: true,
            projectorMode: false, // Usuario puede activarlo en settings si lo desea
            pasteGraphLink: true
        });

        calculatorRef.current = calculator;

        // FORZAR la actualización de la configuración para asegurar que la barra se muestre
        calculator.updateSettings({
            expressionsCollapsed: false,
            keypad: true
        });

        setIsReady(true);

        return () => {
            calculator.destroy();
            calculatorRef.current = null;
        };
    }, []);

    // Sync Data
    useEffect(() => {
        if (!calculatorRef.current || !isReady) return;

        const calculator = calculatorRef.current;

        // Helper to format e-notation (1.23e-4) to Desmos latex (1.23 \cdot 10^{-4})
        // User Requirement: "escribirse como 6.600*10^-1"
        const formatScientific = (num: number, precision: number) => {
            const str = num.toExponential(precision);
            const [base, exp] = str.split('e');
            // Remove '+' from exponent, keep '-'
            const cleanExp = exp ? exp.replace('+', '') : '';
            return `${base} \\cdot 10^{${cleanExp}}`;
        };

        // 1. Data Table
        const columns = [
            { latex: 'x_1', values: data.map(d => formatScientific(d.x, 4)) },
            { latex: 'y_1', values: data.map(d => formatScientific(d.y, 4)) }
        ];

        calculator.setExpression({
            id: 'data_table',
            type: 'table',
            columns: columns
        });

        // 2. Regression Line if params exist
        if (regressionParams) {
            const { m, b } = regressionParams;
            const mStr = formatScientific(m, 6);
            const bStr = formatScientific(Math.abs(b), 6);
            const sign = b >= 0 ? '+' : '-';

            calculator.setExpression({
                id: 'regression_line',
                latex: `y = ${mStr}x ${sign} ${bStr}`,
                color: '#c74440',
                lineStyle: window.Desmos.Styles.SOLID
            });
        } else {
            calculator.removeExpression({ id: 'regression_line' });
        }

        // Auto-zoom logic handled by Desmos usually, or use setMathBounds if needed

    }, [data, regressionParams, isReady]);

    const handleScreenshot = () => {
        if (!calculatorRef.current || !onExport) return;

        const calculator = calculatorRef.current;

        let width = 800;
        let height = 600;
        let pixelRatio = 1;

        // Config sizes
        switch (exportConfig.size) {
            case 'small': width = 400; height = 300; break;
            case 'medium': width = 800; height = 600; break;
            case 'large': width = 1920; height = 1080; break;
        }

        switch (exportConfig.thickness) {
            case 'thin': pixelRatio = 2; break;
            case 'medium': pixelRatio = 1.5; break;
            case 'thick': pixelRatio = 1; break;
        }

        const screenshot = calculator.screenshot({
            width: width,
            height: height,
            targetPixelRatio: pixelRatio
        });

        onExport(screenshot);
        setShowExportModal(false);
    };

    return (
        <div className={`flex flex-col relative ${className}`}>
            {/* Custom Toolbar Header */}
            <div className="bg-slate-900 text-white p-3 rounded-t-[1.5rem] flex justify-between items-center px-6 shadow-md z-10">
                <span className="font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Calculadora Gráfica
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            // 1. Formatear datos para Desmos (TSV simple)
                            const header = "x_1\ty_1";
                            const rows = data.map(d => `${d.x}\t${d.y}`).join('\n');
                            const tsv = `${header}\n${rows}`;

                            // 2. Copiar al portapapeles
                            navigator.clipboard.writeText(tsv).then(() => {
                                // 3. Abrir Desmos y notificar
                                window.open("https://www.desmos.com/calculator", "_blank");
                                alert("¡Datos copiados al portapapeles!\n\nAl abrir Desmos, presiona Ctrl+V (Pegar) para ver tu tabla de datos.");
                            }).catch(err => {
                                console.error("Error al copiar: ", err);
                                window.open("https://www.desmos.com/calculator", "_blank");
                            });
                        }}
                        className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-white/10 border border-transparent hover:border-emerald-500/30"
                        title="Copia los datos al portapapeles y abre Desmos. ¡Solo pega (Ctrl+V) allá!"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M12 11h.01"></path><path d="M12 16h.01"></path></svg>
                        Exportar Datos a Desmos
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-2 bg-[#004b87] hover:bg-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg border border-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                        Exportar Imagen
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                style={{ width: '100%', height: height }}
                className="border-x-4 border-b-4 border-slate-900 rounded-b-[2rem] overflow-hidden bg-white relative"
            />

            {/* Export Modal Overlay */}
            {showExportModal && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/80 rounded-[2rem] backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 space-y-6 text-slate-800 border-2 border-slate-100">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h3 className="font-black text-xl text-[#004b87]">Exportar Gráfica</h3>
                            <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-100 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-800 leading-relaxed">
                                    <span className="font-bold">Nota:</span> Esta acción guardará una captura de la gráfica actual directamente en su informe. No se descargará ningún archivo.
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Tamaño de Imagen</label>
                                <select
                                    value={exportConfig.size}
                                    onChange={(e) => setExportConfig({ ...exportConfig, size: e.target.value })}
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:border-blue-500 outline-none transition-colors"
                                >
                                    <option value="small">Pequeño (400 x 300 px)</option>
                                    <option value="medium">Mediano (800 x 600 px)</option>
                                    <option value="large">Grande (1920 x 1080 px)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Grosor de Línea</label>
                                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                                    {['thin', 'medium', 'thick'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setExportConfig({ ...exportConfig, thickness: t })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${exportConfig.thickness === t ? 'bg-white shadow-md text-[#004b87] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {t === 'thin' ? 'Delgado' : t === 'medium' ? 'Mediano' : 'Grueso'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleScreenshot}
                                className="w-full py-4 bg-[#004b87] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                Capturar e Insertar
                            </button>
                            <p className="text-[10px] text-center text-slate-400 mt-3">La imagen se añadirá automáticamente a la sección de resultados.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

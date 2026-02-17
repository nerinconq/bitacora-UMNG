import React, { useState, useRef } from 'react';
import { ExternalLink, Upload, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';

interface CirkitEmbedProps {
    projectUrl?: string;
    imageUrl?: string;
    onUpdate: (data: { projectUrl?: string; imageUrl?: string }) => void;
}

import { compressImage } from '../utils/imageCompression';

export const CirkitEmbed: React.FC<CirkitEmbedProps> = ({ projectUrl = '', imageUrl = '', onUpdate }) => {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        try {
            const compressed = await compressImage(file, 1024, 0.7); // 1024px max for schematic, better quality
            onUpdate({ imageUrl: compressed });
        } catch (error) {
            console.error("Compression error", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Embedded Editor */}
            <div className="w-full h-[600px] bg-slate-100 rounded-3xl overflow-hidden border-4 border-slate-200 shadow-inner relative group">
                <iframe
                    src={projectUrl || "https://app.cirkitdesigner.com/project"}
                    title="Cirkit Designer Editor"
                    className="w-full h-full"
                    allow="clipboard-read; clipboard-write"
                />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                        href={projectUrl || "https://app.cirkitdesigner.com/project"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur text-blue-600 rounded-xl shadow-lg hover:bg-white font-bold text-xs uppercase tracking-widest"
                    >
                        <ExternalLink size={14} />
                        Abrir en Nueva Pestaña
                    </a>
                </div>
            </div>

            {/* Controls & Upload */}
            <div className="p-8 bg-white rounded-[3rem] shadow-xl border-2 border-slate-50">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-[#004b87] uppercase tracking-tighter flex items-center gap-3">
                            <ImageIcon className="w-6 h-6 text-[#9e1b32]" />
                            Captura del Esquema
                        </h3>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-2xl">
                            1. Diseña tu circuito en el editor de arriba. <br />
                            2. Exporta la imagen (PNG) desde Cirkit Designer. <br />
                            3. Sube esa imagen aquí para incluirla en el reporte PDF.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Link Section */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                            Enlace del Proyecto (Para recargar futuro)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={projectUrl}
                                onChange={(e) => onUpdate({ projectUrl: e.target.value })}
                                placeholder="https://app.cirkitdesigner.com/project/..."
                                className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 text-sm font-medium text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                            Imagen Exportada
                        </label>

                        {!imageUrl ? (
                            <div
                                className={`relative h-32 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleChange}
                                />
                                <Upload className="h-8 w-8 text-slate-300 mb-2" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Click o Arrastrar Imagen
                                </span>
                            </div>
                        ) : (
                            <div className="relative h-32 group border-4 border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                                <img
                                    src={imageUrl}
                                    alt="Circuit Schematic"
                                    className="w-full h-full object-contain p-2"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <button
                                        onClick={() => onUpdate({ imageUrl: '' })}
                                        className="bg-red-500 text-white p-3 rounded-xl shadow-lg hover:bg-red-600 transition-transform hover:scale-110"
                                        title="Eliminar imagen"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-md z-10">
                                    <CheckCircle2 size={12} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


import React, { useState, useEffect, useRef } from 'react';
import pinoutsData from '../utils/pinouts.json';
import html2canvas from 'html2canvas';
import { Info, Cpu, Plus, Globe, X, Edit2, Save, Trash2, Download, Loader2 } from 'lucide-react';
import { compressImage } from '../utils/imageCompression';

interface Pin {
    pin: number | string;
    name: string;
    type: string;
    description: string;
    x?: number;
    y?: number;
}

interface Board {
    id: string;
    name: string;
    imageUrl: string;
    pins: Pin[];
}

interface GPIOViewerBoard {
    name: string;
    image: string;
    pins: string;
}

interface PinoutViewerProps {
    onSelectBoard: (boardId: string) => void;
    selectedBoardId?: string;
    codeContent?: string;
    initialBoardState?: any;
    onExportToAppendix?: (boardName: string, imageUrl: string, boardState?: any) => void;
    onBoardStateChange?: (boardState: any) => void;
}

const GPIO_BASE_URL = "https://thelastoutpostworkshop.github.io/microcontroller_devkit/gpio_viewer_1_5/";

export const PinoutViewer: React.FC<PinoutViewerProps> = ({ onSelectBoard, selectedBoardId, codeContent, initialBoardState, onExportToAppendix, onBoardStateChange }) => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [activeBoard, setActiveBoard] = useState<Board | null>(null);
    const [hoveredPin, setHoveredPin] = useState<Pin | null>(null);
    const [showLibrary, setShowLibrary] = useState(false);
    const [libraryBoards, setLibraryBoards] = useState<GPIOViewerBoard[]>([]);
    const [isLoadingLib, setIsLoadingLib] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const captureRef = useRef<HTMLDivElement>(null);

    // Editing State
    const [editPinForm, setEditPinForm] = useState<Pin>({ pin: '', name: '', type: 'GPIO', description: '' });
    const [editingPinIndex, setEditingPinIndex] = useState<number | null>(null);

    // --- NEW: Auto-parse from Code Content ---
    useEffect(() => {
        if (!activeBoard || !codeContent) return;

        const newPins: Pin[] = [];
        const existingPins = new Set(activeBoard.pins.map(p => p.pin.toString().toUpperCase()));

        const addIfNotExists = (pinStr: string, name: string, type: string, desc: string) => {
            if (!existingPins.has(pinStr.toUpperCase()) && !newPins.find(p => p.pin.toString().toUpperCase() === pinStr.toUpperCase())) {
                newPins.push({ pin: pinStr, name: name, type, description: desc });
            }
        };

        // Parse Custom Wire Pins: Wire.begin(sda, scl) OR Wire.setPins(sda, scl)
        const wireCustomRegex = /Wire\.(?:begin|setPins)\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/;
        const wireMatch = codeContent.match(wireCustomRegex);
        if (wireMatch) {
            addIfNotExists(wireMatch[1], `${wireMatch[1]} (SDA)`, 'GPIO', 'I2C Data (Auto-detectado)');
            addIfNotExists(wireMatch[2], `${wireMatch[2]} (SCL)`, 'GPIO', 'I2C Clock (Auto-detectado)');
        } else if (codeContent.includes('Wire.begin')) {
            addIfNotExists('SDA', 'SDA', 'GPIO', 'I2C Data (Auto-detectado)');
            addIfNotExists('SCL', 'SCL', 'GPIO', 'I2C Clock (Auto-detectado)');
        }

        // Parse Custom Serial Pins: SerialX.begin(baud, serial_config, rx, tx) or Serial.setRxTx(rx, tx)
        // Keep it simple: standard Serial.begin implies default TX/RX
        if (codeContent.includes('Serial.begin')) {
            addIfNotExists('TX', 'TX', 'UART', 'Serial Transmit (Auto-detectado)');
            addIfNotExists('RX', 'RX', 'UART', 'Serial Receive (Auto-detectado)');
        }

        // Parse pinMode
        const pinModeRegex = /pinMode\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([A-Z_]+)\s*\)/g;
        let match;
        // Reset the lastIndex just in case
        pinModeRegex.lastIndex = 0;
        let count = 0;
        while ((match = pinModeRegex.exec(codeContent)) !== null && count < 50) {
            count++;
            const pinVal = match[1];
            const modeVal = match[2]; // INPUT, OUTPUT, INPUT_PULLUP
            addIfNotExists(pinVal, `${pinVal} (${modeVal})`, 'GPIO', `Configurado como ${modeVal} (Auto-detectado)`);
        }

        if (newPins.length > 0) {
            const updatedBoard = {
                ...activeBoard,
                pins: [...activeBoard.pins, ...newPins]
            };
            setActiveBoard(updatedBoard);
            setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
        }
    }, [codeContent, activeBoard?.id]); // Only run when code changes or board switches to new board.

    useEffect(() => {
        // Initialize with default data and templates if empty
        const initialBoards = (pinoutsData as Board[]).length > 0 ? (pinoutsData as Board[]) : [];

        // Add Templates if not present
        if (!initialBoards.find(b => b.name.includes("ESP32-WROOM"))) {
            initialBoards.push({
                id: 'esp32-wroom-template',
                name: 'ESP32-WROOM (Template)',
                imageUrl: `${GPIO_BASE_URL}devboards_images/ESP32-NodeMCU-32S.png`,
                pins: [
                    { pin: '3V3', name: '3V3', type: 'POWER', description: '3.3V Power', x: 23, y: 15 },
                    { pin: 'GND', name: 'GND', type: 'POWER', description: 'Ground', x: 77, y: 15 },
                    { pin: 2, name: 'D2', type: 'GPIO', description: 'Onboard LED', x: 77, y: 65 },
                    { pin: 15, name: 'D15', type: 'GPIO', description: 'GPIO', x: 23, y: 65 },
                ]
            });
        }
        if (!initialBoards.find(b => b.name.includes("ESP32-S3"))) {
            initialBoards.push({
                id: 'esp32-s3-template',
                name: 'ESP32-S3-WROOM-1 (Template)',
                imageUrl: `${GPIO_BASE_URL}devboards_images/esp32-s3-wroom-1.png`,
                pins: [
                    { pin: '3V3', name: '3V3', type: 'POWER', description: 'Power', x: 21, y: 18 },
                    { pin: 'GND', name: 'GND', type: 'POWER', description: 'Ground', x: 79, y: 18 },
                    { pin: 1, name: '1 (TX)', type: 'UART', description: 'Serial TX', x: 79, y: 25 },
                    { pin: 3, name: '3 (RX)', type: 'UART', description: 'Serial RX', x: 79, y: 28 },
                    { pin: 0, name: '0 (BOOT)', type: 'GPIO', description: 'Boot Button', x: 79, y: 55 },
                ]
            });
        }

        setBoards(initialBoards);

        if (initialBoardState) {
            setActiveBoard(initialBoardState);
            onSelectBoard(initialBoardState.id);
        } else if (selectedBoardId) {
            const found = initialBoards.find(b => b.id === selectedBoardId);
            if (found) setActiveBoard(found);
        } else {
            // Default to ESP32-S3 as requested
            const s3 = initialBoards.find(b => b.id === 'esp32-s3-template');
            if (s3) {
                setActiveBoard(s3);
                onSelectBoard(s3.id);
            } else if (initialBoards.length > 0) {
                setActiveBoard(initialBoards[0]);
                onSelectBoard(initialBoards[0].id);
            }
        }
    }, []);

    // Sync board state upward automatically for persistence without requiring 'Exportar' click
    useEffect(() => {
        if (activeBoard && onBoardStateChange) {
            onBoardStateChange(activeBoard);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBoard]);

    const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const boardId = e.target.value;
        const board = boards.find(b => b.id === boardId);
        if (board) {
            setActiveBoard(board);
            onSelectBoard(boardId);
            setIsEditing(false); // Exit edit mode on switch
        }
    };

    const handleUploadBoard = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 800, 0.6);
                const newBoard: Board = {
                    id: `custom-${Date.now()}`,
                    name: `Custom Board (${file.name.substring(0, 10)}...)`,
                    imageUrl: compressedBase64,
                    pins: []
                };
                setBoards(prev => [...prev, newBoard]);
                setActiveBoard(newBoard);
                onSelectBoard(newBoard.id);
            } catch (err) {
                console.error("Error compressing board image", err);
                alert("Error al procesar la imagen de la placa.");
            }
        }
    };

    const loadLibrary = async () => {
        setIsLoadingLib(true);
        try {
            const res = await fetch(`${GPIO_BASE_URL}boards.json`);
            if (!res.ok) throw new Error("Failed to fetch library");
            const data: GPIOViewerBoard[] = await res.json();
            setLibraryBoards(data);
        } catch (err) {
            console.error(err);
            alert("Error cargando la biblioteca online. Verifique su conexión.");
        } finally {
            setIsLoadingLib(false);
        }
    };

    const handleSelectLibraryBoard = (libBoard: GPIOViewerBoard) => {
        const newBoard: Board = {
            id: `lib-${Date.now()}`,
            name: libBoard.name,
            imageUrl: `${GPIO_BASE_URL}${libBoard.image}`,
            pins: [] // Pins imported from this library don't have descriptions, so we start empty for manual entry
        };
        setBoards(prev => [...prev, newBoard]);
        setActiveBoard(newBoard);
        onSelectBoard(newBoard.id);
        setShowLibrary(false);
        setIsEditing(true); // Auto-enter edit mode for convenience
    };

    const handleAddPin = () => {
        if (!activeBoard) return;

        // Prevent exact duplicates
        if (activeBoard.pins.some(p => p.pin.toString().toUpperCase() === editPinForm.pin.toString().toUpperCase() && p.name === editPinForm.name)) {
            alert(`El pin ${editPinForm.pin} ya existe en la lista. En su lugar, usa el botón de editar (lápiz) para modificar su posición u otros detalles.`);
            return;
        }

        const updatedBoard = {
            ...activeBoard,
            pins: [...activeBoard.pins, { ...editPinForm }]
        };
        // Update local state
        setActiveBoard(updatedBoard);
        setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
        setEditPinForm({ pin: '', name: '', type: 'GPIO', description: '', x: undefined, y: undefined });
    };

    const handleUpdatePin = (idx: number) => {
        if (!activeBoard) return;
        const updatedPins = [...activeBoard.pins];
        updatedPins[idx] = { ...editPinForm };
        const updatedBoard = {
            ...activeBoard,
            pins: updatedPins
        };
        setActiveBoard(updatedBoard);
        setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
        setEditPinForm({ pin: '', name: '', type: 'GPIO', description: '', x: undefined, y: undefined });
        setEditingPinIndex(null);
    };

    const handleDeletePin = (idx: number) => {
        if (!activeBoard) return;
        const updatedPins = [...activeBoard.pins];
        updatedPins.splice(idx, 1);
        const updatedBoard = { ...activeBoard, pins: updatedPins };
        setActiveBoard(updatedBoard);
        setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
    };

    // Visual Editor Click Handler
    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEditing || !imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Auto-fill coordinates and focus form
        setEditPinForm({ ...editPinForm, x, y });
    };

    return (
        <div className="flex gap-4 lg:gap-8 h-[780px] font-sans relative">
            {/* Library Modal Overlay */}
            {showLibrary && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm rounded-[2.5rem] flex flex-col p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Globe className="text-blue-400" /> Biblioteca Online GPIOViewer
                        </h2>
                        <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-slate-800 rounded-full text-white">
                            <X />
                        </button>
                    </div>
                    {isLoadingLib ? (
                        <div className="flex-1 flex items-center justify-center text-blue-400 animate-pulse">Cargando catálogo...</div>
                    ) : (
                        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-2 custom-scrollbar">
                            {libraryBoards.map((lb, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectLibraryBoard(lb)}
                                    className="group bg-slate-800 p-4 rounded-xl hover:bg-slate-700 transition-all border border-slate-700 hover:border-blue-500 text-left flex flex-col gap-3"
                                >
                                    <div className="aspect-video bg-white rounded-lg p-2 flex items-center justify-center overflow-hidden">
                                        <img src={`${GPIO_BASE_URL}${lb.image}`} alt={lb.name} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <span className="font-bold text-slate-200 text-sm group-hover:text-blue-300 line-clamp-2">{lb.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Left Panel: Display */}
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border-4 border-slate-50 p-6 lg:p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 -z-0">
                    <Cpu size={200} />
                </div>

                <div className="flex flex-wrap justify-between items-center mb-6 z-10 gap-4">
                    <div className="flex items-center gap-2 lg:gap-4 flex-1">
                        <div className="bg-blue-100 p-2 rounded-xl text-blue-700 hidden sm:block"><Cpu size={24} /></div>
                        <select
                            value={activeBoard?.id || ''}
                            onChange={handleBoardChange}
                            className="bg-slate-50 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl p-2 outline-none focus:border-blue-500 transition-colors uppercase tracking-wider max-w-[150px] lg:max-w-[200px]"
                        >
                            {boards.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-1">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-slate-100 text-slate-500 hover:bg-slate-200 p-2 rounded-xl transition-colors"
                                title="Subir imagen propia"
                            >
                                <input type="file" ref={fileInputRef} onChange={handleUploadBoard} className="hidden" accept="image/*" />
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={() => { setShowLibrary(true); loadLibrary(); }}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-xl transition-colors"
                                title="Explorar Biblioteca Online"
                            >
                                <Globe size={18} />
                            </button>
                        </div>
                    </div>

                    {activeBoard && onExportToAppendix && (
                        <button
                            onClick={async () => {
                                if (activeBoard && onExportToAppendix && captureRef.current) {
                                    setIsExporting(true);
                                    try {
                                        // Use proxy for Board Image if needed (handled in App.tsx globally? No, here we need it for canvas)
                                        // Actually html2canvas handle CORS if useCORS is true and server allows it.
                                        // Check if image is proxy-able ?
                                        const canvas = await html2canvas(captureRef.current, {
                                            useCORS: true,
                                            scale: 2, // Retinal
                                            backgroundColor: null, // Transparent if possible
                                            logging: false
                                        });

                                        // Auto-crop transparent pixels from edges to fix PDF scaling issues
                                        const ctx = canvas.getContext('2d');
                                        let base64 = canvas.toDataURL('image/png');
                                        if (ctx) {
                                            const w = canvas.width;
                                            const h = canvas.height;
                                            const imgData = ctx.getImageData(0, 0, w, h);
                                            const data = imgData.data;

                                            let minX = w, minY = h, maxX = 0, maxY = 0;
                                            for (let y = 0; y < h; y++) {
                                                for (let x = 0; x < w; x++) {
                                                    const alpha = data[(y * w + x) * 4 + 3];
                                                    if (alpha > 0) {
                                                        if (x < minX) minX = x;
                                                        if (x > maxX) maxX = x;
                                                        if (y < minY) minY = y;
                                                        if (y > maxY) maxY = y;
                                                    }
                                                }
                                            }

                                            const cropW = maxX - minX + 1;
                                            const cropH = maxY - minY + 1;

                                            // If valid bounds found and it actually needs cropping (saving space)
                                            if (cropW > 0 && cropH > 0 && (cropW < w || cropH < h)) {
                                                const cropCanvas = document.createElement('canvas');
                                                cropCanvas.width = cropW;
                                                cropCanvas.height = cropH;
                                                const cropCtx = cropCanvas.getContext('2d');
                                                cropCtx?.putImageData(ctx.getImageData(minX, minY, cropW, cropH), 0, 0);
                                                base64 = cropCanvas.toDataURL('image/png');
                                            }
                                        }

                                        onExportToAppendix(activeBoard.name, base64, activeBoard);
                                    } catch (e) {
                                        console.error("Export failed", e);
                                        alert("Error al exportar. Intente nuevamente.");
                                    } finally {
                                        setIsExporting(false);
                                    }
                                }
                            }}
                            disabled={isExporting}
                            className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Exportar
                        </button>
                    )}
                </div>

                <div className="flex-1 flex items-center justify-center relative bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4 overflow-hidden">
                    {activeBoard ? (
                        <div
                            ref={captureRef}
                            className={`relative group w-full h-full flex items-center justify-center ${isEditing ? 'cursor-crosshair' : 'cursor-default'}`}
                            onClick={handleImageClick}
                        >
                            <img
                                ref={imageRef}
                                src={activeBoard.imageUrl?.includes('http') && !activeBoard.imageUrl.includes('weserv')
                                    ? `https://images.weserv.nl/?url=${encodeURIComponent(activeBoard.imageUrl.replace(/^https?:\/\//, ''))}`
                                    : activeBoard.imageUrl}
                                crossOrigin="anonymous"
                                alt={activeBoard.name}
                                className="max-w-full max-h-full object-contain shadow-lg rounded-lg transition-transform relative z-10 pointer-events-none"
                            />

                            {/* Visual Editor Overlay: New Pin Marker */}
                            {isEditing && editPinForm.x !== undefined && editPinForm.y !== undefined && (
                                <div
                                    className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse z-20 pointer-events-none"
                                    style={{ top: `${editPinForm.y}%`, left: `${editPinForm.x}%`, transform: 'translate(-50%, -50%)' }}
                                />
                            )}

                            {/* Line connections for pins */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                {activeBoard.pins.map((pin, idx) => {
                                    if (pin.x === undefined || pin.y === undefined) return null;
                                    const isLeft = Number(pin.x) < 50;
                                    const labelX = isLeft ? 15 : 85;
                                    return (
                                        <line
                                            key={`line-${idx}`}
                                            x1={`${labelX}%`}
                                            y1={`${pin.y}%`}
                                            x2="50%"
                                            y2={`${pin.y}%`}
                                            stroke={
                                                pin.type === 'POWER' ? '#ef4444' :
                                                    pin.type === 'GPIO' ? '#22c55e' :
                                                        pin.type === 'ADC' ? '#a855f7' : '#64748b'
                                            }
                                            strokeWidth="2"
                                            className="opacity-50"
                                            strokeDasharray="4 4"
                                        />
                                    );
                                })}
                            </svg>

                            {/* Existing Pins Overlay */}
                            {activeBoard.pins.map((pin, idx) => {
                                if (pin.x === undefined || pin.y === undefined) return null;
                                const isLeft = Number(pin.x) < 50;
                                return (
                                    <div
                                        key={idx}
                                        className={`absolute whitespace-nowrap px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-sm border transform -translate-y-1/2 transition-all cursor-pointer z-10 flex items-center justify-center min-w-max text-center leading-tight
                                            ${isLeft ? '-translate-x-full' : 'translate-x-0'}
                                            ${hoveredPin === pin ? 'scale-125 z-30 ring-2 ring-white' : ''}
                                            ${pin.type === 'POWER' ? 'bg-red-500 text-white border-red-700' :
                                                pin.type === 'GPIO' ? 'bg-green-500 text-white border-green-700' :
                                                    pin.type === 'ADC' ? 'bg-purple-500 text-white border-purple-700' : 'bg-slate-500 text-white border-slate-700'}`}
                                        style={{ top: `${pin.y}%`, left: `${isLeft ? 15 : 85}%` }}
                                        onMouseEnter={() => setHoveredPin(pin)}
                                        onMouseLeave={() => setHoveredPin(null)}
                                        onClick={(e) => { e.stopPropagation(); setHoveredPin(pin); }}
                                    >
                                        {pin.name}
                                    </div>
                                );
                            })}

                            {activeBoard.pins.length === 0 && !isEditing && (
                                <div className="absolute bottom-4 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full opacity-80 backdrop-blur-sm border border-yellow-200 shadow-sm animate-bounce">
                                    💡 Tip: Activa el modo edición y haz clic en la placa para añadir pines
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-slate-400 font-bold">Seleccione una placa</div>
                    )}
                </div>
            </div>

            {/* Right Panel: Pin Details */}
            <div className="w-44 lg:w-48 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl p-6 lg:p-8 flex flex-col overflow-hidden border border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center text-blue-400">
                        <Info size={16} className="mr-3" /> Pinout
                    </h3>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        title={isEditing ? "Terminar edición" : "Editar pines"}
                    >
                        {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
                    </button>
                </div>

                {/* Edit Form */}
                {isEditing && (
                    <div className="mb-4 bg-slate-800 p-3 rounded-xl border border-slate-700 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="text-[10px] bg-slate-700/50 text-slate-400 p-2 rounded mb-2 text-center">
                            {editPinForm.x !== undefined ? "✅ Posición capturada" : "👆 Haz clic en la imagen para ubicar"}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input
                                placeholder="Pin #"
                                className="bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white focus:border-blue-500 outline-none"
                                value={editPinForm.pin}
                                onChange={e => setEditPinForm({ ...editPinForm, pin: e.target.value })}
                            />
                            <select
                                className="bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white focus:border-blue-500 outline-none"
                                value={editPinForm.type}
                                onChange={e => setEditPinForm({ ...editPinForm, type: e.target.value })}
                            >
                                <option value="GPIO">GPIO</option>
                                <option value="POWER">PWR</option>
                                <option value="ADC">ADC</option>
                                <option value="UART">UART</option>
                            </select>
                        </div>
                        <input
                            placeholder="Nombre Funcional (e.g. D2)"
                            className="bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white w-full mb-2 focus:border-blue-500 outline-none"
                            value={editPinForm.name}
                            onChange={e => setEditPinForm({ ...editPinForm, name: e.target.value })}
                        />
                        <input
                            placeholder="Descripción"
                            className="bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white w-full mb-2 focus:border-blue-500 outline-none"
                            value={editPinForm.description}
                            onChange={e => setEditPinForm({ ...editPinForm, description: e.target.value })}
                        />
                        <button
                            onClick={() => {
                                if (editingPinIndex !== null) {
                                    handleUpdatePin(editingPinIndex);
                                } else {
                                    handleAddPin();
                                }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                        >
                            {editingPinIndex !== null ? <Save size={12} /> : <Plus size={12} />}
                            {editingPinIndex !== null ? 'Actualizar Pin' : 'Añadir Pin'}
                        </button>
                        {editingPinIndex !== null && (
                            <button
                                onClick={() => {
                                    setEditingPinIndex(null);
                                    setEditPinForm({ pin: '', name: '', type: 'GPIO', description: '', x: undefined, y: undefined });
                                }}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] py-1 mt-1 rounded-lg transition-colors"
                            >
                                Cancelar Edición
                            </button>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {activeBoard?.pins.map((pin, idx) => (
                        <div
                            key={idx}
                            className={`group p-3 rounded-xl transition-colors border cursor-pointer relative
                                ${hoveredPin === pin ? 'bg-slate-700 border-blue-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                            onMouseEnter={() => setHoveredPin(pin)}
                            onMouseLeave={() => setHoveredPin(null)}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-mono font-bold text-yellow-400 text-xs shadow-black/50 drop-shadow-sm">
                                    {typeof pin.pin === 'number' ? `PIN ${pin.pin}` : pin.pin}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${pin.type === 'POWER' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                    pin.type === 'GPIO' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                        pin.type === 'ADC' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                            'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                    }`}>
                                    {pin.type}
                                </span>
                            </div>
                            <div className="text-sm font-bold text-slate-200">{pin.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1 leading-tight group-hover:text-blue-200 transition-colors">
                                {pin.description}
                            </div>

                            {isEditing && (
                                <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditPinForm(pin); setEditingPinIndex(idx); }}
                                        className="bg-blue-500 text-white p-1 rounded-full shadow-md hover:bg-blue-600"
                                        title="Editar pin"
                                    >
                                        <Edit2 size={10} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeletePin(idx); }}
                                        className="bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                        title="Eliminar pin"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {activeBoard?.pins.length === 0 && !isEditing && (
                        <div className="text-center text-slate-500 text-xs mt-10 px-4">
                            No hay pines definidos.<br />
                            <span className="text-blue-400 cursor-pointer" onClick={() => setIsEditing(true)}>Activa la edición</span> para añadir uno.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

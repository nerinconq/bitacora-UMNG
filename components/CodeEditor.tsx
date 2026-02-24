
import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
// Using a dark theme for better code visibility
import 'prismjs/themes/prism-okaidia.css';
import { Copy, Wand2, Info, Check, MonitorPlay } from 'lucide-react';

interface CodeEditorProps {
    initialCode: string | { cpp: string; python: string; javascript: string };
    onUpdate: (code: string, language: string, allCode: { cpp: string; python: string; javascript: string }) => void;
    selectedBoard: string;
}

const DEFAULT_CODE = {
    cpp: '// C++ (Arduino) Code for ESP32\nvoid setup() {\n  pinMode(2, OUTPUT);\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  digitalWrite(2, HIGH);\n  delay(1000);\n  digitalWrite(2, LOW);\n  delay(1000);\n}',
    python: '# MicroPython Code for ESP32\nimport machine\nimport time\n\nled = machine.Pin(2, machine.Pin.OUT)\n\nwhile True:\n    led.value(1)\n    time.sleep(1)\n    led.value(0)\n    time.sleep(1)',
    javascript: '// JavaScript (Moddable) Code for ESP32\nlet led = new Host.Pin(2);\n\nwhile (true) {\n  led.write(1);\n  System.delay(1000);\n  led.write(0);\n  System.delay(1000);\n}'
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode, onUpdate, selectedBoard }) => {
    const [activeTab, setActiveTab] = useState<'cpp' | 'python' | 'javascript'>('cpp');
    const [showAI, setShowAI] = useState(false);
    // Initialize state ensuring it's always an object
    const [code, setCode] = useState(() => {
        if (typeof initialCode === 'string') {
            return {
                ...DEFAULT_CODE,
                [(selectedBoard || 'cpp') as 'cpp' | 'python' | 'javascript']: initialCode
            };
        }
        return initialCode || DEFAULT_CODE;
    });
    const [copied, setCopied] = useState(false);

    // Sync active tab with selected board if provided
    useEffect(() => {
        if (selectedBoard && ['cpp', 'python', 'javascript'].includes(selectedBoard)) {
            setActiveTab(selectedBoard as any);
        }
    }, [selectedBoard]);

    useEffect(() => {
        if (typeof initialCode === 'string') {
            setCode(prev => ({
                ...prev,
                [(selectedBoard || activeTab) as 'cpp' | 'python' | 'javascript']: initialCode
            }));
        } else if (initialCode) {
            setCode(initialCode);
        }
    }, [initialCode, selectedBoard, activeTab]);

    const handleCodeChange = (newCode: string) => {
        const updated = { ...code, [activeTab]: newCode };
        setCode(updated);
        onUpdate(newCode, activeTab, updated);
    };

    const handleTranslate = () => {
        setShowAI(!showAI);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Top AI Iframe Tool */}
            {showAI && (
                <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-2xl border-4 border-slate-200 h-[650px] w-full relative group transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full bg-slate-100 p-2 flex justify-between items-center border-b border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 flex items-center gap-2"><Wand2 size={14} /> CodeConvert.AI Embed</span>
                        <button onClick={() => setShowAI(false)} className="text-slate-400 hover:text-red-500 mr-2 text-xs font-bold uppercase">Cerrar IA</button>
                    </div>
                    <iframe
                        src="https://www.codeconvert.ai/c++-to-python-converter"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        title="CodeConvert AI"
                        className="w-full h-full"
                    />
                </div>
            )}

            {/* Local Code Editor (For formatting & PDF export) */}
            <div className={`bg-slate-900 rounded-[1.5rem] overflow-hidden shadow-2xl border-4 border-slate-800 flex flex-col ${showAI ? 'h-[400px]' : 'h-[650px]'} font-sans transition-all duration-300`}>
                {/* MAC OS Style Toolbar */}
                <div className="bg-slate-950 p-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex gap-2 ml-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors" />
                        <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
                    </div>
                    <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <MonitorPlay size={10} /> {selectedBoard}
                    </div>
                    <div className="w-16"></div> {/* Spacer for alignment */}
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-950 border-b border-slate-800 px-2 pt-2 gap-1 overflow-x-auto">
                    {[
                        { id: 'cpp', label: 'main.cpp', icon: 'C++' },
                        { id: 'python', label: 'script.py', icon: 'Py' },
                        { id: 'javascript', label: 'app.js', icon: 'JS' }
                    ].map(lang => (
                        <button
                            key={lang.id}
                            onClick={() => setActiveTab(lang.id as any)}
                            className={`
                px-4 py-2 text-xs font-medium rounded-t-lg flex items-center gap-2 transition-all
                ${activeTab === lang.id
                                    ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500'
                                    : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300 border-t-2 border-transparent'}
              `}
                        >
                            <span className={`font-black text-[9px] px-1 rounded ${lang.id === 'cpp' ? 'bg-blue-900/50 text-blue-400' :
                                lang.id === 'python' ? 'bg-yellow-900/50 text-yellow-400' :
                                    'bg-green-900/50 text-green-400'
                                }`}>{lang.icon}</span>
                            {lang.label}
                        </button>
                    ))}
                </div>

                {/* Toolbar Actions */}
                <div className="flex items-center justify-between p-2 bg-slate-950 border-b border-slate-800">
                    <div className="flex items-center text-[10px] text-slate-500 gap-4 pl-2">
                        <span>UTF-8</span>
                        <span>{code[activeTab].split('\n').length} lines</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleTranslate}
                            className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg
                    ${showAI
                                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:shadow-purple-500/30 hover:scale-105 active:scale-95'
                                }
                `}
                        >
                            <Wand2 size={13} />
                            {showAI ? 'Ocultar Traductor IA' : 'Mostrar Traductor IA'}
                            {!showAI && <span className="bg-white/20 px-1 rounded text-[8px] ml-1">WEB</span>}
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                            title="Copiar código"
                        >
                            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-auto relative custom-scrollbar bg-slate-900">
                    <Editor
                        value={code[activeTab]}
                        onValueChange={handleCodeChange}
                        highlight={code => highlight(code, activeTab === 'python' ? languages.python : activeTab === 'javascript' ? languages.javascript : languages.cpp, activeTab)}
                        padding={20}
                        className="min-h-full font-mono text-sm leading-relaxed"
                        style={{
                            fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
                            fontSize: 14,
                            backgroundColor: '#0f172a', // Slate-900 hardcoded for editor bg
                            color: '#f8f8f2'
                        }}
                        textareaClassName="focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
};

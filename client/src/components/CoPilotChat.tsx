import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Save, Loader2, Bot, User, FileText, RefreshCw, Mic, MicOff, Calendar, ListChecks, AlertTriangle, Book, Activity } from 'lucide-react';
import { getCoPilotSuggestion, summarizeChatToSoap, generateSessionScript, consultCoreLibrary, generatePostSessionAnalysis, monitorActiveProcesses } from '../lib/gemini';
import { generateSOAPPreview } from '../lib/soap-preview';
import { usePatients } from '../context/PatientContext';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

interface CoPilotChatProps {
    onSessionEnd: () => void;
    onAnalysisUpdate?: (analysis: { active_nodes?: any[] }) => void;
}

export const CoPilotChat: React.FC<CoPilotChatProps> = ({ onSessionEnd, onAnalysisUpdate }) => {
    const { currentPatient, updatePatient } = usePatients();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [soapPreview, setSOAPPreview] = useState<any>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [lastPreviewCount, setLastPreviewCount] = useState(0);

    // Radar PBT (Live)
    const [activeProcesses, setActiveProcesses] = useState<any[]>([]);

    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const [interimTranscript, setInterimTranscript] = useState('');

    // Session Script (GPS Terapêutico)
    const [sessionScript, setSessionScript] = useState<string | null>(null);
    const [isCrisisMode, setIsCrisisMode] = useState(false);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

    // Library Consultant
    const [isConsultingLibrary, setIsConsultingLibrary] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const autoSendTimerRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    // ... (rest of useEffects)

    const handleConsultLibrary = async () => {
        if (messages.length === 0) {
            alert("Comece a sessão ou digite algo para dar contexto ao bibliotecário.");
            return;
        }

        setIsConsultingLibrary(true);
        try {
            // Build context from last messages
            const context = messages.slice(-3).map(m => `${m.role === 'user' ? 'Terapeuta' : 'Supervisor'}: ${m.text}`).join('\n');
            const suggestion = await consultCoreLibrary(context);

            const libraryMsg: Message = {
                id: crypto.randomUUID(),
                role: 'ai',
                text: `📚 **CONSULTA AO MANUAL SOCRÁTICO:**\n\n${suggestion}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, libraryMsg]);
        } catch (error) {
            console.error("Erro na consulta:", error);
        } finally {
            setIsConsultingLibrary(false);
        }
    };

    // Web Speech API setup
    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'pt-BR';
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                let interimText = '';
                let finalText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalText += transcript + ' ';
                    } else {
                        interimText += transcript;
                    }
                }

                if (finalText) {
                    setTranscript(prev => prev + finalText);
                    setInterimTranscript('');

                    // Auto-send after 2 seconds of silence
                    if (autoSendTimerRef.current) {
                        clearTimeout(autoSendTimerRef.current);
                    }
                    autoSendTimerRef.current = setTimeout(() => {
                        if (transcript.trim()) {
                            setInput(transcript.trim());
                            setTranscript('');
                        }
                    }, 2000);
                } else {
                    setInterimTranscript(interimText);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    // Silently ignore - user just paused
                    return;
                }
                setIsRecording(false);
            };

            recognition.onend = () => {
                if (isRecording) {
                    // Restart if still recording (continuous mode)
                    recognition.start();
                }
            };

            recognitionRef.current = recognition;
        } else {
            console.warn('Web Speech API not supported in this browser');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (autoSendTimerRef.current) {
                clearTimeout(autoSendTimerRef.current);
            }
        };
    }, [isRecording, transcript]);

    // Generate session script on session start
    const generateScript = async (isCrisis: boolean = false, crisisDetail: string = '') => {
        if (!currentPatient) return;

        setIsGeneratingScript(true);
        try {
            const lastSession = currentPatient.clinicalRecords?.sessions?.slice(-1)[0];

            // Build rich summary of last session
            let lastSessionSummary = 'Primeira sessão ou sem histórico.';
            if (lastSession?.soap) {
                const soap = lastSession.soap;
                const parts = [];
                if (soap.queixa_principal) parts.push(`Queixa Principal: ${soap.queixa_principal}`);
                if (soap.subjetivo?.length) parts.push(`Relatos: ${soap.subjetivo.map((s: any) => s.conteudo).slice(0, 2).join('; ')}`);
                if (soap.avaliacao) parts.push(`Avaliação: ${soap.avaliacao.slice(0, 200)}`);
                if (soap.plano?.length) parts.push(`Plano Anterior: ${soap.plano.slice(0, 3).join(', ')}`);
                lastSessionSummary = parts.join(' | ');
            }

            const planSummary = currentPatient.clinicalRecords?.treatmentPlan?.goals?.join(', ') || 'Plano a definir';

            const script = await generateSessionScript(
                currentPatient.name,
                lastSessionSummary,
                planSummary,
                isCrisis,
                crisisDetail
            );

            setSessionScript(script);
            setIsCrisisMode(isCrisis);

            // Add script as first message
            const scriptMsg: Message = {
                id: crypto.randomUUID(),
                role: 'ai',
                text: isCrisis
                    ? `🚨 **MODO CRISE ATIVADO**\n\n${script}`
                    : `📋 **ROTEIRO DA SESSÃO**\n\n${script}`,
                timestamp: new Date()
            };
            setMessages([scriptMsg]);

        } catch (error) {
            console.error('Error generating script:', error);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleStartSession = async () => {
        setSessionStartTime(new Date());
        await generateScript(false);
    };

    const handleCrisisMode = async () => {
        const crisisDetail = prompt('Descreva brevemente a situação de crise:');
        if (crisisDetail) {
            await generateScript(true, crisisDetail);
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert('Reconhecimento de voz não disponível neste navegador. Use Chrome ou Edge.');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            // Send accumulated transcript
            if (transcript.trim()) {
                setInput(transcript.trim());
                setTranscript('');
            }
        } else {
            setTranscript('');
            setInterimTranscript('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    // Auto-gerar preview a cada 4 mensagens
    useEffect(() => {
        const shouldGenerate = messages.length > 0 &&
            messages.length >= lastPreviewCount + 4 &&
            !isLoading;

        if (shouldGenerate) {
            generatePreview();
        }
    }, [messages.length, isLoading]);

    const generatePreview = async () => {
        setIsGeneratingPreview(true);
        try {
            const preview = await generateSOAPPreview(messages, currentPatient);
            setSOAPPreview(preview);
            setLastPreviewCount(messages.length);
        } catch (error) {
            console.error('Error generating preview:', error);
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const context = messages.slice(-5).map(m => `${m.role === 'user' ? 'Terapeuta' : 'Supervisor'}: ${m.text}`).join('\n');

            // Run Copilot + Live PBT Radar in parallel
            const [suggestion, radarData] = await Promise.all([
                getCoPilotSuggestion(userMsg.text, context, currentPatient),
                monitorActiveProcesses(userMsg.text) // Analyze just the latest input or short context
            ]);

            const aiMsg: Message = { id: crypto.randomUUID(), role: 'ai', text: suggestion, timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);

            // Update Radar UI
            if (radarData?.active_nodes) {
                setActiveProcesses(radarData.active_nodes);
                if (onAnalysisUpdate) {
                    onAnalysisUpdate({ active_nodes: radarData.active_nodes });
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalizeSession = async () => {
        if (messages.length === 0) return;
        if (!confirm("Encerrar sessão e gerar prontuário automático?")) return;

        setIsFinalizing(true);
        try {
            const fullHistory = messages.map(m => `[${m.timestamp.toLocaleTimeString()}] ${m.role === 'user' ? 'TERAPEUTA (Relato/Nota)' : 'CO-PILOTO (Sugestão)'}: ${m.text}`).join('\n');
            const currentPBT = currentPatient?.clinicalRecords?.caseFormulation?.pbtData || { nodes: [], edges: [] };
            const currentPlan = currentPatient?.clinicalRecords?.treatmentPlan || {};
            const currentFormulation = currentPatient?.clinicalRecords?.caseFormulation || {};

            // 1. Run Analysis
            const [analysisResult, postSessionAnalysis] = await Promise.all([
                summarizeChatToSoap(fullHistory),
                generatePostSessionAnalysis(fullHistory, currentPBT, currentPlan, currentFormulation)
            ]);

            if (currentPatient) {
                const sessionId = crypto.randomUUID();

                // 2. Generate Prontuario Record Logic (Simplified Import)
                let prontuarioRecord = null;
                try {
                    const { generateSessionRecord } = await import('../lib/gemini');
                    prontuarioRecord = await generateSessionRecord({
                        soap: analysisResult.soap,
                        notes: fullHistory,
                        patientName: currentPatient.name
                    });
                } catch (err) { console.error(err); }

                // 3. New Session Object
                const newSession = {
                    id: sessionId,
                    date: new Date().toISOString(),
                    notes: "Sessão assistida por Co-Piloto.\n\n" + fullHistory,
                    soap: analysisResult.soap,
                    pbtNetwork: postSessionAnalysis?.pbt_update?.new_struct?.nodes
                        ? postSessionAnalysis.pbt_update.new_struct
                        : (analysisResult.pbt_network || currentPBT),
                    adaptation: analysisResult.adaptacao
                };

                // 4. Update Patient
                const updatedPatient = { ...currentPatient };
                updatedPatient.clinicalRecords.sessions = [newSession, ...updatedPatient.clinicalRecords.sessions];

                // Add prontuario record
                if (prontuarioRecord) {
                    updatedPatient.clinicalRecords.prontuarioRecords = {
                        ...(updatedPatient.clinicalRecords.prontuarioRecords || {}),
                        [sessionId]: { ...prontuarioRecord, sessionDate: new Date().toISOString(), updatedAt: new Date().toISOString(), consultationType: 'presencial' }
                    };
                }

                // Update PBT if changed
                if (postSessionAnalysis?.pbt_update?.new_struct?.nodes?.length > 0) {
                    updatedPatient.clinicalRecords.caseFormulation.pbtData = postSessionAnalysis.pbt_update.new_struct;
                }

                updatePatient(updatedPatient);
                onSessionEnd();

                // 5. Feedback Report
                let msg = `✅ Sessão encerrada!\n\n`;
                if (postSessionAnalysis) {
                    msg += `🧠 INTELIGÊNCIA CLÍNICA:\n\n`;
                    msg += `1️⃣ PBT: ${postSessionAnalysis.pbt_update?.status === 'mudou' ? 'ATUALIZADA' : 'MANTIDA'}\n`;
                    if (postSessionAnalysis.pbt_update?.description) msg += `   "${postSessionAnalysis.pbt_update.description}"\n`;

                    msg += `\n2️⃣ PLANO: ${postSessionAnalysis.plan_review?.status === 'ajustar' ? '⚠️ SUGESTÃO DE AJUSTE' : '✅ MANTIDO'}\n`;
                    if (postSessionAnalysis.plan_review?.suggestions) msg += `   Sugestão: ${postSessionAnalysis.plan_review.suggestions.join('; ')}\n`;

                    msg += `\n3️⃣ DIAGNÓSTICO: ${postSessionAnalysis.formulation_check?.status || 'Ok'}\n`;
                    if (postSessionAnalysis.formulation_check?.insight) msg += `   Obs: ${postSessionAnalysis.formulation_check.insight}`;
                }
                alert(msg);
            }
        } catch (error) {
            console.error("Erro ao finalizar:", error);
            alert("Erro ao processar encerramento.");
        } finally {
            setIsFinalizing(false);
        }
    };

    return (
        <div className="flex gap-4 h-[calc(100vh-8rem)]">
            {/* LEFT: CHAT */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">CO-PILOTO EM TEMPO REAL</h3>
                            <p className="text-xs text-gray-500">
                                {sessionStartTime ? `Sessão iniciada às ${sessionStartTime.toLocaleTimeString('pt-BR')}` : 'Supervisão imediata'}
                            </p>
                            {activeProcesses.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-center mr-1">Radar PBT:</span>
                                    {activeProcesses.slice(0, 3).map((proc, idx) => (
                                        <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${proc.status === 'rigido'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                            {proc.status === 'rigido' ? <Activity className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                                            {proc.label}
                                        </span>
                                    ))}
                                    {activeProcesses.length > 3 && <span className="text-[10px] text-gray-400 self-center">+{activeProcesses.length - 3}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!sessionStartTime && (
                            <button
                                onClick={handleStartSession}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Calendar className="w-4 h-4" />
                                Iniciar Sessão
                            </button>
                        )}
                        <button
                            onClick={toggleRecording}
                            disabled={isFinalizing}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm ${isRecording
                                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                                : 'bg-gray-600 hover:bg-gray-500 text-white'
                                }`}
                            title={isRecording ? 'Clique para parar de gravar' : 'Clique para começar a gravar'}
                        >
                            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            {isRecording ? 'Gravando' : 'Microfone'}
                        </button>
                        {sessionStartTime && (
                            <>
                                <button
                                    onClick={handleCrisisMode}
                                    disabled={isGeneratingScript || isFinalizing}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm ${isCrisisMode
                                        ? 'bg-red-600 hover:bg-red-500 text-white'
                                        : 'bg-amber-500 hover:bg-amber-400 text-white'
                                        }`}
                                    title="Informar situação de crise e recalcular roteiro"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    {isCrisisMode ? 'Em Crise' : 'Mudar Demanda'}
                                </button>

                                <button
                                    onClick={handleConsultLibrary}
                                    disabled={isConsultingLibrary || isFinalizing}
                                    className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                                    title="Consultar Manual Socrático sobre o contexto atual"
                                >
                                    {isConsultingLibrary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Book className="w-4 h-4" />}
                                    Manual Socrático
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleFinalizeSession}
                            disabled={isFinalizing || messages.length === 0}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isFinalizing ? "GERANDO..." : "ENCERRAR"}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <Bot className="w-16 h-16 mb-4" />
                            <p className="text-sm">Sessão iniciada. Digite notas ou falas...</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100' : 'bg-indigo-100'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-blue-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                                </div>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-white text-gray-800 border border-gray-100 rounded-tr-none'
                                    : 'bg-indigo-600 text-white rounded-tl-none shadow-md'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-indigo-50 px-4 py-2 rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-gray-200">
                    {/* Transcript preview */}
                    {(transcript || interimTranscript) && (
                        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                            <span className="text-amber-700 font-medium">🎤 Transcrevendo: </span>
                            <span className="text-gray-700">{transcript}</span>
                            <span className="text-gray-400 italic">{interimTranscript}</span>
                        </div>
                    )}

                    <form onSubmit={handleSend} className="relative flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isRecording ? "Fale... (auto-envia em 2s de pausa)" : "Ex: 'Paciente relatou piora no sono'..."}
                            className={`flex-1 bg-gray-50 border text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isRecording ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            autoFocus
                            disabled={isRecording}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading || isFinalizing}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT: SOAP PREVIEW */}
            <div className="w-96 flex flex-col bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-indigo-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-white" />
                            <h3 className="font-bold text-white">Preview SOAP</h3>
                        </div>
                        <button
                            onClick={generatePreview}
                            disabled={isGeneratingPreview || messages.length === 0}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Atualizar preview"
                        >
                            <RefreshCw className={`w-4 h-4 text-white ${isGeneratingPreview ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <p className="text-xs text-purple-100 mt-1">
                        {messages.length > 0 ? `${messages.length} mensagens • Atualiza a cada 4` : 'Aguardando mensagens...'}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {!soapPreview && messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-purple-400 text-center">
                            <FileText className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">SOAP será gerado automaticamente conforme você digita</p>
                        </div>
                    )}

                    {isGeneratingPreview && (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                        </div>
                    )}

                    {soapPreview && !isGeneratingPreview && (
                        <div className="space-y-3">
                            {/* Subjetivo */}
                            <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                                <h4 className="font-bold text-purple-700 text-sm mb-1 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    SUBJETIVO
                                </h4>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {soapPreview.queixa_principal || 'A definir...'}
                                </p>
                            </div>

                            {/* Objetivo */}
                            <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                                <h4 className="font-bold text-purple-700 text-sm mb-1">OBJETIVO</h4>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {soapPreview.objetivo || 'A definir...'}
                                </p>
                            </div>

                            {/* Avaliação */}
                            <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                                <h4 className="font-bold text-purple-700 text-sm mb-1">AVALIAÇÃO</h4>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {soapPreview.avaliacao || 'A definir...'}
                                </p>
                            </div>

                            {/* Plano */}
                            <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                                <h4 className="font-bold text-purple-700 text-sm mb-1">PLANO</h4>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {soapPreview.plano || 'A definir...'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-purple-200 bg-white">
                    <p className="text-xs text-gray-500 text-center">
                        💡 Preview automático. Clique "Encerrar" para versão final.
                    </p>
                </div>
            </div>
        </div>
    );
};

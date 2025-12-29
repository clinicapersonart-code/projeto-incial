import React, { useState, useEffect, useRef } from 'react';
import { usePatients } from '../context/PatientContext';
import { chatWithPatientHistory } from '../lib/gemini';
import { PBTGraph } from './PBTGraph';
import { SessionTimeline } from './SessionTimeline';
import { SessionPlanner } from './SessionPlanner';
import { TopicAlignmentCard } from './TopicAlignmentCard';
import { EellsRoadmap } from './EellsRoadmap';
import { MonitoringCard } from './MonitoringCard';
import { AlertCard } from './AlertCard';
import { ProgressChart } from './ProgressChart';
import { DecisionLogCard } from './DecisionLogCard';
import { ActiveHypothesis } from './ActiveHypothesis';
import { DischargeCard } from './DischargeCard';
import { DischargeReport } from './DischargeReport';
import { Send, Loader2, Bot, History, BrainCircuit, ChevronRight, ChevronLeft, MessageCircle, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const PatientDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
    const { currentPatient, updatePatient } = usePatients();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Estados para reconhecimento de voz
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Controles de Visualização
    const [isChatCollapsed, setIsChatCollapsed] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load History or Initial Greeting
    useEffect(() => {
        if (!currentPatient) return;

        if (currentPatient.clinicalRecords.chatHistory && currentPatient.clinicalRecords.chatHistory.length > 0) {
            setMessages(currentPatient.clinicalRecords.chatHistory);
        } else if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: `Olá! Sou o **Assistente de Prontuário** do paciente **${currentPatient.name}**.
                
Tenho acesso a todo o histórico. Pergunte coisas como:
* "Qual a evolução da ansiedade?"
* "O que foi discutido sobre a mãe dele?"`
            }]);
        }
    }, [currentPatient?.id]); // Only runs when patient changes

    // Persist Chat
    useEffect(() => {
        if (!currentPatient || messages.length === 0) return;

        const historyChanged = JSON.stringify(currentPatient.clinicalRecords.chatHistory) !== JSON.stringify(messages);
        if (historyChanged) {
            const updated = JSON.parse(JSON.stringify(currentPatient));
            updated.clinicalRecords.chatHistory = messages;
            updatePatient(updated);
        }
    }, [messages]);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Configurar Web Speech API
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('');
                setInput(transcript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // Funções de controle do microfone
    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !currentPatient) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const historyContext = currentPatient.clinicalRecords.sessions
                .map(s => `[DATA: ${new Date(s.date).toLocaleDateString()}]
QUEIXA: ${s.soap.queixa_principal}
AVALIAÇÃO: ${s.soap.avaliacao}
PLANO: ${s.soap.plano.join('; ')}
RELATO BRUTO: ${s.notes}
---`).join('\n');

            const response = await chatWithPatientHistory(historyContext, userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Erro ao acessar prontuário." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for PBT Graph updates (Persistence)
    const handleGraphUpdate = (newNodes: any[], newEdges: any[]) => {
        if (!currentPatient) return;

        // Deep clone to avoid mutation issues
        const updatedPatient = JSON.parse(JSON.stringify(currentPatient));

        // Ensure sessions array exists
        if (!updatedPatient.clinicalRecords.sessions) {
            updatedPatient.clinicalRecords.sessions = [];
        }

        // Get or create latest session (logic similar to retrieval)
        // If no session, create one? Or update the first one?
        // Ideally we update the specific session being viewed, but here we default to index 0 (latest)
        if (updatedPatient.clinicalRecords.sessions.length === 0) {
            updatedPatient.clinicalRecords.sessions.push({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                summary: "Sessão Inicial (Gerada Automaticamente)",
                soap: { S: '', O: '', A: '', P: '' },
                notes: "",
                pbtNetwork: { nodes: [], edges: [] }
            });
        }

        updatedPatient.clinicalRecords.sessions[0].pbtNetwork = {
            nodes: newNodes,
            edges: newEdges
        };

        updatePatient(updatedPatient);
        // Optional: Notify user or show small saved indicator? 
        // console.log("Graph saved to patient record");
    };

    const latestPBT = currentPatient?.clinicalRecords.sessions[0]?.pbtNetwork || { nodes: [], edges: [] };

    if (!currentPatient) return null;

    return (
        <div className="flex h-[calc(100vh-6rem)] w-full overflow-hidden bg-slate-50 relative">

            {/* =========================================================
               PAINEL ESQUERDO: HISTÓRICO (Timeline)
               ========================================================= */}
            <div className={`transition-all duration-300 ease-in-out border-r border-gray-200 bg-white flex flex-col z-20 ${showHistory ? 'w-80' : 'w-12'}`}>

                {/* Cabeçalho / Botão Toggle */}
                <div className="p-2 border-b border-gray-100 flex items-center justify-between h-14 bg-gray-50">
                    {showHistory ? (
                        <div className="flex items-center justify-between w-full px-2">
                            <div className="flex items-center gap-2 font-bold text-gray-700 text-sm">
                                <History className="w-4 h-4 text-blue-600" />
                                <span>HISTÓRICO</span>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-gray-200 rounded">
                                <ChevronLeft className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowHistory(true)} className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-gray-100 rounded text-gray-500" title="Abrir Histórico">
                            <History className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Conteúdo da Timeline */}
                {showHistory && (
                    <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50 custom-scrollbar">
                        <SessionTimeline
                            sessions={currentPatient?.clinicalRecords.sessions || []}
                            onSelectSession={() => { }}
                        />
                    </div>
                )}
            </div>


            {/* =========================================================
               PAINEL CENTRAL: DASHBOARD (Grid System)
               ========================================================= */}
            {/* ADICIONADO: min-w-0 para permitir encolhimento correto */}
            <main className="flex-1 h-full overflow-y-auto p-4 custom-scrollbar scroll-smooth min-w-0">
                <div className="max-w-7xl mx-auto space-y-6 pb-20">

                    {/* LINHA 0: Alertas de Monitoramento (Prioridade máxima) */}
                    <AlertCard />

                    {/* LINHA 0.5: Hipótese em Teste (Supervisor automático) */}
                    <ActiveHypothesis />

                    {/* LINHA 1: Eells (Maior) + Monitoramento (Menor) */}
                    {/* ALTERADO: xl:grid-cols-12 para 2xl:grid-cols-12 para empilhar antes */}
                    <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
                        <div className="2xl:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                            <EellsRoadmap />
                        </div>
                        <div className="2xl:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                            <MonitoringCard currentPatient={currentPatient} />
                        </div>
                    </div>

                    {/* LINHA 2: Alinhamento e Planejamento */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                            <TopicAlignmentCard />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <SessionPlanner />
                        </div>
                    </div>

                    {/* LINHA 2.5: Gráfico de Progresso */}
                    <ProgressChart />

                    {/* LINHA 2.6: Decisões Clínicas */}
                    <DecisionLogCard />

                    {/* LINHA 2.7: Alta e Prevenção de Recaída */}
                    <DischargeCard />

                    {/* LINHA 2.8: Relatório de Alta */}
                    <DischargeReport />

                    {/* LINHA 3: Rede PBT (Com altura garantida) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col relative overflow-hidden min-h-[500px]">
                        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-purple-100 flex items-center gap-2 shadow-sm">
                            <BrainCircuit className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-bold text-purple-900">REDE DE PROCESSOS (PBT)</span>
                        </div>
                        <div className="flex-1 bg-slate-50 w-full h-full">
                            {latestPBT.nodes.length > 0 ? (
                                <PBTGraph
                                    nodes={latestPBT.nodes}
                                    edges={latestPBT.edges}
                                    onGraphUpdate={handleGraphUpdate}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Nenhum dado processado ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>


            {/* =========================================================
               PAINEL DIREITO: CHAT CONTEXTUAL
               ========================================================= */}
            {/* ALTERADO: w-96 para w-80 para economizar espaço */}
            <div className={`transition-all duration-300 ease-in-out border-l border-gray-200 bg-white flex flex-col z-30 shadow-xl ${isChatCollapsed ? 'w-0' : 'w-80'}`}>

                {/* Botão Flutuante de Toggle (Fica fora do painel quando colapsado) */}
                {isChatCollapsed && (
                    <button
                        onClick={() => setIsChatCollapsed(false)}
                        className="absolute top-4 right-4 z-50 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center gap-2"
                        title="Chat com Prontuário"
                    >
                        <MessageCircle className="w-6 h-6" />
                    </button>
                )}

                {!isChatCollapsed && (
                    <>
                        <div className="p-3 border-b border-gray-200 bg-indigo-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-200 rounded-lg">
                                    <Bot className="w-4 h-4 text-indigo-800" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-indigo-900">Assistente do Prontuário</h3>
                                    <p className="text-[10px] text-indigo-600">Baseado no histórico completo</p>
                                </div>
                            </div>
                            <button onClick={() => setIsChatCollapsed(true)} className="p-1 hover:bg-indigo-100 rounded text-indigo-600">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
                                        }`}>
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-gray-400 text-xs ml-2 animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Analisando...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200">
                            {/* Indicador de gravação */}
                            {isListening && (
                                <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-red-600 font-medium">Ouvindo... Fale agora</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={isListening ? "🎤 Dite sua mensagem..." : "Ex: Qual a tendência do humor?"}
                                        className={`w-full pl-4 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all ${isListening
                                            ? 'bg-red-50 border-red-300'
                                            : 'bg-gray-50 border-gray-200'
                                            }`}
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Botão de Microfone */}
                                {speechSupported && (
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        disabled={isLoading}
                                        className={`p-3 rounded-xl transition-all ${isListening
                                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                            }`}
                                        title={isListening ? "Parar gravação" : "Gravar mensagem de voz"}
                                    >
                                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                )}

                                {/* Botão de Enviar */}
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
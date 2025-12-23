import React, { useState, useEffect, useRef } from 'react';
import { usePatients } from '../context/PatientContext';
import { chatWithPatientHistory } from '../lib/gemini';
import { PBTGraph } from './PBTGraph';
import { SessionTimeline } from './SessionTimeline';
import { SessionPlanner } from './SessionPlanner';
import { TopicAlignmentCard } from './TopicAlignmentCard';
import { EellsRoadmap } from './EellsRoadmap';
import { MonitoringCard } from './MonitoringCard';
import { Send, Loader2, Bot, History, BrainCircuit, ChevronRight, ChevronLeft, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const PatientDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
    const { currentPatient } = usePatients();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChatCollapsed, setIsChatCollapsed] = useState(true); // Começa colapsado
    const [showHistory, setShowHistory] = useState(false); // Histórico começa oculto
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: `Olá! Sou o **Assistente de Prontuário** do paciente **${currentPatient?.name}**.
                
Tenho acesso a todo o histórico de sessões e evoluções.  
Você pode me perguntar coisas como:
* "Qual a evolução da ansiedade nas últimas 4 sessões?"
* "O que foi discutido sobre a mãe dele em Janeiro?"
* "Compare a queixa principal da primeira sessão com a de hoje."`
            }]);
        }
    }, [currentPatient]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
---`)
                .join('\n');

            const response = await chatWithPatientHistory(historyContext, userMsg);

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Desculpe, tive um erro ao acessar o prontuário." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const latestPBT = currentPatient?.clinicalRecords.sessions[0]?.pbtNetwork || { nodes: [], edges: [] };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-3 animate-in fade-in duration-300">
            {/* LEFT: TIMELINE - Toggle Button + Panel */}
            {showHistory ? (
                <div className="w-64 flex-none bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-md transition-all duration-300">
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-br from-blue-50 to-white">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-blue-600" />
                            <h3 className="font-bold text-gray-900 text-xs">HISTÓRICO</h3>
                        </div>
                        <button
                            onClick={() => setShowHistory(false)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Ocultar histórico"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
                        <SessionTimeline
                            sessions={currentPatient?.clinicalRecords.sessions || []}
                            onSelectSession={() => { }}
                        />
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowHistory(true)}
                    className="w-10 flex-none bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-2 transition-all shadow-sm"
                    title="Mostrar histórico"
                >
                    <History className="w-5 h-5 text-gray-600" />
                    <span className="text-[10px] font-semibold text-gray-500 writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
                        HISTÓRICO
                    </span>
                </button>
            )}

            {/* CENTER: MAIN CONTENT - Scrollable */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4">
                    {/* Row 1: Eells + Monitoring */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <EellsRoadmap />
                        <MonitoringCard currentPatient={currentPatient} />
                    </div>

                    {/* Row 2: Topic Alignment */}
                    <TopicAlignmentCard />

                    {/* Row 3: Session Planner */}
                    <SessionPlanner />

                    {/* Row 4: PBT Network */}
                    <div className="bg-white rounded-xl border border-gray-200 flex flex-col relative overflow-hidden shadow-sm min-h-[300px]">
                        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-purple-100 flex items-center gap-2 shadow-sm">
                            <BrainCircuit className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-bold text-purple-900">REDE ATUAL</span>
                        </div>
                        <div className="flex-1 bg-gray-50/50">
                            {latestPBT.nodes.length > 0 ? (
                                <PBTGraph nodes={latestPBT.nodes} edges={latestPBT.edges} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                                    <BrainCircuit className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Nenhum dado de rede PBT disponível ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: CONTEXT CHAT - Collapsible */}
            {!isChatCollapsed ? (
                <div className="w-80 flex-none bg-white rounded-xl border border-gray-200 flex flex-col shadow-lg relative transition-all duration-300">
                    {/* Collapse Button */}
                    <button
                        onClick={() => setIsChatCollapsed(true)}
                        className="absolute -left-3 top-4 z-20 w-6 h-12 bg-gray-700 hover:bg-gray-800 text-white rounded-l-lg flex items-center justify-center transition-all shadow-lg"
                        title="Recolher chat"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                        <div className="p-2 bg-teal-50 rounded-lg">
                            <Bot className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xs text-gray-900">Assistente</h3>
                            <p className="text-[10px] text-gray-500">Prontuário</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-teal-50/30 to-white">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                <div className={`inline-block max-w-[90%] rounded-xl p-2.5 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white shadow-md border border-gray-100'
                                    }`}>
                                    <div className={`text-xs ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-teal-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">Analisando...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pergunte sobre o prontuário..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-3 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition-all shadow-md"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Collapsed Chat Bar */
                <button
                    onClick={() => setIsChatCollapsed(false)}
                    className="w-10 flex-none bg-teal-600 hover:bg-teal-700 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    title="Abrir chat"
                >
                    <MessageCircle className="w-5 h-5 text-white" />
                    <span className="text-[10px] font-semibold text-white/80 writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
                        CHAT
                    </span>
                </button>
            )}
        </div>
    );
};
import React, { useState, useEffect, useRef } from 'react';
import { usePatients } from '../context/PatientContext';
import { chatWithPatientHistory } from '../lib/gemini';
import { PBTGraph } from './PBTGraph';
import { SessionTimeline } from './SessionTimeline';
import { SessionPlanner } from './SessionPlanner';
import { TopicAlignmentCard } from './TopicAlignmentCard';
import { Send, Loader2, Bot, History, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const PatientDashboard: React.FC = () => {
    const { currentPatient } = usePatients();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                // MUDANÇA: Curador -> Prontuário Inteligente
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
        <div className="flex h-[calc(100vh-8rem)] gap-4 animate-in fade-in zoom-in-95 duration-500">
            {/* LEFT: TIMELINE */}
            <div className="w-80 flex-none bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-md">
                <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-gradient-to-br from-blue-50 to-white">
                    <History className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900 text-sm">HISTÓRICO DE SESSÕES</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
                    <SessionTimeline
                        sessions={currentPatient?.clinicalRecords.sessions || []}
                        onSelectSession={() => { }} 
                    />
                </div>
            </div>

            {/* CENTER: VISUALIZATION & PLANNING */}
            <div className="flex-1 flex flex-col gap-4">
                <TopicAlignmentCard />
                <SessionPlanner />

                <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col relative overflow-hidden shadow-sm">
                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-purple-100 flex items-center gap-2 shadow-sm">
                        <BrainCircuit className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-purple-900">REDE ATUAL (Última Sessão)</span>
                    </div>
                    <div className="flex-1 bg-gray-50/50">
                        {latestPBT.nodes.length > 0 ? (
                            <PBTGraph nodes={latestPBT.nodes} edges={latestPBT.edges} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <BrainCircuit className="w-12 h-12 mb-4 opacity-20" />
                                <p>Nenhum dado de rede PBT disponível ainda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: CONTEXT CHAT */}
            <div className="w-96 flex-none bg-white rounded-xl border border-gray-200 flex flex-col shadow-lg">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                    <div className="p-2 bg-teal-50 rounded-lg">
                        <Bot className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        {/* MUDANÇA: Memória -> Prontuário */}
                        <h3 className="font-bold text-gray-900 text-sm">PRONTUÁRIO INTELIGENTE</h3>
                        <p className="text-[10px] text-gray-500">Busca em todo o histórico</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-900 rounded-bl-none border border-gray-200'
                                }`}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-none flex items-center gap-2 border border-gray-200">
                                <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                                <span className="text-xs text-gray-600">Lendo prontuário...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 bg-gray-50 border-t border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pergunte sobre o histórico..."
                            className="w-full bg-white border border-gray-300 rounded-xl pl-4 pr-10 py-3 text-xs text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-2 p-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
import React, { useState } from 'react';
import { analyzeCase } from '../lib/gemini';
import { CaseFormulation } from './CaseFormulation';
import { CurationWorkspace } from './CurationWorkspace';
import { AssessmentChart } from './AssessmentChart';
import { PBTGraph } from './PBTGraph';
import { DischargeRadar } from './DischargeRadar';
import { EvolutionPanel } from './EvolutionPanel';
import { usePatients } from '../context/PatientContext';
import { Gad7Form } from './forms/Gad7Form';
import { PatientDashboard } from './PatientDashboard';
import {
    BrainCircuit,
    Target,
    MessageCircle,
    Lightbulb,
    AlertTriangle,
    Send,
    Loader2,
    BookOpen,
    FileText,
    ClipboardList,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import { SessionTimeline } from './SessionTimeline';
import { AlchemyLab } from './AlchemyLab';


interface AnalysisResult {
    soap: {
        queixa_principal: string;
        subjetivo: { conteudo: string; citacao: string; confianca: number }[];
        objetivo: string;
        avaliacao: string;
        plano: string[];
    };
    pbt_network: {
        nodes: { id: string; label: string; type: string; change: string; category?: string }[];
        edges: { source: string; target: string; relation: string; weight: string }[];
    };
    adaptacao: {
        gatilho_identificado: boolean;
        motivo_adapacao: string;
        sugestoes: { acao: string; justificativa_pbt: string }[];
    };
    analise_original?: {
        sugestao_fala: string;
        metafora: string;
        alerta_risco: boolean;
    };
}

export const ClinicalWorkspace: React.FC = () => {
    const { currentPatient, clearCurrentPatient, updatePatient } = usePatients();

    const [notes, setNotes] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'soap' | 'network' | 'plan' | 'forms' | 'anamnesis' | 'formulation' | 'curation' | 'evolution' | 'alchemy'>('dashboard');

    if (!currentPatient) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await analyzeCase(notes);
            setResult(data);

            // Save session to patient history automatically
            const newSession = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                notes: notes,
                soap: data.soap,
                pbtNetwork: data.pbt_network,
                adaptation: data.adaptacao
            };

            updatePatient({
                ...currentPatient,
                clinicalRecords: {
                    ...currentPatient.clinicalRecords,
                    sessions: [newSession, ...currentPatient.clinicalRecords.sessions]
                }
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocorreu um erro ao processar a análise.');
        } finally {
            setLoading(false);
        }
    };



    // ... imports remain same

    // ... inside ClinicalWorkspace

    const renderContent = () => {
        if (activeTab === 'dashboard') {
            return <PatientDashboard />;
        }
        if (activeTab === 'forms') {
            return (
                <div className="space-y-6">
                    <AssessmentChart assessments={currentPatient.clinicalRecords.assessments} />
                    <Gad7Form />
                </div>
            );
        }

        if (activeTab === 'anamnesis') {
            return (
                <div className="bg-slate-950/80 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-xl">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 mb-4">
                        ANAMNESE
                    </h3>
                    <p className="text-slate-400 text-sm">Funcionalidade em desenvolvimento. Aqui você poderá editar a anamnese completa do paciente.</p>
                </div>
            );
        }

        // AI Results Logic (Only show if we have a result OR we want to show history? For now let's stick to current session analysis)
        if (!result) return null;

        if (activeTab === 'network') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-black border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2 flex items-center gap-2 relative z-10">
                            <BrainCircuit className="w-6 h-6 text-cyan-400" />
                            REDE DE PROCESSOS PBT
                        </h3>
                        <PBTGraph nodes={result.pbt_network.nodes} edges={result.pbt_network.edges} />
                    </div>
                </div>
            );
        }

        if (activeTab === 'formulation') {
            return <CaseFormulation />;
        }

        if (activeTab === 'curation') {
            return <CurationWorkspace />;
        }

        if (activeTab === 'evolution') {
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <DischargeRadar criteria={currentPatient.clinicalRecords.dischargeCriteria || []} />
                    <EvolutionPanel />
                </div>
            );
        }

        if (activeTab === 'alchemy') {
            return <AlchemyLab />;
        }

        if (activeTab === 'plan') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {result.analise_original?.alerta_risco && (
                        <div className="relative overflow-hidden rounded-xl bg-red-950/50 border border-red-500/50 p-6 flex items-start gap-4 shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]">
                            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 animate-pulse relative z-10" />
                            <div className="relative z-10">
                                <h3 className="text-red-400 font-bold text-lg tracking-widest flex items-center gap-2">ALERTA DE SEGURANÇA</h3>
                                <p className="text-red-200/80 text-sm mt-2 font-mono border-l-2 border-red-500/30 pl-3">Indicadores de risco detectados.</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-950/80 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-xl">
                        <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/10 rounded-lg"><Target className="w-5 h-5 text-pink-400" /></div>
                                <div>
                                    <h3 className="font-bold text-pink-100 tracking-wide">PLANO DE ADAPTAÇÃO</h3>
                                    <p className="text-[10px] text-pink-400/60 font-mono tracking-widest">{result.adaptacao.gatilho_identificado ? "INTERVENÇÃO NECESSÁRIA" : "MANUTENÇÃO DE ESTRATÉGIA"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-slate-300 italic mb-4 border-l-2 border-pink-500/30 pl-4 py-1">"{result.adaptacao.motivo_adapacao}"</div>
                            <div className="space-y-3">
                                {result.adaptacao.sugestoes.map((sug, i) => (
                                    <div key={i} className="bg-black/40 rounded-lg p-4 border border-white/5 hover:border-pink-500/30 transition-colors">
                                        <h4 className="text-pink-300 font-bold text-sm mb-1">{sug.acao}</h4>
                                        <p className="text-slate-400 text-xs leading-relaxed">{sug.justificativa_pbt}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-950/80 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-xl">
                            <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex items-center gap-3">
                                <div className="p-2 bg-sky-500/10 rounded-lg"><MessageCircle className="w-5 h-5 text-sky-400" /></div>
                                <h3 className="font-bold text-sky-100 tracking-wide">SCRIPT SUGERIDO</h3>
                            </div>
                            <div className="p-6 text-sky-100/90 italic font-serif leading-relaxed">"{result.analise_original?.sugestao_fala}"</div>
                        </div>

                        <div className="bg-slate-950/80 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-xl">
                            <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg"><Lightbulb className="w-5 h-5 text-amber-400" /></div>
                                <h3 className="font-bold text-amber-100 tracking-wide">METÁFORA TERAPÊUTICA</h3>
                            </div>
                            <div className="p-6 text-slate-300 leading-relaxed text-sm">{result.analise_original?.metafora}</div>
                        </div>
                    </div>
                </div>
            );
        }

        // Default SOAP
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-950/80 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg"><FileText className="w-5 h-5 text-cyan-400" /></div>
                        <div><h3 className="font-bold text-cyan-100 tracking-wide">S.O.A.P NOTES</h3></div>
                    </div>
                    <div className="divide-y divide-white/5">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4"><span className="bg-cyan-950 text-cyan-400 font-mono text-xs px-2 py-1 rounded border border-cyan-500/20">S</span><h4 className="text-sm font-bold text-slate-200">SUBJETIVO</h4></div>
                            <div className="space-y-4 pl-4 border-l border-cyan-500/20">
                                <div className="text-sm font-medium text-white mb-2">Queixa Principal: <span className="text-slate-400 font-normal">{result.soap.queixa_principal}</span></div>
                                <div className="space-y-3">
                                    {result.soap.subjetivo.map((item, idx) => (
                                        <div key={idx} className="bg-black/40 p-3 rounded text-xs text-slate-300">
                                            <p className="mb-2">{item.conteudo}</p>
                                            {item.citacao && <p className="text-slate-500 italic border-l-2 border-slate-700 pl-2">"{item.citacao}"</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4"><span className="bg-cyan-950 text-cyan-400 font-mono text-xs px-2 py-1 rounded border border-cyan-500/20">O</span><h4 className="text-sm font-bold text-slate-200">OBJETIVO</h4></div>
                            <p className="text-sm text-slate-300 pl-4 border-l border-cyan-500/20">{result.soap.objetivo}</p>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4"><span className="bg-cyan-950 text-cyan-400 font-mono text-xs px-2 py-1 rounded border border-cyan-500/20">A</span><h4 className="text-sm font-bold text-slate-200">AVALIAÇÃO</h4></div>
                            <p className="text-sm text-slate-300 pl-4 border-l border-cyan-500/20">{result.soap.avaliacao}</p>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4"><span className="bg-cyan-950 text-cyan-400 font-mono text-xs px-2 py-1 rounded border border-cyan-500/20">P</span><h4 className="text-sm font-bold text-slate-200">PLANO</h4></div>
                            <ul className="space-y-2 pl-4 border-l border-cyan-500/20">
                                {result.soap.plano.map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />{step}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };



    // ... inside ClinicalWorkspace after imports ...



    // Helper to load a past session into view (simple version for now: just logs or basic view)
    // For now, let's keep it simple: clicking a session sets it as the "active" result context if we wanted.
    // But per requirements, the main workspace is typically for the *current* session.
    // Maybe we just view it? Let's just log for now or maybe implement a 'view mode' later.
    // Wait, the prompt implies "Clicking a session loads its summary". 
    // Let's implement a simple handleSelectSession.

    const handleSelectSession = (session: any) => {
        // Hydrate the result view with this session's data
        setResult({
            soap: session.soap,
            pbt_network: session.pbtNetwork,
            adaptacao: session.adaptation,
            analise_original: undefined // History doesn't have this explicitly in types yet, or maybe it does? 
            // In patient.ts Session type, we might not have stored analysis_original. Let's check type later.
            // For now, partial hydration.
        });
        // Also maybe set notes?
        setNotes(session.notes);
        setActiveTab('soap'); // Switch to view
    };


    return (
        <div className="min-h-screen text-gray-900 font-sans selection:bg-blue-100 flex flex-col bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex-none h-16 shadow-sm">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={clearCurrentPatient} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors" title="Voltar para lista">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">{currentPatient.name}</h1>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                <p className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">Em Atendimento</p>
                            </div>
                        </div>
                    </div>
                    {/* ... (Tabs) ... */}
                    {/* Tabs */}
                    <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-gray-500 overflow-x-auto">
                        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 ring-inset shadow-sm' : 'hover:bg-gray-100 hover:text-gray-700'}`}>VISÃO GERAL</button>
                        <button onClick={() => setActiveTab('soap')} className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'soap' ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 ring-inset shadow-sm' : 'hover:bg-gray-100 hover:text-gray-700'}`}>SESSÃO ATUAL</button>
                        <button onClick={() => setActiveTab('network')} className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'network' ? 'bg-purple-900 text-purple-100 ring-1 ring-purple-500 ring-inset shadow-sm' : 'hover:bg-gray-100 hover:text-gray-700'}`}>REDE PBT</button>
                        <button onClick={() => setActiveTab('evolution')} className={`px-4 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'evolution' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/50' : 'hover:bg-white/5'}`}>EVOLUÇÃO</button>
                        <button onClick={() => setActiveTab('formulation')} className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'formulation' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 ring-inset shadow-sm' : 'hover:bg-gray-100 hover:text-gray-700'}`}>SETUP INICIAL</button>
                        <button onClick={() => setActiveTab('curation')} className={`px-4 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'curation' ? 'bg-pink-500/20 text-pink-600 border border-pink-500/50' : 'hover:bg-white/5'}`}>CURADORIA</button>
                        <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'plan' ? 'bg-pink-500/20 text-pink-600 border border-pink-500/50' : 'hover:bg-white/5'}`}>ADAPTAÇÃO</button>
                        <button onClick={() => setActiveTab('alchemy')} className={`px-4 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'alchemy' ? 'bg-violet-500/20 text-violet-600 border border-violet-500/50' : 'hover:bg-white/5'}`}>LABORATÓRIO</button>
                        <button onClick={() => setActiveTab('forms')} className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'forms' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 ring-inset shadow-sm' : 'hover:bg-gray-100 hover:text-gray-700'}`}>AVALIAÇÕES</button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Sidebar Timeline - HIDE on Dashboard because Dashboard has its own */}
                {activeTab !== 'dashboard' && (
                    <SessionTimeline
                        sessions={currentPatient.clinicalRecords.sessions}
                        onSelectSession={handleSelectSession}
                    />
                )}

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Only show Input if ... logic */}
                        {activeTab !== 'dashboard' && activeTab !== 'forms' && activeTab !== 'anamnesis' && activeTab !== 'formulation' && activeTab !== 'curation' && activeTab !== 'evolution' && activeTab !== 'alchemy' && activeTab !== 'network' && (
                            <div className="lg:col-span-1 space-y-6">
                                <div className="group relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-b from-neon-purple to-neon-cyan rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                    <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/10 p-1">
                                        <div className="p-6 space-y-6">
                                            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                                <BookOpen className="w-5 h-5 text-neon-purple" />
                                                <span className="tracking-wide">INPUT DE DADOS</span>
                                            </h2>
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div>
                                                    <textarea
                                                        id="notes"
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        className="w-full h-80 p-5 rounded-xl bg-slate-900/50 border border-white/10 text-cyan-50 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple/50 resize-none transition-all text-sm leading-relaxed font-mono custom-scrollbar"
                                                        placeholder="// Relato da sessão..."
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={loading || !notes.trim()}
                                                    className="group relative w-full overflow-hidden rounded-xl bg-slate-900 p-px focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50"
                                                >
                                                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-3 py-4 text-sm font-bold text-white backdrop-blur-3xl gap-2 transition-all group-hover:bg-slate-900/90 group-hover:text-cyan-200">
                                                        {loading ? <Loader2 className="animate-spin" /> : <Send />}
                                                        {loading ? "AUDITANDO..." : "PROCESSAR CASO"}
                                                    </span>
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Right Column: Content */}
                        <div className={activeTab === 'dashboard' || activeTab === 'forms' || activeTab === 'anamnesis' || activeTab === 'formulation' || activeTab === 'curation' || activeTab === 'evolution' || activeTab === 'alchemy' || activeTab === 'network' ? "lg:col-span-3" : "lg:col-span-2"}>
                            {error && (
                                <div className="relative overflow-hidden rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6">
                                    <p className="text-sm text-red-200 font-mono"><span className="font-bold">SYSTEM ERROR:</span> {error}</p>
                                </div>
                            )}

                            {loading && (
                                <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 text-cyan-500 animate-spin" /></div>
                            )}

                            {!loading && (activeTab === 'dashboard' || activeTab === 'forms' || activeTab === 'anamnesis' || activeTab === 'formulation' || activeTab === 'curation' || activeTab === 'evolution' || activeTab === 'alchemy' || result || activeTab === 'network') ? renderContent() : null}

                            {!loading && !result && activeTab !== 'dashboard' && activeTab !== 'forms' && activeTab !== 'anamnesis' && activeTab !== 'formulation' && activeTab !== 'curation' && activeTab !== 'evolution' && activeTab !== 'alchemy' && activeTab !== 'network' && (
                                <div className="h-full min-h-[500px] flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-sm p-12 text-center text-slate-600">
                                    <BrainCircuit className="w-10 h-10 mb-4 opacity-20" />
                                    <p>Aguardando processamento...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
};

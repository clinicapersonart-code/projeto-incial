import React, { useState } from 'react';
import { analyzeCase } from '../lib/gemini';
import { CoPilotChat } from './CoPilotChat';
import { CaseFormulation } from './CaseFormulation';
import { CurationWorkspace } from './CurationWorkspace';
import { AssessmentChart } from './AssessmentChart';
import { PBTGraph } from './PBTGraph';
import { DischargeRadar } from './DischargeRadar';
import { EvolutionPanel } from './EvolutionPanel';
import { usePatients } from '../context/PatientContext';
import { Gad7Form } from './forms/Gad7Form';
import { PatientDashboard } from './PatientDashboard';
import { Sidebar } from './Sidebar';
import { AnamnesisForm } from './AnamnesisForm';
import { ProblemListCard } from './ProblemListCard';
import { GoalsManager } from './GoalsManager';
import { InterventionsPanel } from './InterventionsPanel';
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
    CheckCircle2,
    Download
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
    const { currentPatient, updatePatient } = usePatients();

    const [notes, setNotes] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Mantive os IDs técnicos (dashboard, soap, etc) mas mudei os rótulos visuais abaixo
    const [activeTab, setActiveTab] = useState<'dashboard' | 'soap' | 'network' | 'plan' | 'forms' | 'anamnesis' | 'formulation' | 'curation' | 'evolution' | 'alchemy' | 'copilot' | 'eells'>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    if (!currentPatient) return null;

    const handleExportRecords = () => {
        if (!currentPatient) return;

        let content = `PRONTUÁRIO CLÍNICO: ${currentPatient.name.toUpperCase()}\n`;
        content += `Gerado em: ${new Date().toLocaleDateString()}\n\n`;
        content += "================================================\n\n";

        currentPatient.clinicalRecords.sessions.forEach((session, index) => {
            const date = new Date(session.date).toLocaleDateString();
            content += `SESSÃO ${currentPatient.clinicalRecords.sessions.length - index} - DATA: ${date}\n`;
            content += "------------------------------------------------\n";
            content += `QUEIXA PRINCIPAL: ${session.soap.queixa_principal}\n\n`;
            content += `[S] SUBJETIVO:\n${session.soap.subjetivo.map(s => `- ${s.conteudo}`).join('\n')}\n\n`;
            content += `[O] OBJETIVO: ${session.soap.objetivo}\n\n`;
            content += `[A] AVALIAÇÃO: ${session.soap.avaliacao}\n\n`;
            content += `[P] PLANO: \n${session.soap.plano.map(p => `- ${p}`).join('\n')}\n`;
            content += "\n================================================\n\n";
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Prontuario_${currentPatient.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await analyzeCase(notes);
            setResult(data);

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
            setError('Failed to analyze case. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
                    <p className="mt-4 text-lg font-medium">Analisando o caso...</p>
                    <p className="text-sm text-slate-500">Isso pode levar alguns segundos.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-red-400">
                    <AlertTriangle className="w-10 h-10" />
                    <p className="mt-4 text-lg font-medium">Erro na análise:</p>
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            );
        }

        if (!result && activeTab === 'soap') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <BookOpen className="w-10 h-10" />
                    <p className="mt-4 text-lg font-medium">Nenhum registro SOAP para exibir.</p>
                    <p className="text-sm text-slate-500">Analise um caso para gerar um registro.</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'copilot':
                return <CoPilotChat onSessionEnd={() => setActiveTab('dashboard')} />;
            case 'dashboard':
                return <PatientDashboard activeTab={activeTab} />;
            case 'anamnesis':
                return <AnamnesisForm />;
            case 'eells':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <ProblemListCard />
                        <GoalsManager />
                        <InterventionsPanel />
                    </div>
                );
            case 'forms':
                return (
                    <div className="space-y-6">
                        <AssessmentChart assessments={currentPatient.clinicalRecords.assessments} />
                        <Gad7Form />
                    </div>
                );
            case 'formulation':
                return <CaseFormulation />;
            case 'curation':
                return <CurationWorkspace />;
            case 'evolution':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <DischargeRadar criteria={currentPatient.clinicalRecords.dischargeCriteria || []} />
                        <EvolutionPanel />
                    </div>
                );
            case 'alchemy':
                return <AlchemyLab />;
            case 'network':
                if (!result) return null;
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-black border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2 flex items-center gap-2 relative z-10">
                                <BrainCircuit className="w-6 h-6 text-cyan-400" />REDE DE PROCESSOS PBT
                            </h3>
                            <PBTGraph nodes={result.pbt_network.nodes} edges={result.pbt_network.edges} />
                        </div>
                    </div>
                );
            case 'plan':
                if (!result) return null;
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {result.analise_original?.alerta_risco && (
                            <div className="relative overflow-hidden rounded-xl bg-red-950/50 border border-red-500/50 p-6 flex items-start gap-4 shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]">
                                <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 animate-pulse" />
                                <div className="relative z-10">
                                    <h3 className="text-red-400 font-bold text-lg tracking-widest flex items-center gap-2">ALERTA DE SEGURANÇA</h3>
                                    <p className="text-red-200/80 text-sm mt-2 font-mono border-l-2 border-red-500/30 pl-3">Indicadores de risco detectados.</p>
                                </div>
                            </div>
                        )}

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
                );
            default:
                return null;
        }
    };

    const handleSelectSession = (session: any) => {
        setResult({
            soap: session.soap,
            pbt_network: session.pbtNetwork,
            adaptacao: session.adaptation,
            analise_original: undefined
        });
        setNotes(session.notes);
        setActiveTab('soap');
    };

    return (
        <div className="h-screen flex bg-white text-gray-900 font-sans selection:bg-blue-100">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main Content Area - Removed ml-64 as flex layout handles spacing automatically */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50 transition-all duration-300">
                {/* Top Bar with Export */}
                <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 flex-none">
                    <button
                        onClick={handleExportRecords}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors shadow-sm"
                        title="Baixar Prontuário Completo"
                    >
                        <Download className="w-4 h-4" />
                        Exportar Prontuário
                    </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-auto p-6">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

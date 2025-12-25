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
import { AnamnesisSelector } from './AnamnesisSelector';
import { ProblemListCard } from './ProblemListCard';
import { GoalsManager } from './GoalsManager';
import { InterventionsPanel } from './InterventionsPanel';
import { ProntuarioCRP } from './ProntuarioCRP';
import { TreatmentPlanTab } from './TreatmentPlanTab';
import { MonitoringDashboard } from './MonitoringDashboard';
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
import { NavigationProvider } from '../context/NavigationContext';


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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'soap' | 'network' | 'plan' | 'forms' | 'anamnesis' | 'formulation' | 'curation' | 'evolution' | 'alchemy' | 'copilot' | 'eells' | 'prontuario' | 'library'>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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



    const handleGraphUpdate = (newNodes: any[], newEdges: any[]) => {
        if (!currentPatient) return;

        const updatedPatient = JSON.parse(JSON.stringify(currentPatient));
        if (!updatedPatient.clinicalRecords.sessions) updatedPatient.clinicalRecords.sessions = [];

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
    };

    const handleLiveAnalysis = (analysis: { active_nodes?: any[] }) => {
        if (!analysis.active_nodes || !currentPatient) return;

        // Get current PBT State
        const currentSession = currentPatient.clinicalRecords.sessions[0] || { pbtNetwork: { nodes: [], edges: [] } };
        const currentNodes = currentSession.pbtNetwork?.nodes || [];
        const currentEdges = currentSession.pbtNetwork?.edges || [];

        // Filter New Nodes
        const newNodes = analysis.active_nodes
            .filter((an: any) => !currentNodes.some((cn: any) => cn.label.toLowerCase().includes(an.label.toLowerCase())))
            .map((an: any) => ({
                id: `live-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                label: an.label,
                category: an.category || 'Contexto',
                change: 'novo',
                type: 'pbtNode'
            }));

        if (newNodes.length > 0) {
            // Merge and Update
            const updatedNodes = [...currentNodes, ...newNodes];
            handleGraphUpdate(updatedNodes, currentEdges);
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
                return <CoPilotChat onSessionEnd={() => setActiveTab('dashboard')} onAnalysisUpdate={handleLiveAnalysis} />;
            case 'dashboard':
                return <PatientDashboard activeTab={activeTab} />;
            case 'anamnesis':
                return <AnamnesisSelector />;
            case 'eells':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <ProblemListCard />
                        <GoalsManager />
                        <InterventionsPanel />
                    </div>
                );
            case 'forms':
                return <MonitoringDashboard currentPatient={currentPatient} />;
            case 'formulation':
                return <CaseFormulation />;
            case 'curation':
                return <CurationWorkspace />;
            case 'prontuario':
                return <ProntuarioCRP />;
            case 'plan':
                return <TreatmentPlanTab />;
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
                // Prioritize analysis result, fallback to stored patient data
                const pbtData = result?.pbt_network || currentPatient.clinicalRecords.sessions[0]?.pbtNetwork;

                if (!pbtData || (!pbtData.nodes.length && !pbtData.edges.length)) {
                    // Show empty state / onboarding if no data exists at all
                    return (
                        <div className="flex flex-col items-center justify-start h-full text-slate-400 space-y-4 pt-8">
                            <BrainCircuit className="w-12 h-12 opacity-20" />
                            <div className="text-center">
                                <p className="text-lg font-medium text-slate-300">Nenhuma Rede PBT Criada</p>
                                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                                    Analise um caso clínico para gerar a primeira versão ou use o botão "+" no gráfico para criar manualmente.
                                </p>
                            </div>
                            {/* Allow manual creation even without data */}
                            <div className="w-full flex-1 min-h-[500px] bg-black border border-slate-800 rounded-xl relative">
                                <PBTGraph nodes={[]} edges={[]} onGraphUpdate={handleGraphUpdate} />
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-black border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2 flex items-center gap-2 relative z-10">
                                <BrainCircuit className="w-6 h-6 text-cyan-400" />REDE DE PROCESSOS PBT
                                {result ? <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Análise Atual</span> : <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">Histórico do Paciente</span>}
                            </h3>
                            <PBTGraph nodes={pbtData.nodes} edges={pbtData.edges} onGraphUpdate={handleGraphUpdate} />
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
        <NavigationProvider activeTab={activeTab} setActiveTab={setActiveTab}>
            <div className="h-screen flex bg-white text-gray-900 font-sans selection:bg-blue-100">
                {/* Sidebar */}
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50 transition-all duration-300">

                    {/* Content Container */}
                    <div className="flex-1 overflow-auto p-6">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </NavigationProvider>
    );
};

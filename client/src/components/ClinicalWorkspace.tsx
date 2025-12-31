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
import { GASPanel } from './GASPanel';
import { ProntuarioCRP } from './ProntuarioCRP';
import { TreatmentPlanTab } from './TreatmentPlanTab';
import { MonitoringDashboard } from './MonitoringDashboard';
import { PaymentHistory } from './PaymentHistory';
import { SessionManager } from './SessionManager';
import { HomeworkPanel } from './HomeworkPanel';
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'soap' | 'network' | 'plan' | 'forms' | 'anamnesis' | 'formulation' | 'curation' | 'evolution' | 'alchemy' | 'copilot' | 'eells' | 'prontuario' | 'library' | 'financeiro' | 'sessoes' | 'homework'>('dashboard');
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
                        <GASPanel />
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
            case 'financeiro':
                return <PaymentHistory />;
            case 'homework':
                return <HomeworkPanel />;
            case 'sessoes':
                return <SessionManager />;
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
                    <div className="h-full w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <PBTGraph nodes={pbtData.nodes} edges={pbtData.edges} onGraphUpdate={handleGraphUpdate} />
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

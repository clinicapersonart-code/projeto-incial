import React, { useState } from 'react';
import { LineChart, Sparkles, TrendingUp, AlertTriangle, ArrowRight, BrainCircuit, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { EvolutionAnalysis } from '../types/patient';
import { analyzeEvolution, evolvePBT } from '../lib/gemini';
import { usePatients } from '../context/PatientContext';
import ReactMarkdown from 'react-markdown';

export const EvolutionPanel: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<EvolutionAnalysis | null>(currentPatient?.clinicalRecords.evolutionAnalysis?.[0] || null);

    const [pbtUpdates, setPbtUpdates] = useState<any>(null);
    const [checkingPBT, setCheckingPBT] = useState(false);

    const handleApplyPBTUpdates = () => {
        if (!currentPatient || !pbtUpdates) return;

        const currentPBT = currentPatient.clinicalRecords.caseFormulation.pbtData || { nodes: [], edges: [] };
        let updatedNodes = [...currentPBT.nodes];
        let updatedEdges = [...currentPBT.edges];

        // 1. Add New Nodes
        if (pbtUpdates.newNodes) {
            pbtUpdates.newNodes.forEach((newNode: any) => {
                // Prevent duplicates by ID or Label
                if (!updatedNodes.find(n => n.id === newNode.id || n.label === newNode.label)) {
                    updatedNodes.push({
                        ...newNode,
                        id: newNode.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Ensure ID
                        change: 'novo'
                    });
                }
            });
        }

        // 2. Add New Edges
        if (pbtUpdates.newEdges) {
            updatedEdges = [...updatedEdges, ...pbtUpdates.newEdges];
        }

        // 3. Apply Updates to Existing Nodes (e.g. status change)
        if (pbtUpdates.updates) {
            updatedNodes = updatedNodes.map(node => {
                const update = pbtUpdates.updates.find((u: any) => u.nodeId === node.id);
                if (update) {
                    return { ...node, change: update.newStatus || node.change }; // Update status if provided
                }
                return node;
            });
        }

        // 4. Save to Patient Record
        updatePatient({
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                caseFormulation: {
                    ...currentPatient.clinicalRecords.caseFormulation,
                    pbtData: {
                        nodes: updatedNodes,
                        edges: updatedEdges
                    }
                }
            }
        });

        alert("Rede PBT Evoluída com Sucesso!");
        setPbtUpdates(null); // Clear updates after applying
    };

    const handlePBTEvolution = async () => {
        if (!currentPatient) return;
        const sessions = currentPatient.clinicalRecords.sessions;
        if (sessions.length < 1) {
            alert("Necessário pelo menos 1 sessão para evoluir a rede.");
            return;
        }

        setCheckingPBT(true);
        try {
            const lastSession = sessions[0];
            const currentPBT = currentPatient.clinicalRecords.caseFormulation.pbtData || { nodes: [], edges: [] };

            // Mock analysis or use stored soap if available
            const analysis = lastSession.soap || { evaluation: "Generic session" };

            const result = await evolvePBT(currentPBT, lastSession.notes, analysis);
            setPbtUpdates(result);
        } catch (error) {
            console.error(error);
            alert("Erro ao verificar evolução da rede.");
        } finally {
            setCheckingPBT(false);
        }
    };

    const handleRunAnalysis = async () => {
        if (!currentPatient) return;
        setAnalyzing(true);
        try {
            // Check if we have enough data (at least 2 sessions or 2 assessments)
            const sessions = currentPatient.clinicalRecords.sessions;
            const assessments = currentPatient.clinicalRecords.assessments;
            const criteria = currentPatient.clinicalRecords.dischargeCriteria || [];

            // Allow analysis with just 1 session for testing purposes, or revert to 2
            if (sessions.length === 0 && assessments.length === 0) {
                alert("Sem dados suficientes.");
                setAnalyzing(false);
                return;
            }

            const analysis = await analyzeEvolution(sessions, assessments, criteria);
            setResult(analysis);

            // Save to record
            const updatedEvolution = [analysis, ...(currentPatient.clinicalRecords.evolutionAnalysis || [])];
            updatePatient({
                ...currentPatient,
                clinicalRecords: {
                    ...currentPatient.clinicalRecords,
                    evolutionAnalysis: updatedEvolution,
                    dischargeCriteria: analysis.criteriaUpdates // Update criteria status based on analysis
                }
            });

        } catch (error) {
            console.error(error);
            alert("Erro ao realizar análise de evolução.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

            {/* Header / Trigger */}
            <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        Inteligência de Evolução
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        A IA cruza dados quantitativos (Scores) com qualitativos (Sessões) para encontrar padrões.
                    </p>
                </div>
                <button
                    onClick={handleRunAnalysis}
                    disabled={analyzing}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                >
                    {analyzing ? <TrendingUp className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {analyzing ? "ANALISANDO DADOS..." : "RODAR ANÁLISE DE EVOLUÇÃO"}
                </button>
            </div>

            {/* Results Area */}
            {result ? (
                <div className="bg-slate-950/80 border border-white/10 rounded-xl p-8 shadow-2xl">
                    <div className="mb-6 flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">
                        <span>Análise Gerada em: {new Date(result.date).toLocaleDateString()}</span>
                    </div>

                    <div className="prose prose-invert prose-lg max-w-none">
                        <ReactMarkdown>{result.analysisText}</ReactMarkdown>
                    </div>

                    {result.criteriaUpdates.some(c => c.status === 'achieved') && (
                        <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-full">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-100">Atualização de Radar de Alta</h4>
                                <p className="text-sm text-emerald-200/70">
                                    Baseado nesta análise, o status de alguns critérios de alta foi atualizado automaticamente. Verifique o Radar.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-64 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 gap-4">
                    <LineChart className="w-12 h-12 opacity-20" />
                    <p>Nenhuma análise gerada ainda.</p>
                </div>
            )}

            {/* PBT Network Evolution Section */}
            <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <BrainCircuit className="w-6 h-6 text-cyan-400" />
                            Evolução da Rede PBT
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Detecta novos processos ou mudanças na rede baseada na última sessão.
                        </p>
                    </div>
                    <button
                        onClick={handlePBTEvolution}
                        disabled={checkingPBT}
                        className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-600/30 font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {checkingPBT ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                        {checkingPBT ? "Checando..." : "Checar Mudanças na Rede"}
                    </button>
                </div>

                {pbtUpdates && (
                    <div className="bg-black/40 border border-white/5 rounded-lg p-6 space-y-4">
                        {!pbtUpdates.hasChanges ? (
                            <div className="text-slate-500 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                Nenhuma mudança significativa detectada na rede nesta sessão.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                    <h4 className="font-bold text-purple-300 text-sm mb-2 uppercase tracking-wider">Análise de Mudança</h4>
                                    <p className="text-slate-300 text-sm">{pbtUpdates.reasoning}</p>
                                </div>

                                {pbtUpdates.newNodes?.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-emerald-400 text-xs uppercase mb-2">Novos Processos (Nós)</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {pbtUpdates.newNodes.map((node: any, i: number) => (
                                                <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full text-xs border border-emerald-500/20">
                                                    + {node.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {pbtUpdates.show_interventions && (
                                    <div className="mt-2 text-xs text-slate-400 italic">
                                        * Intervenções foram identificadas e serão adicionadas à rede.
                                    </div>
                                )}

                                {pbtUpdates.updates?.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-amber-400 text-xs uppercase mb-2">Atualizações</h4>
                                        <ul className="space-y-1">
                                            {pbtUpdates.updates.map((upd: any, i: number) => (
                                                <li key={i} className="text-xs text-slate-400">
                                                    <span className="text-amber-300 font-mono">{upd.nodeId}:</span> {upd.changeDescription}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <button
                                        onClick={handleApplyPBTUpdates}
                                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        CONFIRMAR EVOLUÇÃO NA REDE
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

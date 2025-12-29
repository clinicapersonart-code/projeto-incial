import React, { useState, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    Target,
    ChevronDown,
    ChevronRight,
    Sparkles,
    Loader2,
    FileText,
    BookOpen,
    AlertCircle,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    FileUp,
    History,
    Check
} from 'lucide-react';
import { recommendProtocols, generateClinicalAnalysisMultiPdf } from '../lib/gemini';
import type { TreatmentPhase, TreatmentSession, ClinicalAnalysis } from '../types/treatment-plan';
import { TreatmentPlanHistoryEntry, TREATMENT_CHANGE_REASONS, Intervention, Goal } from '../types/eells';

const DEFAULT_PHASES: TreatmentPhase[] = [
    {
        id: 'phase1',
        name: 'Aliança, avaliação e psicoeducação',
        sessionRange: { start: 1, end: 4 },
        sessions: [
            { number: 1, objectives: ['Estabelecimento de aliança terapêutica', 'Mapeamento inicial'], strategies: 'Entrevista motivacional, mapeamento dos problemas, história de vida' },
            { number: 2, objectives: ['Psicoeducação sobre ciclo de manutenção'], strategies: 'Explicação do ciclo de manutenção do sofrimento' },
            { number: 3, objectives: ['Avaliação detalhada'], strategies: 'Análise funcional molar e episódica' },
            { number: 4, objectives: ['Motivação e plano de mudança'], strategies: 'Técnicas de entrevista motivacional' }
        ]
    },
    {
        id: 'phase2',
        name: 'Consciência emocional e regulação',
        sessionRange: { start: 5, end: 8 },
        sessions: [
            { number: 5, objectives: ['Consciência emocional'], strategies: 'Mindfulness para emoções; rotulagem emocional' },
            { number: 6, objectives: ['Relação pensamentos-emoções-comportamento'], strategies: 'Triângulo cognitivo-comportamental' },
            { number: 7, objectives: ['Autorregulação'], strategies: 'Técnicas de aceitação' },
            { number: 8, objectives: ['Manejo de recaídas'], strategies: 'Psicoeducação sobre recaída' }
        ]
    }
];

export const TreatmentPlanTab: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<ClinicalAnalysis | null>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPhase[]>(DEFAULT_PHASES);
    const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
    const [editingSessionKey, setEditingSessionKey] = useState<string | null>(null);
    const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
    const [showAddSessionModal, setShowAddSessionModal] = useState<string | null>(null);
    const [newPhaseName, setNewPhaseName] = useState('');
    const [newSessionObjectives, setNewSessionObjectives] = useState('');
    const [newSessionStrategies, setNewSessionStrategies] = useState('');
    const [pdfList, setPdfList] = useState<Array<{ name: string; base64: string }>>([]);
    const [isSearchingProtocols, setIsSearchingProtocols] = useState(false);
    const [protocolRecommendations, setProtocolRecommendations] = useState<any>(null);
    const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);

    // Revision modal state
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [revisionReason, setRevisionReason] = useState('');
    const [selectedQuickReason, setSelectedQuickReason] = useState<string>('');
    const [revisionChangeType, setRevisionChangeType] = useState<'goal' | 'intervention' | 'both' | 'review' | 'other'>('both');

    // Load treatment plan from patient
    useEffect(() => {
        if (currentPatient?.eellsData?.treatmentPlan) {
            // Could load saved phases here if stored
        }
    }, [currentPatient]);

    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            if (file.type !== 'application/pdf') return;
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                setPdfList(prev => [...prev, { name: file.name, base64 }]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removePdf = (index: number) => setPdfList(prev => prev.filter((_, i) => i !== index));

    const handleDeepResearch = async () => {
        if (!currentPatient) return;
        setIsSearchingProtocols(true);
        try {
            // Coletar dados ricos do paciente
            const eellsData = (currentPatient as any).eellsData || {};
            const clinicalRecords = currentPatient.clinicalRecords || {};

            // Extrair anamnese resumida
            const anamneseContent = clinicalRecords.anamnesis?.content || '';
            const anamneseSummary = anamneseContent.length > 500
                ? anamneseContent.substring(0, 500) + '...'
                : anamneseContent;

            // Extrair mecanismos
            const mechanisms = eellsData.mechanisms || {};
            const mechanismsSummary = [
                mechanisms.precipitants?.length ? `Precipitantes: ${mechanisms.precipitants.join(', ')}` : '',
                mechanisms.maintainingProcesses?.length ? `Mantenedores: ${mechanisms.maintainingProcesses.join(', ')}` : '',
                mechanisms.coreBelief ? `Crença central: ${mechanisms.coreBelief}` : ''
            ].filter(Boolean).join('. ');

            // Extrair formulação
            const formulationNarrative = eellsData.formulation?.narrative || '';

            const recommendations = await recommendProtocols({
                name: currentPatient.name,
                primaryDiagnosis: (currentPatient as any).primaryDiagnosis || currentPatient.primaryDisorder,
                comorbidities: (currentPatient as any).comorbidities,
                presentingProblems: eellsData.problemList?.map((p: any) => p.description || p.problem),
                preferences: `
                    ANAMNESE: ${anamneseSummary}
                    
                    MECANISMOS: ${mechanismsSummary}
                    
                    FORMULAÇÃO: ${formulationNarrative}
                `
            });
            setProtocolRecommendations(recommendations);
            setShowRecommendationsModal(true);
        } catch (error) {
            console.error('Error:', error);
            alert('Erro na busca. Verifique o console para detalhes.');
        } finally {
            setIsSearchingProtocols(false);
        }
    };

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => prev.includes(phaseId) ? prev.filter(id => id !== phaseId) : [...prev, phaseId]);
    };

    const addPhase = () => {
        if (!newPhaseName.trim()) return;
        const lastPhase = treatmentPlan[treatmentPlan.length - 1];
        const startSession = lastPhase ? lastPhase.sessionRange.end + 1 : 1;
        setTreatmentPlan([...treatmentPlan, {
            id: `phase_${Date.now()}`,
            name: newPhaseName,
            sessionRange: { start: startSession, end: startSession },
            sessions: []
        }]);
        setNewPhaseName('');
        setShowAddPhaseModal(false);
    };

    const updatePhaseName = (phaseId: string, newName: string) => {
        setTreatmentPlan(prev => prev.map(p => p.id === phaseId ? { ...p, name: newName } : p));
    };

    const deletePhase = (phaseId: string) => {
        if (!confirm('Excluir fase?')) return;
        setTreatmentPlan(prev => prev.filter(p => p.id !== phaseId));
    };

    const addSession = (phaseId: string) => {
        if (!newSessionObjectives.trim()) return;
        setTreatmentPlan(prev => prev.map(phase => {
            if (phase.id !== phaseId) return phase;
            const newNumber = phase.sessions.length > 0 ? Math.max(...phase.sessions.map(s => s.number)) + 1 : phase.sessionRange.start;
            return {
                ...phase,
                sessions: [...phase.sessions, { number: newNumber, objectives: newSessionObjectives.split('\n').filter(o => o.trim()), strategies: newSessionStrategies }],
                sessionRange: { ...phase.sessionRange, end: newNumber }
            };
        }));
        setNewSessionObjectives('');
        setNewSessionStrategies('');
        setShowAddSessionModal(null);
    };

    const updateSession = (phaseId: string, sessionNumber: number, updates: Partial<TreatmentSession>) => {
        setTreatmentPlan(prev => prev.map(phase => {
            if (phase.id !== phaseId) return phase;
            return { ...phase, sessions: phase.sessions.map(s => s.number === sessionNumber ? { ...s, ...updates } : s) };
        }));
    };

    const deleteSession = (phaseId: string, sessionNumber: number) => {
        if (!confirm('Excluir sessão?')) return;
        setTreatmentPlan(prev => prev.map(phase => {
            if (phase.id !== phaseId) return phase;
            const newSessions = phase.sessions.filter(s => s.number !== sessionNumber);
            return { ...phase, sessions: newSessions, sessionRange: { start: phase.sessionRange.start, end: newSessions.length > 0 ? Math.max(...newSessions.map(s => s.number)) : phase.sessionRange.start } };
        }));
    };

    const handleGenerateAnalysis = async () => {
        if (!currentPatient) return;
        setIsGeneratingAnalysis(true);
        try {
            const analysis = await generateClinicalAnalysisMultiPdf({
                patientName: currentPatient.name,
                sessionsCompleted: 12,
                currentPhase: 'Transição de fases',
                progress: 'Progresso em andamento',
                recentChanges: 'Contexto atualizado',
                currentPlan: treatmentPlan,
                pdfContents: pdfList.length > 0 ? pdfList : undefined,
                protocolRecommendations: protocolRecommendations || undefined
            });
            setCurrentAnalysis(analysis);
            setShowAnalysisModal(true);
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao gerar análise.');
        } finally {
            setIsGeneratingAnalysis(false);
        }
    };

    // Save treatment plan revision with history
    const handleSaveRevision = () => {
        if (!currentPatient) return;

        const finalReason = selectedQuickReason || revisionReason;
        if (finalReason.trim().length < 10) {
            alert('Motivo da revisão deve ter pelo menos 10 caracteres');
            return;
        }

        const now = new Date().toISOString();
        const existingPlan = (currentPatient as any).eellsData?.treatmentPlan;
        const existingHistory = existingPlan?.history || [];

        // Create snapshot
        const goals = existingPlan?.goals || [];
        const interventions = existingPlan?.interventions || [];

        const snapshot = {
            goalsCount: goals.length,
            goalsDescriptions: goals.map((g: Goal) => g.description),
            goalsStatuses: goals.map((g: Goal) => g.status),
            interventionsCount: interventions.length,
            interventionNames: interventions.map((i: Intervention) => i.name),
            targetNodes: interventions.flatMap((i: Intervention) => i.targetNodes || [])
        };

        // Create history entry
        const historyEntry: TreatmentPlanHistoryEntry = {
            id: crypto.randomUUID(),
            date: now,
            snapshot,
            changeReason: finalReason,
            changeType: revisionChangeType,
            changedBy: 'terapeuta'
        };

        // Update patient
        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                treatmentPlan: {
                    ...existingPlan,
                    history: [historyEntry, ...existingHistory].slice(0, 20),
                    reviewedAt: now,
                    lastUpdated: now.split('T')[0]
                }
            }
        } as any);

        // Reset modal
        setShowRevisionModal(false);
        setRevisionReason('');
        setSelectedQuickReason('');
        setRevisionChangeType('both');
    };

    // Get history count
    const historyCount = (currentPatient as any)?.eellsData?.treatmentPlan?.history?.length || 0;

    if (!currentPatient) {
        return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Selecione um paciente</p></div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Target className="w-8 h-8 text-indigo-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Plano de Tratamento</h1>
                            <p className="text-sm text-gray-600">Baseado na Tríade da PBE</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddPhaseModal(true)} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm">
                            <Plus className="w-4 h-4" /> Nova Fase
                        </button>
                        <button onClick={handleDeepResearch} disabled={isSearchingProtocols} className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50">
                            {isSearchingProtocols ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                            Deep Research
                        </button>
                        <button onClick={handleGenerateAnalysis} disabled={isGeneratingAnalysis} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50">
                            {isGeneratingAnalysis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Análise Clínica IA
                        </button>
                        <button
                            onClick={() => setShowRevisionModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm"
                        >
                            <History className="w-4 h-4" />
                            Salvar Revisão
                            {historyCount > 0 && (
                                <span className="bg-teal-800 px-1.5 py-0.5 rounded text-xs">{historyCount}</span>
                            )}
                        </button>
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer border border-gray-300">
                            <FileUp className="w-4 h-4" /> Adicionar Protocolos (PDF)
                            <input type="file" accept=".pdf" multiple onChange={handlePdfUpload} className="hidden" />
                        </label>
                        <span className="text-sm text-gray-500">{pdfList.length === 0 ? 'Nenhum protocolo' : `${pdfList.length} protocolo(s)`}</span>
                        {protocolRecommendations && <span className="text-sm text-amber-600">✓ Deep Research realizado</span>}
                    </div>
                    {pdfList.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {pdfList.map((pdf, index) => (
                                <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                                    <FileText className="w-4 h-4 text-emerald-600" />
                                    <span className="text-emerald-700 max-w-[150px] truncate">{pdf.name}</span>
                                    <button onClick={() => removePdf(index)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Phases */}
            <div className="space-y-4">
                {treatmentPlan.map((phase) => {
                    const isExpanded = expandedPhases.includes(phase.id);
                    const isEditing = editingPhaseId === phase.id;
                    return (
                        <div key={phase.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <button onClick={() => togglePhase(phase.id)} className="flex items-center gap-3 flex-1 text-left">
                                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        {isEditing ? (
                                            <input type="text" value={phase.name} onChange={(e) => updatePhaseName(phase.id, e.target.value)} onBlur={() => setEditingPhaseId(null)} className="font-bold border-b-2 border-indigo-500 outline-none" autoFocus />
                                        ) : (
                                            <h3 className="font-bold text-gray-900">{phase.name}</h3>
                                        )}
                                        <p className="text-sm text-gray-500">Sessões {phase.sessionRange.start}–{phase.sessionRange.end}</p>
                                    </div>
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingPhaseId(phase.id)} className="p-2 text-gray-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => deletePhase(phase.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="border-t border-gray-200">
                                    {phase.sessions.map((session) => {
                                        const sessionKey = `${phase.id}-${session.number}`;
                                        const isEditingSession = editingSessionKey === sessionKey;
                                        return (
                                            <div key={session.number} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 group">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-bold text-indigo-700">{session.number}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        {isEditingSession ? (
                                                            <div className="space-y-3">
                                                                <textarea value={session.objectives.join('\n')} onChange={(e) => updateSession(phase.id, session.number, { objectives: e.target.value.split('\n').filter(o => o.trim()) })} className="w-full border rounded-lg p-2 text-sm" rows={3} />
                                                                <textarea value={session.strategies} onChange={(e) => updateSession(phase.id, session.number, { strategies: e.target.value })} className="w-full border rounded-lg p-2 text-sm" rows={2} />
                                                                <button onClick={() => setEditingSessionKey(null)} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg"><Save className="w-4 h-4 inline mr-1" /> Salvar</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="mb-2">
                                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Objetivos</h4>
                                                                    <ul className="list-disc list-inside">{session.objectives.map((obj, idx) => <li key={idx} className="text-sm text-gray-700">{obj}</li>)}</ul>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Estratégias</h4>
                                                                    <p className="text-sm text-gray-700">{session.strategies}</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {!isEditingSession && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                                            <button onClick={() => setEditingSessionKey(sessionKey)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => deleteSession(phase.id, session.number)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <button onClick={() => setShowAddSessionModal(phase.id)} className="w-full p-3 text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Adicionar Sessão
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Phase Modal */}
            {showAddPhaseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Nova Fase</h3>
                        <input type="text" placeholder="Nome da fase" value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} className="w-full border rounded-lg px-4 py-3 mb-4" autoFocus />
                        <div className="flex gap-3">
                            <button onClick={addPhase} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-semibold">Criar</button>
                            <button onClick={() => setShowAddPhaseModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Session Modal */}
            {showAddSessionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-bold mb-4">Nova Sessão</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Objetivos (um por linha)</label>
                                <textarea value={newSessionObjectives} onChange={(e) => setNewSessionObjectives(e.target.value)} className="w-full border rounded-lg px-4 py-2" rows={3} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Estratégias</label>
                                <textarea value={newSessionStrategies} onChange={(e) => setNewSessionStrategies(e.target.value)} className="w-full border rounded-lg px-4 py-2" rows={2} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => addSession(showAddSessionModal)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-semibold">Adicionar</button>
                            <button onClick={() => setShowAddSessionModal(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Analysis Modal */}
            {showAnalysisModal && currentAnalysis && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-purple-600" />
                                <h2 className="text-xl font-bold">Análise Clínica PBE</h2>
                            </div>
                            <button onClick={() => setShowAnalysisModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {currentAnalysis.pbeTriadAnalysis && (
                                <section className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                                    <h3 className="font-bold mb-3">🔬 Análise da Tríade PBE</h3>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div><p className="font-semibold text-purple-700">Evidência</p><p className="text-gray-600">{currentAnalysis.pbeTriadAnalysis.evidenceUsed}</p></div>
                                        <div><p className="font-semibold text-indigo-700">Expertise</p><p className="text-gray-600">{currentAnalysis.pbeTriadAnalysis.expertiseApplied}</p></div>
                                        <div><p className="font-semibold text-blue-700">Contexto</p><p className="text-gray-600">{currentAnalysis.pbeTriadAnalysis.patientContextIntegration}</p></div>
                                    </div>
                                </section>
                            )}
                            <section><h3 className="text-lg font-bold mb-2">1. Introdução</h3><p className="text-gray-700 whitespace-pre-wrap">{currentAnalysis.introduction}</p></section>
                            <section><h3 className="text-lg font-bold mb-2">2. Síntese</h3><p className="text-gray-700 whitespace-pre-wrap">{currentAnalysis.synthesis}</p></section>
                            <section>
                                <h3 className="text-lg font-bold mb-3">3. Fatores</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-green-800 mb-2">Proteção</h4>
                                        <ul className="space-y-1">{currentAnalysis.protectionFactors?.map((f, i) => <li key={i} className="text-sm text-green-700">✓ {f}</li>)}</ul>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-amber-800 mb-2">Risco</h4>
                                        <ul className="space-y-1">{currentAnalysis.riskFactors?.map((f, i) => <li key={i} className="text-sm text-amber-700 flex items-start gap-1"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {f}</li>)}</ul>
                                    </div>
                                </div>
                            </section>
                            <section><h3 className="text-lg font-bold mb-2">4. Recomendação</h3><div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-3"><p className="font-semibold text-indigo-900">{currentAnalysis.recommendation}</p></div><p className="text-gray-700 whitespace-pre-wrap">{currentAnalysis.recommendationText}</p></section>
                            <section><h3 className="text-lg font-bold mb-2">5. Conclusão</h3><p className="text-gray-700 whitespace-pre-wrap">{currentAnalysis.conclusion}</p></section>
                        </div>
                        <div className="p-4 border-t flex justify-end"><button onClick={() => setShowAnalysisModal(false)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold">Fechar</button></div>
                    </div>
                </div>
            )}

            {/* Deep Research Modal */}
            {showRecommendationsModal && protocolRecommendations && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-amber-600" />
                                <div>
                                    <h2 className="text-xl font-bold">Deep Research - Protocolos Recomendados</h2>
                                    <p className="text-sm text-gray-600">Baseado na Tríade PBE para {currentPatient?.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowRecommendationsModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {protocolRecommendations.triadAnalysis && (
                                <section className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                                    <h3 className="font-bold mb-3">🔬 Análise da Tríade PBE</h3>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div><p className="font-semibold text-purple-700">Evidência</p><p className="text-gray-600">{protocolRecommendations.triadAnalysis.evidenceConsiderations}</p></div>
                                        <div><p className="font-semibold text-indigo-700">Expertise</p><p className="text-gray-600">{protocolRecommendations.triadAnalysis.expertiseConsiderations}</p></div>
                                        <div><p className="font-semibold text-blue-700">Contexto</p><p className="text-gray-600">{protocolRecommendations.triadAnalysis.patientContextConsiderations}</p></div>
                                    </div>
                                </section>
                            )}
                            <section>
                                <h3 className="font-bold mb-3">📚 Protocolos Recomendados</h3>
                                <div className="space-y-4">
                                    {protocolRecommendations.recommendations?.map((rec: any, idx: number) => (
                                        <div key={idx} className="bg-white border rounded-lg p-4 hover:shadow-md">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold">{rec.protocolName}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.evidenceLevel === 'forte' ? 'bg-green-100 text-green-700' : rec.evidenceLevel === 'moderado' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{rec.evidenceLevel}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">{rec.authors} • {rec.estimatedDuration}</p>
                                            <p className="text-gray-700 mb-3">{rec.indicationRationale}</p>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {rec.keyComponents?.map((comp: string, i: number) => <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded">{comp}</span>)}
                                            </div>
                                            <p className="text-xs text-gray-400">{rec.reference}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h3 className="font-bold text-amber-800 mb-2">💡 Recomendação Geral</h3>
                                <p className="text-gray-700">{protocolRecommendations.summaryRecommendation}</p>
                            </section>

                            {/* Fontes do Google Search Grounding */}
                            {protocolRecommendations.searchSources && protocolRecommendations.searchSources.length > 0 && (
                                <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-bold text-blue-800 mb-2">🔗 Fontes Consultadas (Google Search)</h3>
                                    <div className="space-y-2">
                                        {protocolRecommendations.searchSources.map((source: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={source.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {source.title || source.uri}
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Aviso sobre PDF */}
                        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                            <p className="text-sm text-blue-700">
                                💡 <strong>Dica:</strong> Para um plano mais detalhado, faça upload do PDF/manual do protocolo recomendado.
                                O Deep Research identifica o melhor protocolo, mas o conteúdo completo está nos manuais originais.
                            </p>
                        </div>

                        <div className="p-4 border-t flex justify-end gap-3">
                            <button onClick={() => setShowRecommendationsModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Fechar</button>
                            <button onClick={() => setShowRecommendationsModal(false)} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold">OK, Entendi</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revision Modal */}
            {showRevisionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                                <History className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Salvar Revisão do Plano</h2>
                                <p className="text-sm text-gray-500">Registre o motivo da alteração para rastreabilidade clínica</p>
                            </div>
                        </div>

                        {/* Quick Reasons */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo rápido:</label>
                            <div className="flex flex-wrap gap-2">
                                {TREATMENT_CHANGE_REASONS.map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => {
                                            setSelectedQuickReason(reason);
                                            setRevisionReason('');
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedQuickReason === reason
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Reason */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ou descreva (mín. 10 caracteres):
                            </label>
                            <textarea
                                value={revisionReason}
                                onChange={(e) => {
                                    setRevisionReason(e.target.value);
                                    setSelectedQuickReason('');
                                }}
                                placeholder="Ex: Paciente apresentou melhora significativa nas últimas sessões..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm min-h-[80px]"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {(selectedQuickReason || revisionReason).length}/10 caracteres
                            </p>
                        </div>

                        {/* Change Type */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de mudança:</label>
                            <div className="flex gap-2">
                                {[
                                    { value: 'goal', label: 'Metas' },
                                    { value: 'intervention', label: 'Intervenções' },
                                    { value: 'both', label: 'Ambos' },
                                    { value: 'review', label: 'Revisão' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setRevisionChangeType(opt.value as any)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${revisionChangeType === opt.value
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRevisionModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRevision}
                                disabled={(selectedQuickReason || revisionReason).length < 10}
                                className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                Salvar Revisão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

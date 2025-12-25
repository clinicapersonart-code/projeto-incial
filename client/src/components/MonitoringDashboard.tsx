import React, { useState, useMemo } from 'react';
import {
    ClipboardList,
    Plus,
    Sparkles,
    Clock,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Calendar,
    Play,
    X,
    ChevronRight,
    BarChart3,
    Loader2,
    Target,
    ArrowLeft,
    ExternalLink,
    FileText,
    User,
    Hash,
    Download,
    RefreshCw,
    Brain,
    Lightbulb,
    AlertCircle
} from 'lucide-react';
import { usePatients } from '../context/PatientContext';
import { INSTRUMENTS_LIBRARY, Instrument } from '../data/instruments';
import { InstrumentsLibrary } from './InstrumentsLibrary';
import { AssessmentChart } from './AssessmentChart';
import { Gad7Form } from './forms/Gad7Form';
import { generateMonitoringInsights } from '../lib/gemini';
import { GenericAssessmentForm } from './forms/GenericAssessmentForm';
import { INSTRUMENT_CONFIGS } from '../data/instrument-forms';

interface ActiveInstrument {
    instrumentId: string;
    addedDate: string;
    lastApplied?: string;
    frequency: string;
    isAIRecommended?: boolean;
    applicationCount?: number;
}

interface MonitoringDashboardProps {
    currentPatient: any;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ currentPatient }) => {
    const { updatePatient } = usePatients();
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [activeForm, setActiveForm] = useState<string | null>(null);
    const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [instrumentInsights, setInstrumentInsights] = useState<any>(null);

    // Get active instruments for this patient
    const activeInstruments: ActiveInstrument[] = useMemo(() => {
        return currentPatient?.clinicalRecords?.activeInstruments || [];
    }, [currentPatient]);

    // Get assessments for selected instrument
    const getInstrumentAssessments = (instrumentId: string) => {
        const assessments = currentPatient?.clinicalRecords?.assessments || [];
        const instrument = INSTRUMENTS_LIBRARY.find(i => i.id === instrumentId);
        if (!instrument) return [];

        // Match by abbreviation or type
        return assessments.filter((a: any) =>
            a.type?.toLowerCase() === instrument.abbreviation.toLowerCase() ||
            a.type?.toLowerCase().includes(instrument.abbreviation.toLowerCase().split('-')[0])
        );
    };

    // Calculate status for each instrument
    const getInstrumentStatus = (instrument: ActiveInstrument) => {
        if (!instrument.lastApplied) {
            return { status: 'pending', label: 'Nunca aplicado', color: 'amber', daysInfo: null };
        }

        const lastDate = new Date(instrument.lastApplied);
        const now = new Date();
        const daysSinceApplied = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        const frequencyDays: Record<string, number> = {
            'Toda sessão': 7,
            'Semanal': 7,
            'Quinzenal': 14,
            'Mensal': 30,
            'Sob demanda': 999
        };

        const expectedDays = frequencyDays[instrument.frequency] || 7;

        if (daysSinceApplied > expectedDays + 3) {
            return {
                status: 'overdue',
                label: 'Atrasado',
                color: 'red',
                daysInfo: `${daysSinceApplied - expectedDays} dias de atraso`
            };
        } else if (daysSinceApplied >= expectedDays - 2) {
            return { status: 'due', label: 'Aplicar hoje', color: 'amber', daysInfo: 'Momento ideal para aplicar' };
        } else {
            return {
                status: 'ok',
                label: 'Em dia',
                color: 'green',
                daysInfo: `Próxima aplicação em ${expectedDays - daysSinceApplied} dias`
            };
        }
    };

    // Add instrument to patient's active list
    const handleAddInstrument = (instrument: Instrument) => {
        const existing = activeInstruments.find(ai => ai.instrumentId === instrument.id);
        if (existing) {
            setShowLibraryModal(false);
            return;
        }

        const newActiveInstrument: ActiveInstrument = {
            instrumentId: instrument.id,
            addedDate: new Date().toISOString(),
            frequency: instrument.frequency,
            isAIRecommended: false,
            applicationCount: 0
        };

        const updatedPatient = {
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                activeInstruments: [
                    ...(currentPatient.clinicalRecords?.activeInstruments || []),
                    newActiveInstrument
                ]
            }
        };

        updatePatient(updatedPatient);
        setShowLibraryModal(false);
    };

    // Remove instrument from active list
    const handleRemoveInstrument = (instrumentId: string) => {
        const updatedPatient = {
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                activeInstruments: (currentPatient.clinicalRecords?.activeInstruments || [])
                    .filter((i: ActiveInstrument) => i.instrumentId !== instrumentId)
            }
        };
        updatePatient(updatedPatient);
        if (selectedInstrumentId === instrumentId) {
            setSelectedInstrumentId(null);
        }
    };

    // Apply instrument (open form) and update lastApplied
    const handleApplyInstrument = (instrumentId: string) => {
        // Update lastApplied and increment count
        const updatedActiveInstruments = (currentPatient.clinicalRecords?.activeInstruments || []).map((ai: ActiveInstrument) => {
            if (ai.instrumentId === instrumentId) {
                return {
                    ...ai,
                    lastApplied: new Date().toISOString(),
                    applicationCount: (ai.applicationCount || 0) + 1
                };
            }
            return ai;
        });

        const updatedPatient = {
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                activeInstruments: updatedActiveInstruments
            }
        };
        updatePatient(updatedPatient);

        // Open form
        if (instrumentId === 'gad7') {
            setActiveForm('gad7');
        } else {
            setActiveForm(instrumentId);
        }
    };

    // Generate AI insights for instrument
    const handleGenerateInsights = async (instrumentId: string) => {
        const assessments = getInstrumentAssessments(instrumentId);
        if (assessments.length < 2) {
            setInstrumentInsights({
                error: true,
                message: 'É necessário pelo menos 2 aplicações para gerar análise longitudinal.'
            });
            return;
        }

        setLoadingInsights(true);
        try {
            const insights = await generateMonitoringInsights(
                currentPatient,
                instrumentId,
                assessments
            );
            setInstrumentInsights(insights);
        } catch (error) {
            console.error('Error generating insights:', error);
            setInstrumentInsights({
                error: true,
                message: 'Erro ao gerar análise. Tente novamente.'
            });
        } finally {
            setLoadingInsights(false);
        }
    };

    // Get instrument data from library
    const getInstrumentData = (instrumentId: string) => {
        return INSTRUMENTS_LIBRARY.find(i => i.id === instrumentId);
    };

    // Get overdue count for summary
    const overdueCount = activeInstruments.filter(i => getInstrumentStatus(i).status === 'overdue').length;
    const dueCount = activeInstruments.filter(i => ['due', 'pending'].includes(getInstrumentStatus(i).status)).length;

    // Selected instrument details
    const selectedActiveInstrument = selectedInstrumentId
        ? activeInstruments.find(ai => ai.instrumentId === selectedInstrumentId)
        : null;
    const selectedInstrumentData = selectedInstrumentId
        ? getInstrumentData(selectedInstrumentId)
        : null;
    const selectedAssessments = selectedInstrumentId
        ? getInstrumentAssessments(selectedInstrumentId)
        : [];

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Main Content */}
            {selectedInstrumentId && selectedInstrumentData && selectedActiveInstrument ? (
                /* Instrument Detail View */
                <div className="flex-1 overflow-y-auto">
                    {/* Header with Back Button */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-900/30 to-purple-900/30">
                        <button
                            onClick={() => {
                                setSelectedInstrumentId(null);
                                setInstrumentInsights(null);
                            }}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para Monitoramento
                        </button>
                        <h1 className="text-2xl font-bold text-white">
                            Respostas do Formulário: {selectedInstrumentData.name}
                        </h1>
                    </div>

                    <div className="p-6 grid grid-cols-3 gap-6">
                        {/* Left Column - Instrument Info */}
                        <div className="col-span-2 space-y-6">
                            {/* Instrument Description Card */}
                            <div className="bg-slate-800/50 rounded-xl border border-white/5 p-6">
                                <a
                                    href="#"
                                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mb-3 transition-colors"
                                >
                                    {selectedInstrumentData.name} ({selectedInstrumentData.abbreviation})
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <p className="text-slate-300 leading-relaxed">
                                    {selectedInstrumentData.description}
                                </p>
                            </div>

                            {/* Evolution Chart */}
                            <div className="bg-slate-800/50 rounded-xl border border-white/5 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                                    Gráfico de Evolução do Paciente
                                </h3>
                                {selectedAssessments.length > 0 ? (
                                    <AssessmentChart assessments={selectedAssessments} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <BarChart3 className="w-12 h-12 text-slate-600 mb-4" />
                                        <p className="text-slate-400">
                                            Visualize a evolução do seu paciente ao longo do tempo com gráficos detalhados.
                                        </p>
                                        <p className="text-slate-500 text-sm mt-2">
                                            Aplique o instrumento para começar a visualizar os dados.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* AI Longitudinal Analysis */}
                            <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-xl border border-purple-500/20 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    Análise Longitudinal via Inteligência Artificial
                                </h3>

                                {loadingInsights ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
                                        <p className="text-slate-300">Gerando análise...</p>
                                    </div>
                                ) : instrumentInsights ? (
                                    instrumentInsights.error ? (
                                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                            <p className="text-amber-300">{instrumentInsights.message}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Trend Analysis */}
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4" />
                                                    Análise de Tendência
                                                </h4>
                                                <p className="text-slate-300">{instrumentInsights.trendAnalysis}</p>
                                            </div>

                                            {/* Patterns */}
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                                                    <Brain className="w-4 h-4" />
                                                    Padrões Identificados
                                                </h4>
                                                <p className="text-slate-300">{instrumentInsights.patterns}</p>
                                            </div>

                                            {/* Clinical Insights */}
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                                                    <Lightbulb className="w-4 h-4" />
                                                    Insights sobre Progressão do Tratamento
                                                </h4>
                                                <p className="text-slate-300">{instrumentInsights.treatmentInsights}</p>
                                            </div>

                                            {/* Recommendations */}
                                            {instrumentInsights.recommendations && (
                                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                                    <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Recomendações
                                                    </h4>
                                                    <p className="text-slate-300">{instrumentInsights.recommendations}</p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                                            <Sparkles className="w-8 h-8 text-purple-400" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-white mb-2">
                                            Desbloqueie a Análise Longitudinal
                                        </h4>
                                        <p className="text-slate-400 max-w-md mb-4">
                                            Acompanhe a evolução do paciente ao longo do tempo com análises automáticas e personalizadas.
                                        </p>
                                        <ul className="text-left text-sm text-slate-400 space-y-2 mb-6">
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                                Análise automática da evolução temporal
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                                Identificação de tendências e padrões
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                                Insights sobre progressão do tratamento
                                            </li>
                                        </ul>
                                        <button
                                            onClick={() => handleGenerateInsights(selectedInstrumentId)}
                                            disabled={selectedAssessments.length < 2}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Gerar Análise
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        {selectedAssessments.length < 2 && (
                                            <p className="text-amber-400 text-sm mt-2">
                                                Necessário pelo menos 2 aplicações
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Submissions History */}
                            <div className="bg-slate-800/50 rounded-xl border border-white/5 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    Submissões
                                </h3>
                                {selectedAssessments.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedAssessments.map((assessment: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between bg-white/5 rounded-lg p-4"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">
                                                            {new Date(assessment.date).toLocaleDateString('pt-BR', {
                                                                day: '2-digit',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                        <p className="text-sm text-slate-400">
                                                            Score: {assessment.score} - {assessment.interpretation}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${assessment.score <= 4 ? 'bg-green-500/20 text-green-300' :
                                                    assessment.score <= 9 ? 'bg-yellow-500/20 text-yellow-300' :
                                                        assessment.score <= 14 ? 'bg-orange-500/20 text-orange-300' :
                                                            'bg-red-500/20 text-red-300'
                                                    }`}>
                                                    {assessment.score} pts
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <p>Nenhuma submissão ainda.</p>
                                        <p className="text-sm">Aplique o instrumento para registrar dados.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Patient & Actions */}
                        <div className="space-y-6">
                            {/* Patient Card */}
                            <div className="bg-slate-800/50 rounded-xl border border-white/5 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{currentPatient.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                                    <Hash className="w-4 h-4" />
                                    <span>{selectedActiveInstrument.applicationCount || selectedAssessments.length}x aplicado</span>
                                </div>

                                {/* Apply Button */}
                                {selectedInstrumentData.hasForm && (
                                    <button
                                        onClick={() => handleApplyInstrument(selectedInstrumentId)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg mb-3"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Aplicar novamente
                                    </button>
                                )}

                                {/* Status */}
                                {(() => {
                                    const status = getInstrumentStatus(selectedActiveInstrument);
                                    return (
                                        <div className={`p-3 rounded-lg ${status.color === 'red' ? 'bg-red-500/10 border border-red-500/20' :
                                            status.color === 'amber' ? 'bg-amber-500/10 border border-amber-500/20' :
                                                'bg-green-500/10 border border-green-500/20'
                                            }`}>
                                            <div className={`flex items-center gap-2 font-medium ${status.color === 'red' ? 'text-red-300' :
                                                status.color === 'amber' ? 'text-amber-300' :
                                                    'text-green-300'
                                                }`}>
                                                {status.status === 'overdue' ? <AlertTriangle className="w-4 h-4" /> :
                                                    status.status === 'due' || status.status === 'pending' ? <Clock className="w-4 h-4" /> :
                                                        <CheckCircle2 className="w-4 h-4" />}
                                                {status.label}
                                            </div>
                                            {status.daysInfo && (
                                                <p className="text-sm text-slate-400 mt-1">{status.daysInfo}</p>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Download Report */}
                            <div className="bg-slate-800/50 rounded-xl border border-white/5 p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-slate-300">Relatório do paciente</span>
                                    <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">BETA</span>
                                </div>
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all">
                                    <Download className="w-4 h-4" />
                                    Baixar Relatório PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Main Dashboard View */
                <>
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-900/30 to-blue-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                                    <ClipboardList className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Monitoramento Clínico</h1>
                                    <p className="text-slate-400 text-sm">
                                        {activeInstruments.length} instrumento{activeInstruments.length !== 1 ? 's' : ''} ativo{activeInstruments.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLibraryModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar Instrumento
                            </button>
                        </div>
                    </div>

                    {/* Summary Alerts */}
                    {(overdueCount > 0 || dueCount > 0) && (
                        <div className="px-6 pt-4">
                            <div className={`rounded-xl p-4 ${overdueCount > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <AlertCircle className={`w-5 h-5 mt-0.5 ${overdueCount > 0 ? 'text-red-400' : 'text-amber-400'}`} />
                                    <div>
                                        <h4 className={`font-semibold ${overdueCount > 0 ? 'text-red-300' : 'text-amber-300'}`}>
                                            {overdueCount > 0
                                                ? `${overdueCount} instrumento${overdueCount > 1 ? 's' : ''} atrasado${overdueCount > 1 ? 's' : ''}`
                                                : `${dueCount} instrumento${dueCount > 1 ? 's' : ''} para aplicar hoje`
                                            }
                                        </h4>
                                        <p className="text-slate-400 text-sm mt-1">
                                            {overdueCount > 0
                                                ? 'Mantenha o monitoramento em dia para acompanhar a evolução do paciente.'
                                                : 'Aplique os instrumentos programados para manter o acompanhamento.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeInstruments.length === 0 ? (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-24 h-24 rounded-full bg-slate-700/50 flex items-center justify-center mb-6">
                                    <ClipboardList className="w-12 h-12 text-slate-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">Nenhum instrumento ativo</h2>
                                <p className="text-slate-400 max-w-md mb-6">
                                    Adicione instrumentos de monitoramento para acompanhar o progresso do paciente.
                                </p>
                                <button
                                    onClick={() => setShowLibraryModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                                >
                                    <Plus className="w-5 h-5" />
                                    Adicionar Instrumento
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeInstruments.map((activeInstr) => {
                                    const instrumentData = getInstrumentData(activeInstr.instrumentId);
                                    if (!instrumentData) return null;

                                    const status = getInstrumentStatus(activeInstr);
                                    const assessments = getInstrumentAssessments(activeInstr.instrumentId);

                                    return (
                                        <div
                                            key={activeInstr.instrumentId}
                                            onClick={() => setSelectedInstrumentId(activeInstr.instrumentId)}
                                            className={`bg-slate-800/50 rounded-xl border p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${status.status === 'overdue' ? 'border-red-500/40 hover:border-red-500/60' :
                                                status.status === 'due' || status.status === 'pending' ? 'border-amber-500/40 hover:border-amber-500/60' :
                                                    'border-white/10 hover:border-cyan-500/40'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-white text-lg">{instrumentData.abbreviation}</h4>
                                                    <p className="text-slate-400 text-sm line-clamp-1">{instrumentData.name}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveInstrument(activeInstr.instrumentId);
                                                    }}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${status.color === 'red' ? 'bg-red-500/20 text-red-300' :
                                                status.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                                                    'bg-green-500/20 text-green-300'
                                                }`}>
                                                {status.status === 'overdue' ? <AlertTriangle className="w-3 h-3" /> :
                                                    status.status === 'due' || status.status === 'pending' ? <Clock className="w-3 h-3" /> :
                                                        <CheckCircle2 className="w-3 h-3" />}
                                                {status.label}
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">{assessments.length} aplicações</span>
                                                <ChevronRight className="w-4 h-4 text-slate-500" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Library Modal */}
            {showLibraryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Biblioteca de Instrumentos para Monitoramento</h2>
                            <button
                                onClick={() => setShowLibraryModal(false)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="h-[calc(90vh-80px)]">
                            <InstrumentsLibrary
                                currentPatient={currentPatient}
                                onSelectInstrument={handleAddInstrument}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* GAD-7 Form Modal */}
            {activeForm === 'gad7' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">GAD-7 - Avaliação de Ansiedade</h2>
                            <button
                                onClick={() => setActiveForm(null)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="p-6">
                            <Gad7Form />
                        </div>
                    </div>
                </div>
            )}

            {/* Generic Assessment Form */}
            {activeForm && activeForm !== 'gad7' && INSTRUMENT_CONFIGS[activeForm] && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    {/* Removed inner container styles that conflict with GenericForm's full height/width needs, or adjusted them */}
                    <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
                            <h2 className="text-xl font-bold text-white">
                                {getInstrumentData(activeForm)?.name}
                            </h2>
                            <button
                                onClick={() => setActiveForm(null)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <GenericAssessmentForm
                                instrument={getInstrumentData(activeForm)!}
                                config={INSTRUMENT_CONFIGS[activeForm]}
                                onClose={() => setActiveForm(null)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Generic Form Placeholder (for instruments without config) */}
            {activeForm && activeForm !== 'gad7' && !INSTRUMENT_CONFIGS[activeForm] && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {getInstrumentData(activeForm)?.name || 'Instrumento'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            O formulário para este instrumento ainda não foi implementado. Em breve estará disponível!
                        </p>
                        <button
                            onClick={() => setActiveForm(null)}
                            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

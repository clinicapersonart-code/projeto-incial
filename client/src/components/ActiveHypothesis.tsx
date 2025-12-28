/**
 * ActiveHypothesis - Mostra a hipótese/decisão atualmente em teste
 * "Supervisor automático" que puxa do DecisionLog e lembra o terapeuta
 */

import React, { useMemo, useState } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    FlaskConical,
    Target,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    TrendingUp,
    Edit3,
    AlertTriangle
} from 'lucide-react';
import { DecisionLog, InstrumentRecord } from '../types/eells';

interface ActiveHypothesisProps {
    onOpenDecisionLog?: () => void;
}

export const ActiveHypothesis: React.FC<ActiveHypothesisProps> = ({ onOpenDecisionLog }) => {
    const { currentPatient } = usePatients();

    // Interface para efeito observado
    interface ObservedEffect {
        instrumentName: string;
        scoreBefore: number;
        scoreAfter: number;
        delta: number;
        daysBetween: number;
    }

    // Buscar a decisão ativa e verificar se há dados suficientes
    const { activeDecision, hasRecentData, daysSinceLastData, observedEffects } = useMemo(() => {
        if (!currentPatient) return { activeDecision: null, hasRecentData: false, daysSinceLastData: null, observedEffects: [] };

        const eellsData = (currentPatient as any).eellsData;
        const logs: DecisionLog[] = eellsData?.monitoring?.decisionLogs || [];
        const records: InstrumentRecord[] = eellsData?.monitoring?.instrumentRecords || [];

        if (logs.length === 0) return { activeDecision: null, hasRecentData: false, daysSinceLastData: null, observedEffects: [] };

        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // Prioridade: decisões com follow-up no futuro ou vencido há menos de 30 dias
        const relevantLogs = logs.filter(log => {
            if (!log.followUpDate) return false;
            const followUp = new Date(log.followUpDate);
            return followUp >= thirtyDaysAgo;
        });

        const activeDecision = relevantLogs.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0] || null;

        // Verificar se há dados recentes (desde a decisão)
        let hasRecentData = false;
        let daysSinceLastData: number | null = null;
        let observedEffects: ObservedEffect[] = [];

        if (activeDecision) {
            const decisionDate = new Date(activeDecision.date);

            // Buscar instrumentos aplicados desde a decisão
            const recentRecords = records.filter(r => new Date(r.date) >= decisionDate);
            hasRecentData = recentRecords.length > 0;

            // Calcular efeito observado por instrumento
            if (hasRecentData) {
                // Agrupar por instrumento
                const byInstrument = records.reduce((acc, r) => {
                    if (!acc[r.instrumentName]) acc[r.instrumentName] = [];
                    acc[r.instrumentName].push(r);
                    return acc;
                }, {} as Record<string, InstrumentRecord[]>);

                // Para cada instrumento, comparar score antes vs depois da decisão
                Object.entries(byInstrument).forEach(([name, recs]) => {
                    const sorted = recs
                        .filter(r => r.score !== null)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    // Encontrar último score ANTES da decisão
                    const beforeDecision = sorted.filter(r => new Date(r.date) < decisionDate);
                    const afterDecision = sorted.filter(r => new Date(r.date) >= decisionDate);

                    if (beforeDecision.length > 0 && afterDecision.length > 0) {
                        const scoreBefore = beforeDecision[beforeDecision.length - 1].score!;
                        const scoreAfter = afterDecision[afterDecision.length - 1].score!;
                        const dateBefore = new Date(beforeDecision[beforeDecision.length - 1].date);
                        const dateAfter = new Date(afterDecision[afterDecision.length - 1].date);
                        const daysBetween = Math.ceil((dateAfter.getTime() - dateBefore.getTime()) / (1000 * 60 * 60 * 24));

                        observedEffects.push({
                            instrumentName: name,
                            scoreBefore,
                            scoreAfter,
                            delta: scoreAfter - scoreBefore,
                            daysBetween
                        });
                    }
                });
            }

            // Se não há dados recentes, calcular há quantos dias
            if (!hasRecentData && records.length > 0) {
                const lastRecord = records.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )[0];
                daysSinceLastData = Math.ceil(
                    (now.getTime() - new Date(lastRecord.date).getTime()) / (1000 * 60 * 60 * 24)
                );
            }
        }

        return { activeDecision, hasRecentData, daysSinceLastData, observedEffects };
    }, [currentPatient]);

    if (!currentPatient || !activeDecision) {
        return null;
    }

    const followUpDate = activeDecision.followUpDate ? new Date(activeDecision.followUpDate) : null;
    const isPastFollowUp = followUpDate && followUpDate < new Date();
    const daysUntilFollowUp = followUpDate
        ? Math.ceil((followUpDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    // Determinar cor base
    const getColors = () => {
        if (!hasRecentData) return { bg: 'bg-gray-50', border: 'border-gray-300', icon: 'bg-gray-100', iconColor: 'text-gray-500', text: 'text-gray-700' };
        if (isPastFollowUp) return { bg: 'bg-amber-50', border: 'border-amber-300', icon: 'bg-amber-100', iconColor: 'text-amber-600', text: 'text-amber-800' };
        return { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100', iconColor: 'text-purple-600', text: 'text-purple-800' };
    };
    const colors = getColors();

    return (
        <div className={`rounded-xl border-2 overflow-hidden ${colors.bg} ${colors.border}`}>
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                        <FlaskConical className={`w-5 h-5 ${colors.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-bold ${colors.text}`}>
                                    Hipótese em Teste
                                </h3>
                                {!hasRecentData ? (
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Dados insuficientes
                                    </span>
                                ) : isPastFollowUp ? (
                                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Revisar agora!
                                    </span>
                                ) : daysUntilFollowUp !== null && (
                                    <span className="px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {daysUntilFollowUp} dias restantes
                                    </span>
                                )}
                            </div>

                            {/* Botão de revisão rápida */}
                            {(isPastFollowUp || !hasRecentData) && (
                                <button
                                    onClick={onOpenDecisionLog}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isPastFollowUp
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                                        }`}
                                >
                                    <Edit3 className="w-3 h-3" />
                                    Registrar revisão
                                </button>
                            )}
                        </div>

                        {/* Aviso de dados insuficientes */}
                        {!hasRecentData && daysSinceLastData !== null && (
                            <p className="text-xs text-gray-500 mt-1">
                                Último instrumento aplicado há {daysSinceLastData} dia(s). Aplique instrumentos para testar a hipótese.
                            </p>
                        )}

                        {/* Decisão */}
                        <div className="mt-2 p-3 bg-white rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <Target className="w-4 h-4" />
                                <span>Decisão ({new Date(activeDecision.date).toLocaleDateString('pt-BR')})</span>
                            </div>
                            <p className="font-medium text-gray-900">{activeDecision.decision}</p>
                            {activeDecision.rationale && (
                                <p className="text-sm text-gray-600 mt-1 italic">{activeDecision.rationale}</p>
                            )}
                        </div>

                        {/* Outcome esperado */}
                        {activeDecision.outcomeToCheck && (
                            <div className="mt-2 flex items-start gap-2 text-sm">
                                <TrendingUp className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.iconColor}`} />
                                <div>
                                    <span className="text-gray-600">Espero ver: </span>
                                    <span className={`font-medium ${colors.text}`}>
                                        {activeDecision.outcomeToCheck}
                                    </span>
                                    {followUpDate && (
                                        <span className="text-gray-400 ml-1">
                                            (até {followUpDate.toLocaleDateString('pt-BR')})
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Efeito Observado - Mini-laboratório */}
                        {observedEffects.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-1">
                                    <FlaskConical className="w-3 h-3" />
                                    Efeito Observado
                                </p>
                                <div className="space-y-1">
                                    {observedEffects.map((effect, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700">{effect.instrumentName}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">
                                                    {effect.scoreBefore} → {effect.scoreAfter}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${effect.delta < 0
                                                        ? 'bg-green-100 text-green-700'
                                                        : effect.delta > 0
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {effect.delta > 0 ? '+' : ''}{effect.delta} pts
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    em {effect.daysBetween}d
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Baseado em */}
                        {activeDecision.basedOn.instrumentSummary.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {activeDecision.basedOn.instrumentSummary.map((summary, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                                        {summary}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


import React from 'react';
import { usePatients } from '../context/PatientContext';
import { calculateEellsProgress, getNextRecommendedActionWithTab } from '../lib/eells-utils';
import { Check, Circle, Loader2, Target, CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { useNavigation, TabId } from '../context/NavigationContext';

const PHASES = [
    { id: 'assessment', label: 'Assessment', shortLabel: 'Coleta' },
    { id: 'problemList', label: 'Problem List', shortLabel: 'Problemas' },
    { id: 'mechanisms', label: 'Mechanisms', shortLabel: 'Mecanismos' },
    { id: 'formulation', label: 'Formulation', shortLabel: 'Formulação' },
    { id: 'treatment', label: 'Treatment', shortLabel: 'Tratamento' },
    { id: 'monitoring', label: 'Monitoring', shortLabel: 'Monitoramento' },
    { id: 'discharge', label: 'Discharge', shortLabel: 'Alta' }
];

export const EellsRoadmap: React.FC = () => {
    const { currentPatient } = usePatients();
    const { navigateTo } = useNavigation();

    if (!currentPatient) return null;

    const progress = calculateEellsProgress(currentPatient);
    const { action: nextAction, targetTab } = getNextRecommendedActionWithTab(currentPatient);

    // Calcular status de monitoramento
    const getMonitoringStatus = () => {
        const lastAssessment = currentPatient.clinicalRecords.assessments?.[0];
        if (!lastAssessment) return 'missing'; // Sem avaliação

        const daysSince = Math.floor((Date.now() - new Date(lastAssessment.date).getTime()) / (1000 * 60 * 60 * 24));

        if (daysSince <= 14) return 'ok';        // ✅ Em dia
        if (daysSince <= 30) return 'warning';   // ⚠️ Atenção
        return 'overdue';                       // ❌ Atrasado
    };

    const getPhaseIcon = (phaseId: string, phaseProgress: number) => {
        const isCurrent = progress.currentPhase === phaseId;

        // Monitoramento usa ícones de status
        if (phaseId === 'monitoring') {
            const status = getMonitoringStatus();
            if (status === 'ok') return <CheckCircle className="w-5 h-5 text-white" />;
            if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-white" />;
            return <XCircle className="w-5 h-5 text-white" />;
        }

        if (phaseProgress === 100) {
            return <Check className="w-5 h-5 text-white" />;
        }
        if (isCurrent) {
            return <Loader2 className="w-5 h-5 text-white animate-spin" />;
        }
        return <Circle className="w-5 h-5 text-white opacity-40" />;
    };

    const getPhaseColor = (phaseId: string, phaseProgress: number, isCurrent: boolean) => {
        // Monitoramento usa cores por status
        if (phaseId === 'monitoring') {
            const status = getMonitoringStatus();
            if (status === 'ok') return 'bg-emerald-500';
            if (status === 'warning') return 'bg-amber-500';
            return 'bg-red-500';
        }

        if (phaseProgress === 100) return 'bg-emerald-500';
        if (isCurrent) return 'bg-indigo-500';
        if (phaseProgress > 0) return 'bg-amber-500';
        return 'bg-gray-400';
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Target className="w-6 h-6 text-indigo-600" />
                        Progresso do Caso (Modelo Eells)
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {progress.overall}% completo
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress.overall}%` }}
                        />
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{progress.overall}%</span>
                </div>
            </div>

            {/* Desktop Roadmap */}
            <div className="hidden md:block">
                <div className="flex items-center justify-between">
                    {PHASES.map((phase, index) => {
                        const phaseProgress = progress[phase.id as keyof typeof progress] as number;
                        const isCurrent = progress.currentPhase === phase.id;

                        // Status label para monitoramento
                        let statusLabel = `${phaseProgress}%`;
                        if (phase.id === 'monitoring') {
                            const status = getMonitoringStatus();
                            statusLabel = status === 'ok' ? 'Em dia' : status === 'warning' ? 'Atenção' : 'Atrasado';
                        }

                        return (
                            <React.Fragment key={phase.id}>
                                {/* Phase Node */}
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${getPhaseColor(phase.id, phaseProgress, isCurrent)} ${isCurrent ? 'ring-4 ring-indigo-200 scale-110' : ''
                                            }`}
                                    >
                                        {getPhaseIcon(phase.id, phaseProgress)}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-gray-700">{phase.shortLabel}</p>
                                        <p className="text-[10px] text-gray-500">{statusLabel}</p>
                                    </div>
                                </div>

                                {/* Connector Line */}
                                {index < PHASES.length - 1 && (
                                    <div className="flex-1 h-1 bg-gray-300 mx-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-500"
                                            style={{
                                                width: `${phaseProgress === 100 ? 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Roadmap */}
            <div className="md:hidden space-y-2">
                {PHASES.map((phase) => {
                    const phaseProgress = progress[phase.id as keyof typeof progress] as number;
                    const isCurrent = progress.currentPhase === phase.id;

                    return (
                        <div
                            key={phase.id}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrent ? 'bg-indigo-100 border-2 border-indigo-300' : 'bg-white border border-gray-200'
                                }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${getPhaseColor(
                                    phase.id,
                                    phaseProgress,
                                    isCurrent
                                )}`}
                            >
                                {getPhaseIcon(phase.id, phaseProgress)}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-semibold ${isCurrent ? 'text-indigo-700' : 'text-gray-700'}`}>
                                    {phase.shortLabel}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {phase.id === 'monitoring' ? (
                                        <span className="text-xs font-medium text-gray-600">
                                            {getMonitoringStatus() === 'ok' ? '✅ Em dia' : getMonitoringStatus() === 'warning' ? '⚠️ Atenção' : '❌ Atrasado'}
                                        </span>
                                    ) : (
                                        <>
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${phaseProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600">{phaseProgress}%</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Next Action Card */}
            <div
                onClick={() => targetTab && navigateTo(targetTab as TabId)}
                className={`mt-6 bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-md transition-all ${targetTab ? 'cursor-pointer hover:border-indigo-400 hover:shadow-lg hover:scale-[1.02]' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Target className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">Próxima Ação Recomendada</p>
                        <p className="text-sm text-gray-800 font-medium">{nextAction}</p>
                    </div>
                    {targetTab && (
                        <div className="p-2 bg-indigo-500 rounded-lg text-white">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

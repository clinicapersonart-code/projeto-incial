import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { analyzeTopicAlignment } from '../lib/gemini';
import { Target, RefreshCw, AlertCircle, ArrowRight, Zap, Anchor } from 'lucide-react';
import { TopicAlignment } from '../types/patient';

export const TopicAlignmentCard: React.FC = () => {
    const { currentPatient } = usePatients();
    const [alignment, setAlignment] = useState<TopicAlignment | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!currentPatient) return;
        setLoading(true);

        const recentSessions = currentPatient.clinicalRecords.sessions.slice(0, 3); // Last 3 sessions
        const goals = currentPatient.clinicalRecords.treatmentPlan.goals;

        try {
            const result = await analyzeTopicAlignment(recentSessions, goals);
            setAlignment(result);
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (!currentPatient) return null;

    // Helper for visual status styles
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'aligned': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'divergent': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'avoidance': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'crisis': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">PLANO DE TRATAMENTO</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Monitor de Foco</p>
                    </div>
                </div>
                {!alignment && (
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="text-xs flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-500" />}
                        {loading ? "Calculando..." : "Calcular Rota"}
                    </button>
                )}
            </div>

            {alignment && (
                <div className="divide-y divide-gray-100">
                    {/* Status Banner */}
                    <div className={`p-3 border-b ${getStatusStyle(alignment.status)} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wide">{alignment.status}</span>
                        </div>
                        <span className="text-xs font-bold">{alignment.relevanceScore}% Alinhado</span>
                    </div>

                    {/* Comparison Area */}
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="flex-1 p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <span className="block text-[10px] text-indigo-400 font-bold uppercase mb-1">Rota Original (Plano A)</span>
                                <p className="font-medium text-indigo-900 leading-tight">{alignment.mainGoal}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300" />
                            <div className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Foco Atual</span>
                                <p className="font-medium text-gray-900 leading-tight">{alignment.currentFocus}</p>
                            </div>
                        </div>

                        {/* Analysis */}
                        <div>
                            <p className="text-xs text-gray-600 italic leading-relaxed">"{alignment.analysis}"</p>
                        </div>
                    </div>

                    {/* Bridge Strategy */}
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-white">
                        <div className="flex items-start gap-2">
                            <Anchor className="w-4 h-4 text-teal-600 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-teal-700 uppercase mb-1">Sugestão de Amarração</h4>
                                <p className="text-sm text-teal-900 font-medium">"{alignment.bridgeStrategy}"</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 bg-gray-50 flex justify-end">
                        <button onClick={handleAnalyze} className="text-gray-400 hover:text-gray-600"><RefreshCw className="w-3 h-3" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

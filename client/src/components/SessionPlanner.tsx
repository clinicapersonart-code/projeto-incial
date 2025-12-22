import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { generateSessionPlan } from '../lib/gemini';
import { ClipboardList, Play, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface SessionPlan {
    contextAlert: string | null;
    sessionGoal: string;
    script: {
        section: string;
        duration: string;
        content: string;
        reasoning: string;
    }[];
}

export const SessionPlanner: React.FC = () => {
    const { currentPatient } = usePatients();
    const [plan, setPlan] = useState<SessionPlan | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!currentPatient) return;
        setLoading(true);
        try {
            const lastSession = currentPatient.clinicalRecords.sessions[0];
            const latestAssessment = currentPatient.clinicalRecords.assessments[0];
            const goals = currentPatient.clinicalRecords.treatmentPlan.goals;

            const result = await generateSessionPlan(lastSession, latestAssessment, goals);
            setPlan(result);
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar roteiro.");
        } finally {
            setLoading(false);
        }
    };

    if (!currentPatient) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-indigo-200">
            <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <ClipboardList className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        {/* MUDANÇA: Briefing -> Planejamento */}
                        <h3 className="font-bold text-gray-900 mt-1">PLANEJAMENTO DA SESSÃO</h3>
                        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Sugestão de Roteiro Clínico</p>
                    </div>
                </div>

                {!plan && (
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
                    >
                        {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                        {loading ? "GERANDO..." : "GERAR ROTEIRO"}
                    </button>
                )}
            </div>

            {plan && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                    {plan.contextAlert && (
                        <div className="bg-red-50 border-b border-red-100 p-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                            <p className="text-red-700 text-sm font-bold">{plan.contextAlert}</p>
                        </div>
                    )}

                    <div className="p-6 space-y-6">
                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">OBJETIVO CENTRAL</h4>
                            <p className="text-xl font-bold text-indigo-900">{plan.sessionGoal}</p>
                        </div>

                        <div className="space-y-4">
                            {plan.script.map((step, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 ring-4 ring-indigo-50/50 group-hover:ring-indigo-100 transition-all"></div>
                                        <div className="w-0.5 flex-1 bg-gray-100 my-1"></div>
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <h5 className="font-bold text-gray-900">{step.section}</h5>
                                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-medium">{step.duration}</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                                            <p className="text-sm text-gray-700 leading-relaxed font-medium">{step.content}</p>
                                            <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-indigo-200 pl-2">
                                                Motivo: {step.reasoning}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button className="flex-1 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> APROVAR ROTEIRO
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="px-4 py-3 bg-white text-gray-500 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 hover:text-gray-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
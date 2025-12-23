import React, { useState } from 'react';
import { Activity, Lightbulb, X, TrendingUp, Calendar } from 'lucide-react';

interface MonitoringCardProps {
    currentPatient: any;
}

export const MonitoringCard: React.FC<MonitoringCardProps> = ({ currentPatient }) => {
    const [showRecommendations, setShowRecommendations] = useState(false);

    const getRecommendations = () => {
        const disorder = currentPatient?.primaryDisorder || 'other';

        const recommendations: Record<string, any> = {
            panic: {
                specific: [
                    { name: 'PDSS-SR', desc: 'Panic Disorder Severity Scale', freq: 'Semanal' },
                    { name: 'Panic Appraisal Inventory', desc: 'Avaliação de catastrofização', freq: 'Quinzenal' }
                ],
                general: [
                    { name: 'BAI', desc: 'Beck Anxiety Inventory', freq: 'Toda sessão' },
                    { name: 'GAD-7', desc: 'Ansiedade geral', freq: 'Toda sessão' }
                ],
                functionality: [
                    { name: 'WHODAS 2.0', desc: 'Funcionalidade', freq: 'Mensal' }
                ]
            },
            depression: {
                specific: [
                    { name: 'PHQ-9', desc: 'Patient Health Questionnaire', freq: 'Toda sessão' },
                    { name: 'BDI-II', desc: 'Beck Depression Inventory', freq: 'Semanal' }
                ],
                general: [
                    { name: 'BAI', desc: 'Ansiedade comórbida', freq: 'Quinzenal' }
                ],
                functionality: [
                    { name: 'WHODAS 2.0', desc: 'Funcionalidade', freq: 'Mensal' }
                ]
            },
            ocd: {
                specific: [
                    { name: 'Y-BOCS', desc: 'Yale-Brown OC Scale', freq: 'Semanal' },
                    { name: 'OCI-R', desc: 'Obsessive-Compulsive Inventory', freq: 'Quinzenal' }
                ],
                general: [
                    { name: 'PHQ-9', desc: 'Depressão comórbida', freq: 'Quinzenal' }
                ],
                functionality: [
                    { name: 'WHODAS 2.0', desc: 'Funcionalidade', freq: 'Mensal' }
                ]
            },
            gad: {
                specific: [
                    { name: 'GAD-7', desc: 'Generalized Anxiety Disorder', freq: 'Toda sessão' },
                    { name: 'PSWQ', desc: 'Penn State Worry Questionnaire', freq: 'Semanal' }
                ],
                general: [
                    { name: 'PHQ-9', desc: 'Depressão comórbida', freq: 'Quinzenal' }
                ],
                functionality: [
                    { name: 'WHODAS 2.0', desc: 'Funcionalidade', freq: 'Mensal' }
                ]
            },
            other: {
                specific: [],
                general: [
                    { name: 'PHQ-9', desc: 'Depressão', freq: 'Toda sessão' },
                    { name: 'GAD-7', desc: 'Ansiedade', freq: 'Toda sessão' }
                ],
                functionality: [
                    { name: 'WHODAS 2.0', desc: 'Funcionalidade', freq: 'Mensal' }
                ]
            }
        };

        return recommendations[disorder] || recommendations.other;
    };

    const recs = getRecommendations();
    const lastAssessment = currentPatient?.clinicalRecords?.assessments?.[0];

    return (
        <>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-6 hover:border-blue-200 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Monitoramento Clínico</h3>
                            <p className="text-sm text-gray-500">Processo contínuo até alta</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Ativo
                    </div>
                </div>

                <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Última avaliação:
                        </span>
                        <span className="font-semibold text-gray-800">
                            {lastAssessment ? new Date(lastAssessment.date).toLocaleDateString() : 'Nenhuma'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Tendência:
                        </span>
                        <span className="font-semibold text-blue-600">Em monitoramento</span>
                    </div>
                </div>

                <button
                    onClick={() => setShowRecommendations(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-md"
                >
                    <Lightbulb className="w-5 h-5" />
                    Instrumentos Recomendados
                </button>
            </div>

            {/* Modal de Recomendações */}
            {showRecommendations && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Lightbulb className="w-6 h-6" />
                                    Recomendações de Monitoramento
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">
                                    Baseado em: {currentPatient?.primaryDisorder ?
                                        currentPatient.primaryDisorder.toUpperCase() : 'Avaliação Geral'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRecommendations(false)}
                                className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {recs.specific.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        🎯 Instrumentos Específicos
                                    </h3>
                                    <div className="space-y-2">
                                        {recs.specific.map((inst: any, i: number) => (
                                            <div key={i} className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">{inst.name}</h4>
                                                        <p className="text-sm text-gray-600">{inst.desc}</p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                        {inst.freq}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    ✅ Sintomas Gerais
                                </h3>
                                <div className="space-y-2">
                                    {recs.general.map((inst: any, i: number) => (
                                        <div key={i} className="bg-gray-50 border-2 border-gray-100 rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{inst.name}</h4>
                                                    <p className="text-sm text-gray-600">{inst.desc}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                                    {inst.freq}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    📊 Funcionalidade
                                </h3>
                                <div className="space-y-2">
                                    {recs.functionality.map((inst: any, i: number) => (
                                        <div key={i} className="bg-green-50 border-2 border-green-100 rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{inst.name}</h4>
                                                    <p className="text-sm text-gray-600">{inst.desc}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                    {inst.freq}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-amber-800 mb-2">📅 Frequência Sugerida por Fase:</h3>
                                <ul className="space-y-1 text-sm text-gray-700">
                                    <li>• <strong>Fase Aguda:</strong> Toda sessão (PHQ-9, GAD-7)</li>
                                    <li>• <strong>Fase Estável:</strong> A cada 2 sessões</li>
                                    <li>• <strong>Pré-Alta:</strong> Mensal ou quinzenal</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

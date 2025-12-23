import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { Upload, FileText, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { adaptProtocol } from '../lib/gemini';

export const AlchemyLab: React.FC = () => {
    const { currentPatient } = usePatients();
    const [protocolText, setProtocolText] = useState("");
    const [adaptedPlan, setAdaptedPlan] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAdapt = async () => {
        if (!currentPatient || !protocolText) return;
        setIsLoading(true);
        try {
            const patientContext = `
                Nome: ${currentPatient.name}
                Diagnóstico: ${currentPatient.clinicalRecords.caseFormulation.eells?.diagnosis || "Não informado"}
                História: ${currentPatient.clinicalRecords.anamnesis.content || "Não informada"}
            `;
            const result = await adaptProtocol(protocolText, patientContext);
            setAdaptedPlan(result);
        } catch (error) {
            console.error("Alchemy failed", error);
            alert("Erro ao adaptar protocolo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                        Recursos Terapêuticos
                    </h2>
                    <p className="text-violet-100 max-w-lg">
                        Transforme protocolos rígidos em jornadas personalizadas.
                        A IA adapta a técnica científica à realidade do paciente.
                    </p>
                </div>
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
                    <Sparkles className="w-64 h-64" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Area */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-violet-600" />
                        Protocolo Original (Raw)
                    </h3>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer mb-4">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Cole o texto do PDF ou arraste o arquivo (Simulado)</p>
                    </div>
                    <textarea
                        className="w-full h-48 p-4 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-violet-500"
                        placeholder="Cole aqui o trecho do protocolo (Ex: 'Sessão 3: Exposição Interoceptiva...')"
                        value={protocolText}
                        onChange={(e) => setProtocolText(e.target.value)}
                    />
                    <button
                        onClick={handleAdapt}
                        disabled={isLoading || !protocolText}
                        className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isLoading ? <span className="animate-spin">⏳</span> : <Sparkles className="w-4 h-4" />}
                        Realizar Alquimia
                    </button>
                </div>

                {/* Output Area */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[400px]">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        Plano Adaptado
                    </h3>
                    {adaptedPlan ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <span className="text-xs font-bold text-emerald-600 uppercase">Metáfora Central</span>
                                <p className="text-emerald-900 font-serif italic text-lg">"{adaptedPlan.metaphor}"</p>
                            </div>
                            <div className="space-y-3">
                                {adaptedPlan.steps.map((step: any, idx: number) => (
                                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm">{step.originalTitle}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                <span className="font-semibold text-violet-600">Adaptação: </span>
                                                {step.adaptation}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">O resultado da adaptação aparecerá aqui.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

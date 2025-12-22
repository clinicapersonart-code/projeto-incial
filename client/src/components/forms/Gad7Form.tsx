import React, { useState } from 'react';
import { GAD7_QUESTIONS, Assessment } from '../../types/forms';
import { usePatients } from '../../context/PatientContext';
import { Save, AlertCircle, FileCheck } from 'lucide-react';

export const Gad7Form: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [saved, setSaved] = useState(false);

    if (!currentPatient) return null;

    const handleOptionChange = (questionIndex: number, value: number) => {
        setAnswers(prev => ({
            ...prev,
            [`q${questionIndex}`]: value
        }));
        setSaved(false);
    };

    const calculateScore = () => {
        return Object.values(answers).reduce((a, b) => a + b, 0);
    };

    const getInterpretation = (score: number) => {
        if (score >= 15) return "Ansiedade Grave";
        if (score >= 10) return "Ansiedade Moderada";
        if (score >= 5) return "Ansiedade Leve";
        return "Mínima ou Nenhuma Ansiedade";
    };

    const handleSave = () => {
        const score = calculateScore();
        const interpretation = getInterpretation(score);

        const newAssessment: Assessment = {
            id: crypto.randomUUID(),
            type: 'GAD-7',
            date: new Date().toISOString(),
            score,
            interpretation,
            answers
        };

        const updatedPatient = {
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                assessments: [...currentPatient.clinicalRecords.assessments, newAssessment]
            }
        };

        updatePatient(updatedPatient);
        setSaved(true);
        // Optional: Reset form? Keep it for review?
    };

    const isComplete = Object.keys(answers).length === GAD7_QUESTIONS.length;
    const currentScore = calculateScore();

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 font-[Rajdhani]">
                        GAD-7
                    </h2>
                    <p className="text-slate-400 text-sm">Escala de Transtorno de Ansiedade Generalizada</p>
                </div>
                {isComplete && (
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">{currentScore}</div>
                        <div className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${currentScore >= 10 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                            {getInterpretation(currentScore)}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-4">
                    <div className="col-span-6 md:col-span-8">Pergunta</div>
                    <div className="col-span-6 md:col-span-4 grid grid-cols-4 text-center">
                        <span title="Nenhuma vez">0</span>
                        <span title="Vários dias">1</span>
                        <span title="Mais de metade dos dias">2</span>
                        <span title="Quase todos os dias">3</span>
                    </div>
                </div>

                {GAD7_QUESTIONS.map((question, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-4 items-center group hover:bg-white/5 p-2 rounded transition-colors">
                        <div className="col-span-6 md:col-span-8 text-slate-200 text-sm">
                            {idx + 1}. {question}
                        </div>
                        <div className="col-span-6 md:col-span-4 grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => handleOptionChange(idx, val)}
                                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${answers[`q${idx}`] === val
                                            ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                        }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex items-center justify-end gap-4 border-t border-white/5 pt-6">
                {saved && (
                    <span className="flex items-center gap-2 text-emerald-400 text-sm animate-pulse">
                        <FileCheck className="w-4 h-4" />
                        Salvo no prontuário
                    </span>
                )}
                {!isComplete && (
                    <span className="text-amber-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Responda todas as perguntas
                    </span>
                )}
                <button
                    onClick={handleSave}
                    disabled={!isComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Save className="w-4 h-4" />
                    Salvar Avaliação
                </button>
            </div>
        </div>
    );
};

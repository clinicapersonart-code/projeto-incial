import React, { useState } from 'react';
import { Instrument } from '../../data/instruments';
import { usePatients } from '../../context/PatientContext';
import { Save, AlertCircle, FileCheck, Info } from 'lucide-react';

export interface QuestionConfig {
    id: string;
    text: string;
    domain?: string;
    options?: {
        value: number;
        label: string;
        description?: string;
    }[];
}

export interface InstrumentFormConfig {
    instrumentId: string;
    questions: QuestionConfig[];
    // Default options if not specified per question
    options?: {
        value: number;
        label: string;
        description?: string;
    }[];
    scoring: {
        type: 'sum' | 'average' | 'domain';
        interpretation?: (score: number) => string;
        domains?: string[]; // IDs of domains
    };
    instruction?: string;
}

interface GenericAssessmentFormProps {
    instrument: Instrument;
    config: InstrumentFormConfig;
    onClose?: () => void;
}

export const GenericAssessmentForm: React.FC<GenericAssessmentFormProps> = ({ instrument, config, onClose }) => {
    const { currentPatient, updatePatient } = usePatients();
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [saved, setSaved] = useState(false);

    // Initial check
    if (!currentPatient) return null;

    const handleOptionChange = (questionId: string, value: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
        setSaved(false);
    };

    const calculateScore = () => {
        const values = Object.values(answers);
        if (values.length === 0) return 0;

        if (config.scoring.type === 'sum') {
            return values.reduce((a, b) => a + b, 0);
        } else if (config.scoring.type === 'average') {
            return values.reduce((a, b) => a + b, 0) / values.length;
        }
        // Domain scoring logic would go here
        return values.reduce((a, b) => a + b, 0);
    };

    const handleSave = () => {
        const score = calculateScore();
        const interpretation = config.scoring.interpretation ? config.scoring.interpretation(score) : `${score} pontos`;

        const newAssessment = {
            id: crypto.randomUUID(),
            type: instrument.abbreviation,
            date: new Date().toISOString(),
            score,
            interpretation,
            answers
        };

        const updatedPatient = {
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                assessments: [...(currentPatient.clinicalRecords.assessments || []), newAssessment]
            }
        };

        updatePatient(updatedPatient);
        setSaved(true);
    };

    const isComplete = Object.keys(answers).length === config.questions.length;
    const currentScore = calculateScore();

    // Check if we have consistent options (for header) or varied options
    const hasConsistentOptions = config.options && config.questions.every(q => !q.options);

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 max-w-4xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 font-[Rajdhani]">
                        {instrument.name}
                    </h2>
                    <p className="text-slate-400 text-sm">{instrument.abbreviation} - {config.questions.length} itens</p>
                </div>
                {isComplete && (
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                            {config.scoring.type === 'average' ? currentScore.toFixed(1) : currentScore}
                        </div>
                        <div className="text-xs font-bold px-2 py-1 rounded uppercase tracking-wider bg-slate-700 text-slate-300">
                            Result
                        </div>
                    </div>
                )}
            </div>

            {/* Instruction */}
            {config.instruction && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 flex-shrink-0 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                    <p className="text-blue-200 text-sm">{config.instruction}</p>
                </div>
            )}

            {/* Questions - Scrollable Area */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {/* Header Row for Desktop - Only if options are consistent */}
                {hasConsistentOptions && config.options && (
                    <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 sticky top-0 bg-slate-900/95 backdrop-blur z-10 py-2">
                        <div className="col-span-6">Pergunta</div>
                        <div className="col-span-6 flex justify-between px-2">
                            {config.options.map(opt => (
                                <span key={opt.value} className="text-center w-8" title={opt.label}>{opt.value}</span>
                            ))}
                        </div>
                    </div>
                )}

                {config.questions.map((q, idx) => {
                    // Use question-specific options or default options
                    const options = q.options || config.options;
                    if (!options) return null; // Should not happen if config is valid

                    return (
                        <div key={q.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center group hover:bg-white/5 p-3 rounded transition-colors border-b border-white/5 pb-4 last:border-0">
                            <div className="md:col-span-6 text-slate-200 text-sm font-medium">
                                <span className="text-slate-500 mr-2">{idx + 1}.</span> {q.text}
                            </div>
                            <div className="md:col-span-6 flex flex-wrap md:flex-nowrap justify-between gap-2">
                                {options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleOptionChange(q.id, opt.value)}
                                        title={opt.label}
                                        className={`
                                            h-10 md:h-8 flex-1 md:w-8 rounded-lg md:rounded-full flex items-center justify-center transition-all text-xs font-medium border border-transparent
                                            ${answers[q.id] === opt.value
                                                ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)] border-cyan-400'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border-white/5'
                                            }
                                        `}
                                    >
                                        <span className={`${hasConsistentOptions ? 'md:hidden' : 'inline'} mr-2 truncate max-w-[80px]`}>{opt.label}</span>
                                        <span className={`${hasConsistentOptions ? 'hidden md:inline' : 'hidden'}`}>{opt.value}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-4 border-t border-white/5 pt-6 flex-shrink-0">
                {saved && (
                    <span className="flex items-center gap-2 text-emerald-400 text-sm animate-pulse">
                        <FileCheck className="w-4 h-4" />
                        Salvo no prontuário
                    </span>
                )}
                {!isComplete && (
                    <span className="text-amber-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Responda todas as perguntas ({Object.keys(answers).length}/{config.questions.length})
                    </span>
                )}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={!isComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                    <Save className="w-4 h-4" />
                    Salvar Avaliação
                </button>
            </div>
        </div>
    );
};

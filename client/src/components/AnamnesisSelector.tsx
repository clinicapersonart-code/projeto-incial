import React, { useState } from 'react';
import { FileText, Brain, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { usePatients } from '../context/PatientContext';
import { AnamnesisForm } from './AnamnesisForm';
import { EBPAnamnesisForm } from './EBPAnamnesisForm';

type AnamnesisType = 'selector' | 'structured' | 'ebp';

export const AnamnesisSelector: React.FC = () => {
    const { currentPatient } = usePatients();
    const [activeView, setActiveView] = useState<AnamnesisType>('selector');

    // Check completion status
    const hasStructured = (() => {
        const anamnesis = currentPatient?.clinicalRecords?.anamnesis;
        if (!anamnesis) return false;
        // Check new structure
        if (anamnesis.structured?.content && Object.keys(anamnesis.structured.content).length > 0) return true;
        // Check legacy structure
        if (anamnesis.content) {
            try {
                const parsed = JSON.parse(anamnesis.content);
                return Object.keys(parsed).length > 0;
            } catch {
                return anamnesis.content.trim().length > 0;
            }
        }
        return false;
    })();

    const hasEBP = (() => {
        const ebp = currentPatient?.clinicalRecords?.anamnesis?.ebp;
        if (!ebp?.content) return false;
        if (typeof ebp.content === 'object') {
            return Object.keys(ebp.content).length > 0;
        }
        return false;
    })();

    const getStructuredDate = () => {
        const anamnesis = currentPatient?.clinicalRecords?.anamnesis;
        if (anamnesis?.structured?.updatedAt) {
            return new Date(anamnesis.structured.updatedAt).toLocaleDateString('pt-BR');
        }
        if (anamnesis?.updatedAt) {
            return new Date(anamnesis.updatedAt).toLocaleDateString('pt-BR');
        }
        return null;
    };

    const getEBPDate = () => {
        const ebp = currentPatient?.clinicalRecords?.anamnesis?.ebp;
        if (ebp?.updatedAt) {
            return new Date(ebp.updatedAt).toLocaleDateString('pt-BR');
        }
        return null;
    };

    if (activeView === 'structured') {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => setActiveView('selector')}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                    ← Voltar para seleção
                </button>
                <AnamnesisForm />
            </div>
        );
    }

    if (activeView === 'ebp') {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => setActiveView('selector')}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                    ← Voltar para seleção
                </button>
                <EBPAnamnesisForm />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">Escolha o Modelo de Anamnese</h2>
                <p className="text-gray-600">Você pode aplicar uma ou ambas as anamneses. Os dados serão integrados na conceituação.</p>
            </div>

            {/* Status Overview */}
            {(hasStructured || hasEBP) && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>
                            {hasStructured && hasEBP
                                ? 'Ambas as anamneses preenchidas'
                                : hasStructured
                                    ? 'Anamnese Estruturada preenchida'
                                    : 'Entrevista EBP preenchida'}
                        </span>
                    </div>
                    <p className="text-sm text-emerald-600 mt-1">
                        Os dados serão usados automaticamente na geração de conceituação e rede PBT.
                    </p>
                </div>
            )}

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Structured Anamnesis Card */}
                <div
                    onClick={() => setActiveView('structured')}
                    className="bg-white border-2 border-indigo-100 rounded-2xl p-6 cursor-pointer hover:border-indigo-300 hover:shadow-lg transition-all group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FileText className="w-7 h-7 text-white" />
                        </div>
                        {hasStructured ? (
                            <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Preenchida
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                                Pendente
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-indigo-700 transition-colors">
                        Anamnese Estruturada
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Entrevista inicial completa com 14 tópicos: dados gerais, queixa principal, história pessoal, familiar, relacional, traumas, rede de apoio e metas.
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            {getStructuredDate() && <span>Atualizada em {getStructuredDate()}</span>}
                        </div>
                        <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                {/* EBP Card */}
                <div
                    onClick={() => setActiveView('ebp')}
                    className="bg-white border-2 border-purple-100 rounded-2xl p-6 cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        {hasEBP ? (
                            <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Preenchida
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                                Pendente
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-700 transition-colors">
                        Entrevista Baseada em Processos (EBP)
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                        66 questões em 8 dimensões (Atenção, Cognição, Self, Afeto, Comportamento, Motivação, Biofisiológico, Sociocultural) × 3 mecanismos evolutivos.
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            {getEBPDate() && <span>Atualizada em {getEBPDate()}</span>}
                        </div>
                        <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-gray-800 mb-2">💡 Como usar as anamneses</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Anamnese Estruturada</strong>: Ideal para primeira sessão, coleta de dados amplos.</li>
                    <li>• <strong>EBP</strong>: Ideal para formulação baseada em processos, mapeia a "rede" de variação/seleção/retenção.</li>
                    <li>• Você pode preencher <strong>ambas</strong> - a IA usará todos os dados na conceituação.</li>
                </ul>
            </div>
        </div>
    );
};

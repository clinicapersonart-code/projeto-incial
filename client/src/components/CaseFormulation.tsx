import React, { useState, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import { EellsFormulation } from '../types/eells';
import { Save, Wand2, Loader2, FileText } from 'lucide-react';

export const CaseFormulation: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [formulation, setFormulation] = useState<EellsFormulation>({
        problemList: { redFlags: '', chemicalDependence: false, suicidality: false, functioning: '' },
        diagnosis: '',
        explanatoryHypothesis: { precipitants: '', origins: '', resources: '', obstacles: '', coreHypothesis: '' },
        treatmentPlan: { goals: '', interventions: '' },
        narrative: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentPatient?.clinicalRecords.caseFormulation.eells) {
            setFormulation(currentPatient.clinicalRecords.caseFormulation.eells);
        }
    }, [currentPatient]);

    const handleChange = (section: keyof EellsFormulation | 'diagnosis' | 'narrative', field: string, value: any) => {
        setFormulation(prev => {
            if (section === 'diagnosis') {
                return { ...prev, diagnosis: value };
            }
            if (section === 'narrative') {
                return { ...prev, narrative: value };
            }
            // Handle nested objects
            if (section === 'problemList' || section === 'explanatoryHypothesis' || section === 'treatmentPlan') {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: value
                    }
                };
            }
            return prev;
        });
    };

    const handleSave = () => {
        if (!currentPatient) return;
        setIsSaving(true);
        updatePatient({
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                caseFormulation: {
                    ...currentPatient.clinicalRecords.caseFormulation,
                    eells: formulation,
                    updatedAt: new Date().toISOString()
                }
            }
        });
        setTimeout(() => setIsSaving(false), 1000);
    };

    // Placeholder for AI generation logic
    const handleAutoFill = async () => {
        if (!currentPatient) return;
        setIsGenerating(true);

        try {
            // Get data for Stage 1 Kick-off
            const anamnesisText = currentPatient.clinicalRecords.anamnesis.content || "Sem anamnese registrada.";
            const assessments = currentPatient.clinicalRecords.assessments || [];

            // Import dynamically to avoid circular deps if any, or just direct call
            const { generateInitialFormulation } = await import('../lib/gemini');

            const result = await generateInitialFormulation(anamnesisText, assessments);

            // Update Formulation State (Eells)
            setFormulation(prev => ({
                ...prev,
                diagnosis: result.suggestedDiagnosis,
                narrative: result.narrativeDraft,
                treatmentPlan: {
                    ...prev.treatmentPlan,
                    interventions: result.guidelineRecommendations.map((g: any) => `- ${g.title}: ${g.relevance} (${g.source})`).join('\n')
                }
                // Note: PBT data would ideally update the PBT tab, but we store it here for now or update patient directly?
                // For now, let's update the narrative and diagnosis visible here.
            }));

            // Also update the PBT Network in the patient record if possible, or leave it for the PBT tab.
            // Let's just notify the user via a toast or alert that PBT was also generated.
            // For this specific 'Formulation' component, filling the text fields is the priority.

        } catch (error) {
            console.error("Auto-fill error", error);
            alert("Erro ao gerar formulação. Verifique a chave de API.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-purple-400" />
                    Formulação de Caso (Eells)
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleAutoFill}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Auto-Preencher com IA
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-colors text-sm"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
                    </button>
                </div>
            </div>

            {/* Diagram Structure Implementation */}
            <div className="flex flex-col gap-4">

                {/* 1. Problem List & Diagnosis Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-cyan-600 uppercase tracking-widest">Lista de Problemas</h3>
                        <textarea
                            value={formulation.problemList.redFlags}
                            onChange={(e) => handleChange('problemList', 'redFlags', e.target.value)}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            placeholder="Sintomas, Queixas, Red Flags..."
                            rows={8}
                        />
                        <div className="flex flex-col gap-2 mt-2">
                            <label className="flex items-center gap-2 text-xs text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={formulation.problemList.suicidality}
                                    onChange={(e) => handleChange('problemList', 'suicidality', e.target.checked)}
                                    className="rounded border-white/20 bg-slate-800"
                                /> Risco de Suicídio
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={formulation.problemList.chemicalDependence}
                                    onChange={(e) => handleChange('problemList', 'chemicalDependence', e.target.checked)}
                                    className="rounded border-white/20 bg-slate-800"
                                /> Dependência Química
                            </label>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Diagnóstico</h3>
                            <input
                                type="text"
                                value={formulation.diagnosis}
                                onChange={(e) => handleChange('diagnosis', 'diagnosis', e.target.value)} // fix logic above for root keys
                                className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="DSM-5 / CID-11"
                            />
                        </div>
                        <div className="block h-px bg-white/5 w-full my-2"></div>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Precipitantes</h3>
                                <textarea
                                    value={formulation.explanatoryHypothesis.precipitants}
                                    onChange={(e) => handleChange('explanatoryHypothesis', 'precipitants', e.target.value)}
                                    className="flex-1 bg-slate-950/50 border border-white/5 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500/50 resize-none"
                                    placeholder="Gatilhos..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Origens</h3>
                                <textarea
                                    value={formulation.explanatoryHypothesis.origins}
                                    onChange={(e) => handleChange('explanatoryHypothesis', 'origins', e.target.value)}
                                    className="flex-1 bg-slate-950/50 border border-white/5 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500/50 resize-none"
                                    placeholder="História de vida..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Resources & Obstacles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Recursos / Forças</h3>
                        <textarea
                            value={formulation.explanatoryHypothesis.resources}
                            onChange={(e) => handleChange('explanatoryHypothesis', 'resources', e.target.value)}
                            className="bg-slate-950/50 border border-white/5 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 resize-none"
                            rows={3}
                        />
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">Obstáculos</h3>
                        <textarea
                            value={formulation.explanatoryHypothesis.obstacles}
                            onChange={(e) => handleChange('explanatoryHypothesis', 'obstacles', e.target.value)}
                            className="bg-slate-950/50 border border-white/5 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-red-500/50 resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                {/* 3. Treatment Plan */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-pink-400 uppercase tracking-widest">Plano de Tratamento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea
                            value={formulation.treatmentPlan.goals}
                            onChange={(e) => handleChange('treatmentPlan', 'goals', e.target.value)}
                            className="bg-slate-950/50 border border-white/5 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-pink-500/50 resize-none"
                            placeholder="Objetivos (Curto e Longo prazo)..."
                            rows={5}
                        />
                        <textarea
                            value={formulation.treatmentPlan.interventions}
                            onChange={(e) => handleChange('treatmentPlan', 'interventions', e.target.value)}
                            className="bg-slate-950/50 border border-white/5 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-pink-500/50 resize-none"
                            placeholder="Intervenções..."
                            rows={5}
                        />
                    </div>
                </div>

                {/* 4. Narrative (Bottom Text) */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-white/10 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        Narrativa Explicativa
                    </h3>
                    <p className="text-slate-500 text-xs">Abaixo, conecte os pontos acima em uma história clínica coesa (Eells). Explique como os precipitantes ativaram vulnerabilidades (Origens/Mecanismos) gerando os Problemas atuais.</p>
                    <textarea
                        value={formulation.narrative || ''}
                        onChange={(e) => setFormulation(prev => ({ ...prev, narrative: e.target.value }))}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 font-serif leading-relaxed resize-y min-h-[200px]"
                        placeholder="Escreva aqui a narrativa integrativa do caso..."
                    />
                </div>

            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { Intervention, Goal } from '../types/eells';
import { Zap, Plus, Edit2, Trash2, Pause, Play, CheckCircle2 } from 'lucide-react';

export const InterventionsPanel: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Intervention>>({
        name: '',
        type: '',
        rationale: '',
        targetNodes: [],
        targetGoals: [],
        frequency: '',
        status: 'active',
        effectiveness: 50
    });

    if (!currentPatient) return null;

    const interventions = (currentPatient as any).eellsData?.treatmentPlan?.interventions || [];
    const goals = (currentPatient as any).eellsData?.treatmentPlan?.goals || [];
    const pbtNodes = currentPatient.clinicalRecords.sessions[0]?.pbtNetwork?.nodes || [];

    const handleSave = () => {
        if (!formData.name) return;

        const newIntervention: Intervention = {
            id: editingId || crypto.randomUUID(),
            name: formData.name || '',
            type: formData.type || '',
            rationale: formData.rationale || '',
            targetNodes: formData.targetNodes || [],
            targetGoals: formData.targetGoals || [],
            frequency: formData.frequency || '',
            status: formData.status || 'active',
            effectiveness: formData.effectiveness || 50,
            startDate: new Date().toISOString(),
            endDate: formData.endDate
        };

        const updatedInterventions = editingId
            ? interventions.map((i: Intervention) => i.id === editingId ? newIntervention : i)
            : [...interventions, newIntervention];

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                treatmentPlan: {
                    ...(currentPatient as any).eellsData?.treatmentPlan,
                    interventions: updatedInterventions
                }
            }
        } as any);

        setFormData({
            name: '',
            type: '',
            rationale: '',
            targetNodes: [],
            targetGoals: [],
            frequency: '',
            status: 'active',
            effectiveness: 50
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (intervention: Intervention) => {
        setFormData(intervention);
        setEditingId(intervention.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Deletar esta intervenção?')) return;

        const updatedInterventions = interventions.filter((i: Intervention) => i.id !== id);
        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                treatmentPlan: {
                    ...(currentPatient as any).eellsData?.treatmentPlan,
                    interventions: updatedInterventions
                }
            }
        } as any);
    };

    const toggleStatus = (intervention: Intervention) => {
        const newStatus = intervention.status === 'active' ? 'paused' : 'active';

        const updatedInterventions = interventions.map((i: Intervention) =>
            i.id === intervention.id ? { ...i, status: newStatus } : i
        );

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                treatmentPlan: {
                    ...(currentPatient as any).eellsData?.treatmentPlan,
                    interventions: updatedInterventions
                }
            }
        } as any);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'paused': return 'bg-amber-500';
            case 'completed': return 'bg-blue-500';
            default: return 'bg-gray-400';
        }
    };

    const getEffectivenessColor = (effectiveness: number) => {
        if (effectiveness >= 70) return 'text-green-600 bg-green-50';
        if (effectiveness >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="bg-white rounded-2xl p-6 border-2 border-purple-100 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-purple-600" />
                        Intervenções Terapêuticas
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {interventions.filter((i: Intervention) => i.status === 'active').length} ativa(s) de {interventions.length} total
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    Nova Intervenção
                </button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="mb-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Intervenção *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Exposição interoceptiva"
                                    className="w-full bg-white border-2 border-purple-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-white border-2 border-purple-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="CBT">TCC</option>
                                    <option value="Exposure">Exposição</option>
                                    <option value="ACT">ACT</option>
                                    <option value="DBT">DBT</option>
                                    <option value="Mindfulness">Mindfulness</option>
                                    <option value="Other">Outro</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Justificativa/Racional</label>
                            <textarea
                                value={formData.rationale}
                                onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                                placeholder="Ex: Reduzir esquiva de sensações físicas"
                                className="w-full bg-white border-2 border-purple-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Frequência</label>
                                <input
                                    type="text"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    placeholder="Ex: 2x/semana"
                                    className="w-full bg-white border-2 border-purple-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Efetividade (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.effectiveness}
                                    onChange={(e) => setFormData({ ...formData, effectiveness: parseInt(e.target.value) })}
                                    className="w-full bg-white border-2 border-purple-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Metas Vinculadas</label>
                            <select
                                multiple
                                value={formData.targetGoals || []}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    setFormData({ ...formData, targetGoals: selected });
                                }}
                                className="w-full bg-white border-2 border-purple-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px]"
                            >
                                {goals.map((g: Goal) => (
                                    <option key={g.id} value={g.id}>{g.description}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Ctrl/Cmd para múltiplos</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-bold"
                            >
                                {editingId ? 'Salvar' : 'Adicionar'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingId(null);
                                    setFormData({ name: '', type: '', rationale: '', targetNodes: [], targetGoals: [], frequency: '', status: 'active', effectiveness: 50 });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Interventions List */}
            <div className="space-y-3">
                {interventions.map((intervention: Intervention) => (
                    <div
                        key={intervention.id}
                        className="bg-gradient-to-br from-white to-purple-50 rounded-xl p-4 border-2 border-purple-100 hover:border-purple-200 transition-all"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-3 py-1 rounded-lg text-white text-sm font-bold ${getStatusColor(intervention.status)}`}>
                                        {intervention.status === 'active' ? 'Ativa' : intervention.status === 'paused' ? 'Pausada' : 'Concluída'}
                                    </span>
                                    {intervention.type && (
                                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                                            {intervention.type}
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getEffectivenessColor(intervention.effectiveness)}`}>
                                        {intervention.effectiveness}% efetiva
                                    </span>
                                </div>

                                <h4 className="font-bold text-gray-900 mb-1">{intervention.name}</h4>

                                {intervention.rationale && (
                                    <p className="text-sm text-gray-600 mb-2 italic">"{intervention.rationale}"</p>
                                )}

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    {intervention.frequency && (
                                        <div>
                                            <span className="font-semibold">Frequência:</span> {intervention.frequency}
                                        </div>
                                    )}
                                    {intervention.targetGoals.length > 0 && (
                                        <div>
                                            <span className="font-semibold">Metas:</span> {intervention.targetGoals.length} vinculada(s)
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => toggleStatus(intervention)}
                                    className={`p-2 ${intervention.status === 'active' ? 'bg-amber-50 hover:bg-amber-100 text-amber-600' : 'bg-green-50 hover:bg-green-100 text-green-600'} rounded-lg transition-colors`}
                                    title={intervention.status === 'active' ? 'Pausar' : 'Ativar'}
                                >
                                    {intervention.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => handleEdit(intervention)}
                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(intervention.id)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {interventions.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-400">
                        <Zap className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Nenhuma intervenção planejada ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

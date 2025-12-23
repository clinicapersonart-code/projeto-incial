import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { Goal, Problem } from '../types/eells';
import { Target, Plus, Edit2, Trash2, TrendingUp, CheckCircle2 } from 'lucide-react';

export const GoalsManager: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Goal>>({
        description: '',
        linkedProblems: [],
        baseline: '',
        target: '',
        timeframe: '',
        measurableCriteria: '',
        currentProgress: 0,
        status: 'pending',
        history: []
    });

    if (!currentPatient) return null;

    const goals = (currentPatient as any).eellsData?.treatmentPlan?.goals || [];
    const problemList = (currentPatient as any).eellsData?.problemList || [];

    const handleSave = () => {
        if (!formData.description) return;

        const newGoal: Goal = {
            id: editingId || crypto.randomUUID(),
            description: formData.description || '',
            linkedProblems: formData.linkedProblems || [],
            baseline: formData.baseline || '',
            target: formData.target || '',
            timeframe: formData.timeframe || '',
            measurableCriteria: formData.measurableCriteria || '',
            currentProgress: formData.currentProgress || 0,
            status: formData.status || 'pending',
            history: formData.history || [],
            createdAt: new Date().toISOString()
        };

        const updatedGoals = editingId
            ? goals.map((g: Goal) => g.id === editingId ? newGoal : g)
            : [...goals, newGoal];

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                treatmentPlan: {
                    ...(currentPatient as any).eellsData?.treatmentPlan,
                    goals: updatedGoals
                }
            }
        } as any);

        setFormData({
            description: '',
            linkedProblems: [],
            baseline: '',
            target: '',
            timeframe: '',
            measurableCriteria: '',
            currentProgress: 0,
            status: 'pending',
            history: []
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (goal: Goal) => {
        setFormData(goal);
        setEditingId(goal.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Deletar esta meta?')) return;

        const updatedGoals = goals.filter((g: Goal) => g.id !== id);
        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                treatmentPlan: {
                    ...(currentPatient as any).eellsData?.treatmentPlan,
                    goals: updatedGoals
                }
            }
        } as any);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'achieved': return 'bg-emerald-500';
            case 'almost_achieved': return 'bg-lime-500';
            case 'in_progress': return 'bg-amber-500';
            case 'revised': return 'bg-blue-500';
            default: return 'bg-gray-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'achieved': return 'Atingida';
            case 'almost_achieved': return 'Quase lá';
            case 'in_progress': return 'Em progresso';
            case 'revised': return 'Revisada';
            default: return 'Pendente';
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border-2 border-green-100 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Target className="w-6 h-6 text-green-600" />
                        Metas Terapêuticas
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{goals.length} meta(s) definida(s)</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Meta
                </button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="mb-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Descrição da Meta *</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ex: Reduzir ataques de pânico para 0-1/mês"
                                className="w-full bg-white border-2 border-green-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Baseline</label>
                                <input
                                    type="text"
                                    value={formData.baseline}
                                    onChange={(e) => setFormData({ ...formData, baseline: e.target.value })}
                                    placeholder="Ex: 12-16/mês"
                                    className="w-full bg-white border-2 border-green-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Alvo</label>
                                <input
                                    type="text"
                                    value={formData.target}
                                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                    placeholder="Ex: 0-1/mês"
                                    className="w-full bg-white border-2 border-green-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Prazo</label>
                                <input
                                    type="text"
                                    value={formData.timeframe}
                                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                                    placeholder="Ex: 3 meses"
                                    className="w-full bg-white border-2 border-green-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Progresso (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.currentProgress}
                                    onChange={(e) => setFormData({ ...formData, currentProgress: parseInt(e.target.value) })}
                                    className="w-full bg-white border-2 border-green-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Critério Mensurável</label>
                            <input
                                type="text"
                                value={formData.measurableCriteria}
                                onChange={(e) => setFormData({ ...formData, measurableCriteria: e.target.value })}
                                placeholder="Ex: Auto-registro de ataques"
                                className="w-full bg-white border-2 border-green-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Vinculada a Problema(s)</label>
                            <select
                                multiple
                                value={formData.linkedProblems || []}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    setFormData({ ...formData, linkedProblems: selected });
                                }}
                                className="w-full bg-white border-2 border-green-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"
                            >
                                {problemList.map((p: Problem) => (
                                    <option key={p.id} value={p.id}>{p.problem}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Segure Ctrl/Cmd para selecionar múltiplos</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-bold"
                            >
                                {editingId ? 'Salvar' : 'Adicionar'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingId(null);
                                    setFormData({ description: '', linkedProblems: [], baseline: '', target: '', timeframe: '', measurableCriteria: '', currentProgress: 0, status: 'pending', history: [] });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Goals List */}
            <div className="space-y-3">
                {goals.map((goal: Goal) => (
                    <div
                        key={goal.id}
                        className="bg-gradient-to-br from-white to-green-50 rounded-xl p-4 border-2 border-green-100 hover:border-green-200 transition-all"
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-3 py-1 rounded-lg text-white text-sm font-bold ${getStatusColor(goal.status)}`}>
                                        {getStatusLabel(goal.status)}
                                    </span>
                                    {goal.linkedProblems.length > 0 && (
                                        <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-semibold">
                                            {goal.linkedProblems.length} problema(s)
                                        </span>
                                    )}
                                </div>

                                <h4 className="font-bold text-gray-900 mb-2">{goal.description}</h4>

                                {/* Progress Bar */}
                                <div className="mb-2">
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                        <span>{goal.baseline || 'Início'}</span>
                                        <span className="font-bold text-green-600">{goal.currentProgress}%</span>
                                        <span>{goal.target || 'Meta'}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${goal.currentProgress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    {goal.timeframe && (
                                        <div>
                                            <span className="font-semibold">Prazo:</span> {goal.timeframe}
                                        </div>
                                    )}
                                    {goal.measurableCriteria && (
                                        <div>
                                            <span className="font-semibold">Critério:</span> {goal.measurableCriteria}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(goal)}
                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(goal.id)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {goals.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-400">
                        <Target className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Nenhuma meta definida ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

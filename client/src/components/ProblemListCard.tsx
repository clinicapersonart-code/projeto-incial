import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { Problem } from '../types/eells';
import { AlertCircle, Plus, Edit2, Trash2, Link as LinkIcon } from 'lucide-react';

export const ProblemListCard: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Problem>>({
        problem: '',
        frequency: '',
        severity: 5,
        functionalImpairment: '',
        linkedPbtNodes: [],
        status: 'active'
    });

    if (!currentPatient) return null;

    const problemList = (currentPatient as any).eellsData?.problemList || [];

    const handleSave = () => {
        if (!formData.problem) return;

        const newProblem: Problem = {
            id: editingId || crypto.randomUUID(),
            problem: formData.problem || '',
            frequency: formData.frequency || '',
            severity: formData.severity || 5,
            functionalImpairment: formData.functionalImpairment || '',
            linkedPbtNodes: formData.linkedPbtNodes || [],
            status: formData.status || 'active',
            createdAt: new Date().toISOString()
        };

        const updatedList = editingId
            ? problemList.map((p: Problem) => p.id === editingId ? newProblem : p)
            : [...problemList, newProblem];

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                problemList: updatedList
            }
        } as any);

        setFormData({
            problem: '',
            frequency: '',
            severity: 5,
            functionalImpairment: '',
            linkedPbtNodes: [],
            status: 'active'
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (problem: Problem) => {
        setFormData(problem);
        setEditingId(problem.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Deletar este problema?')) return;

        const updatedList = problemList.filter((p: Problem) => p.id !== id);
        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                problemList: updatedList
            }
        } as any);
    };

    const getSeverityColor = (severity: number) => {
        if (severity >= 8) return 'text-red-600 bg-red-50 border-red-200';
        if (severity >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-green-600 bg-green-50 border-green-200';
    };

    return (
        <div className="bg-white rounded-2xl p-6 border-2 border-red-100 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        Lista de Problemas
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{problemList.length} problema(s) identificado(s)</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="mb-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Problema *</label>
                            <input
                                type="text"
                                value={formData.problem}
                                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                                placeholder="Ex: Ataques de pânico"
                                className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Frequência</label>
                                <input
                                    type="text"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    placeholder="Ex: 3-4x por semana"
                                    className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Severidade (0-10)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={formData.severity}
                                    onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                                    className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Impacto Funcional</label>
                            <textarea
                                value={formData.functionalImpairment}
                                onChange={(e) => setFormData({ ...formData, functionalImpairment: e.target.value })}
                                placeholder="Ex: Evita reuniões no trabalho"
                                className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[60px]"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 rounded-lg font-bold"
                            >
                                {editingId ? 'Salvar' : 'Adicionar'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingId(null);
                                    setFormData({ problem: '', frequency: '', severity: 5, functionalImpairment: '', linkedPbtNodes: [], status: 'active' });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Problem List */}
            <div className="space-y-3">
                {problemList.map((problem: Problem) => (
                    <div
                        key={problem.id}
                        className="bg-gradient-to-br from-white to-red-50 rounded-xl p-4 border-2 border-red-100 hover:border-red-200 transition-all"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${getSeverityColor(problem.severity)}`}>
                                        Severidade: {problem.severity}/10
                                    </span>
                                    {problem.linkedPbtNodes.length > 0 && (
                                        <span className="px-3 py-1 bg-purple-50 text-purple-600 border-2 border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                                            <LinkIcon className="w-3 h-3" />
                                            {problem.linkedPbtNodes.length} nó(s) PBT
                                        </span>
                                    )}
                                </div>

                                <h4 className="font-bold text-gray-900 mb-1">{problem.problem}</h4>

                                {problem.frequency && (
                                    <p className="text-sm text-gray-600 mb-1">
                                        <span className="font-semibold">Frequência:</span> {problem.frequency}
                                    </p>
                                )}

                                {problem.functionalImpairment && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">Impacto:</span> {problem.functionalImpairment}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(problem)}
                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(problem.id)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {problemList.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Nenhum problema cadastrado ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

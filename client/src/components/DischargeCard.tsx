/**
 * DischargeCard - Avaliação de Prontidão para Alta e Prevenção de Recaída
 * Etapa 7 do modelo Eells
 */

import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    GraduationCap,
    Plus,
    X,
    Save,
    ChevronDown,
    ChevronUp,
    Target,
    AlertTriangle,
    Shield,
    Users,
    Phone,
    FileText,
    CheckCircle2,
    Circle,
    TrendingUp,
    Calendar,
    Edit3
} from 'lucide-react';
import {
    DischargeData,
    DischargeReadiness,
    DischargeCriterion,
    RelapsePrevention,
    WarningSign,
    CopingStrategy,
    DischargeStatus,
    CriterionStatus,
    DischargeValidation
} from '../types/eells';

// Critérios sugeridos por categoria
const SUGGESTED_CRITERIA: Omit<DischargeCriterion, 'id' | 'metDate' | 'evidence' | 'naJustification'>[] = [
    // Sintomas
    { description: 'Sintomas principais em faixa mínima por 4+ semanas', category: 'sintomas', weight: 3, status: 'pending' },
    { description: 'Sem episódios de crise nas últimas 6 semanas', category: 'sintomas', weight: 2, status: 'pending' },

    // Funcionalidade
    { description: 'Retorno às atividades cotidianas', category: 'funcionalidade', weight: 3, status: 'pending' },
    { description: 'Melhora nos relacionamentos interpessoais', category: 'funcionalidade', weight: 2, status: 'pending' },
    { description: 'Funcionamento ocupacional satisfatório', category: 'funcionalidade', weight: 2, status: 'pending' },

    // Mecanismos
    { description: 'Padrões disfuncionais identificados e modificados', category: 'mecanismos', weight: 3, status: 'pending' },
    { description: 'Crenças nucleares flexibilizadas', category: 'mecanismos', weight: 2, status: 'pending' },

    // Aliança/Autonomia
    { description: 'Paciente percebe progresso e confia nas próprias habilidades', category: 'autonomia', weight: 3, status: 'pending' },
    { description: 'Usa estratégias aprendidas de forma independente', category: 'autonomia', weight: 3, status: 'pending' },
    { description: 'Acordo mútuo sobre encerramento', category: 'alianca', weight: 2, status: 'pending' },
];

// Cores por categoria
const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    sintomas: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
    funcionalidade: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
    mecanismos: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
    alianca: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
    autonomia: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
};

export const DischargeCard: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [activeTab, setActiveTab] = useState<'readiness' | 'prevention' | 'support' | 'letter'>('readiness');
    const [showAddCriterion, setShowAddCriterion] = useState(false);
    const [showAddWarning, setShowAddWarning] = useState(false);
    const [showAddStrategy, setShowAddStrategy] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', relationship: '', contactInfo: '', role: '' });
    const [letterDraft, setLetterDraft] = useState({ whatWorks: '', whatHurts: '', whatToDo: '' });

    // Form states
    const [newCriterion, setNewCriterion] = useState({ description: '', category: 'sintomas' as DischargeCriterion['category'], weight: 2 });
    const [newWarning, setNewWarning] = useState({ description: '', category: 'comportamental' as WarningSign['category'], severity: 'precoce' as WarningSign['severity'] });
    const [newStrategy, setNewStrategy] = useState({ description: '', category: 'cognitiva' as CopingStrategy['category'] });

    // Dados atuais
    const dischargeData = useMemo((): DischargeData | null => {
        if (!currentPatient) return null;
        return (currentPatient as any).eellsData?.discharge || null;
    }, [currentPatient]);

    // Calcular validação de travas
    const calculateValidation = (data: DischargeData): DischargeValidation => {
        const criteria = data.readiness.criteria;
        const prevention = data.relapsePrevention;

        // Calcular percentual (ignorar N/A no total)
        const applicableCriteria = criteria.filter(c => c.status !== 'not_applicable');
        const totalWeight = applicableCriteria.reduce((sum, c) => sum + c.weight, 0);
        const metWeight = applicableCriteria.filter(c => c.status === 'met').reduce((sum, c) => sum + c.weight, 0);
        const percent = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 0;

        // Verificar N/A justificados
        const naWithoutJustification = criteria.filter(c => c.status === 'not_applicable' && (!c.naJustification || c.naJustification.trim().length < 5));

        const missingItems: string[] = [];

        const hasMinWarningSigns = prevention.warningSigns.length >= 1;
        if (!hasMinWarningSigns) missingItems.push('Mínimo 1 sinal de alerta');

        const hasMinCopingStrategies = prevention.copingStrategies.length >= 2;
        if (!hasMinCopingStrategies) missingItems.push('Mínimo 2 estratégias de enfrentamento');

        const hasCriteriaPercent = percent >= 75;
        if (!hasCriteriaPercent) missingItems.push('75% dos critérios atingidos');

        const allNAJustified = naWithoutJustification.length === 0;
        if (!allNAJustified) missingItems.push('Justificativa para todos os N/A');

        return {
            hasMinWarningSigns,
            hasMinCopingStrategies,
            hasCriteriaPercent,
            allNAJustified,
            canMarkAsRealized: hasMinWarningSigns && hasMinCopingStrategies && hasCriteriaPercent && allNAJustified,
            missingItems
        };
    };

    // Calcular status de prontidão (com travas)
    const calculateStatus = (data: DischargeData): { status: DischargeStatus; percent: number } => {
        const criteria = data.readiness.criteria;
        const prevention = data.relapsePrevention;

        if (criteria.length === 0) return { status: 'nao_indicada', percent: 0 };

        // Ignorar N/A no cálculo
        const applicableCriteria = criteria.filter(c => c.status !== 'not_applicable');
        const totalWeight = applicableCriteria.reduce((sum, c) => sum + c.weight, 0);
        const metWeight = applicableCriteria.filter(c => c.status === 'met').reduce((sum, c) => sum + c.weight, 0);
        const percent = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 0;

        // Se já foi marcada como realizada, manter
        if (data.readiness.overallStatus === 'alta_realizada') {
            return { status: 'alta_realizada', percent };
        }

        // Verificar travas mínimas para cada status
        const hasWarningSigns = prevention.warningSigns.length >= 1;
        const hasCopingStrategies = prevention.copingStrategies.length >= 1;

        let status: DischargeStatus = 'nao_indicada';

        if (percent >= 75 && hasWarningSigns && hasCopingStrategies) {
            status = 'indicada';
        } else if (percent >= 50 && hasWarningSigns) {
            status = 'em_preparacao';
        }

        return { status, percent };
    };

    // Inicializar dados se não existirem
    const initializeDischargeData = (): DischargeData => ({
        readiness: {
            criteria: [],
            overallStatus: 'nao_indicada',
            percentMet: 0,
            lastEvaluated: new Date().toISOString(),
        },
        relapsePrevention: {
            warningSigns: [],
            copingStrategies: [],
            supportNetwork: [],
            emergencyContacts: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
        },
        history: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
    });

    // Handlers
    const saveDischargeData = (updated: DischargeData) => {
        if (!currentPatient) return;

        const eellsData = (currentPatient as any).eellsData || {};
        updatePatient({
            ...currentPatient,
            eellsData: {
                ...eellsData,
                discharge: updated
            }
        } as any);
    };

    const toggleCriterion = (criterionId: string, newStatus: CriterionStatus) => {
        const data = dischargeData || initializeDischargeData();
        const criteria = data.readiness.criteria.map(c =>
            c.id === criterionId
                ? {
                    ...c,
                    status: newStatus,
                    metDate: newStatus === 'met' ? new Date().toISOString() : undefined,
                    naJustification: newStatus === 'not_applicable' ? c.naJustification : undefined
                }
                : c
        );

        const updatedData = {
            ...data,
            readiness: {
                ...data.readiness,
                criteria,
                lastEvaluated: new Date().toISOString()
            }
        };

        const { status, percent } = calculateStatus(updatedData);
        updatedData.readiness.overallStatus = status;
        updatedData.readiness.percentMet = percent;

        saveDischargeData(updatedData);
    };

    const updateNAJustification = (criterionId: string, justification: string) => {
        const data = dischargeData || initializeDischargeData();
        const criteria = data.readiness.criteria.map(c =>
            c.id === criterionId ? { ...c, naJustification: justification } : c
        );

        saveDischargeData({
            ...data,
            readiness: {
                ...data.readiness,
                criteria,
                lastEvaluated: new Date().toISOString()
            }
        });
    };

    const addCriterion = () => {
        if (!newCriterion.description.trim()) return;

        const data = dischargeData || initializeDischargeData();
        const criterion: DischargeCriterion = {
            id: crypto.randomUUID(),
            description: newCriterion.description,
            category: newCriterion.category,
            weight: newCriterion.weight,
            status: 'pending'
        };

        const criteria = [...data.readiness.criteria, criterion];
        const updatedData = {
            ...data,
            readiness: {
                ...data.readiness,
                criteria,
                lastEvaluated: new Date().toISOString()
            }
        };

        const { status, percent } = calculateStatus(updatedData);
        updatedData.readiness.overallStatus = status;
        updatedData.readiness.percentMet = percent;

        saveDischargeData(updatedData);

        setNewCriterion({ description: '', category: 'sintomas', weight: 2 });
        setShowAddCriterion(false);
    };

    const addSuggestedCriteria = () => {
        const data = dischargeData || initializeDischargeData();
        const existingDescriptions = new Set(data.readiness.criteria.map(c => c.description));

        const newCriteria: DischargeCriterion[] = SUGGESTED_CRITERIA
            .filter(c => !existingDescriptions.has(c.description))
            .map(c => ({
                id: crypto.randomUUID(),
                ...c
            }));

        const criteria = [...data.readiness.criteria, ...newCriteria];
        const updatedData = {
            ...data,
            readiness: {
                ...data.readiness,
                criteria,
                lastEvaluated: new Date().toISOString()
            }
        };

        const { status, percent } = calculateStatus(updatedData);
        updatedData.readiness.overallStatus = status;
        updatedData.readiness.percentMet = percent;

        saveDischargeData(updatedData);
    };

    const addWarningSign = () => {
        if (!newWarning.description.trim()) return;

        const data = dischargeData || initializeDischargeData();
        const warning: WarningSign = {
            id: crypto.randomUUID(),
            description: newWarning.description,
            category: newWarning.category,
            severity: newWarning.severity
        };

        saveDischargeData({
            ...data,
            relapsePrevention: {
                ...data.relapsePrevention,
                warningSigns: [...data.relapsePrevention.warningSigns, warning],
                lastUpdated: new Date().toISOString()
            }
        });

        setNewWarning({ description: '', category: 'comportamental', severity: 'precoce' });
        setShowAddWarning(false);
    };

    const addCopingStrategy = () => {
        if (!newStrategy.description.trim()) return;

        const data = dischargeData || initializeDischargeData();
        const strategy: CopingStrategy = {
            id: crypto.randomUUID(),
            description: newStrategy.description,
            category: newStrategy.category,
            practiced: false
        };

        saveDischargeData({
            ...data,
            relapsePrevention: {
                ...data.relapsePrevention,
                copingStrategies: [...data.relapsePrevention.copingStrategies, strategy],
                lastUpdated: new Date().toISOString()
            }
        });

        setNewStrategy({ description: '', category: 'cognitiva' });
        setShowAddStrategy(false);
    };

    const addSupportContact = () => {
        if (!newContact.name.trim() || !newContact.relationship.trim()) return;

        const data = dischargeData || initializeDischargeData();
        const contact = {
            name: newContact.name,
            relationship: newContact.relationship,
            contactInfo: newContact.contactInfo || undefined,
            role: newContact.role || undefined
        };

        saveDischargeData({
            ...data,
            relapsePrevention: {
                ...data.relapsePrevention,
                supportNetwork: [...data.relapsePrevention.supportNetwork, contact],
                lastUpdated: new Date().toISOString()
            }
        });

        setNewContact({ name: '', relationship: '', contactInfo: '', role: '' });
        setShowAddContact(false);
    };

    if (!currentPatient) return null;

    const data = dischargeData || initializeDischargeData();
    const { status, percent } = calculateStatus(data);
    const validation = calculateValidation(data);
    const currentStatus = status;

    // Cores do status
    const statusColors = {
        'nao_indicada': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Não Indicada' },
        'em_preparacao': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Em Preparação' },
        'indicada': { bg: 'bg-green-100', text: 'text-green-700', label: 'Indicada' },
        'alta_realizada': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Alta Realizada' }
    };

    const currentStatusColors = statusColors[status];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Alta e Prevenção de Recaída</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentStatusColors.bg} ${currentStatusColors.text}`}>
                                {currentStatusColors.label}
                            </span>
                            <span className="text-sm text-gray-500">{percent}% critérios</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all ${percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                        style={{ width: `${percent}%` }}
                    />
                </div>

                {/* Botão Alta Realizada */}
                {currentStatus !== 'alta_realizada' && (
                    <button
                        onClick={() => {
                            if (validation.canMarkAsRealized) {
                                const updated = { ...data };
                                updated.readiness.overallStatus = 'alta_realizada';
                                updated.dischargeDate = new Date().toISOString();
                                updated.lastUpdated = new Date().toISOString();
                                // Adicionar ao histórico
                                updated.history = [...(updated.history || []), {
                                    id: crypto.randomUUID(),
                                    date: new Date().toISOString(),
                                    changeType: 'discharge_complete' as const,
                                    description: 'Alta terapêutica realizada',
                                    snapshot: {
                                        percentMet: percent,
                                        criteriaMetCount: data.readiness.criteria.filter(c => c.status === 'met').length,
                                        criteriaTotalCount: data.readiness.criteria.length,
                                        warningSignsCount: data.relapsePrevention.warningSigns.length,
                                        copingStrategiesCount: data.relapsePrevention.copingStrategies.length,
                                        status: 'alta_realizada' as const
                                    }
                                }];
                                saveDischargeData(updated);
                            }
                        }}
                        disabled={!validation.canMarkAsRealized}
                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${validation.canMarkAsRealized
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        title={validation.canMarkAsRealized ? 'Marcar alta realizada' : `Falta: ${validation.missingItems.join(', ')}`}
                    >
                        {validation.canMarkAsRealized ? '✓ Marcar Alta' : '🔒 Bloqueado'}
                    </button>
                )}
            </div>

            {/* Aviso do que falta */}
            {!validation.canMarkAsRealized && validation.missingItems.length > 0 && (
                <div className="mx-4 mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium">⚠️ Para liberar a alta:</p>
                    <ul className="text-xs text-amber-600 mt-1 space-y-0.5">
                        {validation.missingItems.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('readiness')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'readiness'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Target className="w-4 h-4 inline mr-1" />
                    Critérios
                </button>
                <button
                    onClick={() => setActiveTab('prevention')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'prevention'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Shield className="w-4 h-4 inline mr-1" />
                    Prevenção
                </button>
                <button
                    onClick={() => setActiveTab('support')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'support'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Users className="w-4 h-4 inline mr-1" />
                    Rede de Apoio
                </button>
                <button
                    onClick={() => setActiveTab('letter')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'letter'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FileText className="w-4 h-4 inline mr-1" />
                    Carta
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                {activeTab === 'readiness' && (
                    <div className="space-y-4">
                        {/* Critérios */}
                        {data.readiness.criteria.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                                <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>Nenhum critério de alta definido.</p>
                                <button
                                    onClick={addSuggestedCriteria}
                                    className="mt-3 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
                                >
                                    Adicionar critérios sugeridos
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.readiness.criteria.map(criterion => {
                                    const colors = CATEGORY_COLORS[criterion.category];
                                    const bgColor = criterion.status === 'met' ? 'bg-green-50 border-green-200'
                                        : criterion.status === 'not_applicable' ? 'bg-gray-100 border-gray-200'
                                            : 'bg-gray-50 border-gray-100';
                                    return (
                                        <div
                                            key={criterion.id}
                                            className={`p-3 rounded-lg border ${bgColor}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Status Buttons */}
                                                <div className="flex flex-col gap-1 mt-0.5">
                                                    <button
                                                        onClick={() => toggleCriterion(criterion.id, criterion.status === 'met' ? 'pending' : 'met')}
                                                        title={criterion.status === 'met' ? 'Remover atingido' : 'Marcar como atingido'}
                                                    >
                                                        {criterion.status === 'met' ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <Circle className="w-5 h-5 text-gray-300 hover:text-green-400" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => toggleCriterion(criterion.id, criterion.status === 'not_applicable' ? 'pending' : 'not_applicable')}
                                                        className={`text-[10px] px-1 py-0.5 rounded ${criterion.status === 'not_applicable'
                                                            ? 'bg-gray-600 text-white'
                                                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                                            }`}
                                                        title="Marcar como Não Aplicável"
                                                    >
                                                        N/A
                                                    </button>
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${criterion.status === 'met' ? 'text-green-800'
                                                        : criterion.status === 'not_applicable' ? 'text-gray-500 line-through'
                                                            : 'text-gray-700'
                                                        }`}>
                                                        {criterion.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}>
                                                            {criterion.category}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            Peso: {criterion.weight}
                                                        </span>
                                                        {criterion.metDate && criterion.status === 'met' && (
                                                            <span className="text-xs text-green-600">
                                                                ✓ {new Date(criterion.metDate).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Campo justificativa N/A */}
                                                    {criterion.status === 'not_applicable' && (
                                                        <div className="mt-2">
                                                            <input
                                                                type="text"
                                                                value={criterion.naJustification || ''}
                                                                onChange={(e) => updateNAJustification(criterion.id, e.target.value)}
                                                                placeholder="Justificativa para N/A (obrigatória)"
                                                                className={`w-full text-xs px-2 py-1 border rounded ${!criterion.naJustification || criterion.naJustification.trim().length < 5
                                                                    ? 'border-red-300 bg-red-50'
                                                                    : 'border-gray-200'
                                                                    }`}
                                                            />
                                                            {(!criterion.naJustification || criterion.naJustification.trim().length < 5) && (
                                                                <p className="text-xs text-red-500 mt-0.5">Mínimo 5 caracteres</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Botão adicionar */}
                        <button
                            onClick={() => setShowAddCriterion(true)}
                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar critério
                        </button>
                    </div>
                )}

                {activeTab === 'prevention' && (
                    <div className="space-y-6">
                        {/* Sinais de Alerta */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Sinais de Alerta
                                </h4>
                                <button
                                    onClick={() => setShowAddWarning(true)}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>

                            {data.relapsePrevention.warningSigns.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Nenhum sinal de alerta definido.</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.relapsePrevention.warningSigns.map(sign => (
                                        <div key={sign.id} className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-sm">
                                            <p className="text-amber-800">{sign.description}</p>
                                            <span className={`text-xs ${sign.severity === 'critico' ? 'text-red-600' :
                                                sign.severity === 'moderado' ? 'text-amber-600' : 'text-green-600'
                                                }`}>
                                                {sign.severity} • {sign.category}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Estratégias de Enfrentamento */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    Estratégias de Enfrentamento
                                </h4>
                                <button
                                    onClick={() => setShowAddStrategy(true)}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>

                            {data.relapsePrevention.copingStrategies.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Nenhuma estratégia definida.</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.relapsePrevention.copingStrategies.map(strategy => (
                                        <div key={strategy.id} className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                                            <p className="text-blue-800">{strategy.description}</p>
                                            <span className="text-xs text-blue-600">
                                                {strategy.category} {strategy.practiced && '• ✓ Praticado'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Aba Rede de Apoio */}
                {activeTab === 'support' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                Rede de Apoio
                            </h4>
                            <button
                                onClick={() => setShowAddContact(true)}
                                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Adicionar
                            </button>
                        </div>

                        {data.relapsePrevention.supportNetwork.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-4">
                                Nenhuma pessoa de apoio cadastrada.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {data.relapsePrevention.supportNetwork.map((contact, idx) => (
                                    <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-blue-800">{contact.name}</p>
                                                <p className="text-sm text-blue-600">{contact.relationship}</p>
                                            </div>
                                            {contact.contactInfo && (
                                                <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                                                    {contact.contactInfo}
                                                </span>
                                            )}
                                        </div>
                                        {contact.role && (
                                            <p className="text-xs text-gray-600 mt-1 italic">
                                                "{contact.role}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-gray-400 mt-4">
                            💡 Cadastre pessoas de confiança que podem ajudar em momentos difíceis.
                        </p>
                    </div>
                )}

                {/* Aba Carta para Si Mesmo */}
                {activeTab === 'letter' && (
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <FileText className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                            <h4 className="font-bold text-gray-700">Carta para Si Mesmo</h4>
                            <p className="text-sm text-gray-500">
                                Um lembrete pessoal para momentos difíceis
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ✅ O que funciona para mim
                            </label>
                            <textarea
                                value={data.relapsePrevention.letterToSelf?.split('|||')[0] || ''}
                                onChange={(e) => {
                                    const parts = (data.relapsePrevention.letterToSelf || '|||').split('|||');
                                    parts[0] = e.target.value;
                                    const updated = { ...data };
                                    updated.relapsePrevention.letterToSelf = parts.join('|||');
                                    updated.relapsePrevention.lastUpdated = new Date().toISOString();
                                    saveDischargeData(updated);
                                }}
                                placeholder="Ex: Fazer caminhadas, conversar com minha irmã, respirar fundo..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[80px]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ⚠️ O que me derruba
                            </label>
                            <textarea
                                value={data.relapsePrevention.letterToSelf?.split('|||')[1] || ''}
                                onChange={(e) => {
                                    const parts = (data.relapsePrevention.letterToSelf || '|||').split('|||');
                                    parts[1] = e.target.value;
                                    const updated = { ...data };
                                    updated.relapsePrevention.letterToSelf = parts.join('|||');
                                    updated.relapsePrevention.lastUpdated = new Date().toISOString();
                                    saveDischargeData(updated);
                                }}
                                placeholder="Ex: Ficar muito tempo sozinho, comparações no Instagram..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[80px]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                🛡️ O que fazer quando notar sinais de alerta
                            </label>
                            <textarea
                                value={data.relapsePrevention.letterToSelf?.split('|||')[2] || ''}
                                onChange={(e) => {
                                    const parts = (data.relapsePrevention.letterToSelf || '|||').split('|||');
                                    parts[2] = e.target.value;
                                    const updated = { ...data };
                                    updated.relapsePrevention.letterToSelf = parts.join('|||');
                                    updated.relapsePrevention.lastUpdated = new Date().toISOString();
                                    saveDischargeData(updated);
                                }}
                                placeholder="Ex: Ligar para fulano, usar a respiração 4-7-8, sair de casa..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[80px]"
                            />
                        </div>

                        <p className="text-xs text-gray-400 text-center mt-4">
                            💜 Esta carta é um recurso pessoal para o paciente consultar quando precisar.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Adicionar Critério */}
            {showAddCriterion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Novo Critério de Alta</h3>
                            <button onClick={() => setShowAddCriterion(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={newCriterion.description}
                                    onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })}
                                    placeholder="Ex: GAD-7 < 5 por 4+ semanas"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                        value={newCriterion.category}
                                        onChange={(e) => setNewCriterion({ ...newCriterion, category: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="sintomas">Sintomas</option>
                                        <option value="funcionalidade">Funcionalidade</option>
                                        <option value="mecanismos">Mecanismos</option>
                                        <option value="alianca">Aliança</option>
                                        <option value="autonomia">Autonomia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
                                    <select
                                        value={newCriterion.weight}
                                        onChange={(e) => setNewCriterion({ ...newCriterion, weight: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value={1}>1 - Menor</option>
                                        <option value={2}>2 - Médio</option>
                                        <option value={3}>3 - Maior</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddCriterion(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addCriterion}
                                disabled={!newCriterion.description.trim()}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Adicionar Sinal de Alerta */}
            {showAddWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Novo Sinal de Alerta</h3>
                            <button onClick={() => setShowAddWarning(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={newWarning.description}
                                    onChange={(e) => setNewWarning({ ...newWarning, description: e.target.value })}
                                    placeholder="Ex: Voltar a evitar situações sociais"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                        value={newWarning.category}
                                        onChange={(e) => setNewWarning({ ...newWarning, category: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="cognitivo">Cognitivo</option>
                                        <option value="comportamental">Comportamental</option>
                                        <option value="emocional">Emocional</option>
                                        <option value="fisiologico">Fisiológico</option>
                                        <option value="social">Social</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Severidade</label>
                                    <select
                                        value={newWarning.severity}
                                        onChange={(e) => setNewWarning({ ...newWarning, severity: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="precoce">Precoce</option>
                                        <option value="moderado">Moderado</option>
                                        <option value="critico">Crítico</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddWarning(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addWarningSign}
                                disabled={!newWarning.description.trim()}
                                className="flex-1 py-2 bg-amber-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Adicionar Estratégia */}
            {showAddStrategy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Nova Estratégia de Enfrentamento</h3>
                            <button onClick={() => setShowAddStrategy(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={newStrategy.description}
                                    onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                                    placeholder="Ex: Usar respiração diafragmática"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <select
                                    value={newStrategy.category}
                                    onChange={(e) => setNewStrategy({ ...newStrategy, category: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="cognitiva">Cognitiva</option>
                                    <option value="comportamental">Comportamental</option>
                                    <option value="social">Social</option>
                                    <option value="automonitoramento">Automonitoramento</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddStrategy(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addCopingStrategy}
                                disabled={!newStrategy.description.trim()}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Adicionar Contato */}
            {showAddContact && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Novo Contato de Apoio</h3>
                            <button onClick={() => setShowAddContact(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                                <input
                                    type="text"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    placeholder="Ex: Maria"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Relação *</label>
                                <input
                                    type="text"
                                    value={newContact.relationship}
                                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                                    placeholder="Ex: Irmã, Amigo, Cônjuge"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Contato</label>
                                <input
                                    type="text"
                                    value={newContact.contactInfo}
                                    onChange={(e) => setNewContact({ ...newContact, contactInfo: e.target.value })}
                                    placeholder="Ex: WhatsApp, Telefone, Mora perto"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">O que essa pessoa pode fazer</label>
                                <input
                                    type="text"
                                    value={newContact.role}
                                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                                    placeholder="Ex: Conversar quando eu estiver ansioso"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddContact(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addSupportContact}
                                disabled={!newContact.name.trim() || !newContact.relationship.trim()}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

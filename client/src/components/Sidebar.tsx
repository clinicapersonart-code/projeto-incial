import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { InactivatePatientDialog } from './InactivatePatientDialog';
import { EditScheduleDialog } from './EditScheduleDialog';
import { EditBillingDialog } from './EditBillingDialog';
import {
    LayoutDashboard,
    Zap,
    FileText,
    BrainCircuit,
    TrendingUp,
    Target,
    BookOpen,
    Sparkles,
    ClipboardList,
    User,
    LogOut,
    FileUser,
    ChevronDown,
    ChevronRight,
    Library,
    UserCheck,
    UserX,
    Calendar,
    Clock,
    DollarSign
} from 'lucide-react';

type TabType = 'dashboard' | 'soap' | 'network' | 'plan' | 'forms' | 'anamnesis' | 'formulation' | 'curation' | 'evolution' | 'alchemy' | 'copilot' | 'eells' | 'prontuario' | 'library' | 'financeiro' | 'sessoes' | 'homework';

export interface SidebarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    isCollapsed: boolean;
    onToggle: () => void;
}

interface MenuItem {
    id: TabType;
    label: string;
    icon: any;
}

interface MenuCategory {
    id: string;
    label: string;
    icon: any;
    items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isCollapsed, onToggle }) => {
    const { currentPatient, clearCurrentPatient, updatePatient } = usePatients();
    const { user, signOut } = useAuth();
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['formulation', 'sessions', 'evolution']);
    const [showInactivateDialog, setShowInactivateDialog] = useState(false);
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [showBillingDialog, setShowBillingDialog] = useState(false);
    const [showMoreActions, setShowMoreActions] = useState(false);

    const DAY_NAMES: Record<number, string> = {
        0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb'
    };

    const handleToggleStatus = () => {
        if (!currentPatient) return;

        if (currentPatient.status === 'ativo') {
            // Show dialog to get inactivation reason
            setShowInactivateDialog(true);
        } else {
            // Reactivate patient directly
            const updated = { ...currentPatient, status: 'ativo' as const, inactivationDate: undefined, inactivationReason: undefined };
            updatePatient(updated);
        }
    };

    const handleInactivate = (reason: 'alta' | 'abandono' | 'transferencia' | 'outro', notes?: string) => {
        if (!currentPatient) return;
        const updated = {
            ...currentPatient,
            status: 'inativo' as const,
            inactivationDate: new Date().toISOString(),
            inactivationReason: reason,
            inactivationNotes: notes
        };
        updatePatient(updated);
    };

    const handleSaveSchedule = (schedule: { dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; time: string; frequency: 'semanal' | 'quinzenal' | 'mensal' }) => {
        if (!currentPatient) return;
        const updated = { ...currentPatient, schedule };
        updatePatient(updated);
    };

    const handleSaveBilling = (billing: any) => {
        if (!currentPatient) return;
        const updated = { ...currentPatient, billing };
        updatePatient(updated);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const toggleCategory = (categoryId: string) => {
        if (isCollapsed) return;
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const categories: MenuCategory[] = [
        {
            id: 'formulation',
            label: 'Formulação de Caso',
            icon: Target,
            items: [
                { id: 'anamnesis', label: 'Anamnese', icon: FileUser },
                { id: 'eells', label: 'Problemas & Metas', icon: Target },
                { id: 'network', label: 'Rede PBT', icon: BrainCircuit },
                { id: 'formulation', label: 'Conceituação', icon: Target },
                { id: 'plan', label: 'Plano de Tratamento', icon: Sparkles }
            ]
        },
        {
            id: 'sessions',
            label: 'Sessões',
            icon: FileText,
            items: [
                { id: 'copilot', label: 'Co-Piloto', icon: Zap },
                { id: 'soap', label: 'Sessão Atual', icon: FileText },
                { id: 'homework', label: 'Lições de Casa', icon: BookOpen },
                { id: 'sessoes', label: 'Agenda/Presença', icon: Calendar }
            ]
        },
        {
            id: 'evolution',
            label: 'Evolução',
            icon: TrendingUp,
            items: [
                { id: 'prontuario', label: 'Fichas de Evolução', icon: BookOpen },
                { id: 'evolution', label: 'Progresso', icon: TrendingUp },
                { id: 'forms', label: 'Monitoramento', icon: ClipboardList }
            ]
        }
    ];

    return (
        <div className={`${isCollapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 flex flex-col h-screen transition-all duration-300 relative z-50`}>

            {/* Collapse Toggle */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-6 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors z-50"
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 rotate-90" />}
            </button>

            {/* PsicoHub Brand Header */}
            <div className={`p-4 border-b border-gray-800/50 ${isCollapsed ? 'px-2' : ''}`}>
                <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 flex-shrink-0">
                        <img src="https://i.ibb.co/N2J6QYLm/psicohublogo.png" alt="PsicoHub" className="w-full h-full object-contain" />
                    </div>
                    {!isCollapsed && (
                        <div>
                            <h1 className="text-white font-bold text-sm">PsicoHub</h1>
                            <p className="text-gray-500 text-[10px] leading-tight">Da formulação ao resultado</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Patient Header */}
            <div className={`p-6 border-b border-gray-800 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 ${isCollapsed ? 'px-2' : ''}`}>
                <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <h2 className="text-white font-bold text-lg truncate">{currentPatient?.name}</h2>
                            <p className={`text-xs font-semibold ${currentPatient?.status === 'ativo' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {currentPatient?.status === 'ativo' ? '● ATIVO' : '○ INATIVO'}
                            </p>
                            {currentPatient?.schedule && (
                                <p className="text-xs text-indigo-300 mt-0.5">
                                    📅 {DAY_NAMES[currentPatient.schedule.dayOfWeek]} {currentPatient.schedule.time}
                                </p>
                            )}
                            {currentPatient?.billing && (
                                <p className="text-xs text-emerald-300 mt-0.5">
                                    💰 {currentPatient.billing.paymentType === 'particular' ? 'Particular' :
                                        currentPatient.billing.paymentType === 'convenio' ? currentPatient.billing.insurance?.name : 'Pacote'}
                                    {' • '}{formatCurrency(currentPatient.billing.sessionValue)}
                                </p>
                            )}
                            {/* Badge de Pacote Mensal */}
                            {currentPatient?.billing?.particularMode === 'mensal' && currentPatient?.billing?.package && (
                                <div className={`text-xs mt-1 px-2 py-1 rounded-lg inline-flex items-center gap-1 ${currentPatient.billing.package.usedSessions >= currentPatient.billing.package.totalSessions - 1
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    }`}>
                                    📦 {currentPatient.billing.package.usedSessions}/{currentPatient.billing.package.totalSessions}
                                    {currentPatient.billing.package.paymentDate && (
                                        <span className="text-gray-400">
                                            | Pago {new Date(currentPatient.billing.package.paymentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    )}
                                    {currentPatient.billing.package.usedSessions >= currentPatient.billing.package.totalSessions - 1 && (
                                        <span className="ml-1">⚠️</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    {/* Exit Button - Always visible */}
                    <button
                        onClick={clearCurrentPatient}
                        className={`w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg font-semibold transition-all ${isCollapsed ? 'text-xs' : 'text-sm'
                            }`}
                        title="Sair do Paciente"
                    >
                        <LogOut className="w-4 h-4" />
                        {!isCollapsed && 'Sair do Paciente'}
                    </button>

                    {/* Toggle More Actions Button */}
                    {!isCollapsed && (
                        <button
                            onClick={() => setShowMoreActions(!showMoreActions)}
                            className="w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        >
                            {showMoreActions ? (
                                <><ChevronDown className="w-3 h-3" />Recolher Opções</>
                            ) : (
                                <><ChevronRight className="w-3 h-3" />Mais Opções</>
                            )}
                        </button>
                    )}

                    {/* Collapsible Buttons */}
                    {!isCollapsed && showMoreActions && (
                        <>
                            {/* Status Toggle Button */}
                            <button
                                onClick={handleToggleStatus}
                                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border ${currentPatient?.status === 'ativo'
                                    ? 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/30 text-amber-400'
                                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30 text-emerald-400'
                                    }`}
                            >
                                {currentPatient?.status === 'ativo' ? (
                                    <><UserX className="w-4 h-4" />Inativar Paciente</>
                                ) : (
                                    <><UserCheck className="w-4 h-4" />Reativar Paciente</>
                                )}
                            </button>

                            {/* Edit Schedule Button */}
                            <button
                                onClick={() => setShowScheduleDialog(true)}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                            >
                                <Clock className="w-4 h-4" />
                                Editar Horário
                            </button>

                            {/* Edit Billing Button */}
                            <button
                                onClick={() => setShowBillingDialog(true)}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                            >
                                <DollarSign className="w-4 h-4" />
                                Configuração Financeira
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {/* Dashboard - Always visible */}
                <button
                    onClick={() => onTabChange('dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'dashboard'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                        : 'text-gray-300 hover:bg-gray-800/50'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    title={isCollapsed ? "Visão Geral" : ""}
                >
                    <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>Visão Geral</span>}
                </button>

                {/* Categorized Menu */}
                {categories.map((category) => {
                    const isExpanded = expandedCategories.includes(category.id);
                    const CategoryIcon = category.icon;
                    const hasActiveItem = category.items.some(item => item.id === activeTab);

                    if (isCollapsed) {
                        // In collapsed mode, show all icons in a flat list or grouped seamlessly
                        return (
                            <div key={category.id} className="pt-2 border-t border-gray-800/50 mt-2">
                                {category.items.map((item) => {
                                    const ItemIcon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onTabChange(item.id as TabType)}
                                            className={`w-full flex items-center justify-center p-3 mb-1 rounded-lg transition-all ${isActive
                                                ? 'bg-indigo-600/20 text-indigo-400'
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'}`}
                                            title={item.label}
                                        >
                                            <ItemIcon className="w-5 h-5" />
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    }

                    return (
                        <div key={category.id} className="space-y-1">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${hasActiveItem
                                    ? 'bg-gray-800/70 text-indigo-400'
                                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <CategoryIcon className="w-4 h-4" />
                                    <span>{category.label}</span>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>

                            {/* Category Items */}
                            {isExpanded && (
                                <div className="ml-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {category.items.map((item) => {
                                        const ItemIcon = item.icon;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => onTabChange(item.id as TabType)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === item.id
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                                                    }`}
                                            >
                                                <ItemIcon className="w-4 h-4" />
                                                <span>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer with User Info and Logout */}
            <div className={`p-4 border-t border-gray-800 bg-gray-900/50 ${isCollapsed ? 'hidden' : ''}`}>
                {/* User Info */}
                {user && (
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-700">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 font-medium truncate">
                                {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-red-600/20 border border-gray-700 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-lg text-sm font-medium transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sair do Sistema
                </button>

                {/* Version Info */}
                <div className="text-center text-xs text-gray-600 mt-3">
                    <p>PsicoHub v2.0</p>
                </div>
            </div>

            {/* Inactivate Dialog */}
            <InactivatePatientDialog
                isOpen={showInactivateDialog}
                patientName={currentPatient?.name || ''}
                onClose={() => setShowInactivateDialog(false)}
                onConfirm={handleInactivate}
            />

            {/* Schedule Dialog */}
            <EditScheduleDialog
                isOpen={showScheduleDialog}
                patientName={currentPatient?.name || ''}
                currentSchedule={currentPatient?.schedule}
                onClose={() => setShowScheduleDialog(false)}
                onSave={handleSaveSchedule}
            />

            {/* Billing Dialog */}
            <EditBillingDialog
                isOpen={showBillingDialog}
                patientName={currentPatient?.name || ''}
                currentBilling={currentPatient?.billing}
                onClose={() => setShowBillingDialog(false)}
                onSave={handleSaveBilling}
            />
        </div>
    );
};

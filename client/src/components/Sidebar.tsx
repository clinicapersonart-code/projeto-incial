import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
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
    ChevronRight
} from 'lucide-react';

type TabType = 'dashboard' | 'soap' | 'network' | 'plan' | 'forms' | 'anamnesis' | 'formulation' | 'curation' | 'evolution' | 'alchemy' | 'copilot' | 'eells';

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
    const { currentPatient, clearCurrentPatient } = usePatients();
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['formulation', 'sessions', 'evolution']);

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
                { id: 'plan', label: 'Intervenções', icon: Sparkles }
            ]
        },
        {
            id: 'sessions',
            label: 'Sessões',
            icon: FileText,
            items: [
                { id: 'copilot', label: 'Co-Piloto', icon: Zap },
                { id: 'soap', label: 'Sessão Atual', icon: FileText },
                { id: 'curation', label: 'Prontuário', icon: BookOpen }
            ]
        },
        {
            id: 'evolution',
            label: 'Evolução',
            icon: TrendingUp,
            items: [
                { id: 'evolution', label: 'Progresso', icon: TrendingUp },
                { id: 'forms', label: 'Monitoramento', icon: ClipboardList },
                { id: 'alchemy', label: 'Recursos', icon: Sparkles }
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

            {/* Patient Header */}
            <div className={`p-6 border-b border-gray-800 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 ${isCollapsed ? 'px-2' : ''}`}>
                <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <h2 className="text-white font-bold text-lg truncate">{currentPatient?.name}</h2>
                            <p className="text-gray-400 text-xs text-nowrap">EM ATENDIMENTO</p>
                        </div>
                    )}
                </div>
                {!isCollapsed && (
                    <button
                        onClick={clearCurrentPatient}
                        className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair do Paciente
                    </button>
                )}
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

            {/* Footer */}
            <div className={`p-4 border-t border-gray-800 bg-gray-900/50 ${isCollapsed ? 'hidden' : ''}`}>
                <div className="text-center text-xs text-gray-500">
                    <p className="font-semibold text-gray-400">Supervisor PBE IA</p>
                    <p className="mt-1">v2.0 • Modelo Eells</p>
                </div>
            </div>
        </div>
    );
};

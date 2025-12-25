import React, { useState, useMemo } from 'react';
import {
    Search,
    Star,
    Filter,
    ClipboardList,
    Clock,
    FileText,
    CheckCircle2,
    Sparkles,
    ChevronDown,
    X,
    ExternalLink,
    Play,
    BookOpen,
    Loader2,
    Target,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import {
    INSTRUMENTS_LIBRARY,
    Instrument,
    InstrumentCategory,
    InstrumentTag,
    getAllTags,
    getAllCategories
} from '../data/instruments';
import { recommendInstruments } from '../lib/gemini';

interface InstrumentRecommendation {
    instrumentId: string;
    instrumentName: string;
    relevanceScore: number;
    rationale: string;
    priority: 'alta' | 'média' | 'baixa';
    category: 'monitoramento' | 'avaliação_inicial' | 'processo' | 'desfecho';
}

interface RecommendationResult {
    recommendations: InstrumentRecommendation[];
    summary: string;
    focusAreas: string[];
}

interface InstrumentsLibraryProps {
    onSelectInstrument?: (instrument: Instrument) => void;
    onNavigateToMonitoring?: () => void;
    currentPatient?: any;
}

export const InstrumentsLibrary: React.FC<InstrumentsLibraryProps> = ({
    onSelectInstrument,
    onNavigateToMonitoring,
    currentPatient
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<InstrumentTag[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<InstrumentCategory | ''>('');
    const [showTagsDropdown, setShowTagsDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);

    // AI Recommendation states
    const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
    const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [recommendationError, setRecommendationError] = useState<string | null>(null);

    const allTags = useMemo(() => getAllTags(), []);
    const allCategories = useMemo(() => getAllCategories(), []);

    // Handle AI Recommendation
    const handleFindIdealInstrument = async () => {
        if (!currentPatient) {
            setRecommendationError('Nenhum paciente selecionado. Acesse a biblioteca através do prontuário de um paciente.');
            setShowRecommendationsModal(true);
            return;
        }

        setLoadingRecommendations(true);
        setRecommendationError(null);
        setShowRecommendationsModal(true);

        try {
            // Prepare patient data
            const patientData = {
                anamnesis: currentPatient.clinicalRecords?.anamnesis?.content || '',
                diagnosis: currentPatient.primaryDisorder || '',
                caseFormulation: currentPatient.clinicalRecords?.caseFormulation?.eells || currentPatient.clinicalRecords?.caseFormulation?.content || '',
                pbtNetwork: currentPatient.clinicalRecords?.sessions?.[0]?.pbtNetwork || currentPatient.eellsData?.pbt || null,
                eellsData: currentPatient.eellsData || null,
                currentAssessments: currentPatient.clinicalRecords?.assessments || []
            };

            // Prepare instruments library for AI
            const instrumentsForAI = INSTRUMENTS_LIBRARY.map(i => ({
                id: i.id,
                name: i.name,
                abbreviation: i.abbreviation,
                description: i.description,
                tags: i.tags as string[],
                category: i.category
            }));

            const result = await recommendInstruments(patientData, instrumentsForAI);
            setRecommendations(result);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            setRecommendationError('Erro ao gerar recomendações. Verifique se há dados suficientes do paciente (anamnese, formulação, rede PBT).');
        } finally {
            setLoadingRecommendations(false);
        }
    };

    // Filter instruments
    const filteredInstruments = useMemo(() => {
        let result = [...INSTRUMENTS_LIBRARY];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(i =>
                i.name.toLowerCase().includes(query) ||
                i.abbreviation.toLowerCase().includes(query) ||
                i.description.toLowerCase().includes(query) ||
                i.tags.some(t => t.toLowerCase().includes(query))
            );
        }

        // Tag filter
        if (selectedTags.length > 0) {
            result = result.filter(i =>
                selectedTags.some(tag => i.tags.includes(tag))
            );
        }

        // Category filter
        if (selectedCategory) {
            result = result.filter(i => i.category === selectedCategory);
        }

        // Favorites filter
        if (showOnlyFavorites) {
            result = result.filter(i => favorites.includes(i.id));
        }

        return result;
    }, [searchQuery, selectedTags, selectedCategory, showOnlyFavorites, favorites]);

    const toggleFavorite = (id: string) => {
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const toggleTag = (tag: InstrumentTag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const getCategoryColor = (category: InstrumentCategory) => {
        switch (category) {
            case 'Escala Padronizada':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Automonitoramento':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'Entrevista/Anamnese':
                return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Avaliação do Clínico':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getTagColor = (tag: InstrumentTag) => {
        const colors: Record<string, string> = {
            'Ansiedade': 'bg-red-500/20 text-red-300',
            'Depressão': 'bg-indigo-500/20 text-indigo-300',
            'Transdiagnóstico': 'bg-violet-500/20 text-violet-300',
            'Pânico': 'bg-orange-500/20 text-orange-300',
            'Trauma': 'bg-rose-500/20 text-rose-300',
            'Monitoramento de Progresso': 'bg-cyan-500/20 text-cyan-300',
            'Dependência': 'bg-amber-500/20 text-amber-300',
            'Mindfulness': 'bg-teal-500/20 text-teal-300',
            'Aceitação': 'bg-green-500/20 text-green-300',
            'Regulação Emocional': 'bg-pink-500/20 text-pink-300',
            'Formulação': 'bg-blue-500/20 text-blue-300',
        };
        return colors[tag] || 'bg-slate-500/20 text-slate-300';
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-900/30 to-purple-900/30">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Biblioteca de Instrumentos para Monitoramento</h1>
                            <p className="text-slate-400 text-sm">{INSTRUMENTS_LIBRARY.length} instrumentos disponíveis</p>
                        </div>
                    </div>
                    <button
                        onClick={handleFindIdealInstrument}
                        disabled={loadingRecommendations}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50"
                    >
                        {loadingRecommendations ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        Encontrar instrumento ideal
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Favorites Toggle */}
                    <button
                        onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                        className={`p-2.5 rounded-xl border transition-all ${showOnlyFavorites
                            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                    >
                        <Star className={`w-5 h-5 ${showOnlyFavorites ? 'fill-yellow-400' : ''}`} />
                    </button>

                    {/* Search */}
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar instrumentos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>

                    {/* Tags Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowTagsDropdown(!showTagsDropdown);
                                setShowCategoryDropdown(false);
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${selectedTags.length > 0
                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filtrar por tags</span>
                            {selectedTags.length > 0 && (
                                <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {selectedTags.length}
                                </span>
                            )}
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {showTagsDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 p-2">
                                <div className="flex flex-wrap gap-1.5">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedTags.includes(tag)
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowCategoryDropdown(!showCategoryDropdown);
                                setShowTagsDropdown(false);
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${selectedCategory
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            <ClipboardList className="w-4 h-4" />
                            <span>{selectedCategory || 'Filtrar por categoria'}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {showCategoryDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 p-2">
                                <button
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setShowCategoryDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                                >
                                    Todas as categorias
                                </button>
                                {allCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setSelectedCategory(cat);
                                            setShowCategoryDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Clear Filters */}
                    {(selectedTags.length > 0 || selectedCategory || searchQuery) && (
                        <button
                            onClick={() => {
                                setSelectedTags([]);
                                setSelectedCategory('');
                                setSearchQuery('');
                            }}
                            className="flex items-center gap-1 px-3 py-2.5 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {/* Instruments Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-slate-900/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-1 text-center">Favorito</div>
                        <div className="col-span-5">Instrumento</div>
                        <div className="col-span-3">Tags</div>
                        <div className="col-span-3">Categoria</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-white/5">
                        {filteredInstruments.map((instrument) => (
                            <div
                                key={instrument.id}
                                className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => setSelectedInstrument(instrument)}
                            >
                                {/* Favorite */}
                                <div className="col-span-1 flex items-center justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(instrument.id);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <Star
                                            className={`w-5 h-5 transition-colors ${favorites.includes(instrument.id)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-slate-500 group-hover:text-slate-400'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Instrument Info */}
                                <div className="col-span-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                            {instrument.name} ({instrument.abbreviation})
                                        </h3>
                                        {instrument.isNew && (
                                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                                                Novo
                                            </span>
                                        )}
                                        {instrument.hasForm && (
                                            <span title="Formulário disponível">
                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-2">{instrument.description}</p>
                                </div>

                                {/* Tags */}
                                <div className="col-span-3 flex flex-wrap gap-1 items-start">
                                    {instrument.tags.slice(0, 3).map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getTagColor(tag)}`}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {instrument.tags.length > 3 && (
                                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-400">
                                            +{instrument.tags.length - 3}
                                        </span>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="col-span-3 flex items-center">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getCategoryColor(instrument.category)}`}>
                                        {instrument.category}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredInstruments.length === 0 && (
                        <div className="p-12 text-center">
                            <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-400 mb-2">Nenhum instrumento encontrado</h3>
                            <p className="text-slate-500">Tente ajustar os filtros ou a busca</p>
                        </div>
                    )}
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-slate-500 flex items-center justify-between">
                    <span>Mostrando {filteredInstruments.length} de {INSTRUMENTS_LIBRARY.length} instrumentos</span>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            {INSTRUMENTS_LIBRARY.filter(i => i.hasForm).length} com formulário
                        </span>
                    </div>
                </div>
            </div>

            {/* Instrument Detail Modal */}
            {selectedInstrument && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getCategoryColor(selectedInstrument.category)}`}>
                                            {selectedInstrument.category}
                                        </span>
                                        {selectedInstrument.isNew && (
                                            <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                                                Novo
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">{selectedInstrument.abbreviation}</h2>
                                    <p className="text-indigo-100">{selectedInstrument.name}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedInstrument(null)}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição</h3>
                                <p className="text-slate-200">{selectedInstrument.description}</p>
                            </div>

                            {/* Quick Info */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                        <FileText className="w-4 h-4" />
                                        Questões
                                    </div>
                                    <p className="text-xl font-bold text-white">
                                        {selectedInstrument.questionCount > 0 ? selectedInstrument.questionCount : 'Variável'}
                                    </p>
                                </div>
                                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                        <Clock className="w-4 h-4" />
                                        Tempo
                                    </div>
                                    <p className="text-xl font-bold text-white">{selectedInstrument.estimatedMinutes} min</p>
                                </div>
                                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                        <ClipboardList className="w-4 h-4" />
                                        Frequência
                                    </div>
                                    <p className="text-xl font-bold text-white">{selectedInstrument.frequency}</p>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedInstrument.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getTagColor(tag)}`}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            {selectedInstrument.hasForm ? (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                                        <div>
                                            <h4 className="font-semibold text-green-300">Formulário disponível</h4>
                                            <p className="text-sm text-green-400/80">Este instrumento pode ser aplicado diretamente no sistema</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <ExternalLink className="w-6 h-6 text-amber-400" />
                                        <div>
                                            <h4 className="font-semibold text-amber-300">Formulário em implementação</h4>
                                            <p className="text-sm text-amber-400/80">Use a versão em papel ou PDF por enquanto</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                <button
                                    onClick={() => {
                                        toggleFavorite(selectedInstrument.id);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${favorites.includes(selectedInstrument.id)
                                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                        }`}
                                >
                                    <Star className={`w-5 h-5 ${favorites.includes(selectedInstrument.id) ? 'fill-yellow-400' : ''}`} />
                                    {favorites.includes(selectedInstrument.id) ? 'Favoritado' : 'Favoritar'}
                                </button>

                                {selectedInstrument.hasForm && (
                                    <button
                                        onClick={() => {
                                            if (onSelectInstrument) {
                                                onSelectInstrument(selectedInstrument);
                                            }
                                            setSelectedInstrument(null);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                                    >
                                        <Play className="w-5 h-5" />
                                        Aplicar Instrumento
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Recommendations Modal */}
            {showRecommendationsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Instrumentos Recomendados</h2>
                                        <p className="text-purple-100">Baseado na anamnese, formulação e rede PBT</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowRecommendationsModal(false);
                                        setRecommendations(null);
                                        setRecommendationError(null);
                                    }}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Loading State */}
                            {loadingRecommendations && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                                    <p className="text-slate-300 text-lg">Analisando dados do paciente...</p>
                                    <p className="text-slate-500 text-sm">Gerando recomendações personalizadas</p>
                                </div>
                            )}

                            {/* Error State */}
                            {recommendationError && !loadingRecommendations && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-6 h-6 text-red-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-red-300 mb-1">Erro ao gerar recomendações</h4>
                                            <p className="text-red-400/80 text-sm">{recommendationError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {recommendations && !loadingRecommendations && (
                                <>
                                    {/* Summary */}
                                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">Resumo da Análise</h3>
                                        <p className="text-slate-200">{recommendations.summary}</p>
                                    </div>

                                    {/* Focus Areas */}
                                    {recommendations.focusAreas.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Áreas de Foco</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {recommendations.focusAreas.map((area, idx) => (
                                                    <span key={idx} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium">
                                                        {area}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommendations List */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Instrumentos Recomendados</h3>
                                        <div className="space-y-3">
                                            {recommendations.recommendations.map((rec, idx) => {
                                                const instrument = INSTRUMENTS_LIBRARY.find(i => i.id === rec.instrumentId);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="bg-slate-900/50 border border-white/5 rounded-xl p-4 hover:border-indigo-500/30 transition-colors cursor-pointer"
                                                        onClick={() => {
                                                            if (instrument) {
                                                                setSelectedInstrument(instrument);
                                                                setShowRecommendationsModal(false);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-white">{rec.instrumentName}</h4>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${rec.priority === 'alta' ? 'bg-red-500/20 text-red-300' :
                                                                        rec.priority === 'média' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                            'bg-green-500/20 text-green-300'
                                                                    }`}>
                                                                    {rec.priority}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Target className="w-4 h-4 text-indigo-400" />
                                                                <span className="text-indigo-300 font-bold">{rec.relevanceScore}/10</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-400 text-sm mb-2">{rec.rationale}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${rec.category === 'monitoramento' ? 'bg-cyan-500/20 text-cyan-300' :
                                                                    rec.category === 'avaliação_inicial' ? 'bg-blue-500/20 text-blue-300' :
                                                                        rec.category === 'processo' ? 'bg-purple-500/20 text-purple-300' :
                                                                            'bg-emerald-500/20 text-emerald-300'
                                                                }`}>
                                                                {rec.category.replace('_', ' ')}
                                                            </span>
                                                            {instrument?.hasForm && (
                                                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Formulário disponível
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

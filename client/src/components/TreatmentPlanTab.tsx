import React, { useState, useCallback } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    Sparkles,
    BookOpen,
    FileText,
    Target,
    Clock,
    Loader2,
    Upload,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    RefreshCw,
    Save,
    Edit3,
    Trash2
} from 'lucide-react';

interface TreatmentPhase {
    name: string;
    sessions: string;
    objectives: string[];
    interventions: string[];
    techniques: string[];
}

interface TreatmentPlan {
    id: string;
    createdAt: string;
    updatedAt: string;
    protocol: string;
    totalSessions: string;
    frequency: string;
    phases: TreatmentPhase[];
    dischargeCriteria: string[];
    notes: string;
}

interface Suggestion {
    type: 'guideline' | 'protocol' | 'gap' | 'approach';
    title: string;
    description: string;
    source?: string;
    selected?: boolean;
}

interface UploadedGuideline {
    id: string;
    name: string;
    content: string; // Base64 or text extracted
    type: 'pdf' | 'image';
}

export const TreatmentPlanTab: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();

    // State
    const [phase, setPhase] = useState<'suggestions' | 'generating' | 'review' | 'editing'>('suggestions');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [currentPlan, setCurrentPlan] = useState<TreatmentPlan | null>(null);
    const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0, 1, 2]));
    const [uploadedGuidelines, setUploadedGuidelines] = useState<UploadedGuideline[]>([]);
    const [customFocus, setCustomFocus] = useState('');
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [selectedLibraryProtocol, setSelectedLibraryProtocol] = useState('');

    // Available protocols in /library folder
    const libraryProtocols = [
        { name: 'Terapia Baseada em Processos (CORE)', file: 'core/Aprendendo a terapia baseada em processos_pesquisavel.pdf' },
        { name: 'Protocolo Unificado (Barlow)', file: 'AplicandoaTerapiaComportamentalDialéticaKellyKoerner.pdf' },
        { name: 'ACT - Terapia de Aceitação e Compromisso', file: 'ACT_Terapia_de_aceitação_e_compromisso_2°_edição_Hayes.pdf' },
        { name: 'DBT - Terapia Dialética Comportamental', file: 'Terapia_comportamental_dialética_na_prática_clínica_aplicações.pdf' },
        { name: 'Prática Baseada em Evidências (Fundamentos)', file: 'Prática_baseada_em_evidências_em_psicologia_clínica_fundamentos.pdf' },
        { name: 'Formulação de Caso (Eells)', file: 'Psychotherapy Case Formulation - Tracy Eells.pdf' },
    ];

    // File input ref
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Handle file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingFile(true);

        for (const file of Array.from(files)) {
            try {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const newGuideline: UploadedGuideline = {
                        id: crypto.randomUUID(),
                        name: file.name,
                        content: e.target?.result as string,
                        type: file.type.includes('pdf') ? 'pdf' : 'image'
                    };

                    setUploadedGuidelines(prev => [...prev, newGuideline]);
                };

                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        setIsUploadingFile(false);
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Remove uploaded guideline
    const removeGuideline = (id: string) => {
        setUploadedGuidelines(prev => prev.filter(g => g.id !== id));
    };

    // Check if patient has enough data
    const hasAnamnesis = !!currentPatient?.clinicalRecords?.anamnesis?.content;
    const hasFormulation = !!currentPatient?.eellsData || !!currentPatient?.clinicalRecords?.caseFormulation?.content;
    const hasPBTNetwork = !!currentPatient?.clinicalRecords?.caseFormulation?.pbtData?.nodes?.length;

    // Generate suggestions
    const handleGenerateSuggestions = async () => {
        setIsLoading(true);
        try {
            const { generateTreatmentSuggestions } = await import('../lib/gemini');

            const patientData = {
                anamnesis: currentPatient?.clinicalRecords?.anamnesis?.content || '',
                formulation: currentPatient?.eellsData || currentPatient?.clinicalRecords?.caseFormulation?.eells || {},
                pbtNetwork: currentPatient?.clinicalRecords?.caseFormulation?.pbtData || { nodes: [], edges: [] },
                diagnosis: currentPatient?.primaryDisorder || '',
                comorbidities: currentPatient?.comorbidities || []
            };

            const result = await generateTreatmentSuggestions(patientData);

            setSuggestions(result.suggestions || []);
        } catch (error) {
            console.error('Error generating suggestions:', error);
            // Mock suggestions for demo
            setSuggestions([
                { type: 'guideline', title: 'NICE Guideline CG113', description: 'Generalised Anxiety Disorder and Panic Disorder in Adults', source: 'NICE UK', selected: true },
                { type: 'protocol', title: 'Protocolo Unificado (Barlow)', description: 'Tratamento transdiagnóstico para transtornos emocionais - 12-16 sessões', selected: false },
                { type: 'protocol', title: 'TCC para TAG (Dugas)', description: 'Intervenção focada em intolerância à incerteza - 16 sessões', selected: false },
                { type: 'gap', title: 'Histórico de Trauma', description: 'A anamnese não menciona avaliação de experiências traumáticas. Considere investigar.', selected: false }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Generate full plan
    const handleGeneratePlan = async () => {
        setPhase('generating');
        setIsLoading(true);

        try {
            const { generateTreatmentPlan, generatePlanFromMaterial } = await import('../lib/gemini');

            // Collect patient context text
            const textContext = `
                Paciente: ${currentPatient?.name}
                Diagnóstico: ${currentPatient?.primaryDisorder}
                Anamnese: ${currentPatient?.clinicalRecords?.anamnesis?.content || 'N/A'}
                Conceituação Eells: ${JSON.stringify(currentPatient?.eellsData || {})}
                Foco do Terapeuta: ${customFocus}
            `;

            let result;

            // Priority: Uploaded Files > Library Protocol > Selected Suggestions
            if (uploadedGuidelines.length > 0) {
                // Use the first uploaded file
                const fileToUse = uploadedGuidelines[0];
                result = await generatePlanFromMaterial(
                    textContext,
                    { type: 'upload', info: fileToUse.content }
                );
            } else if (selectedLibraryProtocol) {
                // Use selected library protocol
                result = await generatePlanFromMaterial(
                    textContext,
                    { type: 'library', info: selectedLibraryProtocol }
                );
            } else {
                // Standard generation from selected suggestions
                const selectedSuggestions = suggestions.filter(s => s.selected);

                const patientData = {
                    anamnesis: currentPatient?.clinicalRecords?.anamnesis?.content || '',
                    formulation: currentPatient?.eellsData || {},
                    pbtNetwork: currentPatient?.clinicalRecords?.caseFormulation?.pbtData || { nodes: [], edges: [] },
                    selectedProtocols: selectedSuggestions.map(s => s.title),
                    customFocus
                };

                result = await generateTreatmentPlan(patientData);
            }

            const protocolName = uploadedGuidelines.length > 0
                ? uploadedGuidelines[0].name
                : (suggestions.find(s => s.selected)?.title || 'Personalizado');

            const plan: TreatmentPlan = {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                protocol: result.protocol || protocolName,
                totalSessions: result.totalSessions || '12-16',
                frequency: result.frequency || 'Semanal',
                phases: result.phases || [],
                dischargeCriteria: result.dischargeCriteria || [],
                notes: ''
            };

            setCurrentPlan(plan);
            setPhase('review');
        } catch (error) {
            console.error('Error generating plan:', error);
            // Mock plan for demo
            setCurrentPlan({
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                protocol: 'Protocolo Unificado (Barlow)',
                totalSessions: '12-16',
                frequency: 'Semanal',
                phases: [
                    {
                        name: 'Fase Inicial',
                        sessions: '1-4',
                        objectives: ['Estabelecer aliança terapêutica', 'Psicoeducação sobre emoções', 'Monitoramento emocional'],
                        interventions: ['Entrevista motivacional', 'Psicoeducação transdiagnóstica'],
                        techniques: ['Registro de emoções', 'Escala SUDS', 'Modelo cognitivo-comportamental']
                    },
                    {
                        name: 'Fase Intermediária',
                        sessions: '5-12',
                        objectives: ['Reavaliação cognitiva', 'Exposição gradual', 'Regulação emocional'],
                        interventions: ['Reestruturação cognitiva', 'Exposição interoceptiva', 'Prevenção de comportamentos de segurança'],
                        techniques: ['Registro de pensamentos', 'Hierarquia de exposição', 'Técnicas de tolerância ao desconforto']
                    },
                    {
                        name: 'Fase Final',
                        sessions: '13-16',
                        objectives: ['Consolidar ganhos', 'Prevenir recaídas', 'Plano de manutenção'],
                        interventions: ['Revisão de progresso', 'Identificação de gatilhos futuros'],
                        techniques: ['Plano de prevenção de recaída', 'Sessões de reforço espaçadas']
                    }
                ],
                dischargeCriteria: [
                    'Redução de 50% nos sintomas (GAD-7 < 10)',
                    'Capacidade de aplicar técnicas autonomamente',
                    'Retorno ao funcionamento pré-mórbido'
                ],
                notes: ''
            });
            setPhase('review');
        } finally {
            setIsLoading(false);
        }
    };

    // Save plan
    const handleSavePlan = () => {
        if (!currentPlan || !currentPatient) return;

        updatePatient({
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                treatmentPlan: {
                    ...currentPatient.clinicalRecords.treatmentPlan,
                    goals: currentPlan.phases.flatMap(p => p.objectives),
                    updatedAt: new Date().toISOString(),
                    // Store full plan
                    fullPlan: currentPlan as any
                }
            }
        });

        alert('Plano de Tratamento salvo com sucesso!');
    };

    // Toggle suggestion selection
    const toggleSuggestion = (index: number) => {
        setSuggestions(prev => prev.map((s, i) =>
            i === index ? { ...s, selected: !s.selected } : s
        ));
    };

    // Toggle phase expansion
    const togglePhase = (index: number) => {
        const newExpanded = new Set(expandedPhases);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedPhases(newExpanded);
    };

    // Render suggestion phase
    const renderSuggestions = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Data Check */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Dados do Paciente
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className={`flex items-center gap-2 ${hasAnamnesis ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {hasAnamnesis ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        Anamnese {hasAnamnesis ? '✓' : '(pendente)'}
                    </div>
                    <div className={`flex items-center gap-2 ${hasFormulation ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {hasFormulation ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        Conceituação {hasFormulation ? '✓' : '(pendente)'}
                    </div>
                    <div className={`flex items-center gap-2 ${hasPBTNetwork ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {hasPBTNetwork ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        Rede PBT {hasPBTNetwork ? '✓' : '(pendente)'}
                    </div>
                </div>
            </div>

            {/* Upload Guidelines Section */}
            <div className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-colors">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-600" />
                    Carregar Guidelines/Protocolos (opcional)
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                    Faça upload de PDFs ou imagens de guidelines que você quer que a IA considere.
                </p>

                {/* Upload Button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                    className="w-full py-3 border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    {isUploadingFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {isUploadingFile ? 'Carregando...' : 'Selecionar Arquivos'}
                </button>

                {/* Uploaded Files List */}
                {uploadedGuidelines.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {uploadedGuidelines.map((guideline) => (
                            <div
                                key={guideline.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm text-gray-700 truncate max-w-[200px]">
                                        {guideline.name}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${guideline.type === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {guideline.type.toUpperCase()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeGuideline(guideline.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Library Protocol Dropdown */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Selecionar da Biblioteca
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                    Escolha um protocolo ou livro da sua biblioteca para basear o plano.
                </p>
                <select
                    value={selectedLibraryProtocol}
                    onChange={(e) => setSelectedLibraryProtocol(e.target.value)}
                    className="w-full p-3 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                    <option value="">-- Nenhum selecionado --</option>
                    {libraryProtocols.map((protocol) => (
                        <option key={protocol.file} value={protocol.file}>
                            📚 {protocol.name}
                        </option>
                    ))}
                </select>
                {selectedLibraryProtocol && (
                    <p className="mt-2 text-xs text-purple-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Protocolo selecionado: {libraryProtocols.find(p => p.file === selectedLibraryProtocol)?.name}
                    </p>
                )}
            </div>

            {/* Generate Suggestions Button */}
            {suggestions.length === 0 && (
                <div className="text-center py-8">
                    <Sparkles className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Gerar Sugestões de Tratamento</h3>
                    <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
                        A IA vai analisar o caso{uploadedGuidelines.length > 0 ? ` e os ${uploadedGuidelines.length} arquivo(s) carregado(s)` : ''} para sugerir guidelines e protocolos.
                    </p>
                    <button
                        onClick={handleGenerateSuggestions}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {isLoading ? 'Analisando...' : 'Analisar Caso'}
                    </button>

                    {/* Direct generation option when library/upload is selected */}
                    {(selectedLibraryProtocol || uploadedGuidelines.length > 0) && (
                        <div className="mt-4">
                            <p className="text-gray-400 text-xs text-center mb-2">— ou —</p>
                            <button
                                onClick={handleGeneratePlan}
                                disabled={isLoading}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                                Gerar Plano do{' '}
                                {selectedLibraryProtocol ? 'Protocolo' : 'Arquivo'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Suggestions List */}
            {suggestions.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        Sugestões da IA (Selecione as relevantes)
                    </h3>

                    <div className="grid gap-3">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                onClick={() => toggleSuggestion(index)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${suggestion.selected
                                    ? 'border-indigo-400 bg-indigo-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${suggestion.selected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                                        }`}>
                                        {suggestion.selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${suggestion.type === 'guideline' ? 'bg-blue-100 text-blue-700' :
                                                suggestion.type === 'protocol' ? 'bg-purple-100 text-purple-700' :
                                                    suggestion.type === 'gap' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                {suggestion.type === 'guideline' ? '📚 Guideline' :
                                                    suggestion.type === 'protocol' ? '🧪 Protocolo' :
                                                        suggestion.type === 'gap' ? '🔍 Lacuna' :
                                                            '💡 Abordagem'}
                                            </span>
                                            <h4 className="font-bold text-gray-800">{suggestion.title}</h4>
                                        </div>
                                        <p className="text-sm text-gray-600">{suggestion.description}</p>
                                        {suggestion.source && (
                                            <p className="text-xs text-gray-400 mt-1">Fonte: {suggestion.source}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Custom Focus */}
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Foco Adicional (opcional)
                        </label>
                        <textarea
                            value={customFocus}
                            onChange={(e) => setCustomFocus(e.target.value)}
                            placeholder="Ex: Priorizar técnicas de exposição, focar em regulação emocional..."
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            rows={2}
                        />
                    </div>

                    {/* Generate Plan Button */}
                    <button
                        onClick={handleGeneratePlan}
                        disabled={!suggestions.some(s => s.selected) || isLoading}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <FileText className="w-5 h-5" />
                        Gerar Plano de Tratamento
                    </button>
                </div>
            )}
        </div>
    );

    // Render generating phase
    const renderGenerating = () => (
        <div className="flex flex-col items-center justify-center py-16 animate-in fade-in">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Gerando Plano de Tratamento</h3>
            <p className="text-gray-500 text-sm text-center max-w-md">
                A IA está integrando os dados do paciente com os protocolos selecionados para criar um plano personalizado...
            </p>
        </div>
    );

    // Render review phase
    const renderReview = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Plan Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        {currentPlan?.protocol}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPhase('suggestions')}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Regenerar
                        </button>
                        <button
                            onClick={handleSavePlan}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-1"
                        >
                            <Save className="w-4 h-4" />
                            Salvar
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Duração Total:</span>
                        <p className="font-semibold text-gray-800">{currentPlan?.totalSessions} sessões</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Frequência:</span>
                        <p className="font-semibold text-gray-800">{currentPlan?.frequency}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Fases:</span>
                        <p className="font-semibold text-gray-800">{currentPlan?.phases.length} fases</p>
                    </div>
                </div>
            </div>

            {/* Treatment Phases */}
            <div className="space-y-4">
                {currentPlan?.phases.map((phase, index) => (
                    <div key={index} className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden">
                        <button
                            onClick={() => togglePhase(index)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-blue-500' :
                                    index === 1 ? 'bg-purple-500' :
                                        'bg-emerald-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-gray-800">{phase.name}</h4>
                                    <p className="text-sm text-gray-500">Sessões {phase.sessions}</p>
                                </div>
                            </div>
                            {expandedPhases.has(index) ?
                                <ChevronDown className="w-5 h-5 text-gray-400" /> :
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            }
                        </button>

                        {expandedPhases.has(index) && (
                            <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2">
                                {/* Objectives */}
                                <div>
                                    <h5 className="text-xs font-bold text-indigo-600 uppercase mb-2">🎯 Objetivos</h5>
                                    <ul className="space-y-1">
                                        {phase.objectives.map((obj, i) => (
                                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-indigo-500 mt-1">•</span>
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Interventions */}
                                <div>
                                    <h5 className="text-xs font-bold text-purple-600 uppercase mb-2">💡 Intervenções</h5>
                                    <ul className="space-y-1">
                                        {phase.interventions.map((int, i) => (
                                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-purple-500 mt-1">•</span>
                                                {int}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Techniques */}
                                <div>
                                    <h5 className="text-xs font-bold text-emerald-600 uppercase mb-2">🛠️ Técnicas</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {phase.techniques.map((tech, i) => (
                                            <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-200">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Discharge Criteria */}
            {currentPlan?.dischargeCriteria && currentPlan.dischargeCriteria.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-amber-600" />
                        Critérios de Alta
                    </h3>
                    <ul className="space-y-2">
                        {currentPlan.dischargeCriteria.map((criteria, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-amber-500 mt-1">✓</span>
                                {criteria}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-indigo-600" />
                        Plano de Tratamento (PBE)
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Gere planos personalizados baseados em evidências
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className={`px-3 py-1 rounded-full font-medium ${phase === 'suggestions' ? 'bg-indigo-100 text-indigo-700' :
                        phase === 'generating' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                        }`}>
                        {phase === 'suggestions' ? '1. Sugestões' :
                            phase === 'generating' ? '2. Gerando...' :
                                '3. Revisão'}
                    </span>
                </div>
            </div>

            {/* Content based on phase */}
            {phase === 'suggestions' && renderSuggestions()}
            {phase === 'generating' && renderGenerating()}
            {(phase === 'review' || phase === 'editing') && renderReview()}
        </div>
    );
};

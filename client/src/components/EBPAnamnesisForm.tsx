import React, { useState, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import { Save, FileText, Loader2, Cloud, CloudOff, BrainCircuit, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { generatePBTNodesFromAnamnesis } from '../lib/gemini';
import { useNavigation } from '../context/NavigationContext';

// EBP Questions organized by Dimension and Mechanism
const EBP_DIMENSIONS = [
    {
        id: 'atencao',
        title: 'Atenção',
        color: 'from-blue-500 to-cyan-500',
        questions: [
            { id: 1, mechanism: 'Variação', text: 'Para onde sua atenção vai automaticamente quando você está na sua luta interna?' },
            { id: 2, mechanism: 'Variação', text: 'O que fica difícil de perceber nesse momento?' },
            { id: 3, mechanism: 'Variação', text: 'Sua atenção fica rígida, presa no passado, futuro ou ameaça?' },
            { id: 4, mechanism: 'Seleção', text: 'O que essa forma de prestar atenção faz por você?' },
            { id: 5, mechanism: 'Seleção', text: 'Ela ajuda a evitar dor, ameaça, vergonha ou risco?' },
            { id: 6, mechanism: 'Seleção', text: 'Quando sua atenção fica mais flexível, o que isso permite?' },
            { id: 7, mechanism: 'Retenção', text: 'O que faz a atenção rígida continuar voltando?' },
            { id: 8, mechanism: 'Retenção', text: 'O que impede um foco mais saudável de durar?' },
            { id: 9, mechanism: 'Retenção', text: 'Que emoções, pensamentos ou situações puxam você para o padrão antigo?' }
        ]
    },
    {
        id: 'cognicao',
        title: 'Cognição',
        color: 'from-purple-500 to-indigo-500',
        questions: [
            { id: 10, mechanism: 'Variação', text: 'Quais pensamentos dominam quando você está mal?' },
            { id: 11, mechanism: 'Variação', text: 'Há pensamentos tomados como verdades absolutas?' },
            { id: 12, mechanism: 'Variação', text: 'Há pensamentos úteis que não aparecem?' },
            { id: 13, mechanism: 'Seleção', text: 'O que esses pensamentos fazem por você?' },
            { id: 14, mechanism: 'Seleção', text: 'Eles ajudam a controlar, prever, evitar ou entender algo?' },
            { id: 15, mechanism: 'Seleção', text: 'Quando surgem pensamentos flexíveis, o que eles permitem?' },
            { id: 16, mechanism: 'Retenção', text: 'O que mantém pensamentos repetitivos vivos?' },
            { id: 17, mechanism: 'Retenção', text: 'O que impede pensamentos adaptativos de permanecerem?' },
            { id: 18, mechanism: 'Retenção', text: 'Emoções, contextos ou hábitos cognitivos puxam você ao padrão antigo?' }
        ]
    },
    {
        id: 'self',
        title: 'Self',
        color: 'from-amber-500 to-orange-500',
        questions: [
            { id: 19, mechanism: 'Variação', text: 'Que versão de você aparece quando está em dificuldade?' },
            { id: 20, mechanism: 'Variação', text: 'Há versões úteis de você que não aparecem?' },
            { id: 21, mechanism: 'Variação', text: 'Seu senso de si fica rígido ou repetitivo?' },
            { id: 22, mechanism: 'Seleção', text: 'O que esse "self problemático" está protegendo, evitando ou tentando garantir?' },
            { id: 23, mechanism: 'Seleção', text: 'Quando surge um self mais funcional, o que ele possibilita?' },
            { id: 24, mechanism: 'Retenção', text: 'O que mantém essa versão rígida predominando?' },
            { id: 25, mechanism: 'Retenção', text: 'O que impede um self saudável de permanecer?' },
            { id: 26, mechanism: 'Retenção', text: 'História, emoções ou contexto puxam você ao padrão antigo?' }
        ]
    },
    {
        id: 'afeto',
        title: 'Afeto',
        color: 'from-rose-500 to-pink-500',
        questions: [
            { id: 27, mechanism: 'Variação', text: 'Quais emoções dominam?' },
            { id: 28, mechanism: 'Variação', text: 'Como você tenta regular essas emoções?' },
            { id: 29, mechanism: 'Variação', text: 'Há emoções úteis que nunca aparecem?' },
            { id: 30, mechanism: 'Seleção', text: 'O que essas emoções estão sinalizando ou pedindo?' },
            { id: 31, mechanism: 'Seleção', text: 'Que função tem reagir dessa forma?' },
            { id: 32, mechanism: 'Seleção', text: 'Quando surge uma resposta emocional saudável, o que ela permite?' },
            { id: 33, mechanism: 'Retenção', text: 'O que mantém emoções intensas ou rígidas?' },
            { id: 34, mechanism: 'Retenção', text: 'O que impede boa regulação de durar?' },
            { id: 35, mechanism: 'Retenção', text: 'Que crenças, contextos ou hábitos emocionais te puxam ao padrão antigo?' }
        ]
    },
    {
        id: 'comportamento',
        title: 'Comportamento',
        color: 'from-emerald-500 to-green-500',
        questions: [
            { id: 36, mechanism: 'Variação', text: 'O que você faz quando está mal?' },
            { id: 37, mechanism: 'Variação', text: 'Há comportamentos úteis que não aparecem?' },
            { id: 38, mechanism: 'Variação', text: 'Suas ações ficam rígidas, repetitivas ou estreitas?' },
            { id: 39, mechanism: 'Seleção', text: 'O que esses comportamentos evitam, protegem, aliviam ou garantem?' },
            { id: 40, mechanism: 'Seleção', text: 'Quando você age de forma funcional, o que isso produz?' },
            { id: 41, mechanism: 'Retenção', text: 'O que mantém comportamentos problemáticos vivos?' },
            { id: 42, mechanism: 'Retenção', text: 'O que impede comportamentos saudáveis de continuar?' },
            { id: 43, mechanism: 'Retenção', text: 'Contingências, emoções ou pensamentos puxam você ao padrão antigo?' }
        ]
    },
    {
        id: 'motivacao',
        title: 'Motivação',
        color: 'from-yellow-500 to-amber-500',
        questions: [
            { id: 44, mechanism: 'Variação', text: 'O que te move ou te bloqueia quando está lidando com esse problema?' },
            { id: 45, mechanism: 'Variação', text: 'Há padrões motivacionais repetitivos?' },
            { id: 46, mechanism: 'Variação', text: 'Há motivações saudáveis que não aparecem?' },
            { id: 47, mechanism: 'Seleção', text: 'Para que serve essa motivação desadaptativa naquele momento?' },
            { id: 48, mechanism: 'Seleção', text: 'Quando sua motivação é funcional, o que ela permite?' },
            { id: 49, mechanism: 'Retenção', text: 'O que mantém padrões motivacionais problemáticos?' },
            { id: 50, mechanism: 'Retenção', text: 'O que impede motivação saudável de durar?' },
            { id: 51, mechanism: 'Retenção', text: 'Emoções, crenças, hábitos ou reforços te puxam ao padrão antigo?' }
        ]
    },
    {
        id: 'biofisiologico',
        title: 'Biofisiológico',
        color: 'from-red-500 to-rose-500',
        questions: [
            { id: 52, mechanism: 'Variação', text: 'Como estão sono, alimentação, energia, dores, rotina corporal?' },
            { id: 53, mechanism: 'Variação', text: 'Há hábitos saudáveis que não aparecem?' },
            { id: 54, mechanism: 'Seleção', text: 'O que esses hábitos fazem por você?' },
            { id: 55, mechanism: 'Seleção', text: 'Comportamentos saudáveis atendem a quais necessidades?' },
            { id: 56, mechanism: 'Retenção', text: 'O que mantém padrões corporais disfuncionais?' },
            { id: 57, mechanism: 'Retenção', text: 'O que impede manutenção do autocuidado?' },
            { id: 58, mechanism: 'Retenção', text: 'Emoções, cultura alimentar, crenças ou rotina te puxam ao antigo padrão?' }
        ]
    },
    {
        id: 'sociocultural',
        title: 'Sociocultural',
        color: 'from-teal-500 to-cyan-500',
        questions: [
            { id: 59, mechanism: 'Variação', text: 'Que padrões sociais/culturais entram em jogo quando você está mal?' },
            { id: 60, mechanism: 'Variação', text: 'Há apoios, valores ou comunidade que não aparecem, mas poderiam?' },
            { id: 61, mechanism: 'Variação', text: 'Há repertório cultural útil que não está sendo usado?' },
            { id: 62, mechanism: 'Seleção', text: 'O que esses padrões socioculturais fazem por você?' },
            { id: 63, mechanism: 'Seleção', text: 'Quando surge uma postura social mais adaptativa, o que ela permite?' },
            { id: 64, mechanism: 'Retenção', text: 'O que mantém padrões socioculturais problemáticos?' },
            { id: 65, mechanism: 'Retenção', text: 'O que impede respostas saudáveis de se sustentarem?' },
            { id: 66, mechanism: 'Retenção', text: 'Há normas, estigma ou julgamentos influenciando você?' }
        ]
    }
];

const getMechanismColor = (mechanism: string) => {
    switch (mechanism) {
        case 'Variação': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Seleção': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Retenção': return 'bg-rose-100 text-rose-700 border-rose-200';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export const EBPAnamnesisForm: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [ebpData, setEbpData] = useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingPBT, setIsGeneratingPBT] = useState(false);
    const { navigateTo } = useNavigation();

    // Collapsed state for dimensions
    const [collapsedDimensions, setCollapsedDimensions] = useState<Record<string, boolean>>({});

    // Auto-Save States
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

    // Initial Load
    useEffect(() => {
        if (currentPatient?.clinicalRecords.anamnesis?.ebp?.content) {
            try {
                const parsed = currentPatient.clinicalRecords.anamnesis.ebp.content;
                if (typeof parsed === 'object') {
                    setEbpData(parsed);
                } else {
                    setEbpData(JSON.parse(parsed));
                }
                setLastSavedAt(new Date(currentPatient.clinicalRecords.anamnesis.ebp.updatedAt));
            } catch { /* Handle error */ }
        }
    }, [currentPatient]);

    // Auto-Save Effect (Debounce 2s)
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const timer = setTimeout(() => {
            handleSave();
        }, 2000);

        return () => clearTimeout(timer);
    }, [ebpData, hasUnsavedChanges]);

    const handleSave = async () => {
        if (!currentPatient) return;
        setIsSaving(true);

        const currentAnamnesis = currentPatient.clinicalRecords.anamnesis || {};

        updatePatient({
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                anamnesis: {
                    ...currentAnamnesis,
                    ebp: {
                        content: ebpData,
                        updatedAt: new Date().toISOString()
                    }
                }
            }
        });

        setTimeout(() => {
            setIsSaving(false);
            setHasUnsavedChanges(false);
            setLastSavedAt(new Date());
        }, 800);
    };

    const handleQuestionChange = (questionId: number, value: string) => {
        setEbpData(prev => ({ ...prev, [questionId]: value }));
        setHasUnsavedChanges(true);
    };

    const toggleDimension = (dimensionId: string) => {
        setCollapsedDimensions(prev => ({
            ...prev,
            [dimensionId]: !prev[dimensionId]
        }));
    };

    // Generate PBT from EBP
    const handleGeneratePBTNodes = async () => {
        if (!currentPatient) return;

        const ebpRecord: Record<string, string> = {};
        EBP_DIMENSIONS.forEach(dim => {
            dim.questions.forEach(q => {
                if (ebpData[q.id]) {
                    ebpRecord[`[${dim.title}][${q.mechanism}] ${q.text}`] = ebpData[q.id];
                }
            });
        });

        if (Object.keys(ebpRecord).length === 0) {
            alert('Preencha a entrevista primeiro!');
            return;
        }

        if (!confirm('Gerar Processos (Nós) da Rede PBT automaticamente com IA?')) return;

        setIsGeneratingPBT(true);
        try {
            const currentSession = currentPatient.clinicalRecords.sessions[0];
            const existingNodes = currentSession?.pbtNetwork?.nodes || [];

            const result = await generatePBTNodesFromAnamnesis(ebpRecord, existingNodes);

            const mergedNodes = [...existingNodes, ...result.nodes];
            const currentEdges = currentSession?.pbtNetwork?.edges || [];

            const updatedPatient = JSON.parse(JSON.stringify(currentPatient));
            if (!updatedPatient.clinicalRecords.sessions) updatedPatient.clinicalRecords.sessions = [];

            if (updatedPatient.clinicalRecords.sessions.length === 0) {
                updatedPatient.clinicalRecords.sessions.push({
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    summary: "Sessão Inicial",
                    pbtNetwork: { nodes: [], edges: [] }
                });
            }

            updatedPatient.clinicalRecords.sessions[0].pbtNetwork = {
                nodes: mergedNodes,
                edges: currentEdges
            };

            updatePatient(updatedPatient);
            alert(`✅ ${result.nodes.length} processos identificados! Vá para "Rede PBT" para visualizar.`);
        } catch (error) {
            console.error('Erro ao gerar processos PBT:', error);
            alert('Erro ao gerar processos. Tente novamente.');
        } finally {
            setIsGeneratingPBT(false);
        }
    };

    // Calculate progress
    const totalQuestions = EBP_DIMENSIONS.reduce((acc, dim) => acc + dim.questions.length, 0);
    const answeredQuestions = Object.keys(ebpData).filter(k => ebpData[parseInt(k)]?.trim()).length;
    const progressPercent = Math.round((answeredQuestions / totalQuestions) * 100);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-purple-600" />
                        Entrevista Baseada em Processos (EBP)
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-600 text-sm">66 questões • 8 dimensões • Variação / Seleção / Retenção</p>
                        {/* Auto-Save Indicator */}
                        <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${hasUnsavedChanges ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Salvando...</span>
                                </>
                            ) : hasUnsavedChanges ? (
                                <>
                                    <CloudOff className="w-3 h-3" />
                                    <span>Alterações não salvas</span>
                                </>
                            ) : (
                                <>
                                    <Cloud className="w-3 h-3" />
                                    <span>Salvo {lastSavedAt ? `às ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleGeneratePBTNodes}
                        disabled={isGeneratingPBT || answeredQuestions < 5}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50"
                    >
                        {isGeneratingPBT ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                        {isGeneratingPBT ? 'Gerando...' : '🕸️ Gerar Processos PBT'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 ${hasUnsavedChanges ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white' : 'bg-gray-200 text-gray-500 cursor-default hover:bg-gray-300'}`}
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Salvando...' : hasUnsavedChanges ? 'Salvar Agora' : 'Salvo'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progresso</span>
                    <span className="text-sm font-bold text-purple-600">{answeredQuestions}/{totalQuestions} ({progressPercent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-4">
                {EBP_DIMENSIONS.map((dimension) => {
                    const dimAnswered = dimension.questions.filter(q => ebpData[q.id]?.trim()).length;
                    const isCollapsed = collapsedDimensions[dimension.id];

                    return (
                        <div
                            key={dimension.id}
                            className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-colors"
                        >
                            {/* Dimension Header */}
                            <button
                                onClick={() => toggleDimension(dimension.id)}
                                className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${dimension.color} text-white`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold opacity-50">{dimension.title.charAt(0)}</span>
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold">{dimension.title}</h3>
                                        <p className="text-sm opacity-80">{dimAnswered}/{dimension.questions.length} respondidas</p>
                                    </div>
                                </div>
                                {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                            </button>

                            {/* Questions */}
                            {!isCollapsed && (
                                <div className="p-4 space-y-4">
                                    {dimension.questions.map((question) => (
                                        <div key={question.id} className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <span className="text-xs font-bold text-gray-400 mt-1">Q{question.id}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getMechanismColor(question.mechanism)}`}>
                                                    {question.mechanism}
                                                </span>
                                            </div>
                                            <p className="text-gray-800 font-medium text-sm">{question.text}</p>
                                            <textarea
                                                value={ebpData[question.id] || ''}
                                                onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                                                placeholder="Registre a resposta do paciente..."
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 min-h-[80px] resize-y text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-2xl disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Salvando...' : 'Salvar Entrevista EBP'}
                </button>
            </div>
        </div>
    );
};

export { EBP_DIMENSIONS };

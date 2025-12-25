import React, { useState, useEffect, useRef } from 'react';
import { usePatients } from '../context/PatientContext';
import { Save, FileText, Sparkles, Loader2, Cloud, CloudOff, BrainCircuit, ArrowRight } from 'lucide-react';
import { generateInitialFormulation, generatePBTNodesFromAnamnesis } from '../lib/gemini';
import { useNavigation } from '../context/NavigationContext';

const DEFAULT_TOPICS = [
    {
        id: 1,
        title: "Dados Gerais",
        questions: [
            "Gênero", "Estado civil", "Orientação sexual", "Escolaridade",
            "Tem filhos? Quantos? Como se chamam?", "Profissão e tempo de atuação",
            "Cidade de origem / Estado", "Cidade de residência atual",
            "Com quem reside? Como é o ambiente?"
        ]
    },
    {
        id: 2,
        title: "Queixa Principal e Contexto Atual",
        questions: [
            "Principal motivo da busca por terapia neste momento",
            "Duração do sofrimento; intensidade (0–10)",
            "Sofrimentos/prejuízos em outras áreas (saúde, amorosa, familiar etc.)",
            "Já fez terapia? Qual abordagem? Houve resultados?",
            "O que espera alcançar com a psicoterapia; metas iniciais"
        ]
    },
    {
        id: 3,
        title: "Histórico Atual",
        questions: [
            "Mudanças significativas nos últimos meses",
            "Principais dificuldades atuais",
            "Dificuldades semelhantes no passado; padrões repetitivos",
            "Motivos para buscar psicoterapia agora",
            "O que tem impedido a melhora; disposição para mudança"
        ]
    },
    {
        id: 4,
        title: "História Pessoal e Desenvolvimento",
        questions: [
            "Infância e adolescência (vínculos, estabilidade emocional)",
            "Vida escolar: dificuldades de aprendizado/socialização",
            "Figuras mais importantes na época",
            "Experiências de bullying, negligência ou abuso"
        ]
    },
    {
        id: 5,
        title: "História Familiar",
        questions: [
            "Relação com mãe e pai; impacto na identidade",
            "Histórico familiar de transtornos mentais",
            "Comportamentos característicos de pai e mãe",
            "História familiar de tentativa/consumo de suicídio"
        ]
    },
    {
        id: 6,
        title: "Histórico de Relacionamentos",
        questions: [
            "Relacionamento atual: qualidade e dinâmica",
            "Relacionamentos marcantes anteriores e aprendizados",
            "Dificuldades/conflitos recorrentes nas relações",
            "Experiências de abuso/violência/traição e impactos"
        ]
    },
    {
        id: 7,
        title: "Vida Atual e Estilo de Vida",
        questions: [
            "Rotina semanal; organização de compromissos",
            "Sono, alimentação e atividade física",
            "Renda principal, variações, preocupações financeiras (0–10)"
        ]
    },
    {
        id: 8,
        title: "Funcionamento Emocional e Comportamental",
        questions: [
            "Identificação/expressão de emoções; estratégias de regulação",
            "Situações/gatilhos de perda de controle emocional",
            "Ideação suicida, automutilação, impulsividade",
            "Sentimentos de vazio, inutilidade ou falta de propósito"
        ]
    },
    {
        id: 9,
        title: "Traumas e Eventos Significativos",
        questions: [
            "Experiências traumáticas (violência, abuso, acidentes, perdas)",
            "Presença de pesadelos, flashbacks ou lembranças recorrentes",
            "Impacto atual dos eventos na vida cotidiana"
        ]
    },
    {
        id: 10,
        title: "Rede de Apoio e Vida Social Atual",
        questions: [
            "Pessoas com quem pode contar em momentos difíceis",
            "Participação em grupos, projetos ou comunidades",
            "Frequência de contato; risco de isolamento",
            "Religião / Espiritualidade",
            "Outros profissionais de saúde envolvidos",
            "Pratica esportes? Quais?",
            "Tipo de dieta",
            "Uso de medicação",
            "Ciclo menstrual (se aplicável)",
            "Uso de tabaco, substâncias"
        ]
    },
    {
        id: 11,
        title: "Histórico de Tratamento Psicológico/Psiquiátrico",
        questions: [
            "Psicoterapias anteriores; abordagens e eficácia",
            "Medicações em uso (nome, dosagem)",
            "Internações psiquiátricas/atendimentos de emergência"
        ]
    },
    {
        id: 12,
        title: "Identidade e Autopercepção",
        questions: [
            "Autoimagem, autoestima e valores",
            "Como uma pessoa próxima o(a) descreveria?",
            "Episódios de instabilidade de identidade ou mudanças bruscas"
        ]
    },
    {
        id: 13,
        title: "Metas, Compromisso e Observações Finais",
        questions: [
            "Mudanças desejadas (curto e médio prazo)",
            "O que está disposto(a) a fazer para alcançá-las",
            "Possíveis dificultadores à permanência na terapia",
            "Informações importantes não abordadas",
            "O que espera levar do processo terapêutico"
        ]
    },
    {
        id: 14,
        title: "Espaço para o Clínico",
        questions: [
            "Hipóteses diagnósticas iniciais (DSM-5-TR)",
            "Focos do tratamento (questões centrais atuais)",
            "Estratégias/técnicas iniciais planejadas"
        ]
    }
];

export const AnamnesisForm: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [anamnesisData, setAnamnesisData] = useState<Record<number, string>>({});
    const [activeTemplate, setActiveTemplate] = useState('default');
    const [customTemplates, setCustomTemplates] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [isGeneratingPBT, setIsGeneratingPBT] = useState(false);
    const { navigateTo } = useNavigation();

    // Auto-Save States
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

    // Initial Load
    useEffect(() => {
        if (currentPatient?.clinicalRecords.anamnesis.content) {
            try {
                const parsed = JSON.parse(currentPatient.clinicalRecords.anamnesis.content);
                setAnamnesisData(parsed);
                setLastSavedAt(new Date(currentPatient.clinicalRecords.anamnesis.updatedAt));
            } catch { /* Handle legacy text */ }
        }
    }, [currentPatient]);

    // Auto-Save Effect (Debounce 2s)
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const timer = setTimeout(() => {
            handleSave();
        }, 2000); // 2 seconds delay

        return () => clearTimeout(timer);
    }, [anamnesisData, hasUnsavedChanges]);

    // Prevent accidental close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleSave = async () => {
        if (!currentPatient) return;
        setIsSaving(true);
        console.log("💾 Auto-saving Anamnesis...");

        updatePatient({
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                anamnesis: {
                    ...currentPatient.clinicalRecords.anamnesis,
                    content: JSON.stringify(anamnesisData),
                    updatedAt: new Date().toISOString()
                }
            }
        });

        // Simulate short delay for visual feedback, then reset states
        setTimeout(() => {
            setIsSaving(false);
            setHasUnsavedChanges(false);
            setLastSavedAt(new Date());
        }, 800);
    };

    const handleTopicChange = (topicId: number, value: string) => {
        setAnamnesisData(prev => ({ ...prev, [topicId]: value }));
        setHasUnsavedChanges(true); // Flag change
    };



    // Gerar Processos PBT a partir da Anamnese
    const handleGeneratePBTNodes = async () => {
        if (!currentPatient) return;

        const anamnesisRecord: Record<string, string> = {};
        Object.entries(anamnesisData).forEach(([topicId, content]) => {
            const topic = DEFAULT_TOPICS.find(t => t.id === parseInt(topicId));
            if (topic && content) {
                anamnesisRecord[topic.title] = content;
            }
        });

        if (Object.keys(anamnesisRecord).length === 0) {
            alert('Preencha a anamnese primeiro!');
            return;
        }

        if (!confirm('Gerar Processos (Nós) da Rede PBT automaticamente com IA?')) return;

        setIsGeneratingPBT(true);
        try {
            const currentSession = currentPatient.clinicalRecords.sessions[0];
            const existingNodes = currentSession?.pbtNetwork?.nodes || [];

            const result = await generatePBTNodesFromAnamnesis(anamnesisRecord, existingNodes);

            // Merge with existing nodes
            const mergedNodes = [...existingNodes, ...result.nodes];
            const currentEdges = currentSession?.pbtNetwork?.edges || [];

            // Update patient
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-600" />
                        Anamnese Estruturada
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-600 text-sm">Entrevista inicial completa - 14 tópicos</p>
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
                        disabled={isGeneratingPBT || !Object.keys(anamnesisData).length}
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

            {/* Topics */}
            <div className="space-y-4">
                {DEFAULT_TOPICS.map((topic, index) => (
                    <div
                        key={topic.id}
                        className="bg-white border-2 border-indigo-100 rounded-2xl p-6 hover:border-indigo-200 transition-colors"
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                                {topic.id}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{topic.title}</h3>
                                <div className="text-xs text-gray-500 space-y-0.5">
                                    {topic.questions.map((q, i) => (
                                        <p key={i}>• {q}</p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <textarea
                            value={anamnesisData[topic.id] || ''}
                            onChange={(e) => handleTopicChange(topic.id, e.target.value)}
                            placeholder={`Digite as respostas para ${topic.title.toLowerCase()}...`}
                            className="w-full bg-indigo-50/50 border-2 border-indigo-100 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 min-h-[120px] resize-y"
                        />
                    </div>
                ))}
            </div>

            {/* Guidance for Next Steps */}
            {Object.keys(anamnesisData).length > 2 && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 mx-1 my-6 animate-in slide-in-from-bottom-8 duration-700 shadow-lg">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h4 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                🚀 Próximos Passos
                            </h4>
                            <p className="text-sm text-indigo-800/80 max-w-lg">
                                Transforme a história clínica em um modelo funcional.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <button
                                onClick={handleGeneratePBTNodes}
                                disabled={isGeneratingPBT}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-md disabled:opacity-50"
                            >
                                {isGeneratingPBT ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                                {isGeneratingPBT ? 'Gerando...' : '🕸️ Gerar Processos'}
                            </button>
                            <button
                                onClick={() => navigateTo('formulation')}
                                className="flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 text-indigo-700 border-2 border-indigo-300 px-5 py-3 rounded-xl font-semibold transition-all shadow-sm"
                            >
                                Ir para Conceituação
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Save */}
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-2xl disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Salvando...' : 'Salvar Anamnese Completa'}
                </button>
            </div>
        </div>
    );
};

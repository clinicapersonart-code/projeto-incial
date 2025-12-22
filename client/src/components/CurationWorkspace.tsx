import React, { useState, useRef } from 'react';
import { usePatients } from '../context/PatientContext';
import { analyzeWithMaterial } from '../lib/gemini';
import { Upload, X, FileText, Send, Loader2, BookOpen, Plus, Sparkles, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const CurationWorkspace: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [mode, setMode] = useState<'creator' | 'auditor'>('creator');
    const [images, setImages] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newImages: string[] = [];
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        setImages(prev => [...prev, reader.result as string]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (!prompt && images.length === 0) return;
        setIsLoading(true);
        setGeneratedPlan(null);

        try {
            let contextPrompt = '';

            if (mode === 'creator') {
                contextPrompt = `
CONTEXTO DO PACIENTE:
Nome: ${currentPatient?.name}
Idade: ${currentPatient?.birthDate ? new Date().getFullYear() - new Date(currentPatient.birthDate).getFullYear() : 'N/A'}
Resumo Anamnese: ${currentPatient?.clinicalRecords.anamnesis.content || 'Sem dados'}
Queixa Principal (Sessão Atual): ${currentPatient?.clinicalRecords.sessions[0]?.soap.queixa_principal || 'N/A'}

TAREFA (MODO CRIADOR):
${prompt}

INSTRUÇÕES:
Analise as imagens fornecidas (se houver) como "Material de Referência".
Adapte EXATAMENTE o que está no material para o contexto do paciente.
Se o material for um protocolo, crie um passo a passo adaptado.
Use metáforas que façam sentido para o paciente.
Responda em Markdown.
            `;
            } else {
                // AUDITOR MODE
                const currentPlan = currentPatient?.clinicalRecords.sessions[0]?.soap.plano.join('\n') || "Sem plano definido na última sessão.";

                // HISTORY CONTEXT (Last 5 sessions for trends)
                const history = currentPatient?.clinicalRecords.sessions
                    .slice(0, 5) // Take last 5
                    .map(s => `[${new Date(s.date).toLocaleDateString()}] Queixa: ${s.soap.queixa_principal} | Plano: ${s.soap.plano.join(', ')}`)
                    .join('\n');

                contextPrompt = `
CONTEXTO CLÍNICO:
Plano de Tratamento Atual (Sessão):
${currentPlan}

HISTÓRICO RECENTE (Últimas 5 sessões):
${history}

PROPOSTA A SER AUDITADA/PERGUNTA:
${prompt}

DOCUMENTO DE REFERÊNCIA (LEI/GUIDELINE):
(Ver imagens em anexo)

SUA MISSÃO (AUDITOR DE COMPLIANCE & MEMÓRIA):
Você é um auditor clínico com acesso total ao histórico.
1. Se a pergunta for sobre tendências/histórico, use a seção "HISTÓRICO RECENTE".
2. Se for uma auditoria de conformidade, compare o plano atual com os documentos/guidelines.
3. Identifique discrepâncias (O que está sendo feito vs O que o guideline manda).
4. Aponte riscos de segurança ou eficácia.
5. CITE A FONTE (Página/Parágrafo) para cada apontamento. Grounding é obrigatório.
                `;
            }

            const response = await analyzeWithMaterial(contextPrompt, images);
            setGeneratedPlan(response);

        } catch (error) {
            console.error(error);
            setGeneratedPlan("Erro ao gerar plano. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const saveProtocol = () => {
        if (!currentPatient || !generatedPlan) return;

        const newProtocol = {
            id: crypto.randomUUID(),
            title: `Protocolo Adaptado - ${new Date().toLocaleDateString()}`,
            date: new Date().toISOString(),
            content: generatedPlan,
            originalMaterial: images.length > 0 ? "Imagens enviadas" : "Texto puro"
        };

        const updatedProtocols = currentPatient.clinicalRecords.customProtocols
            ? [newProtocol, ...currentPatient.clinicalRecords.customProtocols]
            : [newProtocol];

        updatePatient({
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                customProtocols: updatedProtocols
            }
        });
        alert("Protocolo salvo no prontuário!");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Left Col: Curation Interface */}
            <div className="space-y-6">
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            {mode === 'creator' ? <Sparkles className="w-6 h-6 text-pink-400" /> : <ShieldCheck className="w-6 h-6 text-emerald-400" />}
                            {mode === 'creator' ? "Laboratório de Adaptação" : "Auditor de Conformidade"}
                        </h2>
                        <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/5">
                            <button
                                onClick={() => setMode('creator')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'creator' ? 'bg-pink-500/20 text-pink-300' : 'text-slate-400 hover:text-white'}`}
                            >
                                Criador
                            </button>
                            <button
                                onClick={() => setMode('auditor')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'auditor' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
                            >
                                Auditor
                            </button>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-2">1. Material de Referência (Livros, Artigos)</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-700 hover:border-pink-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/30"
                        >
                            <Upload className="w-8 h-8 text-slate-500 mb-2" />
                            <p className="text-sm text-slate-400 text-center">Clique para enviar fotos ou PDFs (como imagens)</p>
                            <span className="text-xs text-slate-600 mt-1">Suporta JPG, PNG</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            accept="image/*"
                            className="hidden"
                        />

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative w-20 h-20 flex-shrink-0 group">
                                        <img src={img} alt="preview" className="w-full h-full object-cover rounded-lg border border-white/10" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Prompt Area */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            {mode === 'creator' ? "2. Comando de Adaptação" : "2. O que você quer auditar?"}
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className={`w-full h-32 bg-slate-950/50 border rounded-xl p-4 text-sm text-slate-200 focus:outline-none resize-none transition-colors ${mode === 'creator' ? 'border-white/10 focus:border-pink-500/50' : 'border-emerald-500/10 focus:border-emerald-500/50'}`}
                            placeholder={mode === 'creator'
                                ? "Ex: Adapte este protocolo de Pânico para o João, considerando que ele é motociclista..."
                                : "Ex: O plano de tratamento atual para ansiedade social está de acordo com as diretrizes do NICE (em anexo)? Verifique a frequência das exposições."}
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || (!prompt && images.length === 0)}
                        className={`w-full py-4 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${mode === 'creator'
                                ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-500/20'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                            }`}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'creator' ? <Sparkles className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />)}
                        {isLoading
                            ? (mode === 'creator' ? "CRIANDO..." : "AUDITANDO...")
                            : (mode === 'creator' ? "GERAR PROTOCOLO ADAPTADO" : "EXECUTAR AUDITORIA DE COMPLIANCE")}
                    </button>
                </div>
            </div>

            {/* Right Col: Result */}
            <div className="h-full bg-slate-900/50 border border-white/10 rounded-xl p-6 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-200">Plano Gerado</h3>
                    {generatedPlan && (
                        <button
                            onClick={saveProtocol}
                            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold hover:bg-emerald-500/20 flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> SALVAR
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-950/30 rounded-lg border border-white/5">
                    {generatedPlan ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{generatedPlan}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                            <FileText className="w-12 h-12 opacity-20" />
                            <p className="text-sm">O resultado da adaptação aparecerá aqui.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

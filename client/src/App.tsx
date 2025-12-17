import React, { useState } from 'react';
import { analyzeCase } from './lib/gemini';
import { PBTGraph } from './components/PBTGraph';
import {
  BrainCircuit,
  Target,
  MessageCircle,
  Lightbulb,
  AlertTriangle,
  Send,
  Loader2,
  BookOpen,
  FileText,
  Activity,
  User,
  CheckCircle2
} from 'lucide-react';

interface AnalysisResult {
  soap: {
    queixa_principal: string;
    subjetivo: { conteudo: string; citacao: string; confianca: number }[];
    objetivo: string;
    avaliacao: string;
    plano: string[];
  };
  pbt_network: {
    nodes: { id: string; label: string; type: string; change: string; category?: string }[];
    edges: { source: string; target: string; relation: string; weight: string }[];
  };
  adaptacao: {
    gatilho_identificado: boolean;
    motivo_adapacao: string;
    sugestoes: { acao: string; justificativa_pbt: string }[];
  };
  analise_original?: {
    sugestao_fala: string;
    metafora: string;
    alerta_risco: boolean;
  };
}

function App() {
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'soap' | 'network' | 'plan'>('soap');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeCase(notes);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao processar a análise. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!result) return null;

    if (activeTab === 'network') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2 flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-cyan-400" />
              REDE DE PROCESSOS PBT
            </h3>
            <p className="text-slate-400 text-sm mb-6 max-w-2xl">
              Visualização interativa das relações causais entre processos cognitivos, afetivos e comportamentais identificados no relato.
            </p>
            <PBTGraph nodes={result.pbt_network.nodes} edges={result.pbt_network.edges} />
          </div>

          {/* Legenda de Categorias */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { color: 'bg-blue-500', label: 'Cognitiva' },
              { color: 'bg-red-500', label: 'Afetiva' },
              { color: 'bg-green-500', label: 'Comportamento' },
              { color: 'bg-purple-500', label: 'Self' },
              { color: 'bg-yellow-500', label: 'Contexto' },
            ].map((cat) => (
              <div key={cat.label} className="bg-slate-900/80 border border-white/5 rounded-lg p-2 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${cat.color} shadow-[0_0_10px_currentColor]`}></div>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'plan') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Alerta de Risco */}
          {result.analise_original?.alerta_risco && (
            <div className="relative overflow-hidden rounded-xl bg-red-950/30 border border-red-500/50 p-6 flex items-start gap-4 shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.05)_10px,rgba(239,68,68,0.05)_20px)]"></div>
              <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 animate-pulse relative z-10" />
              <div className="relative z-10">
                <h3 className="text-red-400 font-bold text-lg tracking-widest flex items-center gap-2">
                  ALERTA DE SEGURANÇA
                </h3>
                <p className="text-red-200/80 text-sm mt-2 font-mono border-l-2 border-red-500/30 pl-3">
                  Indicadores de risco detectados. Avalie protocolos de segurança imediatos.
                </p>
              </div>
            </div>
          )}

          {/* Card Adaptação */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-bold text-pink-100 tracking-wide">PLANO DE ADAPTAÇÃO</h3>
                  <p className="text-[10px] text-pink-400/60 font-mono tracking-widest">
                    {result.adaptacao.gatilho_identificado ? "INTERVENÇÃO NECESSÁRIA" : "MANUTENÇÃO DE ESTRATÉGIA"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-300 italic mb-4 border-l-2 border-pink-500/30 pl-4 py-1">
                "{result.adaptacao.motivo_adapacao}"
              </div>
              <div className="space-y-3">
                {result.adaptacao.sugestoes.map((sug, i) => (
                  <div key={i} className="bg-slate-950/50 rounded-lg p-4 border border-white/5 hover:border-pink-500/30 transition-colors">
                    <h4 className="text-pink-300 font-bold text-sm mb-1">{sug.acao}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{sug.justificativa_pbt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Script Sugerido */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                <div className="p-2 bg-sky-500/20 rounded-lg"><MessageCircle className="w-5 h-5 text-sky-400" /></div>
                <h3 className="font-bold text-sky-100 tracking-wide">SCRIPT SUGERIDO</h3>
              </div>
              <div className="p-6 text-sky-100/90 italic font-serif leading-relaxed">
                "{result.analise_original?.sugestao_fala}"
              </div>
            </div>

            {/* Metáfora */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg"><Lightbulb className="w-5 h-5 text-amber-400" /></div>
                <h3 className="font-bold text-amber-100 tracking-wide">METÁFORA TRAPÊUTICA</h3>
              </div>
              <div className="p-6 text-slate-300 leading-relaxed text-sm">
                {result.analise_original?.metafora}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default: SOAP Tab
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg"><FileText className="w-5 h-5 text-cyan-400" /></div>
            <div>
              <h3 className="font-bold text-cyan-100 tracking-wide">S.O.A.P NOTES</h3>
              <p className="text-[10px] text-cyan-400/60 font-mono tracking-widest">REGISTRO CLÍNICO ESTRUTURADO</p>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {/* S - Subjetivo */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-cyan-950 text-cyan-400 font-mono text-xs px-2 py-1 rounded border border-cyan-500/20">S</span>
                <h4 className="text-sm font-bold text-slate-200">SUBJETIVO (Relato do Paciente)</h4>
              </div>
              <div className="space-y-4 pl-4 border-l border-cyan-500/20">
                <div className="text-sm font-medium text-white mb-2">Queixa Principal: <span className="text-slate-400 font-normal">{result.soap.queixa_principal}</span></div>
                <div className="space-y-3">
                  {result.soap.subjetivo.map((item, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-3 rounded text-xs text-slate-300">
                      <p className="mb-2">{item.conteudo}</p>
                      {item.citacao && (
                        <p className="text-slate-500 italic border-l-2 border-slate-700 pl-2">"{item.citacao}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* O - Objetivo */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-cyan-950 text-cyan-400 font-mono text-xs px-2 py-1 rounded border border-cyan-500/20">O</span>
                <h4 className="text-sm font-bold text-slate-200">OBJETIVO (Observações)</h4>
              </div>
              <p className="text-sm text-slate-300 pl-4 border-l border-cyan-500/20">{result.soap.objetivo}</p>
            </div>

            {/* A - Avaliação */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-cyan-950 text-cyan-400 font-mono text-xs px-2 py-1 rounded border border-cyan-500/20">A</span>
                <h4 className="text-sm font-bold text-slate-200">AVALIAÇÃO (Síntese)</h4>
              </div>
              <p className="text-sm text-slate-300 pl-4 border-l border-cyan-500/20">{result.soap.avaliacao}</p>
            </div>

            {/* P - Plano */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-cyan-950 text-cyan-400 font-mono text-xs px-2 py-1 rounded border border-cyan-500/20">P</span>
                <h4 className="text-sm font-bold text-slate-200">PLANO (Próximos Passos)</h4>
              </div>
              <ul className="space-y-2 pl-4 border-l border-cyan-500/20">
                {result.soap.plano.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-purple to-neon-cyan rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900 p-2.5 rounded-lg border border-white/10 ring-1 ring-white/5">
                <BrainCircuit className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-wider font-[Rajdhani] uppercase">Supervisor PBE IA</h1>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] text-cyan-500/70 font-bold tracking-[0.2em] uppercase">Auditor Clínico // v3.0</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium tracking-widest text-slate-500">
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('soap')} className={`px-4 py-2 rounded transition-colors ${activeTab === 'soap' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'hover:bg-white/5'}`}>S.O.A.P</button>
              <button onClick={() => setActiveTab('network')} className={`px-4 py-2 rounded transition-colors ${activeTab === 'network' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'hover:bg-white/5'}`}>REDE PBT</button>
              <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 rounded transition-colors ${activeTab === 'plan' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50' : 'hover:bg-white/5'}`}>ADAPTAÇÃO</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-1 space-y-6">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-b from-neon-purple to-neon-cyan rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/10 p-1">
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <BookOpen className="w-5 h-5 text-neon-purple" />
                    <span className="tracking-wide">INPUT DE DADOS</span>
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="notes" className="block text-xs font-bold text-cyan-500/80 uppercase tracking-widest mb-3 ml-1">
                        Relato da Sessão
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full h-80 p-5 rounded-xl bg-slate-900/50 border border-white/10 text-cyan-50 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple/50 resize-none transition-all text-sm leading-relaxed font-mono custom-scrollbar"
                        placeholder="// Digite aqui o relato do paciente...&#10;> Aguardando entrada de dados..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !notes.trim()}
                      className="group relative w-full overflow-hidden rounded-xl bg-slate-900 p-px focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50"
                    >
                      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-3 py-4 text-sm font-bold text-white backdrop-blur-3xl gap-2 transition-all group-hover:bg-slate-900/90 group-hover:text-cyan-200">
                        {loading ? <Loader2 className="animate-spin" /> : <Send />}
                        {loading ? "AUDITANDO..." : "PROCESSAR CASO"}
                      </span>
                    </button>
                  </form>
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span className="w-2 h-2 rounded-full bg-green-500/20"></span>
                      DATA SOURCE: BARLOW_DB_CONNECTED
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="relative overflow-hidden rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                <div className="flex relative z-10">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                  <p className="text-sm text-red-200 font-mono"><span className="font-bold">SYSTEM ERROR:</span> {error}</p>
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-sm p-12 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05),transparent_50%)]"></div>
                <div className="relative z-10 space-y-4">
                  <div className="w-24 h-24 mx-auto bg-slate-900 rounded-full flex items-center justify-center border border-white/10 group-hover:border-neon-cyan/50 transition-colors duration-500 shadow-[0_0_30px_-10px_rgba(34,211,238,0.1)]">
                    <BrainCircuit className="w-10 h-10 text-slate-600 group-hover:text-neon-cyan transition-colors duration-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400 tracking-widest">SISTEMA EM STANDBY</h3>
                  <p className="text-sm text-slate-600 font-mono max-w-xs mx-auto">&gt; Inicie a transmissão de dados no painel esquerdo para ativar os protocolos de supervisão.</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="space-y-4 h-full flex flex-col justify-center py-20">
                <div className="w-full max-w-md mx-auto space-y-8">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-cyan-500">
                      <span>ANALISANDO PADRÕES...</span>
                      <span>32%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-neon-cyan w-1/3 animate-progress"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-purple-500">
                      <span>CONSULTANDO PROTOCOLOS...</span>
                      <span>78%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-neon-purple w-3/4 animate-progress delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

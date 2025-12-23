import { GoogleGenAI, Type, Schema } from "@google/genai";

declare global {
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_API_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const RATES = {
  FAST: "gemini-2.0-flash-exp",  // Velocidade para Co-Piloto e Chat
  DEEP: "gemini-pro",             // Raciocínio Profundo para Análise e PBT
};

const EvidenceSchemaWithSource: Schema = {
  type: Type.OBJECT,
  properties: {
    conteudo: { type: Type.STRING },
    citacao: { type: Type.STRING },
  },
  required: ["conteudo", "citacao"]
};

const soapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    queixa_principal: { type: Type.STRING },
    subjetivo: {
      type: Type.ARRAY,
      items: EvidenceSchemaWithSource,
      description: "Pontos chave relatados, com citações."
    },
    objetivo: { type: Type.STRING, description: "Observações comportamentais e métricas." },
    avaliacao: { type: Type.STRING, description: "Conceituação clínica da sessão." },
    plano: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Intervenções e tarefas." }
  },
  required: ["queixa_principal", "subjetivo", "objetivo", "avaliacao", "plano"]
};

const pbtSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["Cognitiva", "Afetiva", "Comportamento", "Self", "Contexto", "Motivacional", "Sociocultural", "Atencional", "Biofisiológica"] },
          change: { type: Type.STRING, enum: ["aumentou", "diminuiu", "estavel", "novo"] }
        },
        required: ["id", "label", "category", "change"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          relation: { type: Type.STRING },
          weight: { type: Type.STRING, enum: ["fraco", "moderado", "forte"] },
          bidirectional: { type: Type.BOOLEAN }
        },
        required: ["source", "target", "relation", "weight", "bidirectional"]
      }
    }
  },
  required: ["nodes", "edges"]
};

const adaptationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    gatilho_identificado: { type: Type.BOOLEAN },
    motivo_adapacao: { type: Type.STRING },
    sugestoes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          acao: { type: Type.STRING },
          justificativa_pbt: { type: Type.STRING }
        },
        required: ["acao", "justificativa_pbt"]
      }
    }
  },
  required: ["gatilho_identificado"]
};

const masterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    soap: soapSchema,
    pbt_network: pbtSchema,
    adaptacao: adaptationSchema,
    analise_original: {
      type: Type.OBJECT,
      properties: {
        sugestao_fala: { type: Type.STRING },
        metafora: { type: Type.STRING },
        alerta_risco: { type: Type.BOOLEAN }
      },
      required: ["sugestao_fala", "metafora", "alerta_risco"]
    }
  },
  required: ["soap", "pbt_network", "adaptacao", "analise_original"]
};

export const systemInstruction = `
VOCÊ É: O "Assistente de Prontuário Clínico", um auditor especializado em Prática Baseada em Evidências (PBE).
SUA MISSÃO: Estruturar dados clínicos brutos em documentos formais, mapear processos PBT e garantir a qualidade técnica do registro.

REGRAS DE OURO:
1. LINGUAGEM CLÍNICA: Use termos técnicos adequados (ex: "Paciente refere", "Evidência sugere", "Comportamento de esquiva").
2. NEUTRALIDADE: Mantenha o tom descritivo e profissional.
3. RASTREABILIDADE: Tudo no campo "Subjetivo" deve ter base no texto original.
4. ESTRUTURA RÍGIDA: Responda APENAS no formato JSON solicitado.

ALERTA DE SEGURANÇA: Se identificar qualquer menção a risco de vida (suicídio, autolesão, heteroagressão), marque "alerta_risco": true IMEDIATAMENTE.
`;

export const analyzeCase = async (sessionNotes: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const response = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: sessionNotes,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: masterSchema,
        temperature: 0.1,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing case:", error);
    throw error;
  }
};

export const summarizeChatToSoap = async (chatHistory: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
  CONTEXTO: O terapeuta realizou uma sessão assistida por chat. Abaixo está o histórico da conversa e anotações rápidas feitas durante o atendimento.
  
  HISTÓRICO DO CHAT DA SESSÃO:
  ${chatHistory}
  
  TAREFA:
  Transforme esse diálogo fragmentado e anotações rápidas em um REGISTRO S.O.A.P FORMAL e uma ANÁLISE PBT COMPLETA, como se fosse um prontuário oficial feito após a sessão.
  Ignore comandos técnicos do terapeuta (ex: "analise isso") e foque no conteúdo clínico relatado.
    `;

  try {
    const response = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: masterSchema,
        temperature: 0.1,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error summarizing chat:", error);
    throw error;
  }
};

export const chatWithPatientHistory = async (historyContext: string, userPrompt: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `
VOCÊ É: O "Assistente de Prontuário", responsável por consultar o histórico do paciente.
SUA BASE DE DADOS: Apenas o texto fornecido abaixo em "HISTÓRICO".
SUA MISSÃO: Responder perguntas do terapeuta cruzando informações de diferentes sessões.
Use linguagem formal de prontuário.
HISTÓRICO DO PACIENTE:
${historyContext}
    `;

  try {
    const result = await ai.models.generateContent({
      model: RATES.FAST,
      contents: [
        { role: "model", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userPrompt }] }
      ],
      config: { temperature: 0.3 }
    });

    return result.text;
  } catch (error) {
    console.error("History chat error:", error);
    throw error;
  }
};

// Função auxiliar para buscar técnicas do servidor RAG
const fetchCBTTechniques = async (query: string, context: string, patientDisorder?: string) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout para não travar

    const response = await fetch('http://localhost:3001/api/search-technique', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `${context}\n${query}`.slice(-500),
        patientDisorder: patientDisorder || null // Hierarquia: protocol → core
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    return data.techniques || [];
  } catch (error) {
    return [];
  }
};

export const getCoPilotSuggestion = async (currentInput: string, context: string, currentPatient?: any) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  // 1. Buscar técnicas (HIERARQUIA: Protocolo → Core)
  const techniques = await fetchCBTTechniques(currentInput, context, currentPatient?.primaryDisorder);

  const techniquesContext = techniques.length > 0
    ? `\n📚 LITERATURA BASEADA EM EVIDÊNCIA ENCONTRADA:\n${techniques.map((t: any) => {
      const sourceLabel = t.source_type === 'protocol' ? '🎯 PROTOCOLO' : '📖 BASE';
      return `${sourceLabel} [${t.source}]:\n"${t.text.slice(0, 250)}..."`;
    }).join('\n\n')}\n`
    : "";

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
CONTEXTO CLÍNICO:
${context}

TERAPEUTA RELATOU:
"${currentInput}"
${techniquesContext}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAREFA:
Atue como Supervisor Clínico Sênior baseado em evidências.

HIERARQUIA DE EVIDÊNCIA (OBRIGATÓRIA):
${techniques.length > 0 ? `
1. PRIORIZE as técnicas da literatura fornecida acima.
2. Cite a fonte quando usar (ex: "Segundo [Nome do Livro]...")
3. NUNCA invente citações ou páginas que não estejam nos materiais.
` : `
1. Use conhecimento geral de TCC/ACT/DBT.
2. NÃO cite livros específicos ou páginas (não foram fornecidos).
3. Base-se em princípios consolidados.
`}

REGRA ANTI-ALUCINAÇÃO:
- Só cite fonte/página se ENCONTROU no material acima.
- Se não encontrou, diga: "Baseado em princípios gerais de TCC..."

RESPOSTA:
Forneça UMA sugestão prática (2-3 frases) sobre o que fazer AGORA.
Seja direto. Dê a INTERVENÇÃO, não teoria.
    `;

  try {
    const result = await ai.models.generateContent({
      model: RATES.FAST,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.3 }
    });

    return result.text;
  } catch (error) {
    console.error("CoPilot error:", error);
    return "Sugestão indisponível no momento.";
  }
};

export const analyzeTopicAlignment = async (recentSessions: any[], goals: string[]) => {
  return {
    status: 'aligned' as const,
    currentFocus: 'Monitoramento Padrão',
    mainGoal: goals[0] || 'Geral',
    relevanceScore: 100,
    analysis: 'Análise simplificada para o novo fluxo.',
    bridgeStrategy: 'Mantenha o foco atual.'
  };
};

export const analyzeWithMaterial = async (prompt: string, images: string[]) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.1 }
    });

    return result.text;
  } catch (error) {
    console.error("Error analyzing with material:", error);
    throw error;
  }
};

export const analyzeEvolution = async (sessions: any[], assessments: any[], criteria: any[]) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const sessionSummary = sessions.slice(0, 5).map((s, i) =>
    `**Sessão ${i + 1}** (${new Date(s.date).toLocaleDateString()}):\n- Queixa: ${s.soap.queixa_principal}\n- Plano: ${s.soap.plano.join(', ')}`
  ).join('\n\n');

  const assessmentSummary = assessments.map(a =>
    `${a.type}: ${a.score} (${new Date(a.date).toLocaleDateString()})`
  ).join('\n');

  const prompt = `
VOCÊ É: Especialista em Análise de Evolução Clínica.
MISSÃO: Cruzar dados qualitativos (sessões) com quantitativos (escalas) para detectar padrões de melhora ou piora.

SESSÕES RECENTES:
${sessionSummary}

AVALIAÇÕES:
${assessmentSummary}

CRITÉRIOS DE ALTA:
${criteria.map(c => `- ${c.criterion}: ${c.status}`).join('\n')}

TAREFA:
1. Analise a evolução do paciente comparando sessões e scores.
2. Identifique padrões (melhora, estagnação, piora).
3. Atualize o status dos critérios de alta se houver evidência clara.
4. Formate a resposta em Markdown profissional.
  `;

  try {
    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.1 }
    });

    return {
      date: new Date().toISOString(),
      analysisText: result.text,
      criteriaUpdates: criteria // In real scenario, parse AI response for updates
    };
  } catch (error) {
    console.error("Error analyzing evolution:", error);
    throw error;
  }
};

export const evolvePBT = async (currentPBT: any, notes: string, analysis: any) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const currentNodesDesc = currentPBT.nodes.map((n: any) => `${n.id}: ${n.label} (${n.category})`).join('\n');

  const prompt = `
VOCÊ É: Especialista em Process-Based Therapy (PBT).
MISSÃO: Detectar novos processos ou mudanças na rede PBT baseado na última sessão.

REDE PBT ATUAL:
${currentNodesDesc}

NOTAS DA ÚLTIMA SESSÃO:
${notes}

TAREFA:
1. Identifique se há novos processos cognitivos, afetivos ou comportamentais mencionados.
2. Detecte mudanças de intensidade em processos existentes.
3. Se houver mudanças, liste:
   - newNodes: novos processos (formato: {id, label, category, change: "novo"})
   - updates: mudanças em nós existentes
4. Se não houver mudanças significativas, retorne hasChanges: false.
5. Responda APENAS em JSON no formato:
{
  "hasChanges": boolean,
  "reasoning": string,
  "newNodes": [],
  "newEdges": [],
  "updates": []
}
  `;

  try {
    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(result.text || '{"hasChanges": false}');
  } catch (error) {
    console.error("Error evolving PBT:", error);
    return {
      hasChanges: false,
      reasoning: "Erro ao processar evolução.",
      newNodes: [],
      newEdges: [],
      updates: []
    };
  }
};

export const generateSessionPlan = async (lastSession: any, assessment: any, goals: any) => {
  return {
    contextAlert: null,
    sessionGoal: "Continuidade do Tratamento",
    script: []
  };
};

export const adaptProtocol = async (protocolText: string, patientContext: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
VOCÊ É: Especialista em Adaptação de Protocolos Clínicos.
MISSÃO: Transformar protocolos genéricos em planos personalizados.

CONTEXTO DO PACIENTE:
${patientContext}

PROTOCOLO ORIGINAL:
${protocolText}

TAREFA:
1. Identifique os passos principais do protocolo.
2. Adapte cada passo ao contexto do paciente (idade, profissão, histórico).
3. Crie uma metáfora central que faça sentido para esse paciente.
4. Retorne em JSON:
{
  "metaphor": "Metáfora adaptada",
  "steps": [
    {"originalTitle": "Passo X", "adaptation": "Adaptação personalizada"}
  ]
}
  `;

  try {
    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(result.text || '{"metaphor": "Erro", "steps": []}');
  } catch (error) {
    console.error("Error adapting protocol:", error);
    throw error;
  }
};

export const generateInitialFormulation = async (anamnesisText: string, assessments: any[]) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const assessmentSummary = assessments.map(a => `${a.type}: ${a.score}`).join('\n');

  const prompt = `
VOCÊ É: Especialista em Formulação de Caso (Modelo Eells).
MISSÃO: Gerar formulação inicial baseada em anamnese e avaliações.

ANAMNESE:
${anamnesisText}

AVALIAÇÕES:
${assessmentSummary}

TAREFA:
1. Sugira um diagnóstico preliminar (DSM-5/CID-11).
2. Escreva uma narrativa explicativa integrando história de vida e sintomas atuais.
3. Liste intervenções baseadas em evidências (guidelines APA, NICE, etc).
4. Retorne em JSON:
{
  "suggestedDiagnosis": "Diagnóstico",
  "narrativeDraft": "Narrativa Eells",
  "guidelineRecommendations": [{"title": "X", "relevance": "Alta/Média", "source": "Fonte"}]
}
  `;

  try {
    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(result.text || '{"suggestedDiagnosis": "Erro", "narrativeDraft": "", "guidelineRecommendations": []}');
  } catch (error) {
    console.error("Error generating formulation:", error);
    throw error;
  }
};

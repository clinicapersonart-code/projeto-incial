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

// --- CONFIGURATION ---
const RATES = {
  FAST: "gemini-2.0-flash-exp",
  DEEP: "gemini-2.0-flash-exp", // Placeholder for when 1.5-pro is active
};


// --- COMPLEX SCHEMAS FOR STRUCTURED OUTPUT ---

// Helper definition moved up to avoid "used before declaration" error
const EvidenceSchemaWithSource: Schema = {
  type: Type.OBJECT,
  properties: {
    conteudo: { type: Type.STRING },
    citacao: { type: Type.STRING },
  },
  required: ["conteudo", "citacao"]
};

// 1. Evidence/Grounding Schema (Reutilizável)
const evidenceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    conteudo: { type: Type.STRING, description: "A informação extraída ou sugerida." },
    citacao: { type: Type.STRING, description: "O trecho EXATO do texto original que justifica esta informação. Se não houver, deixe vazio." },
    confianca: { type: Type.NUMBER, description: "Nível de confiança de 0.0 a 1.0" }
  },
  required: ["conteudo", "citacao", "confianca"]
};

// 2. SOAP Schema
const soapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    queixa_principal: { type: Type.STRING },
    subjetivo: {
      type: Type.ARRAY,
      items: EvidenceSchemaWithSource, // Using evidence structure
      description: "Pontos chave relatados pelo paciente, com citações."
    },
    objetivo: { type: Type.STRING, description: "Observações comportamentais do terapeuta." },
    avaliacao: { type: Type.STRING, description: "Síntese clínica da sessão." },
    plano: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Próximos passos práticos." }
  },
  required: ["queixa_principal", "subjetivo", "objetivo", "avaliacao", "plano"]
};



// 3. PBT Network Schema (Nodes & Edges)
const pbtSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Identificador único do processo (ex: 'ruminacao')" },
          label: { type: Type.STRING, description: "Descrição do conteúdo (Ex: 'Tenho que ser forte')" },
          category: { type: Type.STRING, enum: ["Cognitiva", "Afetiva", "Comportamento", "Self", "Contexto", "Motivacional", "Sociocultural", "Atencional", "Biofisiológica"], description: "Categoria PBT oficial" },
          change: { type: Type.STRING, enum: ["aumentou", "diminuiu", "estavel", "novo"], description: "Mudança em relação à base" }
        },
        required: ["id", "label", "category", "change"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "ID do nó de origem" },
          target: { type: Type.STRING, description: "ID do nó de destino" },
          relation: { type: Type.STRING, description: "Descrição da relação (ex: 'ativa', 'mantém')" },
          weight: { type: Type.STRING, enum: ["fraco", "moderado", "forte"], description: "Força da conexão" },
          bidirectional: { type: Type.BOOLEAN, description: "TRUE se for um ciclo autorreforçador (A <-> B). FALSE se for unidirecional." }
        },
        required: ["source", "target", "relation", "weight", "bidirectional"]
      }
    }
  },
  required: ["nodes", "edges"]
};

// 4. Adaptation Logic Schema
const adaptationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    gatilho_identificado: { type: Type.BOOLEAN, description: "True se houver necessidade de adaptar tratamento." },
    motivo_adapacao: { type: Type.STRING, description: "Por que adaptar? (Ex: Estagnação, Risco)." },
    sugestoes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          acao: { type: Type.STRING, description: "Ação sugerida (ex: 'Introduzir Mindfulness')" },
          justificativa_pbt: { type: Type.STRING, description: "Por que isso ajuda na rede atual?" }
        },
        required: ["acao", "justificativa_pbt"]
      }
    }
  },
  required: ["gatilho_identificado"]
};

// Master Schema combining all
const masterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    soap: soapSchema,
    pbt_network: pbtSchema,
    adaptacao: adaptationSchema,
    analise_original: { // Mantendo compatibilidade com cards antigos
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
VOCÊ É: O "Copiloto Clínico PBE", um assistente de auditoria para terapeutas.
SUA MISSÃO: Estruturar dados clínicos, mapear processos e sugerir intervenções com RASTREABILIDADE TOTAL.

REGRAS DE OURO (THE 4 LOCKS):
1. GROUNDING (RASTREABILIDADE): Você não pode inventar fatos. Para cada ponto subjetivo do SOAP, você DEVE extrair uma citação direta do texto original que comprove aquela afirmação.
2. AUDITOR HUMILDE: Use linguagem probabilística ("Sugere-se", "Evidências indicam"). Nunca dê ordens.
3. TAXONOMIA PBT: Ao criar nós da rede, use preferencialmente termos da TCC/ACT/PBT (ex: Evitação, Fusão, Atenção Flexível).
4. ESTRUTURA RÍGIDA: Responda APENAS no formato JSON solicitado.

REGRAS ESPECÍFICAS DA REDE PBT:
- CICLOS (Loops): Se o Processo A alimenta o Processo B e o B alimenta o A, crie UMA ÚNICA ARESTA com "bidirectional": true.
- FORÇA DA RELAÇÃO:
  - "fraco": Influência leve ou incerta.
  - "moderado": Influência clara.
  - "forte": Influência determinante ou gatilho imediato.
- INTERVENÇÕES:
  - Crie nós com category: "Intervenção".
  - O label DEVE começar com "INT:" (Ex: "INT: Férias da Preocupação").
  - Ligue a Intervenção aos nós que ela visa alterar.
- ALVOS CLÍNICOS:
  - Marque com "isTarget": true os nós que são focos primários de mudança (pelo risco, centralidade ou acesso).

TAREFAS:
- Gerar SOAP completo.
- Mapear Rede PBT (Nós = Processos, Arestas = Relações de Causalidade).
- Verificar Gatilhos de Adaptação (Risco alto, falta de progresso evidente no texto).
`;

export const analyzeCase = async (sessionNotes: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("Chave de API não encontrada.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // Usando versão experimental mais rápida e melhor em JSON se disponível, ou fallback
      contents: sessionNotes,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: masterSchema,
        temperature: 0.2, // Baixa criatividade para fidelidade aos dados
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing case:", error);
    // Fallback simples para não quebrar a UI se o modelo falhar no JSON complexo
    throw error;
  }
};

export const analyzeWithMaterial = async (prompt: string, images: string[]) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  // Convert images to Part objects correctly for the new SDK
  // The SDK expects 'inlineData' with 'data' and 'mimeType'
  const imageParts = images.map(img => {
    // img is data:image/jpeg;base64,.... we need to strip prefix
    const base64Data = img.split(',')[1];
    const mimeType = img.substring(img.indexOf(':') + 1, img.indexOf(';')) || "image/jpeg";

    return {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };
  });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }
      ],
      config: {
        temperature: 0.4
      }
    });

    return result.text;
  } catch (error) {
    console.error("Multimodal error:", error);
    throw error;
  }
};

// --- PATIENT HISTORY CHAT (LOCAL RAG) ---

export const chatWithPatientHistory = async (historyContext: string, userPrompt: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `
VOCÊ É: O "Curador de Memória Clínica", um assistente que conhece profundamente o histórico deste paciente.
SUA BASE DE DADOS: Apenas o texto fornecido abaixo em "HISTÓRICO DO PACIENTE".
SUA MISSÃO: Responder perguntas do terapeuta cruzando informações de diferentes sessões.

REGRAS:
1. SEGREGAÇÃO DE CONTEXTO: Você não sabe nada sobre outros pacientes. Seu mundo é este histórico.
2. CITAÇÃO TEMPORAL: Sempre que afirmar algo, cite a data ou número da sessão (Ex: "Como relatado em 12/05...").
3. SÍNTESE INTELIGENTE: Se perguntarem "como evoluiu a ansiedade?", não liste sessão por sessão. Faça uma narrativa de evolução.
4. GROUNDING: Se a informação não estiver no histórico, diga "Não encontrei registros sobre isso no histórico fornecido".

HISTÓRICO DO PACIENTE:
${historyContext}
    `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "model",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      config: {
        temperature: 0.3
      }
    });

    return result.text;
  } catch (error) {
    console.error("History chat error:", error);
    throw error;
  }
};


// --- EVOLUTION ANALYSIS ---

const evolutionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analysisText: { type: Type.STRING, description: "Análise detalhada da evolução (Markdown)" },
    criteriaUpdates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          description: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['achieved', 'in_progress', 'pending'] },
          evidence: { type: Type.STRING, description: "Por que mudou? Cite a sessão ou score." },
          lastUpdated: { type: Type.STRING }
        },
        required: ["id", "description", "status", "evidence", "lastUpdated"]
      }
    },
    date: { type: Type.STRING }
  },
  required: ["analysisText", "criteriaUpdates", "date"]
};

export const analyzeEvolution = async (sessions: any[], assessments: any[], currentCriteria: any[]) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  // Prepare Data Context
  const sessionContext = sessions.slice(0, 5).map(s =>
    `[SESSÃO ${new Date(s.date).toLocaleDateString()}]\nQueixa: ${s.soap.queixa_principal}\nAvaliação: ${s.soap.avaliacao}\n`
  ).join('\n---\n');

  const assessmentContext = assessments.slice(0, 5).map(a =>
    `[${a.type} - ${new Date(a.date).toLocaleDateString()}] Score: ${a.score}`
  ).join('\n');

  const criteriaContext = currentCriteria.length > 0
    ? JSON.stringify(currentCriteria, null, 2)
    : "Nenhum critério definido ainda. Sugira 3 critérios iniciais baseados no caso.";

  const prompt = `
ANÁLISE DE EVOLUÇÃO E ALTA:

DADOS DAS SESSÕES (Últimas 5):
${sessionContext}

DADOS DE AVALIAÇÕES (Scores):
${assessmentContext}

CRITÉRIOS DE ALTA ATUAIS:
${criteriaContext}

TAREFA:
1. Analise a correlação entre os relatos das sessões e a variação dos scores. (Ex: "Ansiedade aumentou devido a X").
2. Gere um relatório texto rico em Markdown explicando essa evolução ("Meta-Análise").
2.1. BUSQUE INCONGRUÊNCIAS: Compare os scores das escalas com o relato verbal. (Ex: "Paciente marcou Isolamento alto na escala, mas relatou ter ido a festas"). Aponte essas discrepâncias.
3. Revise cada Critério de Alta:
    - Se a evidência nas sessões/scores mostra que foi atingido, mude para 'achieved'.
    - Se houver progresso, 'in_progress'.
    - Se não houver, 'pending'.
    - Se não houver critérios, crie novos relevantes.
    - JUSTIFIQUE com evidências (Ex: "GAD-7 baixou para 4 por 3 semanas").

Responda no formato JSON solicitado.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: evolutionSchema,
        temperature: 0.1
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Evolution analysis failed:", error);
    throw error;
  }
};

// --- SESSION PLANNING (BRIEFING) ---

const sessionPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    contextAlert: { type: Type.STRING, description: "Alerta curto se houve piora/risco (ex: 'Piora em Ansiedade'). Se tudo bem, null." },
    sessionGoal: { type: Type.STRING, description: "Objetivo central da sessão (Ajustado ao estado atual)." },
    script: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING, enum: ["Check-in", "Revisão", "Tópico Principal", "Planejamento"] },
          duration: { type: Type.STRING, description: "Ex: 5 min" },
          content: { type: Type.STRING, description: "O que fazer/falar especificamente." },
          reasoning: { type: Type.STRING, description: "Por que isso? (Baseado no histórico/estado)." }
        },
        required: ["section", "duration", "content", "reasoning"]
      }
    }
  },
  required: ["sessionGoal", "script"]
};

export const generateSessionPlan = async (lastSession: any, latestAssessment: any, treatmentGoals: string[]) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const contextData = `
Última Sessão (${new Date(lastSession?.date).toLocaleDateString() || 'N/A'}):
Queixa: ${lastSession?.soap?.queixa_principal || 'N/A'}
Plano deixado: ${lastSession?.soap?.plano?.join('; ') || 'N/A'}

Última Avaliação:
${latestAssessment ? `${latestAssessment.type}: ${latestAssessment.score} (${new Date(latestAssessment.date).toLocaleDateString()})` : "Nenhuma recente"}

Objetivos do Tratamento:
${treatmentGoals.join('; ')}
  `;

  const prompt = `
VOCÊ É: Um Supervisor Clínico preparando o terapeuta para a sessão de HOJE.
SUA TAREFA: Criar um ROTEIRO DINÂMICO DE SESSÃO.

DADOS DO PACIENTE:
${contextData}

DIRETRIZES DE DECISÃO:
1. CHEQUE O STATUS: Se o score da avaliação subiu muito ou a última sessão foi de crise, O OBJETIVO MUDA para "Estabilização/Crise".
2. SE ESTIVER ESTÁVEL: Siga os "Objetivos do Tratamento" e o que ficou pendente no "Plano deixado".
3. ROTEIRO:
   - Check-in: Perguntas específicas ligadas à semana anterior.
   - Revisão: Cobrar tarefas de casa pendentes.
   - Tópico Principal: O exercício ou tema central.
   - Planejamento: Tarefa para próxima semana.

Gere o JSON conforme schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: RATES.FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: sessionPlanSchema,
        temperature: 0.3
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Session planning failed:", error);
    throw error;
  }
};

// 6. Topic Alignment Schema (Therapy GPS)
const topicAlignmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: ['aligned', 'divergent', 'crisis', 'avoidance'] },
    currentFocus: { type: Type.STRING, description: "O tema central das sessões recentes (ex: Briga com chefe)" },
    mainGoal: { type: Type.STRING, description: "O objetivo original do tratamento (ex: Ansiedade Social)" },
    relevanceScore: { type: Type.NUMBER, description: "0 a 100. O quanto o foco atual ajuda no objetivo original?" },
    analysis: { type: Type.STRING, description: "Explicação clínica. Ex: 'Paciente evita falar de X puxando assunto Y'." },
    bridgeStrategy: { type: Type.STRING, description: "Uma frase para o terapeuta usar que conecta o tema atual de volta ao objetivo principal." }
  },
  required: ["status", "currentFocus", "mainGoal", "relevanceScore", "analysis", "bridgeStrategy"]
};

export const analyzeTopicAlignment = async (recentSessions: any[], treatmentGoals: string[]) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const historyContext = recentSessions.map((s, i) =>
    `Sessão -${i}: ${s.soap.queixa_principal} | Assuntos: ${s.soap.subjetivo?.map((sub: any) => sub.conteudo).join(', ') || 'N/A'}`
  ).join('\n---\n');

  const goalsContext = treatmentGoals.join('; ');

  const prompt = `
ANÁLISE DE "THERAPY GPS" (Alinhamento de Tópicos):

OBJETIVOS DO TRATAMENTO (Plano A):
${goalsContext}

HISTÓRICO RECENTE (O que o paciente trouxe):
${historyContext}

SUA TAREFA:
1. Identifique o "Foco Atual" (Plano B/C) que o paciente está trazendo.
2. Compare com o "Objetivo Principal" (Plano A).
3. Classifique a situação:
   - 'aligned': O paciente está falando do tema A (mesmo que indiretamente).
   - 'divergent': Assunto aleatório, "conversa de elevador".
   - 'avoidance': O paciente MUDA de assunto sempre que toca no tema A (Fuga).
   - 'crisis': O novo tema é URGENTE e grave (ex: divórcio, demissão) e deve ter prioridade.
4. Crie uma "Estratégia de Amarração" (Bridge): Uma frase curta para o terapeuta mostrar como o tema atual se conecta (ou esconde) o tema principal.

Retorne APENAS o JSON.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: topicAlignmentSchema,
        temperature: 0.3
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Topic Alignment error:", error);
    // Fallback mock for demonstration if AI fails
    return {
      status: 'aligned',
      currentFocus: 'Análise de Rotina',
      mainGoal: treatmentGoals[0] || 'Geral',
      relevanceScore: 100,
      analysis: 'Não foi possível analisar no momento.',
      bridgeStrategy: 'Continue monitorando.'
    };
  }
};

// 7. Clinical Journey - Kick-off Schema
const kickOffSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    pbtNetwork: pbtSchema, // Reusing existing PBT schema
    guidelineRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          relevance: { type: Type.STRING, description: "Why this guideline applies to this patient" },
          source: { type: Type.STRING, description: "APA, NICE, etc." }
        },
        required: ["title", "relevance", "source"]
      }
    },
    suggestedDiagnosis: { type: Type.STRING },
    narrativeDraft: { type: Type.STRING, description: "Draft of the explanatory narrative based on Eells." }
  },
  required: ["pbtNetwork", "guidelineRecommendations", "suggestedDiagnosis", "narrativeDraft"]
};

export const generateInitialFormulation = async (anamnesis: string, assessments: any[]) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const scoreContext = assessments.map(a => `${a.type}: Scored ${a.score} (Risk: ${a.interpretation})`).join('; ');

  const prompt = `
JORNADA CLÍNICA - STAGE 1: KICK-OFF (Formulação Inicial):

DADOS DE ENTRADA:
- Anamnese: "${anamnesis.substring(0, 5000)}..."
- Escalas/Scores: ${scoreContext}

SUA MISSÃO:
1. LEITURA CRUZADA: Identifique padrões entre a fala do paciente (Anamnese) e os scores.
2. REDE PBT INICIAL: Desenhe a rede de processos que mantém o problema.
   - Use nós cognitivos ("Pensamento de morte"), afetivos ("Medo"), comportamentais ("Evitação").
   - Identifique ciclos viciosos.
3. CURADORIA DE DIRETRIZES: Baseado no perfil (ex: Pânico, Depressão), quais guidelines a ciência recomenda?
4. RASCUNHO EXPLICATIVO: Escreva um parágrafo conectando tudo para o prontuário.

SAÍDA:
Retorne APENAS o JSON.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: kickOffSchema,
        temperature: 0.4
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Kick-off error:", error);
    throw error;
  }
};

// 8. Clinical Journey - Alchemy Schema (Protocol Adaptation)
const alchemySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    metaphor: { type: Type.STRING, description: "A central metaphor linking the protocol to the patient's interest (e.g., RPG, Gardening)." },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalTitle: { type: Type.STRING },
          adaptation: { type: Type.STRING, description: "How this step is modified/explained to fit the patient." }
        },
        required: ["originalTitle", "adaptation"]
      }
    }
  },
  required: ["metaphor", "steps"]
};

export const adaptProtocol = async (protocolText: string, patientContext: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
JORNADA CLÍNICA - STAGE 2: ALCHEMY (Adaptação de Protocolo):

CONTEXTO DO PACIENTE:
${patientContext}

PROTOCOLO ORIGINAL (TRECHO):
"${protocolText}"

SUA MISSÃO:
1. Analise o "Protocolo Original" (Técnica Rígida).
2. Analise o "Contexto do Paciente" (Interesses, Limitações, Personalidade).
3. Crie uma ADAPTAÇÃO ("Alquimia"):
   - Encontre uma METÁFORA CENTRAL que faça sentido para este paciente (ex: Se ele gosta de jogos, use termos de RPG).
   - Reescreva os passos do protocolo usando essa metáfora, mas MANTENDO O EFEITO TERAPÊUTICO original.

Retorne APENAS o JSON.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: alchemySchema,
        temperature: 0.7
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Alchemy error:", error);
    throw error;
  }
};

// 9. Clinical Journey - Evolution Schema (PBT Updates)
const pbtEvolutionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hasChanges: { type: Type.BOOLEAN, description: "True if the session reveals NEW processes or changes existing ones." },
    newNodes: { type: Type.ARRAY, items: pbtSchema.properties!.nodes.items },
    newEdges: { type: Type.ARRAY, items: pbtSchema.properties!.edges.items },
    updates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nodeId: { type: Type.STRING },
          changeDescription: { type: Type.STRING }
        }
      }
    },
    reasoning: { type: Type.STRING, description: "Why these changes are proposed based on the new session." }
  },
  required: ["hasChanges", "newNodes", "newEdges", "updates", "reasoning"]
};

export const evolvePBT = async (currentPBT: any, sessionNotes: string, analysis: any) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
JORNADA CLÍNICA - STAGE 3: EVOLUÇÃO (Atualização da Rede PBT):

REDE ATUAL (JSON):
${JSON.stringify(currentPBT)}

NOVA SESSÃO (Notas):
"${sessionNotes}"

ANÁLISE S.O.A.P DA SESSÃO:
${JSON.stringify(analysis)}


SUA MISSÃO:
1. EVOLUÇÃO CONTÍNUA: Esta não é apenas uma análise da sessão atual. Você deve integrar as novas informações à REDE ACUMULADA.
2. PROCESSOS: Detecte novos processos (Nós) ou mudanças em processos existentes (ex: "Evitação" diminuiu, "Autocrítica" aumentou).
3. RELAÇÕES: Detecte novas conexões causais.
4. INTERVENÇÕES: Identifique intervenções clínicas realizadas pelo terapeuta (ex: "Desfusão", "Exposição") e adicione-as como nós do tipo "intervention" conectados aos processos que elas visam modificar.

SAÍDA:
Retorne um JSON propondo a ATUALIZAÇÃO da rede.
Se não houver nada relevante, retorne hasChanges: false.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: pbtEvolutionSchema,
        temperature: 0.3
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Evolution error:", error);
    throw error;
  }
};

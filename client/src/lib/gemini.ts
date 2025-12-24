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
  DEEP: "gemini-pro-latest",             // Raciocínio Profundo para Análise e PBT
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
SUA MISSÃO: Estruturar dados clínicos brutos em documentos formais, mapear processos PBT e garantira qualidade técnica do registro.

FILOSOFIA DA REDE PBT (HIPÓTESE, NÃO DOGMA):
- As setas representam HIPÓTESES CLÍNICAS a serem testadas, não leis imutáveis.
- A rede é dinâmica: deve ser ajustada conforme novos dados surgem (ex: intervenção funcionou? a conexão enfraqueceu?).

ALGORITMO PARA DECIDIR SETAS (USE EM CADA CONEXÃO):
1. Ordem Temporal: A costuma vir antes de B?
2. Mecanismo Plausível: Faz sentido funcionalmente A mexer em B?
3. Feedback: B também volta e mexe em A? Se sim, use Seta Bidirecional (↔).
   - Simples influência: Use Seta Unidirecional (→).

DEFINIÇÃO DE FORÇA (PESO):
- Forte (Linha grossa/Ponta grande): Relação CENTRAL para o caso. Influência determinante.
- Moderada (Padrão): Relação relevante, mas não é o "coração" do problema.
- Fraca (Linha fina): Influência periférica ou incerta.

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
CONTEXTO: O terapeuta realizou uma sessão assistida por chat.Abaixo está o histórico da conversa e anotações rápidas feitas durante o atendimento.
  
  HISTÓRICO DO CHAT DA SESSÃO:
  ${chatHistory}

TAREFA:
  Transforme esse diálogo fragmentado e anotações rápidas em um REGISTRO S.O.A.P FORMAL e uma ANÁLISE PBT COMPLETA, como se fosse um prontuário oficial feito após a sessão.
  Ignore comandos técnicos do terapeuta(ex: "analise isso") e foque no conteúdo clínico relatado.
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


// === 1. CO-PILOTO "HANK CIVILIZADO" (Cérebro PBE + Alma Humana) ===
export const getCoPilotSuggestion = async (input: string, context: string, patient: any) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  // Identidade para as metáforas sensoriais
  const identity = patient?.occupation || patient?.profisao || "a vida cotidiana";

  const prompt = `
ATUE COMO: "Hank Civilizado" (Uma persona terapêutica baseada em PBE, mas com prosa moderna).
BASE CLÍNICA: Terapia Baseada em Processos (PBT) e Análise Funcional.

DADOS DO PACIENTE:
- Identidade/Mundo: ${identity}
- Contexto: ${context}
FALA ATUAL: "${input}"

---
SEU GUIA DE ESTILO (IDENTIDADE DO TOM):
1. **Humano e Direto:** Fale com franqueza gentil. A verdade vem sem crueldade. Sem "cliniquês".
2. **Humor Seco (Dose Certa):** Use para desarmar defesas, nunca para ridicularizar a dor.
3. **Sem Floreios:** Frases curtas. Verbos fortes. Uma ideia por parágrafo.
4. **Validação antes de Direção:** Espelhe o sentimento antes de sugerir mudança.

COMO FAZER O PACIENTE SENTIR (A TÉCNICA):
- **Traga para o corpo:** Pergunte onde pega, como vibra. A cabeça mente, o corpo denuncia.
- **Metáfora Sensorial:** Use imagens do cotidiano ou da profissão dele (${identity}).
  - *Ex:* "É como um alarme de incêndio disparando por uma torrada."
- **Mecanismo, não Moral:** Explique como a mente funciona (evolução, hábito), tire a culpa.

ESTRUTURA DE RESPOSTA OBRIGATÓRIA (MÁX 4 LINHAS):
1. **Espelho/Validação:** Uma frase curta conectando com a dor.
2. **O Mecanismo (PBT/PBE):** Explique o nó (Fusão, Evitação, Reforço) usando uma imagem sensorial/metáfora.
3. **Ação:** Um passo concreto e minúsculo agora.

O QUE EVITAR A TODO CUSTO:
- Sarcasmo em momento vulnerável.
- Clichês de psicólogo ("Como você se sente com isso?").
- Palestras longas.

SUA ANÁLISE INTERNA (RÁPIDA):
- Qual o processo travado? (Evitação? Fusão?)
- Qual a função? (Alívio imediato?)
-> Traduza isso para o estilo "Hank Civilizado".

RESPOSTA (Direta para o terapeuta ler ou adaptar):
`;

  try {
    const result = await ai.models.generateContent({
      model: RATES.FAST, // Gemini 2.0 Flash é ótimo para captar nuances de tom
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.6 } // Temperatura média-alta para garantir a criatividade da "prosa moderna"
    });

    return result.text || "Sugestão indisponível.";
  } catch (e) {
    console.error("CoPilot Error:", e);
    return "Sugestão indisponível.";
  }
};

// === 6. CONSULTOR DE BIBLIOTECA (Lê o PDF Físico) ===
export const consultCoreLibrary = async (
  context: string,
  fileName: string = "core/Questionamento_Socrático_para_Terapeutas_Aprenda_a_Pensar_e_a_Intervir.pdf"
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await fetch(`/library/${fileName}`);
    if (!response.ok) throw new Error(`Arquivo ${fileName} não encontrado.`);

    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.includes('base64,') ? result.split('base64,')[1] : result);
      };
      reader.readAsDataURL(blob);
    });

    const prompt = `
    ATUE COMO: Bibliotecário Clínico Socrático.
    CONTEXTO DA SESSÃO: ${context}
    FONTE: Manual de Questionamento Socrático em anexo.
    
    TAREFA: 
    Busque no manual uma técnica de questionamento ou um roteiro de perguntas específico que se aplique AGORA a este contexto.
    Não invente. Cite a técnica do livro e sugira como aplicar.
    `;

    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [
        { role: "user", parts: [{ text: prompt }, { inlineData: { data: base64, mimeType: "application/pdf" } }] }
      ],
      config: { temperature: 0.1 }
    });

    return result.text;
  } catch (e) {
    console.error("Library Consult Error:", e);
    return "Erro ao ler manual.";
  }
};

// === 2. GERADOR DE ROTEIRO (GPS Terapêutico) ===
export const generateSessionScript = async (patientName: string, lastSession: string, plan: string, isCrisis: boolean, crisisDetail: string = "") => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const baseInstructions = `
VOCÊ É: Um supervisor clínico especializado em preparação de sessões.

FORMATO DE RESPOSTA (OBRIGATÓRIO):
Primeiro, forneça um **RESUMO BREVE DA ÚLTIMA SESSÃO** (2-3 frases).
Depois, forneça o **ROTEIRO DA SESSÃO DE HOJE** como um checklist Markdown.

Exemplo de formato:
---
📝 **ÚLTIMA SESSÃO:**
[Resumo aqui]

📋 **ROTEIRO DE HOJE:**
- [ ] Item 1
- [ ] Item 2
---
`;

  const prompt = isCrisis
    ? `${baseInstructions}
MODO CRISE: O paciente ${patientName} trouxe uma situação de urgência: "${crisisDetail}". 
IGNORE o plano de tratamento padrão por hoje. 
Crie um roteiro de sessão focado em ACOLHIMENTO, ESTABILIZAÇÃO e SEGURANÇA.
Ainda assim, mencione brevemente a última sessão para contexto.
Última sessão: "${lastSession}"`
    : `${baseInstructions}
MODO PLANO: Paciente ${patientName}. 
Resumo da última sessão: "${lastSession}". 
Plano de Tratamento atual: "${plan}". 
Crie o roteiro da sessão de hoje (Agenda da Sessão) baseada na continuidade e no plano.`;

  try {
    const result = await ai.models.generateContent({
      model: RATES.FAST,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.4 }
    });

    return result.text || "- [ ] Erro ao gerar roteiro.";
  } catch (e) {
    console.error("Script Gen Error:", e);
    return "- [ ] Erro ao gerar roteiro.";
  }
};

// === 7. ANÁLISE PÓS-SESSÃO (EVOLUÇÃO TOTAL: PBT, Plano, Conceituação) ===
export const generatePostSessionAnalysis = async (
  sessionChat: string,
  currentPBT: any,
  currentPlan: any,
  currentFormulation: any
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  // Transforma os objetos em texto para a IA ler
  const pbtString = JSON.stringify(currentPBT || {});
  const planString = JSON.stringify(currentPlan || {});
  const formulationString = JSON.stringify(currentFormulation || {});

  const prompt = `
ATUE COMO: Supervisor Clínico Sênior (PBT e PBE).
TAREFA: Realizar a "Evolução do Caso" após a sessão de hoje.

INPUTS:
- CHAT DA SESSÃO: ${sessionChat}
- REDE PBT ANTERIOR: ${pbtString}
- PLANO ATUAL: ${planString}
- CONCEITUAÇÃO ATUAL: ${formulationString}

SUA MISSÃO (RACIOCÍNIO CLÍNICO):
1. **Rede PBT:** A sessão de hoje mudou a rede? (Algum nó enfraqueceu? Alguma conexão nova surgiu?)
2. **Plano de Tratamento:** O plano atual ainda faz sentido ou precisa de ajuste de rota? (Ex: O paciente travou na exposição? Surgiu nova demanda?)
3. **Conceituação:** Alguma hipótese diagnóstica caiu?

SAÍDA ESPERADA (JSON):
{
  "pbt_update": {
    "status": "mudou" | "mantido",
    "description": "Explicação curta da mudança na rede...",
    "new_struct": { "nodes": [], "edges": [] }, 
    "suggested_nodes_add": ["Novo Nó 1", "Novo Nó 2"],
    "suggested_edges_remove": ["Conexão X -> Y"]
  },
  "plan_review": {
    "status": "manter" | "ajustar",
    "reason": "Por que mudar?",
    "suggestions": [
      "Adicionar sessão de psicoeducação sobre X",
      "Reduzir intensidade da exposição"
    ]
  },
  "formulation_check": {
    "status": "confirmada" | "revisar",
    "insight": "Ex: Paciente apresentou traços de TDAH não notados antes."
  }
}
*IMPORTANTE: Se "new_struct" for fornecido, deve conter a rede completa atualizada (nodes e edges). Se for muito complexo gerar tudo, foque em descrever as mudanças.*
`;

  try {
    const result = await ai.models.generateContent({
      model: RATES.DEEP, // Usa o modelo Deep para essa análise complexa
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    return JSON.parse(result.text || '{}');
  } catch (error) {
    console.error("Post Session Error:", error);
    return null;
  }
};

// === 8. RADAR DE PROCESSOS (AO VIVO) ===
export const monitorActiveProcesses = async (lastMessages: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
ATUE COMO: Rastreador de Processos PBT em Tempo Real.
CONTEXTO: Trecho recente da sessão.

TEXTO: "${lastMessages}"

TAREFA:
Liste apenas os PROCESSOS (Nós) que estão ativos/quentes nestas falas exatas.
Classifique se estão "Rígidos" (Problemáticos) ou "Flexíveis" (Saudáveis).

JSON:
{
  "active_nodes": [
    { "label": "Ex: Pensamento Catastrófico", "status": "rigido", "intensity": "alta" },
    { "label": "Ex: Contato com Valores", "status": "flexivel", "intensity": "media" }
  ]
}
`;

  try {
    const result = await ai.models.generateContent({
      model: RATES.FAST, // Flash para ser instantâneo
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    return JSON.parse(result.text || '{ "active_nodes": [] }');
  } catch (error) {
    return { active_nodes: [] };
  }
};
// === 3. PLANEJAMENTO COM BIBLIOTECA ===
export const generatePlanFromMaterial = async (patientData: string, fileSource: { type: 'library' | 'upload', info: string }) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave API não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    let base64 = '';

    if (fileSource.type === 'library') {
      // 1. Fetch file from public library
      const response = await fetch(`/library/${fileSource.info}`);
      if (!response.ok) throw new Error(`Livro/Arquivo ${fileSource.info} não encontrado.`);

      const blob = await response.blob();
      base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      // 2. Direct Base64 (remove prefix if present)
      base64 = fileSource.info.includes('base64,') ? fileSource.info.split('base64,')[1] : fileSource.info;
    }

    const prompt = `
LEIA O PDF ANEXO. É um material clínico (protocolo, livro ou guideline).
Crie um plano de tratamento para o seguinte caso clínico, seguindo ESTRITAMENTE este material.

CASO CLÍNICO:
${patientData}

TAREFA:
Extraia do PDF as fases, intervenções e lógica de tratamento e aplique ao caso.

Responda em JSON:
{
  "protocol": "Nome extraído do PDF",
  "totalSessions": "Estimativa baseada no PDF",
  "frequency": "Semanal/Quinzenal",
  "phases": [
    {
      "name": "Nome da Fase (segundo PDF)",
      "sessions": "X-Y",
      "objectives": ["obj1", "obj2"],
      "interventions": ["int1", "int2"],
      "techniques": ["tech1", "tech2"]
    }
  ],
  "dischargeCriteria": ["critério1", "critério2"]
}
`;

    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType: "application/pdf" } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    return JSON.parse(result.text || '{}');

  } catch (e) {
    console.error("Library Plan Error:", e);
    throw e;
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
    `** Sessão ${i + 1}** (${new Date(s.date).toLocaleDateString()}): \n - Queixa: ${s.soap.queixa_principal} \n - Plano: ${s.soap.plano.join(', ')} `
  ).join('\n\n');

  const assessmentSummary = assessments.map(a =>
    `${a.type}: ${a.score} (${new Date(a.date).toLocaleDateString()})`
  ).join('\n');

  const prompt = `
VOCÊ É: Especialista em Análise de Evolução Clínica.
  MISSÃO: Cruzar dados qualitativos(sessões) com quantitativos(escalas) para detectar padrões de melhora ou piora.

SESSÕES RECENTES:
${sessionSummary}

AVALIAÇÕES:
${assessmentSummary}

CRITÉRIOS DE ALTA:
${criteria.map(c => `- ${c.criterion}: ${c.status}`).join('\n')}

TAREFA:
1. Analise a evolução do paciente comparando sessões e scores.
2. Identifique padrões(melhora, estagnação, piora).
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
VOCÊ É: Especialista em Process - Based Therapy(PBT) com foco em monitoramento contínuo.
  MISSÃO: Testar e ajustar a rede PBT(hipótese clínica) baseado nos novos dados da sessão.

FILOSOFIA DE ATUALIZAÇÃO:
- A rede anterior era uma HIPÓTESE.A sessão confirmou ou refutou essa hipótese ?
  - Teste : As intervenções alteraram os nós esperados ? As conexões se mantiveram ?

    REDE PBT ATUAL:
${currentNodesDesc}

NOTAS DA ÚLTIMA SESSÃO:
${notes}

TAREFA:
1. Identifique novos processos(nós) que surgiram.
2. Reavalie a FORÇA das conexões existentes:
- Alguma conexão "Forte" se mostrou mais fraca ou periférica ?
  - Algum ciclo de feedback(↔) foi quebrado ou descoberto ?
    3. Liste as mudanças:
- newNodes: novos processos detectados.
   - updates: alterações em nós / conexões existentes(ex: mudar "change" para "diminuiu", mudar peso de "forte" para "moderado").
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
2. Adapte cada passo ao contexto do paciente(idade, profissão, histórico).
3. Crie uma metáfora central que faça sentido para esse paciente.
4. Retorne em JSON:
{
  "metaphor": "Metáfora adaptada",
    "steps": [
      { "originalTitle": "Passo X", "adaptation": "Adaptação personalizada" }
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

  const assessmentSummary = assessments.map(a => `${a.type}: ${a.score} `).join('\n');

  const prompt = `
VOCÊ É: Especialista em Formulação de Caso(Modelo Eells).
  MISSÃO: Gerar formulação inicial baseada em anamnese e avaliações.

    ANAMNESE:
${anamnesisText}

AVALIAÇÕES:
${assessmentSummary}

TAREFA:
1. Sugira um diagnóstico preliminar(DSM - 5 / CID - 11).
2. Escreva uma narrativa explicativa integrando história de vida e sintomas atuais.
3. Liste intervenções baseadas em evidências(guidelines APA, NICE, etc).
4. Retorne em JSON:
{
  "suggestedDiagnosis": "Diagnóstico",
    "narrativeDraft": "Narrativa Eells",
      "guidelineRecommendations": [{ "title": "X", "relevance": "Alta/Média", "source": "Fonte" }]
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

// ========================================
// GERAÇÃO AUTOMÁTICA DE FICHA DE EVOLUÇÃO
// ========================================

const prontuarioRecordSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intervention: {
      type: Type.STRING,
      description: "Descrição detalhada das intervenções e técnicas utilizadas na sessão"
    },
    demandAssessment: {
      type: Type.STRING,
      description: "Avaliação da demanda principal apresentada pelo paciente"
    },
    objectives: {
      type: Type.STRING,
      description: "Objetivos trabalhados e próximos passos definidos"
    },
    preSessionNotes: {
      type: Type.STRING,
      description: "Observações prévias à sessão (se houver menção)"
    },
    evolution: {
      type: Type.STRING,
      description: "Descrição da evolução do paciente desde a última sessão"
    },
    observation: {
      type: Type.STRING,
      description: "Observações clínicas adicionais do profissional"
    },
    homework: {
      type: Type.STRING,
      description: "Tarefas e atividades propostas para o paciente"
    },
    continuity: {
      type: Type.STRING,
      description: "Registro de encaminhamento, continuidade ou encerramento do tratamento"
    }
  },
  required: ["intervention", "demandAssessment", "objectives", "evolution", "continuity"]
};

export const generateSessionRecord = async (
  sessionData: {
    soap: {
      queixa_principal: string;
      subjetivo: { conteudo: string; citacao: string }[];
      objetivo: string;
      avaliacao: string;
      plano: string[];
    };
    notes?: string;
    patientName?: string;
  }
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
VOCÊ É: Um assistente especializado em documentação clínica conforme Resolução CFP nº 01/2009.

DADOS DA SESSÃO:
Paciente: ${sessionData.patientName || 'N/A'}

QUEIXA PRINCIPAL:
${sessionData.soap.queixa_principal}

SUBJETIVO (Relato do paciente):
${sessionData.soap.subjetivo.map(s => `- ${s.conteudo}`).join('\n')}

OBJETIVO (Observações clínicas):
${sessionData.soap.objetivo}

AVALIAÇÃO CLÍNICA:
${sessionData.soap.avaliacao}

PLANO TERAPÊUTICO:
${sessionData.soap.plano.join('\n')}

${sessionData.notes ? `ANOTAÇÕES ADICIONAIS DO TERAPEUTA:\n${sessionData.notes}` : ''}

TAREFA:
Gere uma FICHA DE EVOLUÇÃO formal e profissional para prontuário clínico, preenchendo cada campo com linguagem técnica adequada.

REGRAS IMPORTANTES:
1. Use linguagem formal e técnica (ex: "Paciente refere...", "Observou-se...", "Foi realizada...")
2. Seja descritivo mas conciso
3. Se não houver informação para um campo, use "Não há registro específico sobre este tópico nas anotações da sessão."
4. O campo "continuity" deve sempre indicar se o tratamento continua, foi encerrado ou há encaminhamento
`;

  try {
    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: prontuarioRecordSchema,
        temperature: 0.2,
      }
    });

    return JSON.parse(result.text || '{}');
  } catch (error) {
    console.error("Error generating session record:", error);
    throw error;
  }
};

// ========================================
// PLANO DE TRATAMENTO (PBE)
// ========================================

export const generateTreatmentSuggestions = async (
  patientData: {
    anamnesis: string;
    formulation: any;
    pbtNetwork: { nodes: any[]; edges: any[] };
    diagnosis?: string;
    comorbidities?: string[];
  }
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
Você é um supervisor clínico especializado em Prática Baseada em Evidências (PBE).

DADOS DO PACIENTE:
Diagnóstico: ${patientData.diagnosis || 'A definir'}
Comorbidades: ${patientData.comorbidities?.join(', ') || 'Nenhuma identificada'}

ANAMNESE:
${patientData.anamnesis || 'Não disponível'}

CONCEITUAÇÃO DE CASO:
${JSON.stringify(patientData.formulation, null, 2) || 'Não disponível'}

REDE PBT (Processos-alvo):
${patientData.pbtNetwork?.nodes?.map(n => `- ${n.label} (${n.category})`).join('\n') || 'Não disponível'}

TAREFA:
Analise o caso e sugira:
1. GUIDELINES internacionais relevantes (NICE, APA, WHO, etc.)
2. PROTOCOLOS manualizados aplicáveis (com número de sessões típico)
3. LACUNAS de informação que o clínico deveria investigar
4. ABORDAGENS alternativas viáveis

Responda em JSON:
{
  "suggestions": [
    { "type": "guideline", "title": "...", "description": "...", "source": "..." },
    { "type": "protocol", "title": "...", "description": "..." },
    { "type": "gap", "title": "...", "description": "..." },
    { "type": "approach", "title": "...", "description": "..." }
  ]
}
`;

  try {
    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(result.text || '{"suggestions": []}');
  } catch (error) {
    console.error("Error generating treatment suggestions:", error);
    throw error;
  }
};

export const generateTreatmentPlan = async (
  patientData: {
    anamnesis: string;
    formulation: any;
    pbtNetwork: { nodes: any[]; edges: any[] };
    selectedProtocols: string[];
    customFocus?: string;
  }
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("Chave de API não encontrada.");

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
Você é um supervisor clínico especializado em PBE (Prática Baseada em Evidências).

DADOS DO PACIENTE:
${patientData.anamnesis ? `ANAMNESE:\n${patientData.anamnesis.substring(0, 2000)}` : ''}

CONCEITUAÇÃO:
${JSON.stringify(patientData.formulation, null, 2) || 'Não disponível'}

PROCESSOS-ALVO (Rede PBT):
${patientData.pbtNetwork?.nodes?.slice(0, 10).map(n => `- ${n.label} (${n.category})`).join('\n') || 'Não disponível'}

PROTOCOLOS SELECIONADOS:
${patientData.selectedProtocols?.join(', ') || 'Nenhum específico'}

${patientData.customFocus ? `FOCO ADICIONAL DO CLÍNICO:\n${patientData.customFocus}` : ''}

TAREFA:
Gere um PLANO DE TRATAMENTO estruturado em fases. Baseie-se nos protocolos selecionados.

Responda em JSON:
{
  "protocol": "Nome do protocolo principal",
  "totalSessions": "X-Y",
  "frequency": "Semanal/Quinzenal",
  "phases": [
    {
      "name": "Fase Inicial",
      "sessions": "1-4",
      "objectives": ["objetivo1", "objetivo2"],
      "interventions": ["intervenção1", "intervenção2"],
      "techniques": ["técnica1", "técnica2"]
    }
  ],
  "dischargeCriteria": ["critério1", "critério2"]
}

REGRAS:
1. Divida em 3 fases mínimo (Inicial, Intermediária, Final)
2. O número de sessões deve seguir o protocolo citado
3. Priorize intervenções para os processos centrais da rede PBT
4. Inclua técnicas específicas com base no protocolo
`;

  try {
    const result = await ai.models.generateContent({
      model: RATES.DEEP,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(result.text || '{}');
  } catch (error) {
    console.error("Error generating treatment plan:", error);
    throw error;
  }
};

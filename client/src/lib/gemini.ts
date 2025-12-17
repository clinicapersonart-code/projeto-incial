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
          weight: { type: Type.STRING, enum: ["fraco", "moderado", "forte"], description: "Força da conexão" }
        },
        required: ["source", "target", "relation", "weight"]
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

// Auxiliary definition helper for recursion workaround if needed, 
// strictly defined above instead for simplicity in this iteration.



export const systemInstruction = `
VOCÊ É: O "Copiloto Clínico PBE", um assistente de auditoria para terapeutas.
SUA MISSÃO: Estruturar dados clínicos, mapear processos e sugerir intervenções com RASTREABILIDADE TOTAL.

REGRAS DE OURO (THE 4 LOCKS):
1. GROUNDING (RASTREABILIDADE): Você não pode inventar fatos. Para cada ponto subjetivo do SOAP, você DEVE extrair uma citação direta do texto original que comprove aquela afirmação.
2. AUDITOR HUMILDE: Use linguagem probabilística ("Sugere-se", "Evidências indicam"). Nunca dê ordens.
3. TAXONOMIA PBT: Ao criar nós da rede, use preferencialmente termos da TCC/ACT/PBT (ex: Evitação, Fusão, Atenção Flexível).
4. ESTRUTURA RÍGIDA: Responda APENAS no formato JSON solicitado.

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

import { Assessment } from "./forms";
import { EellsFormulation } from "./eells";
import { EellsData } from "./eells";

export interface Patient {
    id: string;
    name: string;
    birthDate?: string;
    email?: string;
    phone?: string;
    createdAt: string;

    // Diagnosis for hierarchical knowledge base
    primaryDisorder?: 'panic' | 'depression' | 'ocd' | 'gad' | 'social_anxiety' | 'ptsd' | 'other';
    comorbidities?: string[];

    // Records
    clinicalRecords: ClinicalRecords;

    // Eells Model Data
    eellsData?: EellsData;
}

export interface ClinicalRecords {
    anamnesis: {
        content: string; // HTML/Rich text or Markdown
        history: string[];
        updatedAt: string;
        structured?: {
            content: Record<number, string>;
            updatedAt: string;
        };
        ebp?: {
            content: Record<number, string>;
            updatedAt: string;
        };
    };
    caseFormulation: {
        content: string;
        pbtData?: any; // Dados da rede PBT (Nodes/Edges)
        eells?: EellsFormulation; // Nova estrutura Eells
        updatedAt: string;
    };
    treatmentPlan: {
        goals: string[];
        updatedAt: string;
        fullPlan?: any; // Plano completo gerado pela IA
    };
    assessments: Assessment[];
    customProtocols: Protocol[]; // New field for Curation/Adaptation plans
    sessions: SessionRecord[]; // Histórico das análises de IA
    dischargeCriteria?: DischargeCriteria[];
    evolutionAnalysis?: EvolutionAnalysis[];
    chatHistory?: { role: 'user' | 'assistant'; content: string }[];
    // Prontuário formal por sessão (CRP)
    prontuarioRecords?: Record<string, ProntuarioRecord>;
}

// Estrutura do Prontuário Formal (Res. CFP 01/2009)
export interface ProntuarioRecord {
    // Dados da sessão
    sessionDate: string;
    consultationType: 'presencial' | 'online';
    // Campos clínicos
    intervention: string;         // Intervenção realizada
    demandAssessment: string;     // Avaliação de demanda
    objectives: string;           // Registros de objetivos
    preSessionNotes: string;      // Anotações de antes da sessão
    evolution: string;            // Evolução
    observation: string;          // Observação
    homework: string;             // Dever de casa
    continuity: string;           // Registro de encaminhamento/encerramento/continuidade
    // Metadata
    updatedAt: string;
}

export interface Protocol {
    id: string;
    title: string;
    date: string;
    originalMaterial?: string; // name of file or brief desc
    content: string; // The generated plan (markdown)
}

export interface SessionRecord {
    id: string;
    date: string;
    duration?: string;
    notes: string; // Raw input notes
    soap: any; // Resultado do Gemini
    pbtNetwork: any; // Resultado do Gemini
    adaptation: any; // Resultado do Gemini
}

export interface DischargeCriteria {
    id: string;
    description: string;
    status: 'achieved' | 'in_progress' | 'pending';
    evidence: string;
    lastUpdated: string;
}

export interface EvolutionAnalysis {
    date: string;
    analysisText: string;
    criteriaUpdates: DischargeCriteria[];
}

export interface TopicAlignment {
    status: 'aligned' | 'divergent' | 'crisis' | 'avoidance';
    currentFocus: string; // "Topic C"
    mainGoal: string; // "Topic A"
    relevanceScore: number; // 0-100
    analysis: string; // Logic explanation
    bridgeStrategy: string; // The "Tie-back"
}

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

    // Status management
    status: 'ativo' | 'inativo';
    inactivationDate?: string;
    inactivationReason?: 'alta' | 'abandono' | 'transferencia' | 'outro';
    inactivationNotes?: string;

    // Schedule information
    schedule?: {
        dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Segunda, etc.
        time: string; // "14:00"
        frequency: 'semanal' | 'quinzenal' | 'mensal';
    };

    // Financial information
    billing?: {
        paymentType: 'particular' | 'convenio' | 'pacote';
        particularMode?: 'mensal' | 'avulsa'; // Para particulares
        sessionValue: number; // Valor da sessão em R$
        insurance?: {
            name: string; // Ex: "FUNSERV", "GAMA", "DANAMED"
            planCode?: string;
            reimbursementDays: number; // Dias para receber (ex: 60)
            billingType: 'por_guia' | 'mensal'; // FUNSERV=por_guia, GAMA/DANAMED=mensal
            issPercent?: number; // ISS - FUNSERV 2%
            irrfPercent?: number; // IRRF - 6% para todos
        };
        package?: {
            totalSessions: number;
            usedSessions: number;
            packageValue: number;
            startDate?: string;        // Início do pacote atual
            paymentDate?: string;      // Data do pagamento
            expiresAt?: string;
            history?: PackageHistoryEntry[];  // Histórico de pacotes anteriores
        };
    };
    // Payment history
    paymentRecords?: PaymentRecord[];
    // Scheduled sessions (for attendance tracking)
    scheduledSessions?: ScheduledSession[];

    // Diagnosis for hierarchical knowledge base
    primaryDisorder?: 'panic' | 'depression' | 'ocd' | 'gad' | 'social_anxiety' | 'ptsd' | 'other';
    comorbidities?: string[];

    // Records
    clinicalRecords: ClinicalRecords;

    // Eells Model Data
    eellsData?: EellsData;
}

// Package history entry for tracking previous packages
export interface PackageHistoryEntry {
    id: string;
    startDate: string;
    endDate: string;
    sessionsUsed: number;
    totalSessions: number;
    amountPaid: number;
    paymentDate: string;
}

// Scheduled session with attendance tracking
export interface ScheduledSession {
    id: string;
    scheduledDate: string; // ISO date
    scheduledTime: string; // HH:MM
    status: 'agendada' | 'presente' | 'falta' | 'remarcada' | 'cancelada';
    attendanceConfirmedAt?: string;
    rescheduledTo?: string; // New date if rescheduled
    paymentId?: string; // Link to payment record
    notes?: string;
    absenceReason?: string;
    chargedToPackage?: boolean;     // Se a sessão foi cobrada do pacote
    cancelledWithin24h?: boolean;   // Se cancelou com menos de 24h
}

// Financial payment record
export interface PaymentRecord {
    id: string;
    sessionDate: string;
    amount: number;
    status: 'pendente' | 'pago' | 'a_receber'; // a_receber = convênio
    paymentDate?: string;
    expectedDate?: string; // Para convênios
    method?: 'pix' | 'dinheiro' | 'cartao' | 'convenio' | 'pacote';
    notes?: string;
    sessionId?: string; // Link to scheduled session
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

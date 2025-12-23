// Tipos para o Modelo Eells de Formulação de Caso

export type EellsPhase =
    | 'assessment'
    | 'problemList'
    | 'mechanisms'
    | 'formulation'
    | 'treatment'
    | 'monitoring'
    | 'discharge';

export interface EellsProgress {
    assessment: number;      // 0-100
    problemList: number;     // 0-100
    mechanisms: number;      // 0-100
    formulation: number;     // 0-100
    treatment: number;       // 0-100
    monitoring: number;      // 0-100
    discharge: number;       // 0-100
    overall: number;         // 0-100 (média)
    currentPhase: EellsPhase;
}

export interface Problem {
    id: string;
    problem: string;
    frequency: string;
    severity: number;        // 0-10
    functionalImpairment: string;
    linkedPbtNodes: string[]; // IDs dos nodes PBT
    status: 'active' | 'resolved' | 'improved';
    createdAt: string;
}

export interface CoreBelief {
    id: string;
    belief: string;
    category: 'self' | 'others' | 'world';
    linkedNodes: string[];
}

export interface Goal {
    id: string;
    description: string;
    linkedProblems: string[];    // IDs dos problemas
    baseline: string;
    target: string;
    timeframe: string;
    measurableCriteria: string;
    currentProgress: number;     // 0-100
    status: 'pending' | 'in_progress' | 'almost_achieved' | 'achieved' | 'revised';
    history: GoalProgressEntry[];
    createdAt: string;
}

export interface GoalProgressEntry {
    date: string;
    progress: number;
    evidence: string;
    sessionId?: string;
}

export interface Intervention {
    id: string;
    name: string;
    type: string;               // "CBT", "Exposure", "ACT", etc
    rationale: string;
    targetNodes: string[];      // IDs dos nodes PBT
    targetGoals: string[];      // IDs das metas
    frequency: string;
    status: 'active' | 'paused' | 'completed';
    effectiveness: number;      // 0-100
    startDate: string;
    endDate?: string;
}

export interface PBTChange {
    nodeId: string;
    strengthBefore: number;
    strengthNow: number;
    change: number;
    status: 'aumentou' | 'diminuiu' | 'estavel';
}

export interface SessionWithEells {
    id: string;
    date: string;
    notes: string;
    soap: any;
    pbtNetwork: any;
    adaptation: any;

    // Novos campos Eells
    pbtChanges?: Record<string, PBTChange>;
    goalsReview?: {
        goalId: string;
        progressBefore: number;
        progressNow: number;
        evidence: string;
    }[];
}

export interface EellsFormulation {
    // Problem List Section
    problemList: {
        redFlags: string;
        chemicalDependence: boolean;
        suicidality: boolean;
        functioning: string;
    };

    // Diagnosis
    diagnosis: string;

    // Explanatory Hypothesis (Eells Core)
    explanatoryHypothesis: {
        precipitants: string;
        origins: string;
        resources: string;
        obstacles: string;
        coreHypothesis: string;
    };

    // Treatment Plan
    treatmentPlan: {
        goals: string;
        interventions: string;
    };

    // Narrative Summary
    narrative: string;

    // Metadata
    updatedAt?: string;
}

export interface EellsData {
    // 1. Assessment
    assessment: {
        anamnesisCompleted: boolean;
        anamnesisDate?: string;
        initialAssessments: {
            type: string;
            score: number;
            date: string;
        }[];
    };

    // 2. Problem List
    problemList: Problem[];

    // 3. Mechanisms
    mechanisms: {
        coreBeliefs: CoreBelief[];
        behavioralPatterns: string[];
    };

    // 4. Formulation
    formulation: EellsFormulation;

    // 5. Treatment Plan
    treatmentPlan: {
        goals: Goal[];
        interventions: Intervention[];
    };

    // 6. Progress
    progress: EellsProgress;
}

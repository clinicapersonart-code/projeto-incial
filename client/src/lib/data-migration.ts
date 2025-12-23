import { Patient } from '../types/patient';
import { EellsData, Problem, Goal, Intervention } from '../types/eells';

/**
 * Migra paciente antigo para formato Eells
 */
export function migratePatientToEells(patient: Patient): Patient {
    // Se já tem eellsData, retorna
    if (patient.eellsData) return patient;

    const eellsData: EellsData = {
        // 1. ASSESSMENT
        assessment: {
            anamnesisCompleted: !!patient.clinicalRecords.anamnesis.content,
            anamnesisDate: patient.clinicalRecords.anamnesis.content
                ? patient.clinicalRecords.anamnesis.updatedAt
                : undefined,
            initialAssessments: patient.clinicalRecords.assessments.slice(0, 1).map(a => ({
                type: a.type || 'Unknown',
                score: a.score || 0,
                date: a.date || patient.createdAt
            }))
        },

        // 2. PROBLEM LIST (inferir das sessões)
        problemList: inferProblemsFromSessions(patient),

        // 3. MECHANISMS
        mechanisms: {
            coreBeliefs: [],
            behavioralPatterns: []
        },

        // 4. FORMULATION
        formulation: {
            problemList: {
                redFlags: '',
                chemicalDependence: false,
                suicidality: false,
                functioning: ''
            },
            diagnosis: '',
            explanatoryHypothesis: {
                precipitants: '',
                origins: '',
                resources: '',
                obstacles: '',
                coreHypothesis: patient.clinicalRecords.caseFormulation.content || ''
            },
            treatmentPlan: {
                goals: '',
                interventions: ''
            },
            narrative: '',
            updatedAt: patient.clinicalRecords.caseFormulation.updatedAt
        },

        // 5. TREATMENT PLAN
        treatmentPlan: {
            goals: migrateGoals(patient),
            interventions: []
        },

        // 6. PROGRESS (será calculado automaticamente)
        progress: {
            assessment: 0,
            problemList: 0,
            mechanisms: 0,
            formulation: 0,
            treatment: 0,
            monitoring: 0,
            discharge: 0,
            overall: 0,
            currentPhase: 'assessment'
        }
    };

    return {
        ...patient,
        eellsData
    };
}

/**
 * Infere problemas das queixas das sessões SOAP
 */
function inferProblemsFromSessions(patient: Patient): Problem[] {
    const problems: Problem[] = [];
    const seenProblems = new Set<string>();

    // Pega queixa principal de cada sessão
    patient.clinicalRecords.sessions.forEach(session => {
        const queixa = session.soap?.queixa_principal;
        if (queixa && !seenProblems.has(queixa)) {
            seenProblems.add(queixa);

            problems.push({
                id: crypto.randomUUID(),
                problem: queixa,
                frequency: 'A definir',
                severity: 5, // Médio por padrão
                functionalImpairment: 'A definir',
                linkedPbtNodes: [],
                status: 'active',
                createdAt: session.date
            });
        }
    });

    return problems;
}

/**
 * Migra goals antigas (string[]) para novos Goals
 */
function migrateGoals(patient: Patient): Goal[] {
    const oldGoals = patient.clinicalRecords.treatmentPlan.goals || [];

    return oldGoals.map((goalText, index) => ({
        id: crypto.randomUUID(),
        description: goalText,
        linkedProblems: [],
        baseline: 'A definir',
        target: 'A definir',
        timeframe: 'A definir',
        measurableCriteria: 'A definir',
        currentProgress: 0,
        status: 'in_progress' as const,
        history: [],
        createdAt: patient.clinicalRecords.treatmentPlan.updatedAt
    }));
}

/**
 * Inicializa eellsData vazio para novo paciente
 */
export function initializeEellsData(): EellsData {
    return {
        assessment: {
            anamnesisCompleted: false,
            initialAssessments: []
        },
        problemList: [],
        mechanisms: {
            coreBeliefs: [],
            behavioralPatterns: []
        },
        formulation: {
            problemList: {
                redFlags: '',
                chemicalDependence: false,
                suicidality: false,
                functioning: ''
            },
            diagnosis: '',
            explanatoryHypothesis: {
                precipitants: '',
                origins: '',
                resources: '',
                obstacles: '',
                coreHypothesis: ''
            },
            treatmentPlan: {
                goals: '',
                interventions: ''
            },
            narrative: '',
            updatedAt: new Date().toISOString()
        },
        treatmentPlan: {
            goals: [],
            interventions: []
        },
        progress: {
            assessment: 0,
            problemList: 0,
            mechanisms: 0,
            formulation: 0,
            treatment: 0,
            monitoring: 0,
            discharge: 0,
            overall: 0,
            currentPhase: 'assessment'
        }
    };
}

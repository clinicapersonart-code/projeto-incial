import { Patient } from '../types/patient';
import { EellsProgress, EellsPhase } from '../types/eells';

/**
 * Calcula o progresso de cada fase do modelo Eells
 */
export function calculateEellsProgress(patient: Patient): EellsProgress {
    const progress: EellsProgress = {
        assessment: 0,
        problemList: 0,
        mechanisms: 0,
        formulation: 0,
        treatment: 0,
        monitoring: 0,
        discharge: 0,
        overall: 0,
        currentPhase: 'assessment'
    };

    // 1. ASSESSMENT (0-100%)
    let assessmentScore = 0;
    if (patient.clinicalRecords.anamnesis.content) {
        assessmentScore += 50; // Anamnese preenchida
    }
    if (patient.clinicalRecords.assessments.length > 0) {
        assessmentScore += 50; // Pelo menos 1 avaliação
    }
    progress.assessment = assessmentScore;

    // 2. PROBLEM LIST (0-100%)
    const eellsData = (patient as any).eellsData;
    if (eellsData?.problemList?.length > 0) {
        progress.problemList = 100;
    }

    // 3. MECHANISMS (0-100%)
    let mechanismsScore = 0;
    // Verifica se tem rede PBT em alguma sessão
    const hasPBT = patient.clinicalRecords.sessions.some(s => s.pbtNetwork?.nodes?.length > 0);
    if (hasPBT) {
        mechanismsScore += 50;
    }
    if (eellsData?.mechanisms?.coreBeliefs?.length > 0) {
        mechanismsScore += 50;
    }
    progress.mechanisms = mechanismsScore;

    // 4. FORMULATION (0-100%)
    let formulationScore = 0;
    const formulation = eellsData?.formulation;
    if (formulation) {
        if (formulation.precipitants?.length > 0) formulationScore += 25;
        if (formulation.origins?.length > 0) formulationScore += 25;
        if (formulation.strengths?.length > 0) formulationScore += 25;
        if (formulation.coreHypothesis) formulationScore += 25;
    }
    progress.formulation = formulationScore;

    // 5. TREATMENT (0-100%)
    let treatmentScore = 0;
    const goals = eellsData?.treatmentPlan?.goals || [];
    const interventions = eellsData?.treatmentPlan?.interventions || [];

    if (goals.length > 0) treatmentScore += 30;
    if (interventions.length > 0) treatmentScore += 30;

    const goalsWithProgress = goals.filter((g: any) => g.currentProgress > 0);
    if (goalsWithProgress.length > 0) {
        treatmentScore += 40;
    }
    progress.treatment = treatmentScore;

    // 6. MONITORING (0-100%)
    let monitoringScore = 0;
    const sessions = patient.clinicalRecords.sessions.length;
    if (sessions >= 3) monitoringScore += 50;

    // Reavaliações periódicas
    const hasReassessments = patient.clinicalRecords.assessments.length > 1;
    if (hasReassessments) monitoringScore += 50;
    progress.monitoring = monitoringScore;

    // 7. DISCHARGE (0-100%)
    let dischargeScore = 0;
    const goalsAchieved = goals.filter((g: any) => g.currentProgress >= 80);
    if (goals.length > 0 && goalsAchieved.length === goals.length) {
        dischargeScore += 40;
    }

    const dischargeCriteria = patient.clinicalRecords.dischargeCriteria || [];
    const criteriaAchieved = dischargeCriteria.filter(c => c.status === 'achieved');
    if (dischargeCriteria.length > 0 && criteriaAchieved.length === dischargeCriteria.length) {
        dischargeScore += 40;
    }

    // Plano de prevenção de recaída (hipotético por enquanto)
    if (dischargeScore >= 80) dischargeScore += 20;

    progress.discharge = dischargeScore;

    // OVERALL (média)
    const phases = [
        progress.assessment,
        progress.problemList,
        progress.mechanisms,
        progress.formulation,
        progress.treatment,
        progress.monitoring,
        progress.discharge
    ];
    progress.overall = Math.round(phases.reduce((a, b) => a + b, 0) / 7);

    // Determina fase atual (primeira não completa)
    if (progress.assessment < 100) progress.currentPhase = 'assessment';
    else if (progress.problemList < 100) progress.currentPhase = 'problemList';
    else if (progress.mechanisms < 100) progress.currentPhase = 'mechanisms';
    else if (progress.formulation < 100) progress.currentPhase = 'formulation';
    else if (progress.treatment < 100) progress.currentPhase = 'treatment';
    else if (progress.monitoring < 100) progress.currentPhase = 'monitoring';
    else progress.currentPhase = 'discharge';

    return progress;
}

/**
 * Retorna a próxima ação recomendada baseada no progresso
 */
export function getNextRecommendedAction(patient: Patient): string {
    const progress = calculateEellsProgress(patient);

    if (progress.assessment < 100) {
        if (!patient.clinicalRecords.anamnesis.content) {
            return 'Preencher Anamnese estruturada';
        }
        if (patient.clinicalRecords.assessments.length === 0) {
            return 'Aplicar avaliação inicial (GAD-7, PHQ-9, etc)';
        }
    }

    if (progress.problemList < 100) {
        return 'Criar Lista de Problemas a partir das sessões';
    }

    if (progress.mechanisms < 100) {
        if (!patient.clinicalRecords.sessions.some(s => s.pbtNetwork?.nodes?.length > 0)) {
            return 'Realizar sessão e gerar Rede PBT';
        }
        return 'Identificar Crenças Nucleares';
    }

    if (progress.formulation < 100) {
        return 'Completar Formulação de Caso (Eells)';
    }

    if (progress.treatment < 100) {
        const eellsData = (patient as any).eellsData;
        if (!eellsData?.treatmentPlan?.goals?.length) {
            return 'Definir Metas Terapêuticas';
        }
        if (!eellsData?.treatmentPlan?.interventions?.length) {
            return 'Planejar Intervenções';
        }
        return 'Executar intervenções e monitorar progresso';
    }

    if (progress.monitoring < 100) {
        if (patient.clinicalRecords.sessions.length < 3) {
            return 'Continuar sessões (mínimo 3 para monitoramento)';
        }
        return 'Reavaliar com instrumentos (GAD-7, PHQ-9)';
    }

    if (progress.discharge < 100) {
        return 'Preparar critérios de alta e plano de prevenção';
    }

    return 'Processo completo! Considerar alta terapêutica';
}

/**
 * Verifica se o paciente está pronto para alta
 */
export function checkDischargeReadiness(patient: Patient): boolean {
    const progress = calculateEellsProgress(patient);
    return progress.discharge >= 80;
}

import { EBP_DIMENSIONS } from '../components/EBPAnamnesisForm';

interface Patient {
    clinicalRecords: {
        anamnesis: {
            content?: string;
            updatedAt?: string;
            structured?: {
                content: Record<number, string>;
                updatedAt: string;
            };
            ebp?: {
                content: Record<number, string>;
                updatedAt: string;
            };
        };
        [key: string]: any;
    };
    [key: string]: any;
}

/**
 * Aggregates all anamnesis data from a patient into a single formatted string.
 * Used by AI generation functions to have complete context.
 */
export function aggregateAnamnesisData(patient: Patient): string {
    const parts: string[] = [];
    const anamnesis = patient?.clinicalRecords?.anamnesis;

    if (!anamnesis) return "Sem anamnese registrada.";

    // 1. Structured Anamnesis (new or legacy format)
    let structuredContent = "";

    // Check new structure first
    if (anamnesis.structured?.content && typeof anamnesis.structured.content === 'object') {
        const entries = Object.entries(anamnesis.structured.content);
        if (entries.length > 0) {
            structuredContent = entries
                .map(([topicId, content]) => `Tópico ${topicId}: ${content}`)
                .join('\n');
        }
    }
    // Fallback to legacy structure
    else if (anamnesis.content) {
        try {
            const parsed = JSON.parse(anamnesis.content);
            if (typeof parsed === 'object') {
                structuredContent = Object.entries(parsed)
                    .map(([topicId, content]) => `Tópico ${topicId}: ${content}`)
                    .join('\n');
            } else {
                structuredContent = anamnesis.content;
            }
        } catch {
            structuredContent = anamnesis.content;
        }
    }

    if (structuredContent.trim()) {
        parts.push(`=== ANAMNESE ESTRUTURADA ===\n${structuredContent}`);
    }

    // 2. EBP Anamnesis
    if (anamnesis.ebp?.content && typeof anamnesis.ebp.content === 'object') {
        const ebpContent = anamnesis.ebp.content;
        const ebpParts: string[] = [];

        EBP_DIMENSIONS.forEach(dimension => {
            const dimAnswers: string[] = [];
            dimension.questions.forEach(q => {
                const answer = ebpContent[q.id];
                if (answer?.trim()) {
                    dimAnswers.push(`[${q.mechanism}] ${q.text}\nR: ${answer}`);
                }
            });
            if (dimAnswers.length > 0) {
                ebpParts.push(`--- ${dimension.title} ---\n${dimAnswers.join('\n\n')}`);
            }
        });

        if (ebpParts.length > 0) {
            parts.push(`=== ENTREVISTA BASEADA EM PROCESSOS (EBP) ===\n${ebpParts.join('\n\n')}`);
        }
    }

    if (parts.length === 0) {
        return "Sem anamnese registrada.";
    }

    return parts.join('\n\n');
}

/**
 * Gets a summary of anamnesis completion status
 */
export function getAnamnesisStatus(patient: Patient): {
    hasStructured: boolean;
    hasEBP: boolean;
    structuredDate?: string;
    ebpDate?: string;
} {
    const anamnesis = patient?.clinicalRecords?.anamnesis;

    const hasStructured = (() => {
        if (!anamnesis) return false;
        if (anamnesis.structured?.content && Object.keys(anamnesis.structured.content).length > 0) return true;
        if (anamnesis.content) {
            try {
                const parsed = JSON.parse(anamnesis.content);
                return Object.keys(parsed).length > 0;
            } catch {
                return anamnesis.content.trim().length > 0;
            }
        }
        return false;
    })();

    const hasEBP = (() => {
        const ebp = anamnesis?.ebp;
        if (!ebp?.content) return false;
        if (typeof ebp.content === 'object') {
            return Object.keys(ebp.content).length > 0;
        }
        return false;
    })();

    return {
        hasStructured,
        hasEBP,
        structuredDate: anamnesis?.structured?.updatedAt || anamnesis?.updatedAt,
        ebpDate: anamnesis?.ebp?.updatedAt
    };
}

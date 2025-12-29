/**
 * DischargeReport - Gera relatório de alta exportável
 * Resumo com: problemas iniciais, intervenções, evolução, prevenção, manutenção
 */

import React, { useMemo, useState } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    FileText,
    Download,
    Copy,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Calendar,
    User,
    Target,
    Shield
} from 'lucide-react';

export const DischargeReport: React.FC = () => {
    const { currentPatient } = usePatients();
    const [copied, setCopied] = useState(false);

    const report = useMemo(() => {
        if (!currentPatient) return null;

        const eellsData = (currentPatient as any).eellsData || {};
        const discharge = eellsData.discharge;
        const problems = eellsData.problemList || [];
        const interventions = eellsData.treatmentPlan?.interventions || [];
        const goals = eellsData.treatmentPlan?.goals || [];
        const monitoring = eellsData.monitoring || {};

        // Dados da prevenção de recaída
        const prevention = discharge?.relapsePrevention || {};
        const warningSigns = prevention.warningSigns || [];
        const copingStrategies = prevention.copingStrategies || [];
        const supportNetwork = prevention.supportNetwork || [];
        const letterParts = (prevention.letterToSelf || '|||').split('|||');

        // Evolução dos instrumentos
        const records = monitoring.instrumentRecords || [];
        const instrumentGroups = records.reduce((acc: any, r: any) => {
            if (!acc[r.instrumentName]) acc[r.instrumentName] = [];
            acc[r.instrumentName].push(r);
            return acc;
        }, {});

        // Gerar texto do relatório
        const lines: string[] = [];

        lines.push(`# RELATÓRIO DE ALTA TERAPÊUTICA`);
        lines.push(`**Paciente:** ${currentPatient.name}`);
        lines.push(`**Data:** ${new Date().toLocaleDateString('pt-BR')}`);
        lines.push(``);

        // 1. PROBLEMAS INICIAIS
        lines.push(`## 1. Problemas Identificados`);
        if (problems.length > 0) {
            problems.forEach((p: any) => {
                const status = p.status === 'resolved' ? '✅' : p.status === 'active' ? '🔄' : '⏸️';
                lines.push(`- ${status} ${p.description} (${p.domain || 'geral'})`);
            });
        } else {
            lines.push(`*Nenhum problema registrado*`);
        }
        lines.push(``);

        // 2. INTERVENÇÕES
        lines.push(`## 2. Intervenções Realizadas`);
        if (interventions.length > 0) {
            interventions.forEach((i: any) => {
                lines.push(`- **${i.name}** (${i.category || 'TCC'})`);
            });
        } else {
            lines.push(`*Nenhuma intervenção registrada*`);
        }
        lines.push(``);

        // 3. EVOLUÇÃO OBJETIVA
        lines.push(`## 3. Evolução dos Instrumentos`);
        const instrumentNames = Object.keys(instrumentGroups);
        if (instrumentNames.length > 0) {
            instrumentNames.forEach(name => {
                const recs = instrumentGroups[name].sort((a: any, b: any) =>
                    new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime()
                );
                const first = recs[0];
                const last = recs[recs.length - 1];
                const delta = last.score - first.score;
                const arrow = delta < 0 ? '↓ (melhora)' : delta > 0 ? '↑ (piora)' : '→ (estável)';
                lines.push(`- **${name}:** ${first.score} → ${last.score} ${arrow}`);
            });
        } else {
            lines.push(`*Nenhum instrumento aplicado*`);
        }
        lines.push(``);

        // 4. SINAIS DE ALERTA
        lines.push(`## 4. Sinais de Alerta para Recaída`);
        if (warningSigns.length > 0) {
            warningSigns.forEach((s: any) => {
                const icon = s.severity === 'critico' ? '🔴' : s.severity === 'moderado' ? '🟡' : '🟢';
                lines.push(`- ${icon} ${s.description} (${s.category})`);
            });
        } else {
            lines.push(`*Nenhum sinal definido*`);
        }
        lines.push(``);

        // 5. ESTRATÉGIAS DE ENFRENTAMENTO
        lines.push(`## 5. Estratégias de Enfrentamento`);
        if (copingStrategies.length > 0) {
            copingStrategies.forEach((s: any) => {
                const practiced = s.practiced ? '✓' : '';
                lines.push(`- ${s.description} (${s.category}) ${practiced}`);
            });
        } else {
            lines.push(`*Nenhuma estratégia definida*`);
        }
        lines.push(``);

        // 6. REDE DE APOIO
        lines.push(`## 6. Rede de Apoio`);
        if (supportNetwork.length > 0) {
            supportNetwork.forEach((c: any) => {
                lines.push(`- **${c.name}** (${c.relationship})${c.role ? ` - "${c.role}"` : ''}`);
            });
        } else {
            lines.push(`*Nenhum contato cadastrado*`);
        }
        lines.push(``);

        // 7. CARTA PARA SI MESMO
        if (letterParts.some((p: string) => p.trim())) {
            lines.push(`## 7. Carta para Si Mesmo`);
            if (letterParts[0]?.trim()) lines.push(`**O que funciona:** ${letterParts[0]}`);
            if (letterParts[1]?.trim()) lines.push(`**O que me derruba:** ${letterParts[1]}`);
            if (letterParts[2]?.trim()) lines.push(`**O que fazer:** ${letterParts[2]}`);
            lines.push(``);
        }

        // 8. PLANO DE MANUTENÇÃO
        const maintenance = discharge?.maintenancePlan;
        if (maintenance?.frequency || maintenance?.keyInstruments?.length) {
            lines.push(`## 8. Plano de Manutenção`);
            if (maintenance.frequency) lines.push(`- **Frequência:** ${maintenance.frequency}`);
            if (maintenance.keyInstruments?.length) lines.push(`- **Instrumentos-chave:** ${maintenance.keyInstruments.join(', ')}`);
            if (maintenance.boosterTopics?.length) lines.push(`- **Tópicos de reforço:** ${maintenance.boosterTopics.join(', ')}`);
            lines.push(``);
        }

        // 9. QUANDO PEDIR AJUDA
        lines.push(`## 9. Quando Pedir Ajuda`);
        lines.push(`Se os sinais de alerta aparecerem e as estratégias não ajudarem:`);
        lines.push(`1. Acione sua rede de apoio`);
        lines.push(`2. Retome as estratégias que funcionaram`);
        lines.push(`3. Procure suporte profissional se necessário`);
        if (supportNetwork.length > 0) {
            lines.push(``);
            lines.push(`**Seus contatos de apoio:**`);
            supportNetwork.slice(0, 3).forEach((c: any) => {
                lines.push(`- ${c.name} (${c.relationship})`);
            });
        }
        lines.push(``);

        lines.push(`---`);
        lines.push(`*Relatório gerado automaticamente pelo sistema*`);

        return lines.join('\n');
    }, [currentPatient]);

    const handleCopy = () => {
        if (report) {
            navigator.clipboard.writeText(report);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!currentPatient) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Relatório de Alta</h3>
                        <p className="text-sm text-gray-500">Resumo exportável do tratamento</p>
                    </div>
                </div>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                    {copied ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Copiado!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copiar
                        </>
                    )}
                </button>
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                    {report}
                </pre>
            </div>
        </div>
    );
};

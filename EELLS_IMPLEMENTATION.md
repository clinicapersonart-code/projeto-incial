# Implementação do Modelo Eells - Documentação Completa

## Visão Geral

O Modelo Eells é um framework de formulação de caso em TCC que guia o tratamento através de 7 etapas. Esta implementação integra todas as etapas no sistema de gestão clínica.

---

## 📊 Resumo das Etapas

| Etapa | Nome | Componentes | Status |
|-------|------|-------------|--------|
| 1 | Assessment/Baseline | Anamnese, fontes, instrumentos iniciais, cronograma | ✅ |
| 2 | Lista de Problemas | ProblemList, priorização, acordo | ✅ |
| 3 | Mecanismos | 4 quadrantes, processos, evidência | ✅ |
| 4 | Formulação | Narrativa, diagnóstico, FormulationCard | ✅ |
| 5 | Tratamento | Metas, intervenções, progresso (currentProgress) | ✅ |
| 6 | Progress Monitoring | Instrumentos em dia, DecisionLogs, checklist | ✅ |
| 7 | Alta | DischargeCard, DischargeReport, prevenção | ✅ |

---

## 🗂️ Arquivos Criados/Modificados

### Tipos (`client/src/types/eells.ts`)

```typescript
// Interfaces principais
- EellsData                 // Container principal
- EellsProgress             // Progresso por etapa
- EellsAssessment           // Etapa 1
- Problem                   // Etapa 2
- Mechanisms                // Etapa 3
- FormulationV2             // Etapa 4
- TreatmentPlan             // Etapa 5
- MonitoringData            // Etapa 6
- DischargeData             // Etapa 7

// Subtipos Etapa 7
- DischargeCriterion        // Critérios com peso e N/A
- WarningSign               // Sinais de alerta
- CopingStrategy            // Estratégias de enfrentamento
- MaintenancePlan           // Plano de manutenção
- DischargeHistoryEntry     // Histórico de alterações
- DischargeValidation       // Travas para alta
- CriterionStatus           // 'pending' | 'met' | 'not_applicable'
- DischargeStatus           // 'nao_indicada' | 'em_preparacao' | 'indicada' | 'alta_realizada'
```

### Componentes

| Arquivo | Função |
|---------|--------|
| `EellsRoadmap.tsx` | Visualização do progresso geral |
| `MonitoringCard.tsx` | Instrumentos e cronograma |
| `AlertCard.tsx` | Alertas de instrumentos pendentes |
| `SessionChecklist.tsx` | Checklist de instrumentos por sessão |
| `ProgressChart.tsx` | Gráfico de evolução com Recharts |
| `DecisionLogCard.tsx` | Log de decisões clínicas |
| `ActiveHypothesis.tsx` | Hipótese em teste (supervisor) |
| `DischargeCard.tsx` | Critérios, prevenção, rede, carta |
| `DischargeReport.tsx` | Relatório de alta exportável |

### Utilitários (`client/src/lib/eells-utils.ts`)

```typescript
// Funções principais
calculateEellsProgress(patient)       // Calcula % de cada etapa
getNextRecommendedAction(patient)     // Próxima ação específica
getNextRecommendedActionWithTab()     // Com aba alvo para navegação
```

---

## 📋 Detalhamento por Etapa

### Etapa 1: Assessment/Baseline (Avaliação Inicial)
> Coleta inicial de dados para formar a linha de base do tratamento.

- **30%** - Anamnese preenchida
- **20%** - Fontes externas colaterais (ou N/A justificado)
- **30%** - Instrumentos iniciais aplicados (GAD-7, PHQ-9, etc.)
- **20%** - Cronograma de reavaliações definido (frequência + instrumentos core)

### Etapa 2: Lista de Problemas
- **40%** - Problemas ativos identificados
- **30%** - Prioridades coerentes (rank + foco definido)
- **30%** - Acordo terapeuta-cliente revisado

### Etapa 3: Mecanismos
- **40%** - 4 quadrantes preenchidos (precipitantes, origens, recursos, obstáculos)
- **30%** - Processos mantenedores + crenças/padrões
- **30%** - Evidência vinculada (PBT, notas, instrumentos)

### Etapa 4: Formulação
- **50%** - Narrativa explicativa (>100 chars)
- **50%** - Diagnóstico (ou N/A justificado com ≥10 chars)

### Etapa 5: Tratamento (Treatment Planning)
- **30%** - Metas definidas (`treatmentPlan.goals.length > 0`)
- **30%** - Intervenções planejadas (`treatmentPlan.interventions.length > 0`)
- **40%** - Progresso registrado: **`goals.filter(g => g.currentProgress > 0)`**
  - ⚠️ Conta como progresso: atualização do campo `currentProgress` em qualquer meta
  - Exemplo: meta "Reduzir ansiedade" com `currentProgress: 40` = progresso registrado

### Etapa 6: Progress Monitoring (Monitoramento Ativo)
> Acompanhamento contínuo do tratamento com dados auditáveis.

- **40%** - Instrumentos em dia vs vencidos (`% instrumentos dentro do prazo`)
- **30%** - DecisionLogs existentes vinculados a dados (`decisionLogs.length > 0`)
- **30%** - Sessões com checklist preenchido (`sessionRecords com instrumentos aplicados`)

> **Diferença Etapa 1 vs 6:**
> - Etapa 1 = Coleta inicial (baseline)
> - Etapa 6 = Aderência ao cronograma + tomada de decisão baseada em dados

### Etapa 7: Alta (Discharge)
- **30%** - Critérios ≥75% atingidos
- **25%** - ≥1 sinal de alerta
- **25%** - ≥2 estratégias de enfrentamento
- **20%** - Plano de manutenção definido

---

## 🔒 Travas e Validações (Etapa 7)

### Para marcar "Alta Realizada":
1. ≥75% dos critérios atingidos (ponderado por peso)
2. ≥1 sinal de alerta cadastrado
3. ≥2 estratégias de enfrentamento cadastradas
4. Todos os critérios N/A com justificativa (≥5 chars)

### Regras de N/A:
- N/A é **excluído do denominador** (não infla progresso)
- Exige justificativa obrigatória
- Campo vermelho se justificativa < 5 chars

---

## 📄 DischargeCard - 4 Abas

| Aba | Conteúdo |
|-----|----------|
| **Critérios** | Checkbox (pending/met/N/A), peso, sugeridos |
| **Prevenção** | Sinais de alerta + estratégias |
| **Rede de Apoio** | Nome + relação + contato + papel |
| **Carta** | O que funciona / derruba / fazer |

---

## 📑 DischargeReport - 9 Seções

1. Problemas Identificados
2. Intervenções Realizadas
3. Evolução dos Instrumentos
4. Sinais de Alerta para Recaída
5. Estratégias de Enfrentamento
6. Rede de Apoio
7. Carta para Si Mesmo
8. Plano de Manutenção
9. Quando Pedir Ajuda

---

## 🔄 Integração com Roadmap

### calculateEellsProgress
- Retorna % de cada etapa (0-100)
- Calcula overall como média
- Identifica currentPhase

### getNextRecommendedAction
- Ações específicas por etapa
- Exemplos Etapa 7:
  - "Definir critérios de alta (Etapa 7)"
  - "Atingir critérios de alta (X% atual, meta: 75%)"
  - "Definir sinais de alerta para recaída (mínimo 1)"
  - "Definir estratégias de enfrentamento (X/2 mínimo)"
  - "Definir plano de manutenção (frequência + instrumentos-chave)"

---

## 📊 Histórico de Alterações

```typescript
interface DischargeHistoryEntry {
    id: string;
    date: string;
    changeType: 'criteria_update' | 'prevention_update' | 'status_change' | 'maintenance_update' | 'discharge_complete';
    description: string;
    snapshot?: {
        percentMet: number;
        criteriaMetCount: number;
        criteriaTotalCount: number;
        warningSignsCount: number;
        copingStrategiesCount: number;
        status: DischargeStatus;
    };
}
```

---

## 🚀 Como Testar

1. Acesse `http://localhost:3001/`
2. Selecione um paciente
3. No Dashboard, role até:
   - **DischargeCard** (Critérios de Alta)
   - **DischargeReport** (Relatório de Alta)
4. Adicione critérios sugeridos
5. Marque alguns como atingidos
6. Adicione sinais de alerta e estratégias
7. Verifique se o botão "Marcar Alta" libera

---

## 📝 Commits Realizados

```
feat(discharge): Etapa 7 - Criterios de alta, sinais de alerta, estrategias de enfrentamento, barra de progresso
feat(discharge): Travas e validacao para alta - status N/A com justificativa, minimo 1 sinal + 2 estrategias + 75%
feat(discharge): Integracao roadmap historico e plano de manutencao
feat(discharge): Rede de apoio e Carta para si mesmo - 4 abas, modal contatos, o que funciona/derruba/fazer
```

---

*Documentação gerada em 28/12/2024*

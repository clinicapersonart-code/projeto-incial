# 📋 Roadmap - HumanTrack

## 🔜 Próximas Tarefas (27/12/2024)

### 1. 🔍 Vertex AI / Grounding ✅
- [x] Integrar Google Search Grounding no Deep Research
- [x] Permitir busca atualizada de protocolos e guidelines na web
- [x] Retornar links e fontes verificáveis
- [ ] Configurar credenciais Vertex AI (opcional - grounding funciona com API padrão)

### 2. 🎤 Botão de Voz no Chat (Visão Geral do Paciente) ✅
- [x] Adicionar input de voz no chat da **Visão Geral** (PatientDashboard)
- [x] **NÃO** no CoPilotChat da sessão
- [x] Usar Web Speech API para transcrição
- [x] Facilitar comunicação/registro durante sessão
- [x] Indicador visual de gravação

### 3. 👨‍🏫 Campo SUPERVISOR (IA como Supervisor Clínico)
- [ ] Criar nova seção/aba "Supervisor"
- [ ] IA atua como supervisor clínico para:
  - Discussão de caso do paciente
  - Revisão de conceituação
  - Manutenção/ajustes quando necessário
  - Sugestões clínicas e feedback
- [ ] Estilo de conversa socrática/supervisão
- [ ] Histórico de supervisões

---

## ✅ Concluído (27/12/2024)

### Agenda (WeeklyCalendar) - Melhorias
- [x] Corrigido bug da tela branca (localStorage corrompido)
- [x] Cards de pacientes com avatares coloridos e iniciais
- [x] Exibição de diagnóstico e número da sessão
- [x] Tooltips com informações detalhadas ao passar o mouse
- [x] Modal para criar agendamento direto ao clicar em slots livres
- [x] Opção de remover agendamento
- [x] **Drag and Drop** - arrastar pacientes para mover horários

---

## ✅ Concluído (26/12/2024)

### GAS (Goal Attainment Scaling)
- [x] Botão "Gerar sugestões SMART" com IA
- [x] Geração automática dos 5 níveis (-2 a +2)
- [x] Dica sobre modelo SMART

### Plano de Tratamento
- [x] Sistema editável de fases e sessões
- [x] Upload de múltiplos PDFs (protocolos/guidelines)
- [x] Deep Research para recomendar protocolos
- [x] Integração com Tríade da PBE
- [x] Modal de análise clínica completa

### Bugs Corrigidos
- [x] Bug da Agenda (WeeklyCalendar) - localStorage corrompido
- [x] Erros TypeScript no gemini.ts (ai vs genAI)

---

## 📝 Notas Técnicas

### APIs em Uso
- Gemini API (Flash e Deep models)
- Web Speech API (planejado)
- Vertex AI (planejado)

### Arquivos Importantes
- `client/src/lib/gemini.ts` - Funções de IA
- `client/src/components/TreatmentPlanTab.tsx` - Plano de tratamento
- `client/src/components/GASPanel.tsx` - Metas GAS
- `client/src/components/CoPilotChat.tsx` - Chat principal

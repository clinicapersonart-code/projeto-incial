// Script para adicionar paciente de teste com ansiedade severa
// Cole este código no Console do navegador (F12) com a aplicação aberta

const testPatient = {
    "id": "test-patient-001",
    "name": "Maria Silva Santos",
    "birthDate": "1992-03-15",
    "email": "maria.teste@email.com",
    "phone": "(11) 98765-4321",
    "createdAt": "2024-09-01T10:00:00.000Z",
    "clinicalRecords": {
        "anamnesis": {
            "content": "Paciente de 32 anos, professora do ensino fundamental, procurou atendimento relatando sintomas de ansiedade intensa há aproximadamente 2 anos. Relata palpitações frequentes, pensamentos acelerados, dificuldade para dormir e preocupação excessiva. Histórico familiar de transtorno de ansiedade (mãe). Nega uso de substâncias. Relatou ter tido primeiro ataque de pânico em dezembro de 2022.",
            "history": [],
            "updatedAt": "2024-09-01T10:30:00.000Z"
        },
        "caseFormulation": {
            "content": "TAG com ataques de pânico",
            "updatedAt": "2024-09-05T14:00:00.000Z",
            "eells": {
                "problemList": {
                    "redFlags": "Ataques de pânico, insônia, ansiedade generalizada",
                    "chemicalDependence": false,
                    "suicidality": false,
                    "functioning": "Comprometimento moderado no trabalho"
                },
                "diagnosis": "Transtorno de Ansiedade Generalizada (F41.1) com Ataques de Pânico",
                "explanatoryHypothesis": {
                    "precipitants": "Sobrecarga no trabalho, pandemia",
                    "origins": "Histórico familiar de ansiedade, perfeccionismo",
                    "resources": "Suporte familiar, comprometimento com tratamento",
                    "obstacles": "Esquiva experiencial, pensamentos catastróficos",
                    "coreHypothesis": "Paciente desenvolveu padrão de hipervigilância e evitação"
                },
                "treatmentPlan": {
                    "goals": "Reduzir frequência de ataques de pânico, melhorar qualidade do sono",
                    "interventions": "TCC, exposição interoceptiva, reestruturação cognitiva"
                },
                "narrative": "Paciente apresenta quadro de TAG com componente de pânico."
            }
        },
        "treatmentPlan": {
            "goals": ["Reduzir ataques de pânico", "Melhorar sono", "Retornar ao trabalho"],
            "updatedAt": "2024-09-05T15:00:00.000Z"
        },
        "assessments": [
            { "id": "a1", "type": "GAD-7", "score": 18, "date": "2024-09-01T10:00:00.000Z" },
            { "id": "a2", "type": "GAD-7", "score": 15, "date": "2024-10-01T10:00:00.000Z" },
            { "id": "a3", "type": "GAD-7", "score": 12, "date": "2024-11-01T10:00:00.000Z" },
            { "id": "a4", "type": "GAD-7", "score": 9, "date": "2024-12-01T10:00:00.000Z" }
        ],
        "customProtocols": [],
        "sessions": [
            {
                "id": "s1",
                "date": "2024-09-08T14:00:00.000Z",
                "notes": "Primeira sessão. Paciente chegou ansiosa, relatou ter tido 3 ataques de pânico na última semana. Dificuldade em dormir, acordando às 3h da manhã com taquicardia. No trabalho, tem evitado reuniões com medo de passar mal na frente dos colegas.",
                "soap": {
                    "queixa_principal": "Ataques de pânico frequentes e insônia",
                    "subjetivo": [
                        { "conteudo": "3 ataques de pânico na última semana", "citacao": "tive 3 crises essa semana" },
                        { "conteudo": "Acorda às 3h com taquicardia", "citacao": "acordo de madrugada com coração acelerado" }
                    ],
                    "objetivo": "Paciente apresenta-se visivelmente ansiosa, fala acelerada, mãos trêmulas",
                    "avaliacao": "TAG severa com ataques de pânico. Esquiva de situações sociais por medo de passar mal",
                    "plano": ["Psicoeducação sobre ansiedade e pânico", "Iniciar diário de sintomas", "Técnica de respiração diafragmática"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n1", "label": "Pensamento catastrófico", "category": "Cognitiva", "change": "novo" },
                        { "id": "n2", "label": "Taquicardia", "category": "Biofisiológica", "change": "novo" },
                        { "id": "n3", "label": "Esquiva social", "category": "Comportamento", "change": "novo" }
                    ],
                    "edges": [
                        { "source": "n1", "target": "n2", "relation": "ativa", "weight": "forte", "bidirectional": false },
                        { "source": "n2", "target": "n3", "relation": "reforça", "weight": "moderado", "bidirectional": false }
                    ]
                },
                "adaptation": { "gatilho_identificado": true, "motivo_adapacao": "Primeira crise documentada", "sugestoes": [] }
            },
            {
                "id": "s2",
                "date": "2024-09-15T14:00:00.000Z",
                "notes": "Paciente trouxe diário preenchido. Identificou que ataques acontecem principalmente à noite e antes de dormir. Praticou respiração 2x ao dia, relatou melhora leve. Ainda evita reuniões no trabalho.",
                "soap": {
                    "queixa_principal": "Ansiedade noturna persistente",
                    "subjetivo": [
                        { "conteudo": "Ataques ocorrem principalmente à noite", "citacao": "percebi que piora de noite" },
                        { "conteudo": "Respiração ajudou um pouco", "citacao": "fiz os exercícios e melhorou um pouco" }
                    ],
                    "objetivo": "Paciente menos ansiosa que sessão anterior, trouxe diário organizado",
                    "avaliacao": "Padrão de ansiedade antecipatória identificado. Boa adesão aos exercícios",
                    "plano": ["Reestruturação cognitiva para pensamentos catastróficos", "Continuar diário", "Higiene do sono"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n1", "label": "Pensamento catastrófico", "category": "Cognitiva", "change": "estavel" },
                        { "id": "n2", "label": "Taquicardia", "category": "Biofisiológica", "change": "diminuiu" },
                        { "id": "n3", "label": "Esquiva social", "category": "Comportamento", "change": "estavel" },
                        { "id": "n4", "label": "Ansiedade antecipatória", "category": "Afetiva", "change": "novo" }
                    ],
                    "edges": [
                        { "source": "n4", "target": "n1", "relation": "ativa", "weight": "forte", "bidirectional": true },
                        { "source": "n1", "target": "n2", "relation": "ativa", "weight": "moderado", "bidirectional": false }
                    ]
                },
                "adaptation": { "gatilho_identificado": true, "motivo_adapacao": "Padrão noturno", "sugestoes": [] }
            },
            {
                "id": "s3",
                "date": "2024-09-22T14:00:00.000Z",
                "notes": "Semana difícil. Teve reunião importante no trabalho e teve ataque de pânico durante. Precisou sair da sala. Está com vergonha dos colegas. Questionando se vai conseguir continuar trabalhando.",
                "soap": {
                    "queixa_principal": "Ataque de pânico durante reunião no trabalho",
                    "subjetivo": [
                        { "conteudo": "Teve que sair da reunião por ataque de pânico", "citacao": "tive que sair correndo da sala" },
                        { "conteudo": "Sente vergonha dos colegas", "citacao": "agora todos viram, que vergonha" }
                    ],
                    "objetivo": "Paciente chorosa, expressão de frustração e desânimo",
                    "avaliacao": "Comportamento de esquiva reforçado pela experiência negativa. Risco de generalização da evitação",
                    "plano": ["Processamento do evento", "Exposição interoceptiva gradual", "Questionamento socrático sobre consequências"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n1", "label": "Pensamento catastrófico", "category": "Cognitiva", "change": "aumentou" },
                        { "id": "n3", "label": "Esquiva social", "category": "Comportamento", "change": "aumentou" },
                        { "id": "n5", "label": "Vergonha", "category": "Afetiva", "change": "novo" },
                        { "id": "n6", "label": "Autocrítica", "category": "Self", "change": "novo" }
                    ],
                    "edges": [
                        { "source": "n5", "target": "n6", "relation": "ativa", "weight": "forte", "bidirectional": true },
                        { "source": "n6", "target": "n3", "relation": "reforça", "weight": "forte", "bidirectional": false }
                    ]
                },
                "adaptation": { "gatilho_identificado": true, "motivo_adapacao": "Crise no trabalho", "sugestoes": [{ "acao": "Exposição gradual", "justificativa_pbt": "Quebrar ciclo de esquiva" }] }
            },
            {
                "id": "s4",
                "date": "2024-09-29T14:00:00.000Z",
                "notes": "Conversou com chefe sobre a situação. Chefe foi compreensivo. Começou exposição: sentou em reuniões curtas. Não teve ataque. Dormindo melhor com higiene do sono.",
                "soap": {
                    "queixa_principal": "Melhora na ansiedade, iniciou exposições",
                    "subjetivo": [
                        { "conteudo": "Chefe foi compreensivo", "citacao": "ele entendeu e me apoiou" },
                        { "conteudo": "Participou de reuniões sem ataque", "citacao": "consegui ficar na reunião toda" }
                    ],
                    "objetivo": "Paciente mais animada, postura mais relaxada",
                    "avaliacao": "Progresso significativo. Exposição bem-sucedida reduziu evitação",
                    "plano": ["Continuar exposição gradual", "Reforçar sucessos", "Aumentar duração de reuniões"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n1", "label": "Pensamento catastrófico", "category": "Cognitiva", "change": "diminuiu" },
                        { "id": "n3", "label": "Esquiva social", "category": "Comportamento", "change": "diminuiu" },
                        { "id": "n5", "label": "Vergonha", "category": "Afetiva", "change": "diminuiu" },
                        { "id": "n7", "label": "Autoeficácia", "category": "Self", "change": "novo" }
                    ],
                    "edges": [
                        { "source": "n7", "target": "n1", "relation": "reduz", "weight": "moderado", "bidirectional": false }
                    ]
                },
                "adaptation": { "gatilho_identificado": false, "motivo_adapacao": "", "sugestoes": [] }
            },
            {
                "id": "s5",
                "date": "2024-10-06T14:00:00.000Z",
                "notes": "Teve um ataque de pânico em casa ontem à noite. Ficou assustada porque estava indo bem. Usou técnicas de respiração e mindfulness e conseguiu passar sozinha em 10 minutos.",
                "soap": {
                    "queixa_principal": "Ataque de pânico isolado, mas manejou sozinha",
                    "subjetivo": [
                        { "conteudo": "Teve ataque mas usou técnicas", "citacao": "respirei e consegui me acalmar" },
                        { "conteudo": "Passou em 10 minutos", "citacao": "durou bem menos que antes" }
                    ],
                    "objetivo": "Paciente orgulhosa de ter manejado a crise",
                    "avaliacao": "Desenvolvimento de habilidades de autorregulação. Recaída normal no processo",
                    "plano": ["Normalizar recaídas", "Reforçar uso de técnicas", "Prevenir catastrofização"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n1", "label": "Pensamento catastrófico", "category": "Cognitiva", "change": "estavel" },
                        { "id": "n7", "label": "Autoeficácia", "category": "Self", "change": "aumentou" },
                        { "id": "n8", "label": "Autorregulação", "category": "Comportamento", "change": "novo" }
                    ],
                    "edges": [
                        { "source": "n8", "target": "n7", "relation": "fortalece", "weight": "forte", "bidirectional": true }
                    ]
                },
                "adaptation": { "gatilho_identificado": false, "motivo_adapacao": "", "sugestoes": [] }
            },
            {
                "id": "s6",
                "date": "2024-10-13T14:00:00.000Z",
                "notes": "Semana tranquila. Dormindo 7-8h por noite. Participou de todas reuniões no trabalho. Está começando a sair com amigos novamente. Relatou sentir-se 'quase normal'.",
                "soap": {
                    "queixa_principal": "Melhora significativa, retomando vida social",
                    "subjetivo": [
                        { "conteudo": "Dormindo bem", "citacao": "estou dormindo a noite toda" },
                        { "conteudo": "Saiu com amigos", "citacao": "fui no cinema e foi ótimo" }
                    ],
                    "objetivo": "Paciente sorridente, relata bem-estar",
                    "avaliacao": "Melhora consolidada. Redução significativa de sintomas",
                    "plano": ["Manutenção de ganhos", "Identificar gatilhos residuais", "Plano de prevenção de recaída"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n1", "label": "Pensamento catastrófico", "category": "Cognitiva", "change": "diminuiu" },
                        { "id": "n3", "label": "Esquiva social", "category": "Comportamento", "change": "diminuiu" },
                        { "id": "n7", "label": "Autoeficácia", "category": "Self", "change": "aumentou" },
                        { "id": "n9", "label": "Engajamento social", "category": "Comportamento", "change": "novo" }
                    ],
                    "edges": [
                        { "source": "n9", "target": "n7", "relation": "reforça", "weight": "moderado", "bidirectional": false }
                    ]
                },
                "adaptation": { "gatilho_identificado": false, "motivo_adapacao": "", "sugestoes": [] }
            },
            {
                "id": "s7",
                "date": "2024-10-20T14:00:00.000Z",
                "notes": "Mãe foi diagnosticada com câncer. Paciente muito preocupada mas não teve ataques de pânico. Ansiedade aumentou mas está manejando. Usando técnicas aprendidas.",
                "soap": {
                    "queixa_principal": "Estressor externo (doença da mãe) mas mantendo controle",
                    "subjetivo": [
                        { "conteudo": "Mãe diagnosticada com câncer", "citacao": "estou preocupada mas não entrei em pânico" },
                        { "conteudo": "Ansiedade controlada com técnicas", "citacao": "estou usando tudo que aprendi" }
                    ],
                    "objetivo": "Paciente preocupada mas funcional, sem sinais de descompensação",
                    "avaliacao": "Resiliência desenvolvida. Capacidade de enfrentar estressor significativo sem recaída",
                    "plano": ["Apoio emocional", "Validação de sentimentos", "Reforçar habilidades de enfrentamento"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n7", "label": "Autoeficácia", "category": "Self", "change": "estavel" },
                        { "id": "n8", "label": "Autorregulação", "category": "Comportamento", "change": "estavel" },
                        { "id": "n10", "label": "Estressor externo", "category": "Contexto", "change": "novo" }
                    ],
                    "edges": [
                        { "source": "n10", "target": "n4", "relation": "ativa", "weight": "moderado", "bidirectional": false }
                    ]
                },
                "adaptation": { "gatilho_identificado": true, "motivo_adapacao": "Estressor familiar", "sugestoes": [] }
            },
            {
                "id": "s8",
                "date": "2024-10-27T14:00:00.000Z",
                "notes": "Acompanhou mãe em consulta médica. Estava muito ansiosa antes mas conseguiu ir. Prognóstico da mãe é bom. Paciente aliviada. Refletiu sobre o quanto evoluiu desde o início.",
                "soap": {
                    "queixa_principal": "Enfrentamento bem-sucedido de situação desafiadora",
                    "subjetivo": [
                        { "conteudo": "Conseguiu acompanhar mãe apesar da ansiedade", "citacao": "antes não conseguiria, mas fui" },
                        { "conteudo": "Reconhece própria evolução", "citacao": "percebo o quanto mudei" }
                    ],
                    "objetivo": "Paciente com insight sobre progressos, tom de voz confiante",
                    "avaliacao": "Meta-consciência sobre mudanças. Consolidação de ganhos terapêuticos",
                    "plano": ["Discutir critérios de alta", "Planejamento de manutenção", "Espaçamento de sessões"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n1", "label": "Pensamento catastrófico", "category": "Cognitiva", "change": "diminuiu" },
                        { "id": "n7", "label": "Autoeficácia", "category": "Self", "change": "aumentou" },
                        { "id": "n8", "label": "Autorregulação", "category": "Comportamento", "change": "aumentou" },
                        { "id": "n11", "label": "Insight", "category": "Cognitiva", "change": "novo" }
                    ],
                    "edges": [
                        { "source": "n11", "target": "n7", "relation": "fortalece", "weight": "forte", "bidirectional": false }
                    ]
                },
                "adaptation": { "gatilho_identificado": false, "motivo_adapacao": "", "sugestoes": [] }
            },
            {
                "id": "s9",
                "date": "2024-11-10T14:00:00.000Z",
                "notes": "Primeira sessão quinzenal. Paciente bem. Sem ataques de pânico há 3 semanas. Ansiedade em níveis manejáveis. Voltou a fazer atividade física (yoga). Dorme bem. Trabalho normalizado.",
                "soap": {
                    "queixa_principal": "Manutenção de ganhos, sem sintomas significativos",
                    "subjetivo": [
                        { "conteudo": "3 semanas sem ataques", "citacao": "faz tempo que não tenho crise" },
                        { "conteudo": "Iniciou yoga", "citacao": "comecei yoga e estou amando" }
                    ],
                    "objetivo": "Paciente tranquila, sem sinais de ansiedade",
                    "avaliacao": "Remissão sintomática. Funcionamento preservado em todas áreas",
                    "plano": ["Manutenção de estratégias", "Planejamento de alta", "Sessões mensais de acompanhamento"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n1", "label": "Pensamento catastrófico", "category": "Cognitiva", "change": "diminuiu" },
                        { "id": "n7", "label": "Autoeficácia", "category": "Self", "change": "estavel" },
                        { "id": "n8", "label": "Autorregulação", "category": "Comportamento", "change": "estavel" },
                        { "id": "n12", "label": "Autocuidado", "category": "Comportamento", "change": "novo" }
                    ],
                    "edges": [
                        { "source": "n12", "target": "n7", "relation": "fortalece", "weight": "moderado", "bidirectional": false }
                    ]
                },
                "adaptation": { "gatilho_identificado": false, "motivo_adapacao": "", "sugestoes": [] }
            },
            {
                "id": "s10",
                "date": "2024-12-01T14:00:00.000Z",
                "notes": "Sessão de revisão e planejamento de alta. Paciente extremamente satisfeita com resultados. GAD-7 em 9 pontos (melhora de 50%). Discutimos sinais de alerta e plano de ação. Combinado acompanhamento trimestral.",
                "soap": {
                    "queixa_principal": "Sessão de alta, revisão de progresso",
                    "subjetivo": [
                        { "conteudo": "Muito satisfeita com resultados", "citacao": "minha vida mudou completamente" },
                        { "conteudo": "Sente-se preparada para alta", "citacao": "sei que consigo manter sozinha" }
                    ],
                    "objetivo": "Paciente confiante, demonstra domínio das técnicas",
                    "avaliacao": "Critérios de alta atingidos. Paciente com ferramentas para manutenção",
                    "plano": ["Alta terapêutica", "Acompanhamento trimestral", "Plano de prevenção de recaída documentado"]
                },
                "pbtNetwork": {
                    "nodes": [
                        { "id": "n1", "label": "Pensamento catastrófico", "category": "Cognitiva", "change": "estavel" },
                        { "id": "n7", "label": "Autoeficácia", "category": "Self", "change": "estavel" },
                        { "id": "n8", "label": "Autorregulação", "category": "Comportamento", "change": "estavel" },
                        { "id": "n12", "label": "Autocuidado", "category": "Comportamento", "change": "estavel" }
                    ],
                    "edges": []
                },
                "adaptation": { "gatilho_identificado": false, "motivo_adapacao": "Alta terapêutica", "sugestoes": [{ "acao": "Manter práticas", "justificativa_pbt": "Prevenção de recaída" }] }
            }
        ],
        "dischargeCriteria": [
            { "id": "dc1", "description": "Redução de 50% no GAD-7", "status": "achieved", "evidence": "GAD-7: 18→9", "lastUpdated": "2024-12-01" },
            { "id": "dc2", "description": "Sem ataques de pânico por 4 semanas", "status": "achieved", "evidence": "Última crise: 06/10", "lastUpdated": "2024-12-01" },
            { "id": "dc3", "description": "Retorno ao trabalho pleno", "status": "achieved", "evidence": "Participando de todas atividades", "lastUpdated": "2024-11-01" }
        ],
        "evolutionAnalysis": []
    }
};

// Executar no console:
const existing = JSON.parse(localStorage.getItem('clinic_patients') || '[]');
existing.push(testPatient);
localStorage.setItem('clinic_patients', JSON.stringify(existing));
console.log('✅ Paciente de teste adicionado com sucesso!');
console.log('Recarregue a página (F5) para ver o paciente na lista.');

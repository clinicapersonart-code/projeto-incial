// Biblioteca de Instrumentos de Monitoramento Clínico
// Baseado no HumanTrack e guidelines internacionais

export type InstrumentCategory =
    | 'Escala Padronizada'
    | 'Automonitoramento'
    | 'Entrevista/Anamnese'
    | 'Avaliação do Clínico';

export type InstrumentTag =
    | 'Formulação'
    | 'Transdiagnóstico'
    | 'Dependência'
    | 'Trauma'
    | 'Monitoramento de Progresso'
    | 'Aceitação'
    | 'Mindfulness'
    | 'TDAH'
    | 'Autismo'
    | 'Regulação Emocional'
    | 'Pânico'
    | 'Ansiedade'
    | 'Depressão'
    | 'Burnout'
    | 'Bem-estar'
    | 'Análise Funcional'
    | 'Imagem Corporal'
    | 'Alimentação'
    | 'Mensuração'
    | 'Funcionamento Global'
    | 'Perfeccionismo'
    | 'Autoeficácia'
    | 'Fadiga'
    | 'Registro de Atividades'
    | 'Afetos Negativos'
    | 'Sintomas Somáticos'
    | 'TOC'
    | 'Fobia Social'
    | 'TEPT'
    | 'Sono'
    | 'Qualidade de Vida'
    | 'Avaliação do Clínico'
    | 'Dor Crônica'
    | 'Valores'
    | 'Luto'
    | 'Transtorno de Personalidade'
    | 'DBT'
    | 'Humor'
    | 'Relaxamento'
    | 'Afetos Positivos'
    | 'Procrastinação'
    | 'Behaviorismo Contextual'
    | 'Autoconhecimento'
    | 'Dor'
    | 'Personalidade'
    | 'Comunicação e Habilidades Sociais'
    | 'Modelo Cognitivo'
    | 'Imagem Corporal e Alimentação'
    | 'Entrevista/Anamnese'
    | 'Comportamento'
    | 'Crenças'
    | 'Processos';

export interface Instrument {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    category: InstrumentCategory;
    tags: InstrumentTag[];
    questionCount: number;
    estimatedMinutes: number;
    frequency: 'Toda sessão' | 'Semanal' | 'Quinzenal' | 'Mensal' | 'Sob demanda' | 'Diário';
    hasForm: boolean; // Se temos formulário implementado
    isNew?: boolean;
    isFavorite?: boolean;
}

export const INSTRUMENTS_LIBRARY: Instrument[] = [
    // ==============================
    // ESCALAS PADRONIZADAS - ANSIEDADE
    // ==============================
    {
        id: 'gad7',
        name: 'Generalized Anxiety Disorder',
        abbreviation: 'GAD-7',
        description: 'Escala de 7 itens para rastreio e monitoramento de sintomas de ansiedade generalizada. Validada internacionalmente.',
        category: 'Escala Padronizada',
        tags: ['Ansiedade', 'Transdiagnóstico', 'Monitoramento de Progresso'],
        questionCount: 7,
        estimatedMinutes: 3,
        frequency: 'Toda sessão',
        hasForm: true
    },
    {
        id: 'eapt',
        name: 'Escala de Avaliação de Processos Transdiagnósticos',
        abbreviation: 'EAPT',
        description: 'Avalia mudanças funcionais ao longo de dimensões psicológicas centrais (Afeto, Cognição, Atenção, etc.), alinhadas ao Modelo Baseado em Processos.',
        category: 'Escala Padronizada',
        tags: ['Transdiagnóstico', 'Monitoramento de Progresso', 'Análise Funcional', 'Processos'],
        questionCount: 9,
        estimatedMinutes: 3,
        frequency: 'Semanal',
        hasForm: true,
        isNew: true
    },
    {
        id: 'bai',
        name: 'Beck Anxiety Inventory',
        abbreviation: 'BAI',
        description: 'Inventário de 21 itens que avalia sintomas somáticos e cognitivos de ansiedade. Gold standard para ansiedade clínica.',
        category: 'Escala Padronizada',
        tags: ['Ansiedade', 'Monitoramento de Progresso'],
        questionCount: 21,
        estimatedMinutes: 10,
        frequency: 'Semanal',
        hasForm: true
    },
    {
        id: 'pdss',
        name: 'Panic Disorder Severity Scale - Self Report',
        abbreviation: 'PDSS-SR',
        description: 'Escala de autorrelato para avaliar gravidade do transtorno de pânico, incluindo frequência, intensidade e evitação.',
        category: 'Escala Padronizada',
        tags: ['Pânico', 'Ansiedade', 'Monitoramento de Progresso'],
        questionCount: 7,
        estimatedMinutes: 5,
        frequency: 'Semanal',
        hasForm: true,
        isNew: true
    },
    {
        id: 'spin',
        name: 'Social Phobia Inventory',
        abbreviation: 'SPIN',
        description: 'Instrumento de 17 itens para avaliação de sintomas de fobia social/ansiedade social.',
        category: 'Escala Padronizada',
        tags: ['Fobia Social', 'Ansiedade'],
        questionCount: 17,
        estimatedMinutes: 7,
        frequency: 'Quinzenal',
        hasForm: true
    },
    {
        id: 'lsas',
        name: 'Liebowitz Social Anxiety Scale',
        abbreviation: 'LSAS',
        description: 'Escala detalhada para avaliação de medo e evitação em situações sociais e de desempenho.',
        category: 'Escala Padronizada',
        tags: ['Fobia Social', 'Ansiedade'],
        questionCount: 24,
        estimatedMinutes: 15,
        frequency: 'Mensal',
        hasForm: false
    },

    // ==============================
    // ESCALAS PADRONIZADAS - DEPRESSÃO
    // ==============================
    {
        id: 'phq9',
        name: 'Patient Health Questionnaire',
        abbreviation: 'PHQ-9',
        description: 'Escala de 9 itens baseada nos critérios do DSM para depressão. Amplamente usado em atenção primária e saúde mental.',
        category: 'Escala Padronizada',
        tags: ['Depressão', 'Transdiagnóstico', 'Monitoramento de Progresso'],
        questionCount: 9,
        estimatedMinutes: 5,
        frequency: 'Toda sessão',
        hasForm: true
    },
    {
        id: 'bdi2',
        name: 'Beck Depression Inventory II',
        abbreviation: 'BDI-II',
        description: 'Inventário de 21 itens para avaliação de sintomas depressivos. Padrão-ouro em pesquisa e prática clínica.',
        category: 'Escala Padronizada',
        tags: ['Depressão', 'Monitoramento de Progresso'],
        questionCount: 21,
        estimatedMinutes: 10,
        frequency: 'Semanal',
        hasForm: true
    },

    // ==============================
    // ESCALAS PADRONIZADAS - TOC
    // ==============================
    {
        id: 'ybocs',
        name: 'Yale-Brown Obsessive Compulsive Scale',
        abbreviation: 'Y-BOCS',
        description: 'Escala padrão-ouro para avaliação de gravidade de obsessões e compulsões no TOC.',
        category: 'Avaliação do Clínico',
        tags: ['TOC', 'Monitoramento de Progresso'],
        questionCount: 10,
        estimatedMinutes: 20,
        frequency: 'Semanal',
        hasForm: true
    },
    {
        id: 'ocir',
        name: 'Obsessive-Compulsive Inventory - Revised',
        abbreviation: 'OCI-R',
        description: 'Inventário de autorrelato de 18 itens para rastreio e monitoramento de sintomas obsessivo-compulsivos.',
        category: 'Escala Padronizada',
        tags: ['TOC', 'Transdiagnóstico'],
        questionCount: 18,
        estimatedMinutes: 7,
        frequency: 'Quinzenal',
        hasForm: true
    },

    // ==============================
    // ESCALAS PADRONIZADAS - TRAUMA/TEPT
    // ==============================
    {
        id: 'pcl5',
        name: 'PTSD Checklist for DSM-5',
        abbreviation: 'PCL-5',
        description: 'Questionário de 20 itens para avaliação de sintomas de TEPT conforme critérios do DSM-5.',
        category: 'Escala Padronizada',
        tags: ['TEPT', 'Trauma', 'Monitoramento de Progresso'],
        questionCount: 20,
        estimatedMinutes: 10,
        frequency: 'Semanal',
        hasForm: true,
        isNew: true
    },
    {
        id: 'eles',
        name: 'Escala de Experiências Precoces de Vida',
        abbreviation: 'ELES',
        description: 'A Escala de Experiências Precoces de Vida (Early Life Experiences Scale) avalia eventos adversos na infância.',
        category: 'Escala Padronizada',
        tags: ['Trauma', 'Formulação'],
        questionCount: 15,
        estimatedMinutes: 10,
        frequency: 'Sob demanda',
        hasForm: false,
        isNew: true
    },

    // ==============================
    // FUNCIONAMENTO E QUALIDADE DE VIDA
    // ==============================
    {
        id: 'whodas',
        name: 'WHO Disability Assessment Schedule',
        abbreviation: 'WHODAS 2.0',
        description: 'Instrumento da OMS para avaliação de funcionalidade em 6 domínios. Usado para monitorar impacto funcional.',
        category: 'Escala Padronizada',
        tags: ['Funcionamento Global', 'Monitoramento de Progresso'],
        questionCount: 12,
        estimatedMinutes: 10,
        frequency: 'Mensal',
        hasForm: true
    },
    {
        id: 'coreom',
        name: 'Clinical Outcomes in Routine Evaluation',
        abbreviation: 'CORE-OM',
        description: 'O CORE-OM é um instrumento de autoaplicação que avalia o bem-estar, problemas/sintomas, funcionamento e risco.',
        category: 'Escala Padronizada',
        tags: ['Funcionamento Global', 'Monitoramento de Progresso', 'Transdiagnóstico'],
        questionCount: 34,
        estimatedMinutes: 15,
        frequency: 'Mensal',
        hasForm: false,
        isNew: true
    },
    {
        id: 'whoqol',
        name: 'World Health Organization Quality of Life',
        abbreviation: 'WHOQOL-BREF',
        description: 'Instrumento da OMS para avaliação de qualidade de vida em 4 domínios: físico, psicológico, social e ambiental.',
        category: 'Escala Padronizada',
        tags: ['Qualidade de Vida', 'Bem-estar'],
        questionCount: 26,
        estimatedMinutes: 15,
        frequency: 'Mensal',
        hasForm: false
    },

    // ==============================
    // MINDFULNESS E PROCESSOS
    // ==============================
    {
        id: 'eq',
        name: 'Questionário de Descentração',
        abbreviation: 'EQ',
        description: 'O Questionário de Descentração (Experiences Questionnaire - EQ) é um instrumento para avaliar capacidade de descentração.',
        category: 'Escala Padronizada',
        tags: ['Aceitação', 'Mindfulness', 'Transdiagnóstico'],
        questionCount: 11,
        estimatedMinutes: 5,
        frequency: 'Quinzenal',
        hasForm: false,
        isNew: true
    },
    {
        id: 'aaq2',
        name: 'Acceptance and Action Questionnaire',
        abbreviation: 'AAQ-II',
        description: 'Questionário de 7 itens que avalia flexibilidade psicológica e evitação experiencial (ACT).',
        category: 'Escala Padronizada',
        tags: ['Aceitação', 'Transdiagnóstico', 'Monitoramento de Progresso'],
        questionCount: 7,
        estimatedMinutes: 3,
        frequency: 'Quinzenal',
        hasForm: true
    },
    {
        id: 'ffmq',
        name: 'Five Facet Mindfulness Questionnaire',
        abbreviation: 'FFMQ',
        description: 'Questionário de 39 itens que avalia 5 facetas de mindfulness: observar, descrever, agir com consciência, não julgar e não reagir.',
        category: 'Escala Padronizada',
        tags: ['Mindfulness', 'Transdiagnóstico'],
        questionCount: 39,
        estimatedMinutes: 15,
        frequency: 'Mensal',
        hasForm: false
    },

    // ==============================
    // REGULAÇÃO EMOCIONAL
    // ==============================
    {
        id: 'ders',
        name: 'Difficulties in Emotion Regulation Scale',
        abbreviation: 'DERS',
        description: 'Escala de 36 itens que avalia dificuldades de regulação emocional em 6 dimensões.',
        category: 'Escala Padronizada',
        tags: ['Regulação Emocional', 'Transdiagnóstico'],
        questionCount: 36,
        estimatedMinutes: 15,
        frequency: 'Mensal',
        hasForm: true
    },

    // ==============================
    // DEPENDÊNCIA
    // ==============================
    {
        id: 'audit',
        name: 'Alcohol Use Disorder Identification Test',
        abbreviation: 'AUDIT',
        description: 'O AUDIT é um instrumento de 10 itens desenvolvido pela OMS para identificar uso problemático de álcool.',
        category: 'Escala Padronizada',
        tags: ['Dependência', 'Mensuração'],
        questionCount: 10,
        estimatedMinutes: 5,
        frequency: 'Mensal',
        hasForm: true
    },
    {
        id: 'eaad',
        name: 'Escala de Autoeficácia para Abstinência de Drogas',
        abbreviation: 'EAAD',
        description: 'A Escala de Autoeficácia para Abstinência de Drogas (EAAD) avalia a confiança do indivíduo para resistir ao uso de drogas em diferentes situações de risco.',
        category: 'Escala Padronizada',
        tags: ['Dependência'],
        questionCount: 20,
        estimatedMinutes: 10,
        frequency: 'Quinzenal',
        hasForm: false,
        isNew: true
    },
    {
        id: 'urica',
        name: 'University Rhode Island Change Assessment',
        abbreviation: 'URICA',
        description: 'Avalia estágios de mudança (pré-contemplação, contemplação, ação, manutenção) para dependências.',
        category: 'Escala Padronizada',
        tags: ['Dependência', 'Monitoramento de Progresso'],
        questionCount: 32,
        estimatedMinutes: 15,
        frequency: 'Mensal',
        hasForm: false,
        isNew: true
    },
    {
        id: 'estud',
        name: 'Escala de Situações Tentadoras para o Uso de Drogas',
        abbreviation: 'ESTUD',
        description: 'Avalia o nível de tentação para usar drogas em diferentes situações de risco.',
        category: 'Escala Padronizada',
        tags: ['Dependência'],
        questionCount: 20,
        estimatedMinutes: 10,
        frequency: 'Quinzenal',
        hasForm: false,
        isNew: true
    },

    // ==============================
    // TDAH E AUTISMO
    // ==============================
    {
        id: 'asrs18',
        name: 'Adult Self-Report Scale',
        abbreviation: 'ASRS-18',
        description: 'A Adult Self-Report Scale (ASRS-18) é um questionário de auto-relato para rastreio de TDAH em adultos.',
        category: 'Escala Padronizada',
        tags: ['TDAH', 'Transdiagnóstico'],
        questionCount: 18,
        estimatedMinutes: 10,
        frequency: 'Sob demanda',
        hasForm: true
    },
    {
        id: 'aq10',
        name: 'Autism Spectrum Quotient - Adult',
        abbreviation: 'AQ-10',
        description: 'A Escala AQ10 avalia traços do Transtorno do Espectro Autista (TEA) em adultos.',
        category: 'Escala Padronizada',
        tags: ['Autismo'],
        questionCount: 10,
        estimatedMinutes: 5,
        frequency: 'Sob demanda',
        hasForm: false
    },

    // ==============================
    // BURNOUT E ESTRESSE
    // ==============================
    {
        id: 'cbibr',
        name: 'Copenhagen Burnout Inventory - Versão brasileira',
        abbreviation: 'CBI-Br',
        description: 'O Copenhagen Burnout Inventory - versão brasileira (CBI-Br) avalia a síndrome de burnout em 3 dimensões.',
        category: 'Escala Padronizada',
        tags: ['Burnout', 'Bem-estar'],
        questionCount: 19,
        estimatedMinutes: 10,
        frequency: 'Mensal',
        hasForm: true,
        isNew: true
    },
    {
        id: 'pss',
        name: 'Perceived Stress Scale',
        abbreviation: 'PSS-10',
        description: 'Escala de 10 itens que avalia a percepção de estresse no último mês.',
        category: 'Escala Padronizada',
        tags: ['Burnout', 'Transdiagnóstico'],
        questionCount: 10,
        estimatedMinutes: 5,
        frequency: 'Quinzenal',
        hasForm: true
    },

    // ==============================
    // SONO
    // ==============================
    {
        id: 'psqi',
        name: 'Pittsburgh Sleep Quality Index',
        abbreviation: 'PSQI',
        description: 'Índice de 19 itens que avalia qualidade e padrões de sono no último mês.',
        category: 'Escala Padronizada',
        tags: ['Sono', 'Transdiagnóstico'],
        questionCount: 19,
        estimatedMinutes: 10,
        frequency: 'Mensal',
        hasForm: true
    },
    {
        id: 'isi',
        name: 'Insomnia Severity Index',
        abbreviation: 'ISI',
        description: 'Índice de 7 itens para avaliação rápida de gravidade da insônia.',
        category: 'Escala Padronizada',
        tags: ['Sono', 'Monitoramento de Progresso'],
        questionCount: 7,
        estimatedMinutes: 3,
        frequency: 'Semanal',
        hasForm: true
    },

    // ==============================
    // IMAGEM CORPORAL E ALIMENTAÇÃO
    // ==============================
    {
        id: 'cia30',
        name: 'Clinical Impairment Assessment Questionnaire',
        abbreviation: 'CIA 3.0',
        description: 'O CIA 3.0 é um instrumento de 16 itens para avaliar o grau de comprometimento psicossocial causado por TAs.',
        category: 'Escala Padronizada',
        tags: ['Imagem Corporal', 'Alimentação', 'Mensuração'],
        questionCount: 16,
        estimatedMinutes: 8,
        frequency: 'Quinzenal',
        hasForm: false,
        isNew: true
    },
    {
        id: 'edeq',
        name: 'Eating Disorder Examination Questionnaire',
        abbreviation: 'EDE-Q',
        description: 'Questionário de autorrelato para avaliação de psicopatologia alimentar.',
        category: 'Escala Padronizada',
        tags: ['Alimentação', 'Imagem Corporal'],
        questionCount: 28,
        estimatedMinutes: 15,
        frequency: 'Mensal',
        hasForm: false
    },

    // ==============================
    // PBT E AVALIAÇÃO DE PROCESSOS
    // ==============================
    {
        id: 'ebp',
        name: 'Entrevista Baseada em Processos',
        abbreviation: 'EBP',
        description: 'A Entrevista Baseada em Processos (EBP) é um instrumento clínico para identificar processos transdiagnósticos.',
        category: 'Entrevista/Anamnese',
        tags: ['Formulação', 'Transdiagnóstico'],
        questionCount: 0,
        estimatedMinutes: 60,
        frequency: 'Sob demanda',
        hasForm: false,
        isNew: true
    },
    {
        id: 'fabp',
        name: 'Ferramenta de Avaliação Baseada em Processos',
        abbreviation: 'FABP',
        description: 'Este instrumento foi desenvolvido para avaliar mudanças funcionais ao longo do tratamento baseado em processos.',
        category: 'Escala Padronizada',
        tags: ['Monitoramento de Progresso', 'Transdiagnóstico'],
        questionCount: 30,
        estimatedMinutes: 15,
        frequency: 'Quinzenal',
        hasForm: false,
        isNew: true
    },

    // ==============================
    // AVALIAÇÃO DO CLÍNICO
    // ==============================
    {
        id: 'ctrs',
        name: 'Escala de Avaliação em Terapia Cognitivo-Comportamental',
        abbreviation: 'CTRS',
        description: 'A Escala de Avaliação em TCC é a versão brasileira para avaliar competência do terapeuta.',
        category: 'Avaliação do Clínico',
        tags: ['Avaliação do Clínico'],
        questionCount: 11,
        estimatedMinutes: 15,
        frequency: 'Sob demanda',
        hasForm: false,
        isNew: true
    },

    // ==============================
    // ANAMNESE
    // ==============================
    {
        id: 'anamnesejg',
        name: 'Anamnese Psicológica (modelo J.G.)',
        abbreviation: 'Anamnese J.G.',
        description: 'A anamnese psicológica apresentada é um instrumento estruturado de coleta de informações clínicas.',
        category: 'Entrevista/Anamnese',
        tags: ['Formulação', 'Avaliação do Clínico'],
        questionCount: 0,
        estimatedMinutes: 90,
        frequency: 'Sob demanda',
        hasForm: false
    },

    // ==============================
    // AUTOMONITORAMENTO - DIÁRIOS
    // ==============================
    {
        id: 'diarioabc',
        name: 'Diário ABC - versão do paciente',
        abbreviation: 'Diário ABC',
        description: 'O Diário ABC (Antecedente-Resposta-Consequência) é um recurso clínico idiográfico baseado na Análise Funcional.',
        category: 'Automonitoramento',
        tags: ['Análise Funcional', 'Transdiagnóstico'],
        questionCount: 0,
        estimatedMinutes: 10,
        frequency: 'Semanal',
        hasForm: true
    },
    {
        id: 'diarioalimentar',
        name: 'Diário Alimentar',
        abbreviation: 'Diário Alimentar',
        description: 'O Diário Alimentar, também conhecido como registro alimentar, é uma ferramenta para registrar alimentos e bebidas.',
        category: 'Automonitoramento',
        tags: ['Imagem Corporal', 'Alimentação'],
        questionCount: 0,
        estimatedMinutes: 5,
        frequency: 'Semanal',
        hasForm: true
    },
    {
        id: 'diariofadiga',
        name: 'Diário Clínico de Fadiga',
        abbreviation: 'Diário Fadiga',
        description: 'Este diário é um instrumento idiográfico de automonitoramento em tempo real para rastrear fadiga.',
        category: 'Automonitoramento',
        tags: ['Fadiga', 'Registro de Atividades'],
        questionCount: 0,
        estimatedMinutes: 5,
        frequency: 'Semanal',
        hasForm: false
    },
    {
        id: 'diariopanicoataque',
        name: 'Diário de Ataques, Gatilhos e Respostas de Pânico',
        abbreviation: 'Diário Pânico',
        description: 'Objetivo clínico do instrumento: Captar, em tempo real, o ciclo do pânico (sensações → interpretações → respostas).',
        category: 'Automonitoramento',
        tags: ['Pânico', 'Ansiedade'],
        questionCount: 0,
        estimatedMinutes: 10,
        frequency: 'Semanal',
        hasForm: true
    },
    {
        id: 'diarioatividades',
        name: 'Diário de Atividades Significativas',
        abbreviation: 'Diário Atividades',
        description: 'O Diário de Atividades Significativas é um instrumento clínico idiográfico de automonitoramento derivado da TCC.',
        category: 'Automonitoramento',
        tags: ['Funcionamento Global', 'Registro de Atividades', 'Depressão'],
        questionCount: 0,
        estimatedMinutes: 10,
        frequency: 'Semanal',
        hasForm: true
    },
    {
        id: 'diarioperfeccionismo',
        name: 'Diário de Autoavaliação do Perfeccionismo',
        abbreviation: 'Diário Perfeccionismo',
        description: 'O Diário de Autoavaliação do Perfeccionismo é um instrumento clínico idiográfico para o contexto brasileiro.',
        category: 'Automonitoramento',
        tags: ['Perfeccionismo', 'Transdiagnóstico'],
        questionCount: 0,
        estimatedMinutes: 10,
        frequency: 'Semanal',
        hasForm: false,
        isNew: true
    },
    {
        id: 'diarioautoeficacia',
        name: 'Diário de Autoeficácia',
        abbreviation: 'DA',
        description: 'O Diário de Autoeficácia é um instrumento idiográfico de automonitoramento diário para avaliar a percepção de capacidades.',
        category: 'Automonitoramento',
        tags: ['Autoeficácia'],
        questionCount: 0,
        estimatedMinutes: 5,
        frequency: 'Semanal',
        hasForm: false
    },
    {
        id: 'automonitoramentoemocoes',
        name: 'Automonitoramento do Impacto das Emoções na Vida Diária',
        abbreviation: 'Diário Emoções',
        description: 'Este questionário foi desenvolvido como uma ferramenta terapêutica para rastrear impacto emocional.',
        category: 'Automonitoramento',
        tags: ['Regulação Emocional'],
        questionCount: 0,
        estimatedMinutes: 10,
        frequency: 'Semanal',
        hasForm: true
    },
    {
        id: 'automonitoramentopanicoataque',
        name: 'Automonitoramento dos Ataques de Pânico',
        abbreviation: 'MAP',
        description: 'O instrumento de Automonitoramento dos Ataques de Pânico, baseado em Craske e Barlow (2023).',
        category: 'Automonitoramento',
        tags: ['Pânico'],
        questionCount: 0,
        estimatedMinutes: 5,
        frequency: 'Semanal',
        hasForm: true
    },

    // ==============================
    // AFETOS E SOMÁTICOS
    // ==============================
    {
        id: 'aass',
        name: 'Avaliação de Afetos e Sintomas Somáticos',
        abbreviation: 'AASS',
        description: 'O Questionário de Avaliação de Afetos e Sintomas Somáticos é um instrumento de monitoramento diário.',
        category: 'Escala Padronizada',
        tags: ['Afetos Negativos', 'Sintomas Somáticos'],
        questionCount: 20,
        estimatedMinutes: 8,
        frequency: 'Semanal',
        hasForm: false
    },
    {
        id: 'ema',
        name: 'Avaliação Ecológica Momentânea Diária para Dependência Tecnológica',
        abbreviation: 'EMA',
        description: 'A Avaliação Ecológica Momentânea (EMA – Ecological Momentary Assessment) para dependência tecnológica.',
        category: 'Automonitoramento',
        tags: ['Dependência'],
        questionCount: 0,
        estimatedMinutes: 5,
        frequency: 'Semanal',
        hasForm: false,
        isNew: true
    },

    // ==============================
    // ADICIONAIS
    // ==============================
    {
        id: 'pswq',
        name: 'Penn State Worry Questionnaire',
        abbreviation: 'PSWQ',
        description: 'Questionário de 16 itens para avaliação de preocupação patológica (worry) característica do TAG.',
        category: 'Escala Padronizada',
        tags: ['Ansiedade', 'Transdiagnóstico'],
        questionCount: 16,
        estimatedMinutes: 7,
        frequency: 'Quinzenal',
        hasForm: true
    },
    {
        id: 'pas',
        name: 'Panic Appraisal Inventory',
        abbreviation: 'PAI',
        description: 'Inventário para avaliação de interpretações catastróficas sobre sensações de pânico.',
        category: 'Escala Padronizada',
        tags: ['Pânico', 'Ansiedade'],
        questionCount: 45,
        estimatedMinutes: 20,
        frequency: 'Mensal',
        hasForm: false
    },


    // ==============================
    // INSTRUMENTOS BREVES
    // ==============================
    {
        id: 'whoqol-bref',
        name: 'World Health Organization Quality of Life - Bref',
        abbreviation: 'WHOQOL-BREF',
        description: 'Versão abreviada do instrumento de avaliação de qualidade de vida da OMS. Avalia 4 domínios: físico, psicológico, relações sociais e meio ambiente.',
        category: 'Escala Padronizada',
        tags: ['Personalidade', 'Entrevista/Anamnese'], // Usando tags existentes mais próximas de "Qualidade de Vida"
        questionCount: 26,
        estimatedMinutes: 10,
        frequency: 'Mensal',
        hasForm: true,
        isNew: true
    },
    {
        id: 'bsi',
        name: 'Brief Symptom Inventory (Inventário de Sintomas Breve)',
        abbreviation: 'BSI',
        description: 'Instrumento de autorrelato breve para avaliar sintomas psicopatológicos e sofrimento psicológico em nove dimensões primárias.',
        category: 'Escala Padronizada',
        tags: ['Personalidade', 'Humor', 'Ansiedade'],
        questionCount: 53,
        estimatedMinutes: 10,
        frequency: 'Quinzenal',
        hasForm: true,
        isNew: true
    },
    {
        id: 'brief-cope',
        name: 'Brief COPE (Coping Orientation to Problems Experienced)',
        abbreviation: 'COPE-Breve',
        description: 'Versão abreviada do inventário COPE, projetada para avaliar uma ampla gama de respostas de enfrentamento (coping) ao estresse.',
        category: 'Escala Padronizada',
        tags: ['Personalidade', 'Comportamento'], // Comportamento se refere a estratégias de enfrentamento
        questionCount: 28,
        estimatedMinutes: 10,
        frequency: 'Mensal',
        hasForm: true,
        isNew: true
    },
    {
        id: 'ipq-b',
        name: 'Brief Illness Perception Questionnaire',
        abbreviation: 'IPQ-B',
        description: 'Questionário breve para avaliar a percepção cognitiva e emocional da doença pelo paciente.',
        category: 'Escala Padronizada',
        tags: ['Modelo Cognitivo', 'Crenças'],
        questionCount: 9,
        estimatedMinutes: 5,
        frequency: 'Sob demanda',
        hasForm: true,
        isNew: true
    },



    // ==============================
    // ESCALAS ADICIONAIS
    // ==============================
    {
        id: 'panas',
        name: 'Escala de Afetos Positivos e Negativos',
        abbreviation: 'PANAS',
        description: 'Escala de 20 itens que avalia afetos positivos e negativos, amplamente utilizada em pesquisa e prática clínica.',
        category: 'Escala Padronizada',
        tags: ['Humor'],
        questionCount: 20,
        estimatedMinutes: 5,
        frequency: 'Semanal',
        hasForm: true,
        isNew: true
    },
    {
        id: 'hama',
        name: 'Escala de Ansiedade de Hamilton',
        abbreviation: 'HAM-A',
        description: 'Escala de avaliação clínica de 14 itens para mensuração de sintomas de ansiedade.',
        category: 'Avaliação do Clínico',
        tags: ['Ansiedade'],
        questionCount: 14,
        estimatedMinutes: 15,
        frequency: 'Semanal',
        hasForm: true,
        isNew: true
    }
];

// Funções auxiliares
export const getInstrumentsByCategory = (category: InstrumentCategory): Instrument[] => {
    return INSTRUMENTS_LIBRARY.filter(i => i.category === category);
};

export const getInstrumentsByTag = (tag: InstrumentTag): Instrument[] => {
    return INSTRUMENTS_LIBRARY.filter(i => i.tags.includes(tag));
};

export const getImplementedInstruments = (): Instrument[] => {
    return INSTRUMENTS_LIBRARY.filter(i => i.hasForm);
};

export const searchInstruments = (query: string): Instrument[] => {
    const lowerQuery = query.toLowerCase();
    return INSTRUMENTS_LIBRARY.filter(i =>
        i.name.toLowerCase().includes(lowerQuery) ||
        i.abbreviation.toLowerCase().includes(lowerQuery) ||
        i.description.toLowerCase().includes(lowerQuery) ||
        i.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
};

export const getAllTags = (): InstrumentTag[] => {
    const tags = new Set<InstrumentTag>();
    INSTRUMENTS_LIBRARY.forEach(i => i.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
};

export const getAllCategories = (): InstrumentCategory[] => {
    const categories = new Set<InstrumentCategory>();
    INSTRUMENTS_LIBRARY.forEach(i => categories.add(i.category));
    return Array.from(categories);
};

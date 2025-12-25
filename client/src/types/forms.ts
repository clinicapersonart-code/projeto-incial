export interface Assessment {
    id: string;
    type: string;
    date: string;
    score: number;
    interpretation: string;
    answers: Record<string, number>;
}

export const GAD7_QUESTIONS = [
    "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
    "Não ser capaz de impedir ou de controlar as preocupações",
    "Preocupar-se demais com diversas coisas diferentes",
    "Dificuldade para relaxar",
    "Ficar tão agitado(a) a ponto de ser difícil permanecer sentado(a)",
    "Ficar facilmente aborrecido(a) ou irritado(a)",
    "Sentir medo como se algo horrível fosse acontecer"
];

export const PHQ9_QUESTIONS = [
    "Pouco interesse ou pouco prazer em fazer as coisas",
    "Sentir-se 'pra baixo', deprimido(a) ou sem perspectiva",
    "Dificuldade para adormecer ou permanecer dormindo, ou dormir demais",
    "Sentir-se cansado(a) ou com pouca energia",
    "Pouco apetite ou comendo demais",
    "Sentir-se mal com você mesmo(a) - ou achar que você é um fracasso ou que decepcionou sua família ou você mesmo(a)",
    "Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão",
    "Mover-se ou falar tão devagar que outras pessoas poderiam ter notado? Ou o oposto - estar tão agitado(a) ou inquieto(a) que você tem andado de um lado para o outro muito mais do que o costume",
    "Pensamentos de que seria melhor estar morto(a) ou de ferir a si mesmo(a) de alguma maneira"
];

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '../types/patient';
import { migratePatientToEells, initializeEellsData } from '../lib/data-migration';

interface PatientContextType {
    patients: Patient[];
    currentPatient: Patient | null;
    isLoading: boolean;
    addPatient: (name: string, demographics?: any) => void;
    selectPatient: (id: string) => void;
    updatePatient: (patient: Patient) => void;
    deletePatient: (id: string) => void;
    clearCurrentPatient: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load initial state from localStorage
    const [patients, setPatients] = useState<Patient[]>([]);
    const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('clinic_patients');
        const anamnesisRich = {
            1: "Maria Silva Santos, 38 anos, divorciada, heterossexual, formada em Administração. Atualmente desempregada.",
            2: "Crises de pânico recorrentes e ansiedade generalizada. Sente que 'o coração vai explodir' e teme morrer durante as crises. Intensidade 9/10.",
            3: "Perdeu o emprego há 3 meses em uma reestruturação da empresa. Desde então, a ansiedade disparou. Tem evitado sair de casa para não ter crises em público.",
            4: "Infância estável, mas com cobrança excessiva por desempenho acadêmico. Sempre foi a 'filha perfeita'.",
            5: "Pai autoritário e mãe ansiosa. Histórico de depressão na família materna.",
            6: "Divorciada há 2 anos. Relacionamento atual instável, com muitas discussões sobre o futuro financeiro.",
            7: "Sono fragmentado (acorda às 3h com palpitações). Alimentação irregular. Parou de frequentar a academia.",
            8: "Muita ruminação sobre o futuro. Medo constante de passar por necessidades financeiras. Evitação de situações sociais.",
            9: "Morte súbita de uma tia próxima no ano passado, o que aumentou seu medo de problemas cardíacos durante as crises.",
            10: "Conta com o apoio da irmã, mas se sente um 'fardo'. Tem poucas amigas próximas no momento.",
            11: "Fez terapia há 5 anos por causa do divórcio. Tomou fluoxetina por um tempo, mas parou por conta própria.",
            12: "Autoestima fragilizada pelo desemprego. Sente-se incompetente apesar do currículo sólido.",
            13: "Deseja retomar o controle das crises, voltar a trabalhar e conseguir frequentar lugares públicos sem medo.",
            14: "Hipótese de Transtorno de Pânico e Ansiedade Generalizada. Focar em regulação emocional e exposição gradual."
        };

        if (saved) {
            try {
                let loaded = JSON.parse(saved);
                let migrated = loaded.map((p: Patient) => migratePatientToEells(p));

                // One-time Reset Maria for the user's test
                const mariaIndex = migrated.findIndex((p: Patient) => p.name === "Maria Silva Santos");

                // FORCE RESET strategy: We prefer the clean state defined in code for testing
                // We create a specific ID to ensure it is treated as a new fresh record
                const cleanMaria: Patient = {
                    id: "maria-fresh-test-v3", // New ID to invalidate old cache
                    name: "Maria Silva Santos",
                    birthDate: "1985-05-15",
                    createdAt: new Date().toISOString(),
                    clinicalRecords: {
                        anamnesis: {
                            content: JSON.stringify(anamnesisRich),
                            updatedAt: new Date().toISOString(),
                            history: []
                        },
                        caseFormulation: { content: "", updatedAt: new Date().toISOString(), eells: initializeEellsData().formulation },
                        treatmentPlan: { goals: [], updatedAt: new Date().toISOString() },
                        assessments: [],
                        customProtocols: [],
                        sessions: []
                    },
                    eellsData: initializeEellsData()
                };

                if (mariaIndex !== -1) {
                    migrated[mariaIndex] = cleanMaria;
                } else {
                    migrated.push(cleanMaria);
                }

                setPatients(migrated);
            } catch (e) {
                console.error("Failed to parse patients from local storage", e);
            }
        } else {
            // DEMO PATIENT: Maria Silva Santos (Initial Clean Version)
            const demoId = crypto.randomUUID();
            const mariaData: Patient = {
                id: demoId,
                name: "Maria Silva Santos",
                birthDate: "1985-05-15",
                createdAt: new Date().toISOString(),
                clinicalRecords: {
                    anamnesis: {
                        content: JSON.stringify(anamnesisRich),
                        updatedAt: new Date().toISOString(),
                        history: []
                    },
                    caseFormulation: { content: "", updatedAt: new Date().toISOString() },
                    treatmentPlan: { goals: [], updatedAt: new Date().toISOString() },
                    assessments: [],
                    customProtocols: [],
                    sessions: []
                },
                eellsData: initializeEellsData()
            };
            setPatients([mariaData]);
        }
        setIsLoading(false);
    }, []);

    // Persist changes
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem('clinic_patients', JSON.stringify(patients));
        }
    }, [patients, isLoading]);

    const addPatient = (name: string, demographics: any = {}) => {
        const newPatient: Patient = {
            id: crypto.randomUUID(),
            name,
            ...demographics,
            createdAt: new Date().toISOString(),
            clinicalRecords: {
                anamnesis: { content: "", updatedAt: new Date().toISOString(), history: [] },
                caseFormulation: { content: "", updatedAt: new Date().toISOString() },
                treatmentPlan: { goals: [], updatedAt: new Date().toISOString() },
                assessments: [],
                customProtocols: [],
                sessions: []
            },
            eellsData: initializeEellsData()
        };
        setPatients(prev => [...prev, newPatient]);
        // Auto select new patient? Maybe not.
    };

    const selectPatient = (id: string) => {
        const p = patients.find(p => p.id === id);
        setCurrentPatient(p || null);
    };

    const clearCurrentPatient = () => {
        setCurrentPatient(null);
    };

    const updatePatient = (updatedPatient: Patient) => {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        if (currentPatient?.id === updatedPatient.id) {
            setCurrentPatient(updatedPatient);
        }
    };

    const deletePatient = (id: string) => {
        if (confirm("Tem certeza que deseja excluir este paciente? Esta ação é irreversível.")) {
            setPatients(prev => prev.filter(p => p.id !== id));
            if (currentPatient?.id === id) {
                setCurrentPatient(null);
            }
        }
    };

    return (
        <PatientContext.Provider value={{ patients, currentPatient, isLoading, addPatient, selectPatient, updatePatient, deletePatient, clearCurrentPatient }}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatients = () => {
    const context = useContext(PatientContext);
    if (!context) throw new Error("usePatients must be used within a PatientProvider");
    return context;
};

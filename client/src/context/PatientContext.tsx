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
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                // Auto-migrar pacientes antigos para formato Eells
                const migrated = loaded.map((p: Patient) => migratePatientToEells(p));
                setPatients(migrated);
            } catch (e) {
                console.error("Failed to parse patients from local storage", e);
            }
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

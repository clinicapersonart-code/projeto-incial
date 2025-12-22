import React from 'react';
import { PatientProvider, usePatients } from './context/PatientContext';
import { PatientList } from './components/PatientList';
import { ClinicalWorkspace } from './components/ClinicalWorkspace';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPatient, isLoading } = usePatients();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (currentPatient) {
    return <ClinicalWorkspace />;
  }

  return <PatientList />;
};

function App() {
  return (
    <PatientProvider>
      <AppContent />
    </PatientProvider>
  );
}

export default App;

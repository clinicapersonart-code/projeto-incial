import React from 'react';
import { PatientProvider, usePatients } from './context/PatientContext';
import { PatientList } from './components/PatientList';
import { ClinicalWorkspace } from './components/ClinicalWorkspace';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPatient, isLoading } = usePatients();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando...</p>
        </div>
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

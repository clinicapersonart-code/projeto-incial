import React from 'react';
import { PatientProvider, usePatients } from './context/PatientContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './components/HomePage';
import { ClinicalWorkspace } from './components/ClinicalWorkspace';
import { LoginPage } from './components/LoginPage';
import { Loader2 } from 'lucide-react';

// Whitelist de emails autorizados (remova ou edite quando quiser liberar)
const ALLOWED_EMAILS = ['brualx5@gmail.com'];

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { currentPatient, isLoading } = usePatients();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-300 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Check if user email is in whitelist
  if (!ALLOWED_EMAILS.includes(user.email || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-orange-900">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-white/20 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h1>
          <p className="text-gray-300 mb-6">
            Este sistema está em desenvolvimento e o acesso é limitado.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Email: {user.email}
          </p>
          <button
            onClick={() => signOut()}
            className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  // Show loading while loading patient data
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

  return <HomePage />;
};

function App() {
  return (
    <AuthProvider>
      <PatientProvider>
        <AppContent />
      </PatientProvider>
    </AuthProvider>
  );
}

export default App;

import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { User, Plus, Search, Calendar, FileText } from 'lucide-react';

export const PatientList: React.FC = () => {
    const { patients, addPatient, selectPatient } = usePatients();
    const [newPatientName, setNewPatientName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPatientName.trim()) {
            addPatient(newPatientName);
            setNewPatientName('');
            setIsCreating(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                            Pacientes
                        </h1>
                        <p className="text-gray-600 mt-2 text-lg">Gerencie seus prontuários clínicos</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                            <input
                                type="text"
                                placeholder="Buscar paciente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white border-2 border-indigo-100 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 w-72 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            Novo Paciente
                        </button>
                    </div>
                </div>

                {isCreating && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                        <form onSubmit={handleCreate} className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 p-8 rounded-2xl flex items-end gap-4 shadow-xl">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3">Nome Completo</label>
                                <input
                                    type="text"
                                    value={newPatientName}
                                    onChange={(e) => setNewPatientName(e.target.value)}
                                    className="w-full bg-white border-2 border-indigo-100 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                                    placeholder="Ex: João da Silva"
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg">
                                Criar Prontuário
                            </button>
                            <button onClick={() => setIsCreating(false)} type="button" className="text-gray-500 hover:text-gray-800 px-4 py-3 font-medium">
                                Cancelar
                            </button>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map(patient => (
                        <div
                            key={patient.id}
                            onClick={() => selectPatient(patient.id)}
                            className="group bg-white border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-2xl hover:shadow-indigo-200 hover:-translate-y-1 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex items-start justify-between mb-5 relative z-10">
                                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200 group-hover:shadow-xl group-hover:shadow-indigo-300 transition-all group-hover:scale-110">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                    ID: {patient.id.slice(0, 8)}...
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 mb-4 relative z-10 transition-colors">
                                {patient.name}
                            </h3>

                            <div className="space-y-2 relative z-10">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <span>Criado em: {new Date(patient.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="p-1.5 bg-purple-50 rounded-lg">
                                        <FileText className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <span className="font-semibold text-purple-600">{patient.clinicalRecords.sessions.length}</span>
                                    <span>sessões registradas</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredPatients.length === 0 && !isCreating && (
                        <div className="col-span-full text-center py-20">
                            <div className="inline-block p-6 bg-indigo-50 rounded-full mb-4">
                                <User className="w-12 h-12 text-indigo-300" />
                            </div>
                            <p className="text-gray-500 text-lg">Nenhum paciente encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

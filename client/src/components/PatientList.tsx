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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight font-[Rajdhani]">
                        Pacientes
                    </h1>
                    <p className="text-slate-400 mt-1">Gerencie seus prontuários clínicos</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar paciente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 w-64"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Paciente
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleCreate} className="bg-slate-900/50 border border-cyan-500/30 p-6 rounded-xl flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-cyan-400 uppercase mb-2">Nome Completo</label>
                            <input
                                type="text"
                                value={newPatientName}
                                onChange={(e) => setNewPatientName(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                                placeholder="Ex: João da Silva"
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold">
                            Criar Prontuário
                        </button>
                        <button onClick={() => setIsCreating(false)} type="button" className="text-slate-400 hover:text-white px-4 py-3">
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
                        className="group bg-slate-900/50 backdrop-blur border border-white/5 hover:border-cyan-500/50 rounded-xl p-6 cursor-pointer transition-all hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.15)] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="p-3 bg-slate-950 rounded-lg border border-white/5 group-hover:border-cyan-500/20">
                                <User className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">
                                ID: {patient.id.slice(0, 8)}...
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-200 group-hover:text-white mb-2 relative z-10">
                            {patient.name}
                        </h3>

                        <div className="space-y-2 relative z-10">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar className="w-3 h-3" />
                                <span>Criado em: {new Date(patient.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <FileText className="w-3 h-3" />
                                <span>{patient.clinicalRecords.sessions.length} sessões registradas</span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredPatients.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-20 text-slate-500">
                        <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum paciente encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

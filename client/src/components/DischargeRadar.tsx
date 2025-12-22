import React, { useState } from 'react';
import { CheckCircle2, Circle, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { DischargeCriteria } from '../types/patient';

interface DischargeRadarProps {
    criteria: DischargeCriteria[];
}

export const DischargeRadar: React.FC<DischargeRadarProps> = ({ criteria }) => {
    if (!criteria || criteria.length === 0) {
        return (
            <div className="bg-slate-900/50 rounded-xl border border-white/10 p-6 flex flex-col items-center justify-center text-center">
                <TrendingUp className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-slate-400 text-sm">Nenhum critério de alta definido.</p>
                <p className="text-slate-600 text-xs mt-1">Defina metas para monitorar a evolução.</p>
            </div>
        );
    }

    const achieved = criteria.filter(c => c.status === 'achieved').length;
    const progress = Math.round((achieved / criteria.length) * 100);

    return (
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-emerald-100 tracking-wide">RADAR DE ALTA</h3>
                        <p className="text-[10px] text-emerald-400/60 font-mono tracking-widest">{progress}% DOS CRITÉRIOS ATINGIDOS</p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-950 w-full">
                <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="p-6 space-y-4">
                {criteria.map((criterion) => (
                    <div key={criterion.id} className="group relative">
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                            <div className="mt-0.5 flex-shrink-0">
                                {criterion.status === 'achieved' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                {criterion.status === 'in_progress' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                                {criterion.status === 'pending' && <Circle className="w-5 h-5 text-slate-600" />}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className={`text-sm font-medium ${criterion.status === 'achieved' ? 'text-slate-200' : 'text-slate-400'}`}>
                                        {criterion.description}
                                    </h4>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${criterion.status === 'achieved'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : criterion.status === 'in_progress'
                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                : 'bg-slate-800 text-slate-500 border-slate-700'
                                        }`}>
                                        {criterion.status === 'achieved' ? 'ATINGIDO' : criterion.status === 'in_progress' ? 'EM ANDAMENTO' : 'PENDENTE'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed pl-1 border-l-2 border-slate-800">
                                    {criterion.evidence || "Sem evidências registradas ainda."}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

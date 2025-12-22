import React from 'react';
import { Calendar, Clock, ChevronRight, FileText } from 'lucide-react';
import { SessionRecord } from '../types/patient';

interface SessionTimelineProps {
    sessions: SessionRecord[];
    onSelectSession: (session: SessionRecord) => void;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({ sessions, onSelectSession }) => {
    // Sort sessions by date descending
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col w-64">
            <div className="p-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-slate-400 tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    HISTÓRICO
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {sortedSessions.length === 0 ? (
                    <div className="p-8 text-center opacity-30 text-xs text-slate-400">
                        Nenhuma sessão registrada.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {sortedSessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => onSelectSession(session)}
                                className="p-4 hover:bg-white/5 cursor-pointer group transition-colors relative"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-cyan-500/0 to-transparent group-hover:via-cyan-500 transition-all opacity-0 group-hover:opacity-100" />

                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/10">
                                        {new Date(session.date).toLocaleDateString()}
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                </div>

                                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2 opacity-80 group-hover:opacity-100">
                                    {session.soap.queixa_principal || "Sem queixa principal"}
                                </p>

                                <div className="flex items-center gap-2">
                                    {session.pbtNetwork?.nodes?.length > 0 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Possui Rede PBT" />
                                    )}
                                    {session.adaptation?.gatilho_identificado && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" title="Intervenção Adaptativa" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

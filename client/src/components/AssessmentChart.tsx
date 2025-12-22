import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea
} from 'recharts';
import { Assessment } from '../types/forms';

interface AssessmentChartProps {
    assessments: Assessment[];
}

export const AssessmentChart: React.FC<AssessmentChartProps> = ({ assessments }) => {
    if (assessments.length === 0) return null;

    // Filtrar apenas GAD-7 por enquanto ou aceitar prop de tipo
    const data = assessments
        .filter(a => a.type === 'GAD-7')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(a => ({
            date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            score: a.score,
            fullDate: new Date(a.date).toLocaleDateString('pt-BR')
        }));

    if (data.length === 0) return null;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                Progresso Clínico (GAD-7)
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />

                        {/* Zonas de Gravidade do GAD-7 */}
                        <ReferenceArea y1={0} y2={5} fill="#10b981" fillOpacity={0.1} />
                        <ReferenceArea y1={5} y2={10} fill="#eab308" fillOpacity={0.1} />
                        <ReferenceArea y1={10} y2={15} fill="#f97316" fillOpacity={0.1} />
                        <ReferenceArea y1={15} y2={21} fill="#ef4444" fillOpacity={0.1} />

                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 21]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                            itemStyle={{ color: '#22d3ee' }}
                            labelStyle={{ color: '#94a3b8' }}
                            cursor={{ stroke: '#334155' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#22d3ee"
                            strokeWidth={3}
                            dot={{ fill: '#0f172a', stroke: '#22d3ee', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#22d3ee' }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500/20 rounded-full"></div>Minimo</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500/20 rounded-full"></div>Leve</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500/20 rounded-full"></div>Moderado</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500/20 rounded-full"></div>Grave</div>
            </div>
        </div>
    );
};

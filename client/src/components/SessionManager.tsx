import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { ScheduledSession, PaymentRecord } from '../types/patient';
import { PaymentHistory } from './PaymentHistory';
import {
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Plus,
    ChevronRight,
    AlertTriangle,
    FileText,
    DollarSign,
    CalendarPlus
} from 'lucide-react';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const SessionManager: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [activeTab, setActiveTab] = useState<'agenda' | 'financeiro'>('agenda');
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [newSessionDate, setNewSessionDate] = useState('');
    const [newSessionTime, setNewSessionTime] = useState('');

    if (!currentPatient) return null;

    const sessions = currentPatient.scheduledSessions || [];
    const billing = currentPatient.billing;
    const sessionValue = billing?.sessionValue || 0;

    // Generate next sessions based on schedule
    const generateUpcomingSessions = () => {
        if (!currentPatient.schedule) return;

        const { dayOfWeek, time, frequency } = currentPatient.schedule;
        const today = new Date();
        const newSessions: ScheduledSession[] = [];

        // Generate next 4 sessions
        for (let i = 0; i < 4; i++) {
            const targetDate = new Date(today);
            const weeksToAdd = frequency === 'quinzenal' ? i * 2 : frequency === 'mensal' ? i * 4 : i;
            targetDate.setDate(today.getDate() + weeksToAdd * 7);

            // Find next occurrence of dayOfWeek
            while (targetDate.getDay() !== dayOfWeek) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const dateStr = targetDate.toISOString().split('T')[0];

            // Don't add if already exists
            if (!sessions.some(s => s.scheduledDate === dateStr)) {
                newSessions.push({
                    id: crypto.randomUUID(),
                    scheduledDate: dateStr,
                    scheduledTime: time,
                    status: 'agendada'
                });
            }
        }

        if (newSessions.length > 0) {
            updatePatient({
                ...currentPatient,
                scheduledSessions: [...sessions, ...newSessions]
            });
        }
    };

    // Mark as present and create payment
    const handlePresent = (session: ScheduledSession) => {
        if (!currentPatient) return;

        // Verificar se é pacote mensal para descontar sessão
        const isMonthlyPackage = billing?.paymentType === 'particular' && billing?.particularMode === 'mensal' && billing?.package;

        // Create payment record
        const paymentId = crypto.randomUUID();
        const isInsurance = billing?.paymentType === 'convenio';
        const insurance = billing?.insurance;

        // Calculate taxes for insurance
        let amount = sessionValue;
        if (isInsurance && insurance) {
            const totalTax = (insurance.issPercent || 0) + (insurance.irrfPercent || 6);
            amount = sessionValue * (1 - totalTax / 100);
        }

        const newPayment: PaymentRecord = {
            id: paymentId,
            sessionDate: session.scheduledDate,
            amount,
            status: isInsurance ? 'a_receber' : isMonthlyPackage ? 'pago' : 'pendente',
            method: isInsurance ? 'convenio' : isMonthlyPackage ? 'pacote' : billing?.paymentType === 'pacote' ? 'pacote' : undefined,
            expectedDate: isInsurance && insurance
                ? new Date(Date.now() + (insurance.reimbursementDays || 60) * 24 * 60 * 60 * 1000).toISOString()
                : undefined,
            notes: `Sessão ${new Date(session.scheduledDate).toLocaleDateString('pt-BR')}${isMonthlyPackage ? ' (pacote mensal)' : ''}`,
            sessionId: session.id
        };

        // Update session status
        const updatedSessions = sessions.map(s =>
            s.id === session.id
                ? { ...s, status: 'presente' as const, attendanceConfirmedAt: new Date().toISOString(), paymentId, chargedToPackage: Boolean(isMonthlyPackage) }
                : s
        );

        // Se é pacote mensal, incrementar usedSessions
        let updatedBilling = currentPatient.billing;
        if (isMonthlyPackage && updatedBilling?.package) {
            updatedBilling = {
                ...updatedBilling,
                package: {
                    ...updatedBilling.package,
                    usedSessions: (updatedBilling.package.usedSessions || 0) + 1
                }
            };
        }

        updatePatient({
            ...currentPatient,
            scheduledSessions: updatedSessions,
            billing: updatedBilling,
            paymentRecords: [...(currentPatient.paymentRecords || []), newPayment]
        });
    };

    // Mark as absent and create evolution note
    const handleAbsent = (session: ScheduledSession, reason?: string) => {
        if (!currentPatient) return;

        // Verificar se a falta foi com menos de 24h de antecedência
        const sessionDateTime = new Date(`${session.scheduledDate}T${session.scheduledTime}`);
        const now = new Date();
        const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        const cancelledWithin24h = hoursUntilSession < 24 && hoursUntilSession > -24; // Falta em cima da hora

        // Verificar se deve descontar do pacote (particular mensal)
        const isMonthlyPackage = billing?.paymentType === 'particular' && billing?.particularMode === 'mensal' && billing?.package;
        const shouldChargePackage = cancelledWithin24h && isMonthlyPackage;

        // Update session com flags de cobrança
        const updatedSessions = sessions.map(s =>
            s.id === session.id
                ? {
                    ...s,
                    status: 'falta' as const,
                    attendanceConfirmedAt: new Date().toISOString(),
                    absenceReason: reason,
                    cancelledWithin24h,
                    chargedToPackage: Boolean(shouldChargePackage)
                }
                : s
        );

        // Se deve descontar do pacote, incrementar usedSessions
        let updatedBilling = currentPatient.billing;
        if (shouldChargePackage && updatedBilling?.package) {
            updatedBilling = {
                ...updatedBilling,
                package: {
                    ...updatedBilling.package,
                    usedSessions: (updatedBilling.package.usedSessions || 0) + 1
                }
            };
        }

        // Create automatic evolution note (SEM informações financeiras)
        const absenceNote = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            notes: `⚠️ FALTA - Paciente não compareceu à sessão agendada para ${new Date(session.scheduledDate).toLocaleDateString('pt-BR')} às ${session.scheduledTime}.${reason ? ` Motivo: ${reason}` : ''}`,
            summary: 'Falta - Paciente não compareceu',
            soap: {
                S: 'Paciente não compareceu à sessão agendada.',
                O: 'Ausência registrada automaticamente pelo sistema.',
                A: reason || 'Falta sem justificativa prévia.',
                P: 'Reagendar sessão e verificar motivo da ausência no próximo contato.'
            },
            pbtNetwork: { nodes: [], edges: [] },
            adaptation: null
        };

        const updatedRecords = {
            ...currentPatient.clinicalRecords,
            sessions: [absenceNote, ...currentPatient.clinicalRecords.sessions]
        };

        updatePatient({
            ...currentPatient,
            scheduledSessions: updatedSessions,
            billing: updatedBilling,
            clinicalRecords: updatedRecords
        });
    };

    // Reschedule session
    const handleReschedule = (session: ScheduledSession, newDate: string) => {
        if (!currentPatient) return;

        const updatedSessions = sessions.map(s =>
            s.id === session.id
                ? { ...s, status: 'remarcada' as const, rescheduledTo: newDate }
                : s
        );

        // Create new session for the new date
        const newSession: ScheduledSession = {
            id: crypto.randomUUID(),
            scheduledDate: newDate,
            scheduledTime: session.scheduledTime,
            status: 'agendada',
            notes: `Remarcada de ${new Date(session.scheduledDate).toLocaleDateString('pt-BR')}`
        };

        updatePatient({
            ...currentPatient,
            scheduledSessions: [...updatedSessions, newSession]
        });
    };

    // Add single session
    const handleAddSession = () => {
        if (!newSessionDate || !newSessionTime) return;

        const newSession: ScheduledSession = {
            id: crypto.randomUUID(),
            scheduledDate: newSessionDate,
            scheduledTime: newSessionTime,
            status: 'agendada'
        };

        updatePatient({
            ...currentPatient,
            scheduledSessions: [...sessions, newSession]
        });

        setShowScheduleDialog(false);
        setNewSessionDate('');
        setNewSessionTime('');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    // Filter for upcoming and past
    const today = new Date().toISOString().split('T')[0];
    const upcomingSessions = sortedSessions.filter(s => s.scheduledDate >= today && s.status === 'agendada');
    const pastSessions = sortedSessions.filter(s => s.status !== 'agendada').slice(0, 10);

    // Calculate stats
    const stats = {
        total: sessions.length,
        presentes: sessions.filter(s => s.status === 'presente').length,
        faltas: sessions.filter(s => s.status === 'falta').length,
        taxa: sessions.filter(s => s.status === 'presente' || s.status === 'falta').length > 0
            ? Math.round((sessions.filter(s => s.status === 'presente').length /
                sessions.filter(s => s.status === 'presente' || s.status === 'falta').length) * 100)
            : 100
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'agendada':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Agendada</span>;
            case 'presente':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">✓ Presente</span>;
            case 'falta':
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">✗ Falta</span>;
            case 'remarcada':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">↻ Remarcada</span>;
            case 'cancelada':
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Cancelada</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header com Abas */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {activeTab === 'agenda' ? (
                            <Calendar className="w-6 h-6 text-indigo-600" />
                        ) : (
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        )}
                        {activeTab === 'agenda' ? 'Agenda e Presença' : 'Financeiro'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {activeTab === 'agenda'
                            ? `Controle de sessões de ${currentPatient.name}`
                            : `Histórico financeiro de ${currentPatient.name}`
                        }
                    </p>
                </div>

                {/* Abas estilo Chrome */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab('agenda')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'agenda'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Agenda
                    </button>
                    <button
                        onClick={() => setActiveTab('financeiro')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'financeiro'
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <DollarSign className="w-4 h-4" />
                        Financeiro
                    </button>
                </div>
            </div>

            {/* Conteúdo da aba Financeiro */}
            {activeTab === 'financeiro' && (
                <PaymentHistory />
            )}

            {/* Conteúdo da aba Agenda */}
            {activeTab === 'agenda' && (
                <>
                    {/* Botões de ação */}
                    <div className="flex gap-2 flex-wrap">
                        {currentPatient.schedule && (
                            <button
                                onClick={generateUpcomingSessions}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Gerar Próximas
                            </button>
                        )}
                        <button
                            onClick={() => setShowScheduleDialog(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Sessão
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
                            <p className="text-gray-500 text-sm">Total de Sessões</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl border-2 border-emerald-100 p-4">
                            <p className="text-emerald-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />Presenças</p>
                            <p className="text-2xl font-bold text-emerald-700">{stats.presentes}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl border-2 border-red-100 p-4">
                            <p className="text-red-600 text-sm flex items-center gap-1"><XCircle className="w-4 h-4" />Faltas</p>
                            <p className="text-2xl font-bold text-red-700">{stats.faltas}</p>
                        </div>
                        <div className={`rounded-xl border-2 p-4 ${stats.taxa >= 80 ? 'bg-emerald-50 border-emerald-100' : stats.taxa >= 60 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                            <p className={`text-sm ${stats.taxa >= 80 ? 'text-emerald-600' : stats.taxa >= 60 ? 'text-amber-600' : 'text-red-600'}`}>Taxa de Comparecimento</p>
                            <p className={`text-2xl font-bold ${stats.taxa >= 80 ? 'text-emerald-700' : stats.taxa >= 60 ? 'text-amber-700' : 'text-red-700'}`}>{stats.taxa}%</p>
                        </div>
                    </div>

                    {/* Upcoming Sessions */}
                    {upcomingSessions.length > 0 && (
                        <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
                            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100">
                                <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Próximas Sessões
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {upcomingSessions.map(session => (
                                    <div key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center bg-indigo-100 rounded-lg p-2 min-w-[60px]">
                                                <p className="text-xs text-indigo-600">{DAY_NAMES[new Date(session.scheduledDate).getDay()].slice(0, 3)}</p>
                                                <p className="text-lg font-bold text-indigo-800">{formatDate(session.scheduledDate)}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{session.scheduledTime}</p>
                                                {getStatusBadge(session.status)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePresent(session)}
                                                className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-all"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Presente
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt('Motivo da falta (opcional):');
                                                    handleAbsent(session, reason || undefined);
                                                }}
                                                className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Faltou
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newDate = prompt('Nova data (AAAA-MM-DD):', session.scheduledDate);
                                                    if (newDate) handleReschedule(session, newDate);
                                                }}
                                                className="flex items-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-all"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Remarcar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past Sessions */}
                    {pastSessions.length > 0 && (
                        <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Histórico Recente
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {pastSessions.map(session => (
                                    <div key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[60px]">
                                                <p className="text-sm text-gray-500">{formatDate(session.scheduledDate)}</p>
                                                <p className="text-xs text-gray-400">{session.scheduledTime}</p>
                                            </div>
                                            <div>
                                                {getStatusBadge(session.status)}
                                                {session.absenceReason && (
                                                    <p className="text-xs text-gray-500 mt-1">{session.absenceReason}</p>
                                                )}
                                                {session.rescheduledTo && (
                                                    <p className="text-xs text-amber-600 mt-1">→ {formatDate(session.rescheduledTo)}</p>
                                                )}
                                            </div>
                                        </div>
                                        {session.paymentId && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                Pagamento criado
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {sessions.length === 0 && (
                        <div className="bg-white rounded-xl border-2 border-gray-100 p-8 text-center">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">Nenhuma sessão agendada</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {currentPatient.schedule
                                    ? 'Clique em "Gerar Próximas" para criar sessões baseadas no horário configurado'
                                    : 'Configure o horário do paciente ou adicione sessões manualmente'}
                            </p>
                        </div>
                    )}

                    {/* Add Session Dialog */}
                    {showScheduleDialog && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <CalendarPlus className="w-5 h-5 text-indigo-600" />
                                    Agendar Nova Sessão
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Data</label>
                                        <input
                                            type="date"
                                            value={newSessionDate}
                                            onChange={(e) => setNewSessionDate(e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Horário</label>
                                        <input
                                            type="time"
                                            value={newSessionTime}
                                            onChange={(e) => setNewSessionTime(e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowScheduleDialog(false)}
                                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddSession}
                                        disabled={!newSessionDate || !newSessionTime}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50"
                                    >
                                        Agendar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )
            }
        </div >
    );
};

export default SessionManager;

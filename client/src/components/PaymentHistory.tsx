import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { PaymentRecord } from '../types/patient';
import { ReceiptGenerator } from './ReceiptGenerator';
import { FunservReportGenerator } from './FunservReportGenerator';
import {
    Plus,
    CheckCircle,
    Clock,
    AlertCircle,
    DollarSign,
    Calendar,
    CreditCard,
    Building2,
    Trash2,
    FileText,
    X,
    CalendarCheck,
    Receipt,
    Calculator
} from 'lucide-react';

interface AddPaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (payment: Omit<PaymentRecord, 'id'>) => void;
    sessionValue: number;
}

const AddPaymentDialog: React.FC<AddPaymentDialogProps> = ({ isOpen, onClose, onAdd, sessionValue }) => {
    const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState(sessionValue);
    const [status, setStatus] = useState<'pendente' | 'pago' | 'a_receber'>('pago');
    const [method, setMethod] = useState<'pix' | 'dinheiro' | 'cartao' | 'convenio' | 'pacote'>('pix');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        onAdd({
            sessionDate,
            amount,
            status,
            method,
            paymentDate: status === 'pago' ? new Date().toISOString() : undefined,
            expectedDate: status === 'a_receber' ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            notes: notes || undefined
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Registrar Pagamento</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Data da Sessão</label>
                        <input
                            type="date"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Valor</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 pl-12 focus:outline-none focus:border-indigo-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'pago', label: 'Pago', icon: CheckCircle, color: 'emerald' },
                                { value: 'pendente', label: 'Pendente', icon: AlertCircle, color: 'amber' },
                                { value: 'a_receber', label: 'Convênio', icon: Clock, color: 'blue' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(opt.value as any)}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${status === opt.value
                                        ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <opt.icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Forma de Pagamento</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value as any)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                        >
                            <option value="pix">PIX</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="cartao">Cartão</option>
                            <option value="convenio">Convênio</option>
                            <option value="pacote">Pacote</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Observações (opcional)</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Referente a dezembro..."
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg"
                    >
                        Registrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PaymentHistory: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showReceiptDialog, setShowReceiptDialog] = useState(false);
    const [showFunservReport, setShowFunservReport] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pago' | 'pendente' | 'a_receber'>('all');

    const payments = currentPatient?.paymentRecords || [];
    const sessionValue = currentPatient?.billing?.sessionValue || 200;
    const billing = currentPatient?.billing;
    const insurance = billing?.insurance;

    // Check if this is a monthly billing insurance
    const isMonthlyBilling = insurance?.billingType === 'mensal';
    const isPerSessionBilling = insurance?.billingType === 'por_guia';

    // Calculate taxes
    const issPercent = insurance?.issPercent || 0;
    const irrfPercent = insurance?.irrfPercent || 6;
    const totalTaxPercent = issPercent + irrfPercent;

    // Get current month sessions (for monthly closing)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const filteredPayments = payments.filter(p => filter === 'all' || p.status === filter);

    const handleAddPayment = (payment: Omit<PaymentRecord, 'id'>) => {
        if (!currentPatient) return;

        const newPayment: PaymentRecord = {
            ...payment,
            id: crypto.randomUUID()
        };

        const updated = {
            ...currentPatient,
            paymentRecords: [...(currentPatient.paymentRecords || []), newPayment]
        };
        updatePatient(updated);
    };

    const handleDeletePayment = (paymentId: string) => {
        if (!currentPatient || !confirm('Remover este pagamento?')) return;

        const updated = {
            ...currentPatient,
            paymentRecords: currentPatient.paymentRecords?.filter(p => p.id !== paymentId) || []
        };
        updatePatient(updated);
    };

    const handleMarkAsPaid = (paymentId: string) => {
        if (!currentPatient) return;

        const updated = {
            ...currentPatient,
            paymentRecords: currentPatient.paymentRecords?.map(p =>
                p.id === paymentId
                    ? { ...p, status: 'pago' as const, paymentDate: new Date().toISOString() }
                    : p
            ) || []
        };
        updatePatient(updated);
    };

    // Monthly closing for GAMA/DANAMED
    const handleMonthlyClosing = () => {
        if (!currentPatient || !insurance) return;

        // Count sessions this month that haven't been billed yet
        const sessionsThisMonth = payments.filter(p => {
            const date = new Date(p.sessionDate);
            return date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear &&
                p.method === 'convenio' &&
                p.status !== 'a_receber';
        }).length;

        if (sessionsThisMonth === 0) {
            // If no unbilled sessions, just add one for this month
            const totalValue = sessionValue;
            const taxAmount = totalValue * (totalTaxPercent / 100);
            const netValue = totalValue - taxAmount;

            const closingPayment: PaymentRecord = {
                id: crypto.randomUUID(),
                sessionDate: new Date().toISOString(),
                amount: netValue,
                status: 'a_receber',
                method: 'convenio',
                expectedDate: new Date(Date.now() + (insurance.reimbursementDays || 60) * 24 * 60 * 60 * 1000).toISOString(),
                notes: `Fechamento ${monthNames[currentMonth]}/${currentYear} - ${insurance.name} (1 sessão) - Impostos: ${totalTaxPercent}%`
            };

            const updated = {
                ...currentPatient,
                paymentRecords: [...(currentPatient.paymentRecords || []), closingPayment]
            };
            updatePatient(updated);
        } else {
            alert(`Já existem ${sessionsThisMonth} sessões registradas este mês. Para fazer fechamento, registre as sessões primeiro.`);
        }
    };

    // Register single session for FUNSERV (por_guia)
    const handleRegisterSession = () => {
        if (!currentPatient || !insurance) return;

        const taxAmount = sessionValue * (totalTaxPercent / 100);
        const netValue = sessionValue - taxAmount;

        const sessionPayment: PaymentRecord = {
            id: crypto.randomUUID(),
            sessionDate: new Date().toISOString(),
            amount: netValue,
            status: 'a_receber',
            method: 'convenio',
            expectedDate: new Date(Date.now() + (insurance.reimbursementDays || 60) * 24 * 60 * 60 * 1000).toISOString(),
            notes: `Guia ${insurance.name} - ISS: ${issPercent}% + IRRF: ${irrfPercent}% = ${totalTaxPercent}%`
        };

        const updated = {
            ...currentPatient,
            paymentRecords: [...(currentPatient.paymentRecords || []), sessionPayment]
        };
        updatePatient(updated);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    // Summary calculations
    const summary = {
        total: payments.reduce((acc, p) => acc + p.amount, 0),
        pago: payments.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.amount, 0),
        pendente: payments.filter(p => p.status === 'pendente').reduce((acc, p) => acc + p.amount, 0),
        aReceber: payments.filter(p => p.status === 'a_receber').reduce((acc, p) => acc + p.amount, 0)
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pago':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />Pago</span>;
            case 'pendente':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />Pendente</span>;
            case 'a_receber':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" />Conv.</span>;
            default:
                return null;
        }
    };

    const getMethodIcon = (method?: string) => {
        switch (method) {
            case 'pix': return '📱';
            case 'dinheiro': return '💵';
            case 'cartao': return '💳';
            case 'convenio': return '🏥';
            case 'pacote': return '📦';
            default: return '💰';
        }
    };

    if (!currentPatient) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                        Histórico de Pagamentos
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Controle financeiro de {currentPatient.name}
                        {insurance && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {insurance.name} • {insurance.billingType === 'por_guia' ? 'Por Guia' : 'Mensal'}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Receipt Button */}
                    <button
                        onClick={() => setShowReceiptDialog(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                    >
                        <Receipt className="w-4 h-4" />
                        Recibo
                    </button>

                    {/* Insurance-specific buttons */}
                    {billing?.paymentType === 'convenio' && insurance?.name.includes('FUNSERV') && (
                        <button
                            onClick={() => setShowFunservReport(true)}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            Relatório FUNSERV
                        </button>
                    )}

                    {billing?.paymentType === 'convenio' && isPerSessionBilling && (
                        <button
                            onClick={handleRegisterSession}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            Registrar Guia
                        </button>
                    )}

                    {billing?.paymentType === 'convenio' && isMonthlyBilling && (
                        <button
                            onClick={handleMonthlyClosing}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                        >
                            <CalendarCheck className="w-4 h-4" />
                            Fechar Mês
                        </button>
                    )}

                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2 rounded-xl font-semibold shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Registrar Pagamento
                    </button>
                </div>
            </div>

            {/* Tax Info for Insurance */}
            {billing?.paymentType === 'convenio' && insurance && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <Calculator className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="font-bold text-blue-800">{insurance.name}</p>
                                <p className="text-sm text-blue-600">
                                    {insurance.billingType === 'por_guia' ? 'Faturamento por Guia' : 'Fechamento Mensal'}
                                    {' • '}{insurance.reimbursementDays} dias para repasse
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {issPercent > 0 && (
                                <div className="text-center">
                                    <p className="text-xs text-blue-600">ISS</p>
                                    <p className="font-bold text-blue-800">{issPercent}%</p>
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-xs text-blue-600">IRRF</p>
                                <p className="font-bold text-blue-800">{irrfPercent}%</p>
                            </div>
                            <div className="text-center border-l border-blue-200 pl-4">
                                <p className="text-xs text-blue-600">Total Impostos</p>
                                <p className="font-bold text-blue-800">{totalTaxPercent}%</p>
                            </div>
                            <div className="text-center border-l border-blue-200 pl-4">
                                <p className="text-xs text-blue-600">Valor Líquido</p>
                                <p className="font-bold text-emerald-700">{formatCurrency(sessionValue * (1 - totalTaxPercent / 100))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pacote Mensal Status */}
            {billing?.paymentType === 'particular' && billing?.particularMode === 'mensal' && billing?.package && (
                <div className={`rounded-xl border-2 p-4 ${billing.package.usedSessions >= billing.package.totalSessions
                        ? 'bg-red-50 border-red-200'
                        : billing.package.usedSessions >= billing.package.totalSessions - 1
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-emerald-50 border-emerald-200'
                    }`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">📦</span>
                            <div>
                                <p className="font-bold text-gray-800">Pacote Mensal</p>
                                <p className="text-sm text-gray-600">
                                    {billing.package.paymentDate && (
                                        <>Pago em {formatDate(billing.package.paymentDate)} • </>
                                    )}
                                    {formatCurrency(billing.package.packageValue || sessionValue)}/mês
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="text-center">
                                <p className="text-xs text-gray-600">Usadas</p>
                                <p className={`text-2xl font-bold ${billing.package.usedSessions >= billing.package.totalSessions
                                        ? 'text-red-700'
                                        : billing.package.usedSessions >= billing.package.totalSessions - 1
                                            ? 'text-amber-700'
                                            : 'text-emerald-700'
                                    }`}>
                                    {billing.package.usedSessions}/{billing.package.totalSessions}
                                </p>
                            </div>
                            <div className="text-center border-l border-gray-300 pl-4">
                                <p className="text-xs text-gray-600">Restam</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {billing.package.totalSessions - billing.package.usedSessions}
                                    {billing.package.usedSessions >= billing.package.totalSessions - 1 && ' ⚠️'}
                                </p>
                            </div>
                            {billing.package.usedSessions >= billing.package.totalSessions && (
                                <button
                                    onClick={() => {
                                        if (!currentPatient || !currentPatient.billing?.package) return;
                                        // Arquivar pacote atual no histórico
                                        const currentPackage = currentPatient.billing.package;
                                        const historyEntry = {
                                            id: crypto.randomUUID(),
                                            startDate: currentPackage.startDate || new Date().toISOString(),
                                            endDate: new Date().toISOString(),
                                            sessionsUsed: currentPackage.usedSessions,
                                            totalSessions: currentPackage.totalSessions,
                                            amountPaid: currentPackage.packageValue || sessionValue,
                                            paymentDate: currentPackage.paymentDate || new Date().toISOString()
                                        };
                                        // Criar novo pacote zerado
                                        const newPackage = {
                                            ...currentPackage,
                                            usedSessions: 0,
                                            startDate: new Date().toISOString(),
                                            paymentDate: '', // Aguardando novo pagamento
                                            history: [...(currentPackage.history || []), historyEntry]
                                        };
                                        updatePatient({
                                            ...currentPatient,
                                            billing: {
                                                ...currentPatient.billing,
                                                package: newPackage
                                            }
                                        });
                                    }}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all"
                                >
                                    🔄 Renovar Pacote
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Histórico de Pacotes */}
                    {billing.package.history && billing.package.history.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="font-semibold text-gray-700 mb-2">📋 Histórico de Pacotes</p>
                            <div className="space-y-2">
                                {billing.package.history.slice(-3).reverse().map((pkg: any) => (
                                    <div key={pkg.id} className="flex items-center justify-between bg-white/60 rounded-lg p-2 text-sm">
                                        <span className="text-gray-600">
                                            {formatDate(pkg.startDate)} → {formatDate(pkg.endDate)}
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {pkg.sessionsUsed}/{pkg.totalSessions} sessões
                                        </span>
                                        <span className="text-emerald-700 font-semibold">
                                            {formatCurrency(pkg.amountPaid)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
                    <p className="text-gray-500 text-sm">Total Registrado</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.total)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl border-2 border-emerald-100 p-4">
                    <p className="text-emerald-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />Recebido</p>
                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(summary.pago)}</p>
                </div>
                <div className="bg-amber-50 rounded-xl border-2 border-amber-100 p-4">
                    <p className="text-amber-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />Pendente</p>
                    <p className="text-2xl font-bold text-amber-700">{formatCurrency(summary.pendente)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl border-2 border-blue-100 p-4">
                    <p className="text-blue-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" />Convênios</p>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary.aReceber)}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
                {[
                    { value: 'all', label: 'Todos' },
                    { value: 'pago', label: 'Pagos' },
                    { value: 'pendente', label: 'Pendentes' },
                    { value: 'a_receber', label: 'Convênios' }
                ].map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.value
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
                {filteredPayments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum pagamento registrado</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredPayments.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()).map(payment => (
                            <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">{getMethodIcon(payment.method)}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800">{formatCurrency(payment.amount)}</span>
                                            {getStatusBadge(payment.status)}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Sessão: {formatDate(payment.sessionDate)}
                                            {payment.paymentDate && ` • Pago: ${formatDate(payment.paymentDate)}`}
                                            {payment.expectedDate && ` • Previsão: ${formatDate(payment.expectedDate)}`}
                                        </p>
                                        {payment.notes && <p className="text-xs text-gray-400 mt-1">{payment.notes}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {payment.status !== 'pago' && (
                                        <button
                                            onClick={() => handleMarkAsPaid(payment.id)}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Marcar como pago"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeletePayment(payment.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remover"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Payment Dialog */}
            <AddPaymentDialog
                isOpen={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onAdd={handleAddPayment}
                sessionValue={sessionValue}
            />

            {/* Receipt Generator Dialog */}
            <ReceiptGenerator
                isOpen={showReceiptDialog}
                onClose={() => setShowReceiptDialog(false)}
            />

            {/* FUNSERV Report Generator */}
            <FunservReportGenerator
                isOpen={showFunservReport}
                onClose={() => setShowFunservReport(false)}
            />
        </div>
    );
};

export default PaymentHistory;

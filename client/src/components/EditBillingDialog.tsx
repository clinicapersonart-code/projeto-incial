import React, { useState, useEffect } from 'react';
import { X, DollarSign, Building2, Package, Save, Calendar, CreditCard } from 'lucide-react';

interface EditBillingDialogProps {
    isOpen: boolean;
    patientName: string;
    currentBilling?: {
        paymentType: 'particular' | 'convenio' | 'pacote';
        particularMode?: 'mensal' | 'avulsa';
        sessionValue: number;
        insurance?: {
            name: string;
            planCode?: string;
            reimbursementDays: number;
            billingType: 'por_guia' | 'mensal';
            issPercent?: number;
            irrfPercent?: number;
        };
        package?: {
            totalSessions: number;
            usedSessions: number;
            packageValue: number;
            paymentDate?: string;
            startDate?: string;
            expiresAt?: string;
        };
    };
    onClose: () => void;
    onSave: (billing: EditBillingDialogProps['currentBilling']) => void;
}

// Convênios com valores fixos, tipo de faturamento e impostos
const INSURANCE_OPTIONS = [
    { name: 'FUNSERV CONVENCIONAL', value: 40, reimbursementDays: 60, billingType: 'por_guia' as const, description: 'Guia por sessão', issPercent: 2, irrfPercent: 6 },
    { name: 'GAMA', value: 74, reimbursementDays: 60, billingType: 'mensal' as const, description: 'Fechamento mensal', issPercent: 0, irrfPercent: 6 },
    { name: 'DANAMED ABA', value: 62, reimbursementDays: 60, billingType: 'mensal' as const, description: 'Fechamento mensal', issPercent: 0, irrfPercent: 6 },
    { name: 'Outro', value: 0, reimbursementDays: 60, billingType: 'mensal' as const, description: 'Personalizado', issPercent: 0, irrfPercent: 6 }
];

// Valores padrão particular
const DEFAULTS = {
    mensal: 400,
    avulsa: 100
};

export const EditBillingDialog: React.FC<EditBillingDialogProps> = ({
    isOpen,
    patientName,
    currentBilling,
    onClose,
    onSave
}) => {
    const [paymentType, setPaymentType] = useState<'particular' | 'convenio' | 'pacote'>('particular');
    const [particularMode, setParticularMode] = useState<'mensal' | 'avulsa'>('mensal');
    const [sessionValue, setSessionValue] = useState(DEFAULTS.mensal);
    const [insuranceName, setInsuranceName] = useState('');
    const [insurancePlanCode, setInsurancePlanCode] = useState('');
    const [reimbursementDays, setReimbursementDays] = useState(60);
    const [totalSessions, setTotalSessions] = useState(4); // Pacote padrão de 4 sessões
    const [usedSessions, setUsedSessions] = useState(0);
    const [packageValue, setPackageValue] = useState(400); // Valor mensal padrão
    const [customInsuranceValue, setCustomInsuranceValue] = useState(0);
    const [packagePaymentDate, setPackagePaymentDate] = useState(''); // Data do pagamento do pacote

    useEffect(() => {
        if (currentBilling) {
            setPaymentType(currentBilling.paymentType);
            setParticularMode(currentBilling.particularMode || 'mensal');
            setSessionValue(currentBilling.sessionValue);
            if (currentBilling.insurance) {
                setInsuranceName(currentBilling.insurance.name);
                setInsurancePlanCode(currentBilling.insurance.planCode || '');
                setReimbursementDays(currentBilling.insurance.reimbursementDays);
                // Check if it's a custom value
                const found = INSURANCE_OPTIONS.find(i => i.name === currentBilling.insurance?.name);
                if (!found || found.name === 'Outro') {
                    setCustomInsuranceValue(currentBilling.sessionValue);
                }
            }
            if (currentBilling.package) {
                setTotalSessions(currentBilling.package.totalSessions || 4);
                setUsedSessions(currentBilling.package.usedSessions || 0);
                setPackageValue(currentBilling.package.packageValue || 400);
                setPackagePaymentDate(currentBilling.package.paymentDate || '');
            }
        } else {
            // Reset to defaults
            setPaymentType('particular');
            setParticularMode('mensal');
            setSessionValue(DEFAULTS.mensal);
        }
    }, [currentBilling, isOpen]);

    // Auto-update session value when particular mode changes
    useEffect(() => {
        if (paymentType === 'particular') {
            setSessionValue(particularMode === 'mensal' ? DEFAULTS.mensal : DEFAULTS.avulsa);
        }
    }, [particularMode, paymentType]);

    // Auto-update session value when insurance changes
    useEffect(() => {
        if (paymentType === 'convenio' && insuranceName) {
            const ins = INSURANCE_OPTIONS.find(i => i.name === insuranceName);
            if (ins && ins.name !== 'Outro') {
                setSessionValue(ins.value);
                setReimbursementDays(ins.reimbursementDays);
            } else if (ins?.name === 'Outro') {
                setSessionValue(customInsuranceValue || 0);
            }
        }
    }, [insuranceName, paymentType, customInsuranceValue]);

    if (!isOpen) return null;

    const handleSave = () => {
        const billing: EditBillingDialogProps['currentBilling'] = {
            paymentType,
            particularMode: paymentType === 'particular' ? particularMode : undefined,
            sessionValue
        };

        if (paymentType === 'convenio') {
            const selectedIns = INSURANCE_OPTIONS.find(i => i.name === insuranceName);
            billing.insurance = {
                name: insuranceName,
                planCode: insurancePlanCode || undefined,
                reimbursementDays,
                billingType: selectedIns?.billingType || 'mensal',
                issPercent: selectedIns?.issPercent || 0,
                irrfPercent: selectedIns?.irrfPercent || 6
            };
        }

        // Salvar pacote para modo pacote OU particular mensal
        if (paymentType === 'pacote' || (paymentType === 'particular' && particularMode === 'mensal')) {
            billing.package = {
                totalSessions,
                usedSessions,
                packageValue: paymentType === 'particular' ? sessionValue : packageValue,
                paymentDate: packagePaymentDate || undefined,
                startDate: packagePaymentDate || new Date().toISOString()
            };
        }

        onSave(billing);
        onClose();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const selectedInsurance = INSURANCE_OPTIONS.find(i => i.name === insuranceName);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Configurar Pagamento</h3>
                            <p className="text-sm text-gray-500">{patientName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Payment Type Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            Tipo de Pagamento
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentType('particular')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentType === 'particular'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                <DollarSign className="w-6 h-6" />
                                <span className="font-semibold text-sm">Particular</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('convenio')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentType === 'convenio'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                <Building2 className="w-6 h-6" />
                                <span className="font-semibold text-sm">Convênio</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('pacote')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentType === 'pacote'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                <Package className="w-6 h-6" />
                                <span className="font-semibold text-sm">Pacote</span>
                            </button>
                        </div>
                    </div>

                    {/* Particular Fields */}
                    {paymentType === 'particular' && (
                        <div className="bg-emerald-50 rounded-xl p-4 space-y-4 border border-emerald-100">
                            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Pagamento Particular
                            </h4>

                            {/* Mode Selector */}
                            <div>
                                <label className="block text-sm font-medium text-emerald-700 mb-2">
                                    Modalidade
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setParticularMode('mensal')}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${particularMode === 'mensal'
                                            ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                                            : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'
                                            }`}
                                    >
                                        <Calendar className="w-5 h-5" />
                                        <span className="font-semibold text-sm">Mensal</span>
                                        <span className="text-xs opacity-70">R$ {DEFAULTS.mensal}/mês</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setParticularMode('avulsa')}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${particularMode === 'avulsa'
                                            ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                                            : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'
                                            }`}
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        <span className="font-semibold text-sm">Avulsa</span>
                                        <span className="text-xs opacity-70">R$ {DEFAULTS.avulsa}/sessão</span>
                                    </button>
                                </div>
                            </div>

                            {/* Custom Value */}
                            <div>
                                <label className="block text-sm font-medium text-emerald-700 mb-2">
                                    Valor Personalizado (opcional)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">R$</span>
                                    <input
                                        type="number"
                                        value={sessionValue}
                                        onChange={(e) => setSessionValue(Number(e.target.value))}
                                        className="w-full border-2 border-emerald-200 rounded-xl p-3 pl-12 focus:outline-none focus:border-emerald-400 bg-white text-lg font-bold"
                                        min={0}
                                        step={10}
                                    />
                                </div>
                                <p className="text-xs text-emerald-600 mt-1">
                                    Altere aqui para cobrar valor diferente deste paciente
                                </p>
                            </div>

                            {/* Controle de Pacote Mensal (4 sessões) */}
                            {particularMode === 'mensal' && (
                                <div className="bg-emerald-100 rounded-xl p-4 space-y-4 border border-emerald-200">
                                    <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                                        📦 Pacote Mensal (4 sessões)
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-emerald-700 mb-2">
                                                Sessões do Pacote
                                            </label>
                                            <input
                                                type="number"
                                                value={totalSessions}
                                                onChange={(e) => setTotalSessions(Number(e.target.value))}
                                                className="w-full border-2 border-emerald-200 rounded-xl p-3 focus:outline-none focus:border-emerald-400 bg-white"
                                                min={1}
                                                max={12}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-emerald-700 mb-2">
                                                Sessões Usadas
                                            </label>
                                            <input
                                                type="number"
                                                value={usedSessions}
                                                onChange={(e) => setUsedSessions(Number(e.target.value))}
                                                className="w-full border-2 border-emerald-200 rounded-xl p-3 focus:outline-none focus:border-emerald-400 bg-white"
                                                min={0}
                                                max={totalSessions}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-emerald-700 mb-2">
                                            Data do Pagamento
                                        </label>
                                        <input
                                            type="date"
                                            value={packagePaymentDate}
                                            onChange={(e) => setPackagePaymentDate(e.target.value)}
                                            className="w-full border-2 border-emerald-200 rounded-xl p-3 focus:outline-none focus:border-emerald-400 bg-white"
                                        />
                                    </div>

                                    {/* Resumo */}
                                    <div className="bg-emerald-200/50 rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-emerald-700">Restam</p>
                                            <p className={`text-xl font-bold ${totalSessions - usedSessions <= 1 ? 'text-amber-600' : 'text-emerald-800'}`}>
                                                {totalSessions - usedSessions} sessões
                                                {totalSessions - usedSessions <= 1 && ' ⚠️'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-emerald-700">Valor/Sessão</p>
                                            <p className="text-lg font-bold text-emerald-800">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sessionValue / totalSessions)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Insurance Fields */}
                    {paymentType === 'convenio' && (
                        <div className="bg-blue-50 rounded-xl p-4 space-y-4 border border-blue-100">
                            <h4 className="font-bold text-blue-800 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Dados do Convênio
                            </h4>

                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-2">
                                    Selecione o Convênio
                                </label>
                                <div className="space-y-2">
                                    {INSURANCE_OPTIONS.map(ins => (
                                        <button
                                            key={ins.name}
                                            type="button"
                                            onClick={() => setInsuranceName(ins.name)}
                                            className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${insuranceName === ins.name
                                                ? 'border-blue-500 bg-blue-100 text-blue-700'
                                                : 'border-blue-200 bg-white text-blue-600 hover:bg-blue-50'
                                                }`}
                                        >
                                            <span className="font-medium">{ins.name}</span>
                                            {ins.name !== 'Outro' && (
                                                <span className="font-bold">{formatCurrency(ins.value)}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom value for "Outro" */}
                            {insuranceName === 'Outro' && (
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">
                                        Valor do Convênio
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-bold">R$</span>
                                        <input
                                            type="number"
                                            value={customInsuranceValue}
                                            onChange={(e) => {
                                                setCustomInsuranceValue(Number(e.target.value));
                                                setSessionValue(Number(e.target.value));
                                            }}
                                            className="w-full border-2 border-blue-200 rounded-xl p-3 pl-12 focus:outline-none focus:border-blue-400 bg-white text-lg font-bold"
                                            min={0}
                                            step={5}
                                            placeholder="Digite o valor"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-2">
                                    Código do Plano (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={insurancePlanCode}
                                    onChange={(e) => setInsurancePlanCode(e.target.value)}
                                    placeholder="Ex: 12345-6"
                                    className="w-full border-2 border-blue-200 rounded-xl p-3 focus:outline-none focus:border-blue-400 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-2">
                                    Prazo de Repasse (dias)
                                </label>
                                <div className="flex gap-2">
                                    {[30, 45, 60, 90].map(days => (
                                        <button
                                            key={days}
                                            type="button"
                                            onClick={() => setReimbursementDays(days)}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-all ${reimbursementDays === days
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-100'
                                                }`}
                                        >
                                            {days}d
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            {insuranceName && (
                                <div className="bg-blue-100 rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-700">Convênio Selecionado</p>
                                        <p className="text-lg font-bold text-blue-800">{insuranceName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-blue-700">Valor/Sessão</p>
                                        <p className="text-xl font-bold text-blue-800">{formatCurrency(sessionValue)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Package Fields */}
                    {paymentType === 'pacote' && (
                        <div className="bg-purple-50 rounded-xl p-4 space-y-4 border border-purple-100">
                            <h4 className="font-bold text-purple-800 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Dados do Pacote
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-2">
                                        Total de Sessões
                                    </label>
                                    <input
                                        type="number"
                                        value={totalSessions}
                                        onChange={(e) => setTotalSessions(Number(e.target.value))}
                                        className="w-full border-2 border-purple-200 rounded-xl p-3 focus:outline-none focus:border-purple-400 bg-white"
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-2">
                                        Sessões Usadas
                                    </label>
                                    <input
                                        type="number"
                                        value={usedSessions}
                                        onChange={(e) => setUsedSessions(Number(e.target.value))}
                                        className="w-full border-2 border-purple-200 rounded-xl p-3 focus:outline-none focus:border-purple-400 bg-white"
                                        min={0}
                                        max={totalSessions}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-purple-700 mb-2">
                                    Valor Total do Pacote
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 font-bold">R$</span>
                                    <input
                                        type="number"
                                        value={packageValue}
                                        onChange={(e) => setPackageValue(Number(e.target.value))}
                                        className="w-full border-2 border-purple-200 rounded-xl p-3 pl-12 focus:outline-none focus:border-purple-400 bg-white text-lg font-bold"
                                        min={0}
                                        step={50}
                                    />
                                </div>
                            </div>

                            {/* Package Summary */}
                            <div className="bg-purple-100 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-700">Restam</p>
                                    <p className="text-xl font-bold text-purple-800">{totalSessions - usedSessions} sessões</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-purple-700">Valor/Sessão</p>
                                    <p className="text-xl font-bold text-purple-800">
                                        {formatCurrency(packageValue / totalSessions)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

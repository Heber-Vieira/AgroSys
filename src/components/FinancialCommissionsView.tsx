import React, { useState } from 'react';
import { UserProfile, FinancialEntry, ServiceOrder } from '../types';
import { 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Filter,
  Users,
  Printer,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { formatBRL } from '../utils/formatters';

interface FinancialCommissionsViewProps {
  currentUser: UserProfile;
  orders: ServiceOrder[];
  financials: FinancialEntry[];
}

export const FinancialCommissionsView: React.FC<FinancialCommissionsViewProps> = ({
  currentUser,
  orders,
  financials,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  // Strict Admin & Master Role Guard
  const hasAccess = currentUser.role === 'ADMIN' || currentUser.role === 'MASTER' || currentUser.isMaster;
  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-3xl shadow-xl text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-emerald-950 dark:text-white">
            Acesso Restrito ao Módulo Financeiro
          </h2>
          <p className="text-xs text-slate-600 dark:text-emerald-300/80 leading-relaxed max-w-md mx-auto">
            As informações de faturamento, comissões da tripulação, contas a pagar e contas a receber são de visualização e controle exclusivo dos <strong>Administradores</strong> e <strong>Usuários Master</strong> do sistema.
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Perfil Conectado: {currentUser.roleLabel}
          </span>
        </div>
      </div>
    );
  }

  const totalReceivables = financials
    .filter(f => f.type === 'RECEIVABLE')
    .reduce((acc, f) => acc + f.amount, 0);

  const totalPayables = financials
    .filter(f => f.type === 'PAYABLE')
    .reduce((acc, f) => acc + f.amount, 0);

  const netBalance = totalReceivables - totalPayables;

  // Filter based on type
  const displayedEntries = financials.filter(f => {
    if (filterType === 'RECEIVABLE') return f.type === 'RECEIVABLE';
    if (filterType === 'PAYABLE') return f.type === 'PAYABLE';
    return true;
  });

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {currentUser.role === 'PILOT' || currentUser.role === 'ASSISTANT'
              ? 'Extrato de Comissões de Voo & Solo'
              : 'Gestão Financeira & Comissões da Tripulação'}
          </h1>
          <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Faturamento automatizado a partir da Matriz de Precificação e rateio transparente da tríade de campo.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="print:hidden px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          title="Imprimir Extrato Financeiro e Comissões"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir Extrato</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">
              {currentUser.role === 'USER' ? 'Total Faturado' : 'Contas a Receber (OS)'}
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-base sm:text-lg lg:text-xl font-black text-emerald-950 dark:text-white font-mono">
              {formatBRL(totalReceivables)}
            </span>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Duplicatas emitidas contra produtores</p>
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">
              {currentUser.role === 'PILOT' || currentUser.role === 'ASSISTANT' ? 'Minhas Comissões' : 'Comissões da Tripulação'}
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-base sm:text-lg lg:text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
              {formatBRL(totalPayables)}
            </span>
            <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">Provisões de folha e rateio por ha</p>
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Margem Líquida</span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-base sm:text-lg lg:text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {formatBRL(netBalance)}
            </span>
            <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">Superávit após comissões e insumos</p>
          </div>
        </div>
      </div>

      {/* Financial Entries Table */}
      <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Lançamentos Financeiros & Títulos
          </h3>

          {(currentUser.role === 'ADMIN' || currentUser.role === 'MASTER' || currentUser.isMaster) && (
            <div className="flex items-center gap-1 bg-emerald-100/70 dark:bg-emerald-950/80 p-0.5 rounded-lg text-xs border border-emerald-200/60 dark:border-emerald-800 self-start sm:self-auto">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer text-xs ${
                  filterType === 'ALL' ? 'bg-white dark:bg-emerald-900 text-emerald-950 dark:text-white shadow-2xs' : 'text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('RECEIVABLE')}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer text-xs ${
                  filterType === 'RECEIVABLE' ? 'bg-white dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 shadow-2xs' : 'text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white'
                }`}
              >
                Receber (OS)
              </button>
              <button
                onClick={() => setFilterType('PAYABLE')}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer text-xs ${
                  filterType === 'PAYABLE' ? 'bg-white dark:bg-emerald-900 text-amber-700 dark:text-amber-300 shadow-2xs' : 'text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white'
                }`}
              >
                Pagar (Comissões)
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
            <thead>
              <tr className="border-b border-emerald-200/80 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200">
                <th className="pb-2 font-bold">Tipo</th>
                <th className="pb-2 font-bold">OS Ref.</th>
                <th className="pb-2 font-bold">Favorecido / Produtor</th>
                <th className="pb-2 font-bold">Descrição</th>
                <th className="pb-2 font-bold">Vencimento</th>
                <th className="pb-2 font-bold text-right">Valor</th>
                <th className="pb-2 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-200/60 dark:divide-emerald-800/60">
              {displayedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40">
                  <td className="py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                      entry.type === 'RECEIVABLE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    }`}>
                      {entry.type === 'RECEIVABLE' ? 'RECEBER' : 'PAGAR'}
                    </span>
                  </td>
                  <td className="py-2 font-mono font-bold text-emerald-950 dark:text-white">
                    {entry.osCode}
                  </td>
                  <td className="py-2 font-semibold text-emerald-950 dark:text-emerald-200">
                    {entry.clientOrBeneficiary}
                  </td>
                  <td className="py-2 text-emerald-900 dark:text-emerald-100">
                    {entry.description}
                  </td>
                  <td className="py-2 text-emerald-800 dark:text-emerald-300 font-mono">
                    {entry.dueDate}
                  </td>
                  <td className="py-2 text-right font-mono font-black text-emerald-950 dark:text-white">
                    {formatBRL(entry.amount)}
                  </td>
                  <td className="py-2 text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      entry.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {entry.status === 'PAID' ? 'LIQUIDADO' : 'PENDENTE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, PieChart, 
  BarChart3, Wallet, Receipt, FileText, Activity, Percent
} from 'lucide-react';
import { db, TABLES } from '../lib/db';
import { Invoice, Payroll, Expense, Transaction } from '../types';

export default function ProfitDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    revenueBreakdown: {
      invoices: 0,
      sales: 0,
      credits: 0
    },
    expenseBreakdown: {
      payroll: 0,
      fuel: 0,
      maintenance: 0,
      debits: 0,
      others: 0
    }
  });

  const [filter, setFilter] = useState<'month' | 'year' | 'all'>('month');

  useEffect(() => {
    calculateProfit();
  }, [filter]);

  const calculateProfit = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isWithinFilter = (dateString: string) => {
      if (filter === 'all') return true;
      const d = new Date(dateString);
      if (filter === 'month') {
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }
      if (filter === 'year') {
        return d.getFullYear() === currentYear;
      }
      return true;
    };

    // 1. Revenue
    const documents = db.getAll<any>(TABLES.DOCUMENTS);
    const invoices = documents.filter(d => d.type === 'invoice' && d.status === 'Paid' && isWithinFilter(d.date));
    const totalInvoiceRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    const sales = db.getAll<any>(TABLES.SALES);
    const filteredSales = sales.filter(s => (s.status === 'Paid' || s.status === 'Pembayaran Diterima') && isWithinFilter(s.date));
    const totalSalesRevenue = filteredSales.reduce((sum, s) => sum + (s.total || s.amount || 0), 0);

    const transactions = db.getAll<Transaction>(TABLES.TRANSACTIONS);
    // Only count credits that are NOT already counted from Sales or Invoices (if they have a source)
    const otherCredits = transactions.filter(t => 
      t.type === 'credit' && 
      isWithinFilter(t.date) && 
      t.source !== 'Sales' && 
      t.source !== 'Invoices'
    );
    const totalOtherCreditRevenue = otherCredits.reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalRevenue = totalInvoiceRevenue + totalSalesRevenue + totalOtherCreditRevenue;

    // 2. Expenses
    // Payroll
    const payrolls = db.getAll<any>(TABLES.PAYROLL);
    const filteredPayrolls = payrolls.filter(p => {
      if (filter === 'all') return true;
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      if (filter === 'month') {
        return p.month === monthNames[currentMonth] && p.year.toString() === currentYear.toString();
      }
      if (filter === 'year') {
        return p.year.toString() === currentYear.toString();
      }
      return true;
    });
    const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + (p.net_salary || p.net || 0), 0);

    // Expenses (Fuel, Maintenance, Others)
    const expenses = db.getAll<Expense>(TABLES.EXPENSES);
    const filteredExpenses = expenses.filter(e => isWithinFilter(e.date));
    
    const fuelExpenses = filteredExpenses.filter(e => e.category === 'Fuel' || (e as any).type === 'fuel').reduce((sum, e) => sum + ((e as any).amount || (e as any).cost || 0), 0);
    const maintenanceExpenses = filteredExpenses.filter(e => e.category === 'Maintenance' || (e as any).type === 'maintenance').reduce((sum, e) => sum + ((e as any).amount || (e as any).cost || 0), 0);
    const otherExpenses = filteredExpenses.filter(e => e.category === 'Others' || (e as any).type === 'others').reduce((sum, e) => sum + ((e as any).amount || (e as any).cost || 0), 0);

    // Debits (Only count those NOT already counted from Payroll, Fuel, or Maintenance)
    const otherDebits = transactions.filter(t => 
      t.type === 'debit' && 
      isWithinFilter(t.date) && 
      t.source !== 'Payroll' && 
      t.source !== 'Fuel' && 
      t.source !== 'Maintenance' &&
      t.source !== 'Inventory' // Inventory is also an expense
    );
    const totalOtherDebitsAmount = otherDebits.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Inventory purchases are also expenses
    const inventoryExpenses = transactions.filter(t => t.type === 'debit' && t.source === 'Inventory' && isWithinFilter(t.date))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = totalPayroll + fuelExpenses + maintenanceExpenses + otherExpenses + totalOtherDebitsAmount + inventoryExpenses;

    // 3. Net Profit
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    setStats({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      revenueBreakdown: {
        invoices: totalInvoiceRevenue,
        sales: totalSalesRevenue,
        credits: totalOtherCreditRevenue
      },
      expenseBreakdown: {
        payroll: totalPayroll,
        fuel: fuelExpenses,
        maintenance: maintenanceExpenses,
        debits: totalOtherDebitsAmount,
        others: otherExpenses
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4">
        <div>
          <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-widest leading-tight">Ringkasan Kewangan</h2>
        </div>
        
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5 w-full md:w-fit overflow-x-auto no-scrollbar whitespace-nowrap">
          <button 
            onClick={() => setFilter('month')}
            className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${filter === 'month' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Bulan Ini
          </button>
          <button 
            onClick={() => setFilter('year')}
            className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${filter === 'year' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Tahun Ini
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 border border-emerald-500/20 p-4 md:p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} className="md:size-64 text-emerald-500" />
          </div>
          <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1 md:mb-2">Jualan</p>
          <h2 className="text-xl md:text-3xl font-black text-white leading-none">{formatCurrency(stats.totalRevenue)}</h2>
          <div className="mt-3 md:mt-4 flex items-center gap-2 text-[9px] md:text-xs text-emerald-400/80">
            <Activity size={12} /> {filter === 'month' ? 'Bulan Ini' : 'Terkini'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-900/20 border border-red-500/20 p-4 md:p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={48} className="md:size-64 text-red-500" />
          </div>
          <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mb-1 md:mb-2">Belanja</p>
          <h2 className="text-xl md:text-3xl font-black text-white leading-none">{formatCurrency(stats.totalExpenses)}</h2>
          <div className="mt-3 md:mt-4 flex items-center gap-2 text-[9px] md:text-xs text-red-400/80">
            <Wallet size={12} /> Kos Operasi
          </div>
        </div>

        <div className={`bg-gradient-to-br border p-4 md:p-6 rounded-2xl relative overflow-hidden group ${stats.netProfit >= 0 ? 'from-blue-500/10 to-blue-900/20 border-blue-500/20' : 'from-orange-500/10 to-orange-900/20 border-orange-500/20'}`}>
          <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={48} className={`md:size-64 ${stats.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 md:mb-2 ${stats.netProfit >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>Untung Bersih</p>
          <h2 className="text-xl md:text-3xl font-black text-white leading-none">{formatCurrency(stats.netProfit)}</h2>
          <div className={`mt-3 md:mt-4 flex items-center gap-2 text-[9px] md:text-xs ${stats.netProfit >= 0 ? 'text-blue-400/80' : 'text-orange-400/80'}`}>
            <Percent size={12} /> Margin: {stats.profitMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <PieChart className="text-emerald-500" size={20} /> Pecahan Pendapatan
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Invois Dibayar</p>
                  <p className="text-xs text-slate-400">Dari sistem invois</p>
                </div>
              </div>
              <p className="font-bold text-emerald-400">{formatCurrency(stats.revenueBreakdown.invoices)}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Jualan & Servis</p>
                  <p className="text-xs text-slate-400">Dari sistem jualan terus</p>
                </div>
              </div>
              <p className="font-bold text-emerald-400">{formatCurrency(stats.revenueBreakdown.sales)}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
                  <DollarSign size={18} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Kredit / Pendapatan Lain</p>
                  <p className="text-xs text-slate-400">Dari sistem Debit/Credit</p>
                </div>
              </div>
              <p className="font-bold text-emerald-400">{formatCurrency(stats.revenueBreakdown.credits)}</p>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="text-red-500" size={20} /> Pecahan Perbelanjaan
          </h3>
          <div className="space-y-3">
            <ExpenseItem icon={<Wallet />} label="Gaji Pekerja (Payroll)" amount={stats.expenseBreakdown.payroll} total={stats.totalExpenses} />
            <ExpenseItem icon={<TrendingDown />} label="Debit / Perbelanjaan Lain" amount={stats.expenseBreakdown.debits} total={stats.totalExpenses} />
            <ExpenseItem icon={<Receipt />} label="Minyak (Fuel)" amount={stats.expenseBreakdown.fuel} total={stats.totalExpenses} />
            <ExpenseItem icon={<Receipt />} label="Penyelenggaraan (Maintenance)" amount={stats.expenseBreakdown.maintenance} total={stats.totalExpenses} />
            <ExpenseItem icon={<Receipt />} label="Lain-lain (Others)" amount={stats.expenseBreakdown.others} total={stats.totalExpenses} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseItem({ icon, label, amount, total }: { icon: React.ReactNode, label: string, amount: number, total: number }) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  
  return (
    <div className="p-3 bg-white/5 rounded-xl border border-white/5 group transition-colors hover:bg-white/10">
      <div className="flex items-center justify-between mb-1.5 md:mb-2">
        <div className="flex items-center gap-2 text-[10px] md:text-sm text-white">
          <div className="text-slate-400 [&>svg]:w-3 md:[&>svg]:w-4 [&>svg]:h-3 md:[&>svg]:h-4">{icon}</div>
          <span className="truncate">{label}</span>
        </div>
        <p className="font-bold text-red-400 text-[10px] md:text-sm whitespace-nowrap">{new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount)}</p>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1 md:h-1.5 overflow-hidden">
        <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { LayoutDashboard, IndianRupee, TrendingUp, TrendingDown, Users, Monitor, Repeat, FileText, Calendar as CalIcon, Plus, ArrowRight, RefreshCw, BarChart3 } from "lucide-react";
import DashboardCharts from "./Charts";

export default async function ErpDashboardPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS", "OPERATIONS", "HR"].includes(session.role as string)) {
    redirect("/");
  }

  // Fetch Financial Data
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfMonth = new Date(currentYear, now.getMonth(), 1, 0, 0, 0);
  const startOfToday = new Date(currentYear, now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(currentYear, now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  // Income (Strictly Real Ledger Income, Excluding Quotations)
  const totalIncomeObj = await prisma.erpIncome.aggregate({ _sum: { amount: true } });
  const annualIncomeObj = await prisma.erpIncome.aggregate({ where: { date: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true } });
  const monthlyIncomeObj = await prisma.erpIncome.aggregate({ where: { date: { gte: startOfMonth } }, _sum: { amount: true } });
  const todayIncomeObj = await prisma.erpIncome.aggregate({ where: { date: { gte: startOfToday, lte: endOfToday } }, _sum: { amount: true } });

  // Expenses
  const totalExpenseObj = await prisma.erpExpense.aggregate({ _sum: { amount: true }, where: { status: "PAID" } });
  const annualExpenseObj = await prisma.erpExpense.aggregate({ where: { paymentDate: { gte: startOfYear, lte: endOfYear }, status: "PAID" }, _sum: { amount: true } });
  const monthlyExpenseObj = await prisma.erpExpense.aggregate({ where: { paymentDate: { gte: startOfMonth }, status: "PAID" }, _sum: { amount: true } });
  const todayExpenseObj = await prisma.erpExpense.aggregate({ where: { paymentDate: { gte: startOfToday, lte: endOfToday }, status: "PAID" }, _sum: { amount: true } });

  const monthlyIncome = monthlyIncomeObj._sum.amount || 0;
  const monthlyExpense = monthlyExpenseObj._sum.amount || 0;
  const netProfit = monthlyIncome - monthlyExpense;

  const todayIncome = todayIncomeObj._sum.amount || 0;
  const todayExpense = todayExpenseObj._sum.amount || 0;
  const annualRevenue = annualIncomeObj._sum.amount || 0;

  // Stats
  const activeVendors = await prisma.erpVendor.count();
  const activeAssets = await prisma.erpAsset.count({ where: { status: "ACTIVE" } });
  const activeSubs = await prisma.erpSubscription.count();
  
  // Pending approvals
  const pendingExpenses = await prisma.erpExpense.count({ where: { status: "PENDING" } });

  // For Charts: We need the verified data for the year and map accurately in JS
  const allYearIncome = await prisma.erpIncome.findMany({
    where: { date: { gte: startOfYear, lte: endOfYear } },
    select: { date: true, amount: true, category: true }
  });
  
  const allYearExpense = await prisma.erpExpense.findMany({
    where: { paymentDate: { gte: startOfYear, lte: endOfYear }, status: "PAID" },
    select: { paymentDate: true, amount: true, category: true }
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = months.map((month, index) => {
    if (index > now.getMonth()) return null; // Only show up to current month
    
    const incomeForMonth = allYearIncome
      .filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      
    const expenseForMonth = allYearExpense
      .filter(e => {
        const d = new Date(e.paymentDate);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      name: month,
      Income: Math.round(incomeForMonth),
      Expenses: Math.round(expenseForMonth),
      Profit: Math.round(incomeForMonth - expenseForMonth)
    };
  }).filter(Boolean);

  // Expense breakdown
  const expenseCategories = allYearExpense.reduce((acc: any, curr) => {
    const cat = curr.category || "General";
    acc[cat] = (acc[cat] || 0) + (Number(curr.amount) || 0);
    return acc;
  }, {});

  const breakdownData = Object.keys(expenseCategories).map(key => ({
    name: key,
    value: Math.round(expenseCategories[key])
  })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 categories

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className={styles.title}>
            <LayoutDashboard size={28} color="#7C3AED" />
            Centralized Business Operations
          </h1>
          <p className={styles.subtitle}>Executive ERP Dashboard • Real-time ledgers, operational assets, suppliers and POS live sync</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/erp/finance/income/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#10B981', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <Plus size={15} /> Add Income
          </Link>
          <Link href="/erp/finance/expense/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#EF4444', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <Plus size={15} /> Record Expense
          </Link>
          <Link href="/erp/vendors/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--surface-background)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <Users size={15} /> New Vendor
          </Link>
          <Link href="/erp/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--surface-background)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <BarChart3 size={15} /> Audit Reports
          </Link>
        </div>
      </header>

      {/* Primary Financial Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Today's Income</span>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div className={styles.statValue}>₹{todayIncome.toLocaleString()}</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Today's Expenses</span>
            <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div className={styles.statValue}>₹{todayExpense.toLocaleString()}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Monthly Net Profit</span>
            <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
              {netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <div className={styles.statValue} style={{ color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>
            ₹{netProfit.toLocaleString()}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Annual Revenue (YTD)</span>
            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div className={styles.statValue}>₹{annualRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts Section */}
      <DashboardCharts chartData={chartData} breakdownData={breakdownData} />

      {/* Secondary Stats */}
      <div className={styles.chartsGrid} style={{ gridTemplateColumns: '1fr', marginBottom: 0 }}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Operational Overview</h2>
          <div className={styles.secondaryGrid}>
            <Link href="/erp/vendors" className={styles.secondaryCard} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Users size={24} color="#64748B" />
              <div className={styles.secondaryInfo}>
                <h4>Active Vendors</h4>
                <p>{activeVendors}</p>
              </div>
            </Link>
            
            <Link href="/erp/assets" className={styles.secondaryCard} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Monitor size={24} color="#64748B" />
              <div className={styles.secondaryInfo}>
                <h4>Company Assets</h4>
                <p>{activeAssets}</p>
              </div>
            </Link>

            <Link href="/erp/subscriptions" className={styles.secondaryCard} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Repeat size={24} color="#64748B" />
              <div className={styles.secondaryInfo}>
                <h4>Active Subscriptions</h4>
                <p>{activeSubs}</p>
              </div>
            </Link>

            <Link href="/erp/finance/expense" className={styles.secondaryCard} style={{ textDecoration: 'none', color: 'inherit' }}>
              <FileText size={24} color="#F59E0B" />
              <div className={styles.secondaryInfo}>
                <h4>Pending Approvals</h4>
                <p style={{ color: pendingExpenses > 0 ? '#F59E0B' : 'var(--text-primary)' }}>{pendingExpenses} Expenses</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

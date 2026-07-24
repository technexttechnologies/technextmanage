import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import { LayoutDashboard, IndianRupee, TrendingUp, TrendingDown, Users, Monitor, Repeat, FileText, Calendar as CalIcon } from "lucide-react";
import DashboardCharts from "./Charts";

export default async function ErpDashboardPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "ACCOUNTS", "OPERATIONS", "HR"].includes(session.role as string)) {
    redirect("/");
  }

  // Fetch Financial Data
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Income
  const totalIncomeObj = await prisma.erpIncome.aggregate({ _sum: { amount: true } });
  const annualIncomeObj = await prisma.erpIncome.aggregate({ where: { paymentDate: { gte: startOfYear } }, _sum: { amount: true } });
  const monthlyIncomeObj = await prisma.erpIncome.aggregate({ where: { paymentDate: { gte: startOfMonth } }, _sum: { amount: true } });
  const todayIncomeObj = await prisma.erpIncome.aggregate({ where: { paymentDate: { gte: startOfToday } }, _sum: { amount: true } });

  // Expenses
  const totalExpenseObj = await prisma.erpExpense.aggregate({ _sum: { amount: true }, where: { status: "PAID" } });
  const annualExpenseObj = await prisma.erpExpense.aggregate({ where: { paymentDate: { gte: startOfYear }, status: "PAID" }, _sum: { amount: true } });
  const monthlyExpenseObj = await prisma.erpExpense.aggregate({ where: { paymentDate: { gte: startOfMonth }, status: "PAID" }, _sum: { amount: true } });
  const todayExpenseObj = await prisma.erpExpense.aggregate({ where: { paymentDate: { gte: startOfToday }, status: "PAID" }, _sum: { amount: true } });

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

  // For Charts: We need the last 6 months of data
  // Since Prisma group by date is complex across SQLite/Postgres without raw, we can fetch all for the year and map in JS.
  const allYearIncome = await prisma.erpIncome.findMany({
    where: { paymentDate: { gte: startOfYear } },
    select: { paymentDate: true, amount: true, category: true }
  });
  
  const allYearExpense = await prisma.erpExpense.findMany({
    where: { paymentDate: { gte: startOfYear }, status: "PAID" },
    select: { paymentDate: true, amount: true, category: true }
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = months.map((month, index) => {
    if (index > now.getMonth()) return null; // Only show up to current month
    
    const incomeForMonth = allYearIncome
      .filter(i => new Date(i.paymentDate).getMonth() === index)
      .reduce((sum, i) => sum + i.amount, 0);
      
    const expenseForMonth = allYearExpense
      .filter(e => new Date(e.paymentDate).getMonth() === index)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      name: month,
      Income: incomeForMonth,
      Expenses: expenseForMonth,
      Profit: incomeForMonth - expenseForMonth
    };
  }).filter(Boolean);

  // Expense breakdown
  const expenseCategories = allYearExpense.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const breakdownData = Object.keys(expenseCategories).map(key => ({
    name: key,
    value: expenseCategories[key]
  })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 categories

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <LayoutDashboard size={32} color="#8B5CF6" />
          Business Operations
        </h1>
        <p className={styles.subtitle}>Executive Dashboard & Financial Overview</p>
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
            <div className={styles.secondaryCard}>
              <Users size={24} color="#64748B" />
              <div className={styles.secondaryInfo}>
                <h4>Active Vendors</h4>
                <p>{activeVendors}</p>
              </div>
            </div>
            
            <div className={styles.secondaryCard}>
              <Monitor size={24} color="#64748B" />
              <div className={styles.secondaryInfo}>
                <h4>Company Assets</h4>
                <p>{activeAssets}</p>
              </div>
            </div>

            <div className={styles.secondaryCard}>
              <Repeat size={24} color="#64748B" />
              <div className={styles.secondaryInfo}>
                <h4>Active Subscriptions</h4>
                <p>{activeSubs}</p>
              </div>
            </div>

            <div className={styles.secondaryCard}>
              <FileText size={24} color="#F59E0B" />
              <div className={styles.secondaryInfo}>
                <h4>Pending Approvals</h4>
                <p style={{ color: pendingExpenses > 0 ? '#F59E0B' : 'var(--text-primary)' }}>{pendingExpenses} Expenses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import styles from "./page.module.css";
import { TrendingUp, PieChart as PieChartIcon, ArrowRight, X, Calendar, IndianRupee } from "lucide-react";

export default function DashboardCharts({ chartData, breakdownData }: { chartData: any[], breakdownData: any[] }) {
  const [selectedMonth, setSelectedMonth] = useState<any | null>(null);
  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inc = payload.find((p: any) => p.dataKey === "Income")?.value || 0;
      const exp = payload.find((p: any) => p.dataKey === "Expenses")?.value || 0;
      const net = inc - exp;

      return (
        <div style={{ backgroundColor: 'var(--surface-card, #ffffff)', border: '1px solid var(--surface-border, #e2e8f0)', padding: '12px 14px', borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
          <p style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary, #0f172a)', fontSize: '13px' }}>{label} Performance</p>
          <p style={{ color: '#10B981', fontSize: '13px', margin: '3px 0', fontWeight: 600 }}>
            Income: ₹{Number(inc).toLocaleString("en-IN")}
          </p>
          <p style={{ color: '#EF4444', fontSize: '13px', margin: '3px 0', fontWeight: 600 }}>
            Expenses: ₹{Number(exp).toLocaleString("en-IN")}
          </p>
          <p style={{ color: net >= 0 ? '#059669' : '#DC2626', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 700, borderTop: '1px solid var(--surface-border, #f1f5f9)', paddingTop: '4px' }}>
            Net Profit: {net >= 0 ? '+' : ''}₹{Number(net).toLocaleString("en-IN")}
          </p>
          <p style={{ fontSize: '10.5px', color: '#64748B', margin: '4px 0 0 0' }}>Click bar to inspect details</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartsGrid}>
      <div className={styles.chartCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className={styles.chartTitle} style={{ margin: 0 }}>
            <TrendingUp size={20} color="#8B5CF6" />
            Revenue vs Expenses (YTD)
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>
            Click any month to inspect details
          </span>
        </div>

        <div style={{ height: '300px', width: '100%', cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedMonth(e.activePayload[0].payload);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border, #e2e8f0)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted, #64748B)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted, #64748B)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value >= 1000 ? Math.round(value/1000) + 'k' : value}`} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
              <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Month Details Panel */}
        {selectedMonth && (
          <div style={{
            marginTop: '16px',
            padding: '14px 18px',
            background: 'var(--surface-background, #F8FAFC)',
            borderRadius: '10px',
            border: '1px solid var(--surface-border, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary, #0F172A)' }}>
                <Calendar size={16} color="#7C3AED" />
                <span>{selectedMonth.name} Breakdown:</span>
              </div>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Income: </span>
                <strong style={{ color: '#10B981' }}>₹{Number(selectedMonth.Income).toLocaleString("en-IN")}</strong>
              </div>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Expenses: </span>
                <strong style={{ color: '#EF4444' }}>₹{Number(selectedMonth.Expenses).toLocaleString("en-IN")}</strong>
              </div>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Net Profit: </span>
                <strong style={{ color: selectedMonth.Profit >= 0 ? '#059669' : '#DC2626' }}>
                  {selectedMonth.Profit >= 0 ? '+' : ''}₹{Number(selectedMonth.Profit).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link 
                href="/erp/finance/income" 
                style={{ fontSize: '12px', fontWeight: 600, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none' }}
              >
                View Incomes →
              </Link>
              <Link 
                href="/erp/finance/expense" 
                style={{ fontSize: '12px', fontWeight: 600, color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none' }}
              >
                View Expenses →
              </Link>
              <button 
                type="button" 
                onClick={() => setSelectedMonth(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>
          <PieChartIcon size={20} color="#F59E0B" />
          Expense Breakdown
        </h2>
        <div style={{ height: '300px', width: '100%' }}>
          {breakdownData.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No expenses recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--surface-card)" strokeWidth={2} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

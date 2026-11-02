"use client";

import { useState, useTransition } from "react";
import { 
  saveWhatsAppSettings, 
  sendTestWhatsAppMessage 
} from "./actions";
import { 
  MessageSquare, 
  Send, 
  Settings2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Smartphone, 
  Star, 
  Briefcase, 
  Layers, 
  UserCheck, 
  FileText,
  Clock,
  Sparkles
} from "lucide-react";
import styles from "./page.module.css";

interface WhatsAppSettingsClientProps {
  settings: any;
  logs: any[];
  stats: {
    total: number;
    sent: number;
    simulated: number;
    failed: number;
  };
}

export function WhatsAppSettingsClient({ settings, logs, stats }: WhatsAppSettingsClientProps) {
  const [provider, setProvider] = useState<string>(settings?.whatsappProvider || "OFF");
  const [isSaving, startSaving] = useTransition();
  const [isTesting, startTesting] = useTransition();
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    status?: string;
    provider?: string;
    error?: string;
    waLink?: string;
    message?: string;
  } | null>(null);

  const [testPhone, setTestPhone] = useState("");
  const [testType, setTestType] = useState("PROJECT_UPDATE");

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus(null);
    const formData = new FormData(e.currentTarget);
    startSaving(async () => {
      try {
        await saveWhatsAppSettings(formData);
        setSaveStatus({ success: true, message: "WhatsApp automation settings saved successfully!" });
        setTimeout(() => setSaveStatus(null), 4000);
      } catch (err: any) {
        setSaveStatus({ success: false, message: err?.message || "Failed to save settings." });
      }
    });
  };

  const handleTest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTestResult(null);
    const formData = new FormData(e.currentTarget);
    startTesting(async () => {
      try {
        const res = await sendTestWhatsAppMessage(formData);
        setTestResult(res);
      } catch (err: any) {
        setTestResult({
          success: false,
          error: err?.message || "Test dispatch failed."
        });
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div>
          <a href="/settings" className={styles.backLink}>← Back to System Settings</a>
          <h1 className={styles.title}>WhatsApp Message Automation</h1>
          <p className={styles.subtitle}>
            Configure automated WhatsApp notifications for project updates, service requests, customer reviews, and client portal links.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="https://business.whatsapp.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <ExternalLink size={14} /> Meta Business Manager
          </a>
        </div>
      </header>

      {/* Analytics Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#DCFCE7', color: '#166534' }}>
            <MessageSquare size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Total Dispatches</h4>
            <p>{stats.total}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ECFDF5', color: '#10B981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Delivered / Sent</h4>
            <p>{stats.sent}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Smartphone size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Logged & 1-Click</h4>
            <p>{stats.simulated}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FEF2F2', color: '#DC2626' }}>
            <AlertCircle size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Delivery Errors</h4>
            <p>{stats.failed}</p>
          </div>
        </div>
      </div>

      {/* Main Form & Test Layout */}
      <div className={styles.layoutGrid}>
        {/* Left Column: Provider Settings & Automation Toggles */}
        <div>
          <form onSubmit={handleSave}>
            {/* Gateway Configuration Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <Settings2 size={18} style={{ color: "var(--brand-accent)" }} />
                  WhatsApp Gateway Provider
                </h3>
                <span className={styles.typePill}>
                  {provider === "OFF" ? "Manual / 1-Click wa.me" : `${provider} API Gateway`}
                </span>
              </div>

              <div className={styles.formGroup}>
                <label>Messaging Engine</label>
                <select 
                  name="whatsappProvider" 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value)}
                  className={styles.select}
                >
                  <option value="OFF">Manual / 1-Click Direct (wa.me) - Free & No Setup Needed</option>
                  <option value="META">Meta WhatsApp Cloud API (Official Cloud Graph API)</option>
                  <option value="ULTRAMSG">UltraMsg WhatsApp API (Instance + Token)</option>
                  <option value="GENERIC">Custom HTTP Webhook / Third-Party Gateway</option>
                </select>
                <p className={styles.helperText}>
                  {provider === "OFF" && "Messages will be generated automatically and logged with 1-click 'Open in WhatsApp' buttons across the CRM."}
                  {provider === "META" && "Requires Meta Developer App with WhatsApp Cloud API enabled (Phone Number ID + Permanent System User Access Token)."}
                  {provider === "ULTRAMSG" && "Requires active UltraMsg instance (Instance ID + Token) for instant WhatsApp Web gateway sending."}
                  {provider === "GENERIC" && "Posts JSON payload ({ to, message, triggerType }) to your custom API gateway or webhook."}
                </p>
              </div>

              {provider === "META" && (
                <>
                  <div className={styles.formGroup}>
                    <label>Meta Phone Number ID</label>
                    <input 
                      type="text" 
                      name="whatsappInstanceId" 
                      defaultValue={settings?.whatsappInstanceId || ""} 
                      placeholder="e.g. 104857291038472" 
                      className={styles.input}
                    />
                    <p className={styles.helperText}>From Meta Developer Portal &gt; WhatsApp &gt; API Setup &gt; Phone Number ID.</p>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Meta Permanent Access Token (Bearer)</label>
                    <input 
                      type="password" 
                      name="whatsappApiKey" 
                      defaultValue={settings?.whatsappApiKey || ""} 
                      placeholder="EAA..." 
                      className={styles.input}
                    />
                    <p className={styles.helperText}>System user access token with whatsapp_business_messaging permission.</p>
                  </div>
                </>
              )}

              {provider === "ULTRAMSG" && (
                <>
                  <div className={styles.formGroup}>
                    <label>UltraMsg Instance ID</label>
                    <input 
                      type="text" 
                      name="whatsappInstanceId" 
                      defaultValue={settings?.whatsappInstanceId || ""} 
                      placeholder="e.g. instance102934" 
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>UltraMsg Token</label>
                    <input 
                      type="password" 
                      name="whatsappApiKey" 
                      defaultValue={settings?.whatsappApiKey || ""} 
                      placeholder="e.g. abc123def456" 
                      className={styles.input}
                    />
                  </div>
                </>
              )}

              {provider === "GENERIC" && (
                <>
                  <div className={styles.formGroup}>
                    <label>Gateway Webhook URL</label>
                    <input 
                      type="url" 
                      name="whatsappApiUrl" 
                      defaultValue={settings?.whatsappApiUrl || ""} 
                      placeholder="https://your-api.com/whatsapp/send" 
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Authorization Token / API Key (Optional)</label>
                    <input 
                      type="password" 
                      name="whatsappApiKey" 
                      defaultValue={settings?.whatsappApiKey || ""} 
                      placeholder="Bearer token or secret key" 
                      className={styles.input}
                    />
                  </div>
                </>
              )}

              <div className={styles.formGroup}>
                <label>TechNext Google Review URL</label>
                <input 
                  type="url" 
                  name="googleReviewUrl" 
                  defaultValue={settings?.googleReviewUrl || "https://g.page/r/Cb3TAmXgJGHWEBM/review"} 
                  className={styles.input}
                />
                <p className={styles.helperText}>Used for automated review requests upon project delivery.</p>
              </div>
            </div>

            {/* Automation Triggers Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <Sparkles size={18} style={{ color: "#10B981" }} />
                  Automated Event Triggers
                </h3>
              </div>

              <div className={styles.togglesList}>
                {/* 1. Project Updates */}
                <label className={styles.toggleItem}>
                  <input 
                    type="checkbox" 
                    name="waAutoProjectUpdate" 
                    defaultChecked={settings?.waAutoProjectUpdate ?? true}
                    className={styles.toggleCheckbox} 
                  />
                  <div className={styles.toggleInfo}>
                    <div className={styles.toggleLabel}>
                      <Briefcase size={15} color="#4F46E5" /> Project Status & Progress Updates
                    </div>
                    <p className={styles.toggleDescription}>
                      Automatically sends WhatsApp notifications when project stages change, progress percentage is logged, or milestones are completed. Includes live tracking links.
                    </p>
                  </div>
                </label>

                {/* 2. Service Requests */}
                <label className={styles.toggleItem}>
                  <input 
                    type="checkbox" 
                    name="waAutoServiceRequest" 
                    defaultChecked={settings?.waAutoServiceRequest ?? true}
                    className={styles.toggleCheckbox} 
                  />
                  <div className={styles.toggleInfo}>
                    <div className={styles.toggleLabel}>
                      <Layers size={15} color="#2563EB" /> Service Package Activation & Provisioning
                    </div>
                    <p className={styles.toggleDescription}>
                      Automatically alerts customers when a service package (Website, SEO, E-Commerce, AMC) is booked by sales staff, with contract term and portal link.
                    </p>
                  </div>
                </label>

                {/* 3. Customer Reviews */}
                <label className={styles.toggleItem}>
                  <input 
                    type="checkbox" 
                    name="waAutoCustomerReview" 
                    defaultChecked={settings?.waAutoCustomerReview ?? true}
                    className={styles.toggleCheckbox} 
                  />
                  <div className={styles.toggleInfo}>
                    <div className={styles.toggleLabel}>
                      <Star size={15} color="#F59E0B" /> Google Review Invitations
                    </div>
                    <p className={styles.toggleDescription}>
                      Automatically invites clients to write a 5-star Google review upon project delivery and completion, linking directly to your verified review page.
                    </p>
                  </div>
                </label>

                {/* 4. Customer Portal */}
                <label className={styles.toggleItem}>
                  <input 
                    type="checkbox" 
                    name="waAutoCustomerPortal" 
                    defaultChecked={settings?.waAutoCustomerPortal ?? true}
                    className={styles.toggleCheckbox} 
                  />
                  <div className={styles.toggleInfo}>
                    <div className={styles.toggleLabel}>
                      <UserCheck size={15} color="#10B981" /> Customer Portal Access & Welcome
                    </div>
                    <p className={styles.toggleDescription}>
                      Automatically sends new clients their secure personal portal link to track invoices, milestones, quotations, and raise support tickets.
                    </p>
                  </div>
                </label>

                {/* 5. Invoices & Quotations */}
                <label className={styles.toggleItem}>
                  <input 
                    type="checkbox" 
                    name="waAutoInvoice" 
                    defaultChecked={settings?.waAutoInvoice ?? true}
                    className={styles.toggleCheckbox} 
                  />
                  <div className={styles.toggleInfo}>
                    <div className={styles.toggleLabel}>
                      <FileText size={15} color="#6366F1" /> Invoices & Quotations Ready
                    </div>
                    <p className={styles.toggleDescription}>
                      Sends WhatsApp notifications when new invoices or official quotations are generated, complete with amounts and review links.
                    </p>
                  </div>
                </label>
              </div>

              {saveStatus && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px 14px', 
                  borderRadius: '6px', 
                  fontSize: '13.5px',
                  background: saveStatus.success ? '#DCFCE7' : '#FEE2E2',
                  color: saveStatus.success ? '#166534' : '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {saveStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {saveStatus.message}
                </div>
              )}

              <div style={{ marginTop: '24px' }}>
                <button type="submit" disabled={isSaving} className="btn-primary" style={{ padding: '10px 24px' }}>
                  {isSaving ? "Saving Settings..." : "Save WhatsApp Settings"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Testing Dispatcher */}
        <div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Send size={18} style={{ color: "#25D366" }} />
                Live Message Simulator & Tester
              </h3>
            </div>

            <form onSubmit={handleTest}>
              <div className={styles.formGroup}>
                <label>Recipient WhatsApp Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. 9876543210 or 919876543210" 
                  className={styles.input}
                  required
                />
                <p className={styles.helperText}>Enter 10-digit Indian number or international format with country code.</p>
              </div>

              <div className={styles.formGroup}>
                <label>Select Automation Scenario to Test</label>
                <select 
                  name="triggerType" 
                  value={testType} 
                  onChange={(e) => setTestType(e.target.value)}
                  className={styles.select}
                >
                  <option value="PROJECT_UPDATE">Project Update (Status & Progress)</option>
                  <option value="SERVICE_REQUEST">Service Request / Package Activated</option>
                  <option value="CUSTOMER_REVIEW">Customer Review Request (Google 5-Star)</option>
                  <option value="CUSTOMER_PORTAL">Customer Portal Access Link</option>
                  <option value="TEST">Custom Free-form Test Message</option>
                </select>
              </div>

              {testType === "TEST" && (
                <div className={styles.formGroup}>
                  <label>Custom Message Text</label>
                  <textarea 
                    name="customMessage" 
                    rows={3} 
                    className={styles.textarea} 
                    placeholder="Enter custom test message..." 
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={isTesting || !testPhone} 
                className="btn-primary" 
                style={{ width: '100%', background: '#25D366', borderColor: '#25D366', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                <Send size={16} /> {isTesting ? "Dispatching..." : "Send Test WhatsApp Message"}
              </button>
            </form>

            {testResult && (
              <div className={styles.testResultBox}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ 
                    fontWeight: 700, 
                    fontSize: '13px', 
                    color: testResult.success ? '#166534' : '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {testResult.status === "SENT" ? "Delivered via Gateway API" : testResult.status === "SIMULATED" ? "Logged & Ready for 1-Click Send" : "Failed to Dispatch"}
                  </span>
                  <span className={styles.typePill}>Provider: {testResult.provider || "OFF"}</span>
                </div>

                {testResult.error && (
                  <p style={{ fontSize: '12px', color: '#DC2626', margin: '4px 0 10px 0' }}>
                    {testResult.error}
                  </p>
                )}

                {testResult.message && (
                  <div style={{ 
                    background: '#FFFFFF', 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '6px', 
                    padding: '10px 12px', 
                    fontSize: '12px', 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace',
                    marginBottom: '12px' 
                  }}>
                    {testResult.message}
                  </div>
                )}

                {testResult.waLink && (
                  <a 
                    href={testResult.waLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.waBtn}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <ExternalLink size={14} /> Open in WhatsApp Web / App
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className={styles.card} style={{ marginTop: 'var(--spacing-6)' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            <Clock size={18} style={{ color: "var(--brand-accent)" }} />
            Recent WhatsApp Automation Dispatch Logs
          </h3>
          <span className={styles.typePill}>{logs.length} Recent Dispatches</span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Recipient</th>
                <th>Phone</th>
                <th>Automation Trigger</th>
                <th>Status</th>
                <th>Provider</th>
                <th>Message Snippet</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const waLink = `https://wa.me/${log.phone}?text=${encodeURIComponent(log.message)}`;
                const statusClass = log.status === "SENT" ? styles.sent : log.status === "SIMULATED" ? styles.simulated : styles.failed;
                return (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.recipientName || (log.customer?.name ?? "Customer")}</td>
                    <td style={{ fontFamily: 'monospace' }}>+{log.phone}</td>
                    <td>
                      <span className={styles.typePill}>
                        {log.triggerType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.provider}</td>
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }} title={log.message}>
                      {log.message}
                    </td>
                    <td>
                      <a 
                        href={waLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.waBtn}
                        title="Open in WhatsApp Web"
                      >
                        <ExternalLink size={12} /> Send
                      </a>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyLogs}>
                    No WhatsApp automation logs recorded yet. Try sending a test message above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

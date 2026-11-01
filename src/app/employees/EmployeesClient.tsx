"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  Users, UserCheck, Plus, Search, Mail, Phone, 
  Building, Clock, Calendar, KeyRound, Edit2, Trash2, 
  Check, X, ShieldAlert, Award, FileText, CheckCircle2, UserPlus, Zap
} from "lucide-react";
import styles from "./employees.module.css";
import { 
  createEmployee, updateEmployee, resetEmployeePassword, 
  toggleEmployeeStatus, deleteEmployee 
} from "./actions";

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  employeeId: string | null;
  role: string;
  designation: string | null;
  departmentId: string | null;
  department: Department | null;
  employmentType: string;
  shiftHours: string | null;
  joiningDate: Date | string | null;
  salary: number | null;
  emergencyContact: string | null;
  bloodGroup: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date | string;
}

export default function EmployeesClient({
  employees,
  departments,
  currentUserId,
}: {
  employees: Employee[];
  departments: Department[];
  currentUserId: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [resettingEmployee, setResettingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [generatedPass, setGeneratedPass] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("TNT@" + Math.random().toString(36).substring(2, 6).toUpperCase() + "!2026");

  // Check URL query parameter to auto-open Add Staff modal (e.g. from Admin Dashboard)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "1" || params.get("add") === "true") {
        setIsAddModalOpen(true);
      }
    }
  }, []);

  // Stats calculation
  const totalEmployees = employees.length;
  const fullTimeCount = employees.filter(e => e.employmentType === "FULL_TIME").length;
  const activeCount = employees.filter(e => e.isActive !== false).length;
  const techTeamCount = employees.filter(e => ["DEVELOPER", "PROJECT", "SUPPORT"].includes(e.role)).length;

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.phone && emp.phone.includes(searchTerm)) ||
      (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = deptFilter === "ALL" || emp.departmentId === deptFilter;
    const matchesRole = roleFilter === "ALL" || emp.role === roleFilter;
    const matchesType = typeFilter === "ALL" || emp.employmentType === typeFilter;
    const matchesStatus = 
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && emp.isActive !== false) ||
      (statusFilter === "INACTIVE" && emp.isActive === false);

    return matchesSearch && matchesDept && matchesRole && matchesType && matchesStatus;
  });

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(pwd);
  };

  const handleToggleStatus = (emp: Employee) => {
    startTransition(async () => {
      try {
        await toggleEmployeeStatus(emp.id, emp.isActive);
      } catch (err: any) {
        alert(err.message || "Failed to update status");
      }
    });
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return styles.roleSuperAdmin;
      case "ADMIN": return styles.roleAdmin;
      case "DEVELOPER": return styles.roleDeveloper;
      case "HR": return styles.roleHR;
      case "SALES": return styles.roleSales;
      case "PROJECT": return styles.roleProject;
      case "SUPPORT": return styles.roleSupport;
      default: return styles.roleDefault;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>
            <Users size={30} color="var(--brand-primary)" />
            Employee Directory & Staff Management
          </h1>
          <p>Manage TechNext team profiles, roles, shift hours, and employee credentials.</p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/employees/portal" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <UserCheck size={16} /> My Work Portal
          </Link>
          <button 
            type="button" 
            className="btn-primary"
            onClick={() => {
              setActionError(null);
              setIsAddModalOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(99, 91, 255, 0.1)", color: "var(--brand-primary)" }}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalEmployees}</span>
            <span className={styles.statLabel}>Total Staff Members</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{activeCount}</span>
            <span className={styles.statLabel}>Active Employees</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#2563EB" }}>
            <Award size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{fullTimeCount}</span>
            <span className={styles.statLabel}>Full-Time Contracts</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#D97706" }}>
            <Building size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{departments.length}</span>
            <span className={styles.statLabel}>Departments</span>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name, employee ID, email, or designation..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="ALL">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="DEVELOPER">Software Developer</option>
          <option value="PROJECT">Project Manager</option>
          <option value="SALES">Sales Executive</option>
          <option value="SUPPORT">Technical Support</option>
          <option value="HR">Human Resources (HR)</option>
          <option value="HEAD">Department Head</option>
          <option value="ADMIN">Administrator</option>
          <option value="SUPER_ADMIN">Super Administrator</option>
        </select>

        <select 
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Contract Types</option>
          <option value="FULL_TIME">Full-Time</option>
          <option value="PART_TIME">Part-Time</option>
          <option value="CONTRACT">Contractual</option>
          <option value="INTERN">Internship</option>
        </select>

        <select 
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Staff</option>
          <option value="INACTIVE">Suspended / Inactive</option>
        </select>
      </div>

      {/* Employees Grid */}
      <div className={styles.employeeGrid}>
        {filteredEmployees.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={44} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <h3>No employee profiles found</h3>
            <p>Try clearing your search query or adjusting your filters.</p>
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <div key={emp.id} className={styles.employeeCard}>
              <div className={styles.cardHeader}>
                <div className={styles.employeeInfo}>
                  <div className={styles.avatarWrapper}>
                    <div className={styles.avatar}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`${styles.statusDot} ${emp.isActive !== false ? styles.statusActive : styles.statusInactive}`} />
                  </div>
                  <div>
                    <h3 className={styles.employeeName}>{emp.name}</h3>
                    <p className={styles.employeeTitle}>{emp.designation || emp.role.replace("_", " ")}</p>
                  </div>
                </div>

                <div className={styles.badgeStack}>
                  {emp.employeeId && (
                    <span className={styles.empIdBadge}>{emp.employeeId}</span>
                  )}
                  <span className={`${styles.roleBadge} ${getRoleBadgeClass(emp.role)}`}>
                    {emp.role.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className={styles.employeeMeta}>
                <div className={styles.metaRow}>
                  <Mail size={14} />
                  <span>{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className={styles.metaRow}>
                    <Phone size={14} />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.department && (
                  <div className={styles.metaRow}>
                    <Building size={14} />
                    <span>{emp.department.name}</span>
                  </div>
                )}
                <div className={styles.metaRow}>
                  <Clock size={14} />
                  <span>Shift: {emp.shiftHours || "09:30 AM - 06:30 PM"} ({emp.employmentType.replace("_", " ")})</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={`${styles.statusToggleBtn} ${emp.isActive !== false ? styles.active : styles.inactive}`}
                  onClick={() => handleToggleStatus(emp)}
                  disabled={isPending || emp.id === currentUserId}
                  title={emp.id === currentUserId ? "Cannot toggle own status" : "Toggle active status"}
                >
                  {emp.isActive !== false ? (
                    <>
                      <Check size={14} /> Active
                    </>
                  ) : (
                    <>
                      <X size={14} /> Suspended
                    </>
                  )}
                </button>

                <div className={styles.actionBtns}>
                  <button 
                    type="button" 
                    className={styles.iconBtn}
                    onClick={() => {
                      setActionError(null);
                      setEditingEmployee(emp);
                    }}
                    title="Edit Employee Information"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button 
                    type="button" 
                    className={styles.iconBtn}
                    onClick={() => {
                      setActionError(null);
                      setGeneratedPass("");
                      setResettingEmployee(emp);
                    }}
                    title="Reset Password"
                  >
                    <KeyRound size={14} />
                  </button>

                  <button 
                    type="button" 
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => {
                      setActionError(null);
                      setDeletingEmployee(emp);
                    }}
                    disabled={emp.id === currentUserId}
                    title={emp.id === currentUserId ? "Cannot delete yourself" : "Delete Employee"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- ADD EMPLOYEE MODAL --- */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Users size={20} color="var(--brand-primary)" />
                Add New Employee Profile
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await createEmployee(formData);
                  setIsAddModalOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to create employee");
                }
              });
            }}>
              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Full Employee Name *</label>
                    <input type="text" name="name" required placeholder="e.g. Rahul Sharma" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Employee ID (Leave blank to auto-generate)</label>
                    <input type="text" name="employeeId" placeholder="e.g. TNT-105" />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Work Email Address *</label>
                    <input type="email" name="email" required placeholder="rahul@technext.com" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Phone Number</label>
                    <input type="tel" name="phone" placeholder="+91 98461 22334" />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Designation / Job Title *</label>
                    <input type="text" name="designation" required placeholder="e.g. Senior Software Engineer" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>System Role *</label>
                    <select name="role" required defaultValue="SALES">
                      <option value="SALES">💼 Sales Executive (Sales Portal Panel Access)</option>
                      <option value="DEVELOPER">💻 Software Developer / Engineer</option>
                      <option value="PROJECT">📋 Project Manager</option>
                      <option value="SUPPORT">🎧 Technical Support Engineer</option>
                      <option value="HR">👥 Human Resources (HR)</option>
                      <option value="HEAD">🏢 Department Head</option>
                      <option value="ADMIN">🛡️ Administrator (Admin Panel Access)</option>
                      <option value="SUPER_ADMIN">👑 Super Administrator (Full System Control)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Department</label>
                    <select name="departmentId">
                      <option value="">General / None</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Contract Type</label>
                    <select name="employmentType" defaultValue="FULL_TIME">
                      <option value="FULL_TIME">Full-Time Permanent</option>
                      <option value="PART_TIME">Part-Time</option>
                      <option value="CONTRACT">Contractual</option>
                      <option value="INTERN">Internship</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Joining Date</label>
                    <input type="date" name="joiningDate" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Shift Timings</label>
                    <input type="text" name="shiftHours" defaultValue="09:30 AM - 06:30 PM" />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Monthly Salary (INR)</label>
                    <input type="number" name="salary" placeholder="e.g. 45000" />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Emergency Contact</label>
                    <input type="tel" name="emergencyContact" placeholder="+91 99999 88888" />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Initial Login Password *</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        const pass = "TNT@" + Math.random().toString(36).substring(2, 6).toUpperCase() + "!" + (new Date().getFullYear());
                        setNewStaffPassword(pass);
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Zap size={13} /> Generate Password
                    </button>
                  </div>
                  <input 
                    type="text" 
                    name="password" 
                    required 
                    minLength={6} 
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="e.g. TechNext@2026" 
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Encrypted with bcrypt hash. Share this password with the staff member to log in.</span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT EMPLOYEE MODAL --- */}
      {editingEmployee && (
        <div className={styles.modalOverlay} onClick={() => setEditingEmployee(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Edit2 size={20} color="var(--brand-primary)" />
                Edit Employee: {editingEmployee.name}
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setEditingEmployee(null)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await updateEmployee(formData);
                  setEditingEmployee(null);
                } catch (err: any) {
                  setActionError(err.message || "Failed to update employee");
                }
              });
            }}>
              <input type="hidden" name="userId" value={editingEmployee.id} />

              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Full Name *</label>
                    <input type="text" name="name" defaultValue={editingEmployee.name} required />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Employee ID</label>
                    <input type="text" name="employeeId" defaultValue={editingEmployee.employeeId || ""} />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Work Email *</label>
                    <input type="email" name="email" defaultValue={editingEmployee.email} required />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Phone Number</label>
                    <input type="tel" name="phone" defaultValue={editingEmployee.phone || ""} />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Designation</label>
                    <input type="text" name="designation" defaultValue={editingEmployee.designation || ""} />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Role *</label>
                    <select name="role" defaultValue={editingEmployee.role} required>
                      <option value="DEVELOPER">Software Developer / Engineer</option>
                      <option value="PROJECT">Project Manager</option>
                      <option value="SALES">Sales Executive</option>
                      <option value="SUPPORT">Technical Support</option>
                      <option value="HR">Human Resources (HR)</option>
                      <option value="HEAD">Department Head</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="SUPER_ADMIN">Super Administrator</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Department</label>
                    <select name="departmentId" defaultValue={editingEmployee.departmentId || ""}>
                      <option value="">General / None</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Contract Type</label>
                    <select name="employmentType" defaultValue={editingEmployee.employmentType || "FULL_TIME"}>
                      <option value="FULL_TIME">Full-Time Permanent</option>
                      <option value="PART_TIME">Part-Time</option>
                      <option value="CONTRACT">Contractual</option>
                      <option value="INTERN">Internship</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Shift Timings</label>
                    <input type="text" name="shiftHours" defaultValue={editingEmployee.shiftHours || "09:30 AM - 06:30 PM"} />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Status</label>
                    <select name="isActive" defaultValue={editingEmployee.isActive !== false ? "true" : "false"}>
                      <option value="true">Active Staff</option>
                      <option value="false">Suspended / Inactive</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Salary (INR)</label>
                    <input type="number" name="salary" defaultValue={editingEmployee.salary || ""} />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Emergency Contact</label>
                    <input type="tel" name="emergencyContact" defaultValue={editingEmployee.emergencyContact || ""} />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setEditingEmployee(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESET PASSWORD MODAL --- */}
      {resettingEmployee && (
        <div className={styles.modalOverlay} onClick={() => setResettingEmployee(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <KeyRound size={20} color="var(--brand-primary)" />
                Reset Password: {resettingEmployee.name}
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setResettingEmployee(null)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await resetEmployeePassword(formData);
                  alert(`Password for ${resettingEmployee.name} updated successfully.`);
                  setResettingEmployee(null);
                } catch (err: any) {
                  setActionError(err.message || "Failed to reset password");
                }
              });
            }}>
              <input type="hidden" name="userId" value={resettingEmployee.id} />

              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>New Password *</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      name="newPassword" 
                      required 
                      minLength={6} 
                      value={generatedPass}
                      onChange={(e) => setGeneratedPass(e.target.value)}
                      placeholder="Enter new password (min 6 characters)..." 
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={generatePassword}
                      style={{ padding: "8px 12px", fontSize: "12px", whiteSpace: "nowrap" }}
                    >
                      🎲 Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setResettingEmployee(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deletingEmployee && (
        <div className={styles.modalOverlay} onClick={() => setDeletingEmployee(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
            <div className={styles.modalHeader}>
              <h2 style={{ color: "#DC2626" }}>
                <ShieldAlert size={20} color="#DC2626" />
                Confirm Deletion
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setDeletingEmployee(null)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await deleteEmployee(formData);
                  setDeletingEmployee(null);
                } catch (err: any) {
                  setActionError(err.message || "Failed to delete employee");
                }
              });
            }}>
              <input type="hidden" name="userId" value={deletingEmployee.id} />

              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete employee <strong>{deletingEmployee.name}</strong> ({deletingEmployee.employeeId || deletingEmployee.email})?
                </p>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setDeletingEmployee(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-danger" disabled={isPending} style={{ background: "#DC2626", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                  {isPending ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

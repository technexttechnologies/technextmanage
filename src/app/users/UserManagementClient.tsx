"use client";

import { useState, useTransition } from "react";
import { 
  Users, Shield, GraduationCap, Briefcase, Search, Filter, 
  UserPlus, MoreVertical, Edit2, KeyRound, Trash2, CheckCircle2, 
  XCircle, Mail, Phone, Building, Check, X, ShieldAlert, Award
} from "lucide-react";
import styles from "./page.module.css";
import { createUser, updateUser, resetUserPassword, toggleUserStatus, deleteUser } from "./actions";

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  designation: string | null;
  departmentId: string | null;
  department: Department | null;
  isActive: boolean;
  createdAt: Date | string;
}

export default function UserManagementClient({
  users,
  departments,
  currentUserId,
}: {
  users: User[];
  departments: Department[];
  currentUserId: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form loading states
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [generatedPass, setGeneratedPass] = useState("");

  // Stats calculation
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === "SUPER_ADMIN" || u.role === "ADMIN").length;
  const facultyCount = users.filter(u => u.role === "FACULTY").length;
  const activeCount = users.filter(u => u.isActive !== false).length;

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.designation && u.designation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = 
      statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && u.isActive !== false) ||
      (statusFilter === "INACTIVE" && u.isActive === false);

    const matchesDept = deptFilter === "ALL" || u.departmentId === deptFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesDept;
  });

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let res = "";
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(res);
  };

  const handleToggleStatus = (user: User) => {
    startTransition(async () => {
      try {
        await toggleUserStatus(user.id, user.isActive);
      } catch (err: any) {
        alert(err.message || "Failed to toggle status");
      }
    });
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return styles.roleSuperAdmin;
      case "ADMIN": return styles.roleAdmin;
      case "FACULTY": return styles.roleFaculty;
      case "SALES": return styles.roleSales;
      case "PROJECT": return styles.roleProject;
      case "SUPPORT": return styles.roleSupport;
      case "HEAD": return styles.roleHead;
      default: return styles.roleDefault;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>
            <Users size={32} color="var(--brand-primary)" />
            User Management & Access Control
          </h1>
          <p>Create, manage system roles, assign faculty, and configure security permissions.</p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={() => {
              setActionError(null);
              setIsAddModalOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <UserPlus size={18} />
            <span>Add New User</span>
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
            <span className={styles.statValue}>{totalUsers}</span>
            <span className={styles.statLabel}>Total Staff Users</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#D97706" }}>
            <Shield size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{adminCount}</span>
            <span className={styles.statLabel}>Administrators</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
            <GraduationCap size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{facultyCount}</span>
            <span className={styles.statLabel}>Faculty & Instructors</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#2563EB" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{activeCount}</span>
            <span className={styles.statLabel}>Active Accounts</span>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name, email, phone, or title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="FACULTY">Faculty / Instructor</option>
          <option value="ADMIN">Administrator</option>
          <option value="SUPER_ADMIN">Super Administrator</option>
          <option value="SALES">Sales Representative</option>
          <option value="PROJECT">Project Manager</option>
          <option value="SUPPORT">Support Agent</option>
          <option value="HEAD">Department Head</option>
        </select>

        <select 
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Accounts</option>
          <option value="INACTIVE">Inactive Accounts</option>
        </select>

        {departments.length > 0 && (
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
        )}
      </div>

      {/* User Grid */}
      <div className={styles.userGrid}>
        {filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <h3>No users found matching your filters</h3>
            <p>Try clearing your search query or selecting "All Roles".</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userCardHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.avatarWrapper}>
                    <div className={styles.avatar}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`${styles.statusDot} ${user.isActive !== false ? styles.statusActive : styles.statusInactive}`} />
                  </div>
                  <div>
                    <h3 className={styles.userName}>{user.name}</h3>
                    <p className={styles.userDesignation}>{user.designation || user.role.replace("_", " ")}</p>
                  </div>
                </div>

                <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                  {user.role === "FACULTY" && "🎓 "}
                  {user.role.replace("_", " ")}
                </span>
              </div>

              <div className={styles.userMeta}>
                <div className={styles.metaItem}>
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className={styles.metaItem}>
                    <Phone size={14} />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.department && (
                  <div className={styles.metaItem}>
                    <Building size={14} />
                    <span>{user.department.name}</span>
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={`${styles.statusToggleBtn} ${user.isActive !== false ? styles.active : styles.inactive}`}
                  onClick={() => handleToggleStatus(user)}
                  disabled={isPending || user.id === currentUserId}
                  title={user.id === currentUserId ? "Cannot toggle own status" : "Toggle active status"}
                >
                  {user.isActive !== false ? (
                    <>
                      <Check size={14} /> Active
                    </>
                  ) : (
                    <>
                      <X size={14} /> Inactive
                    </>
                  )}
                </button>

                <div className={styles.actionBtns}>
                  <button 
                    type="button" 
                    className={styles.iconBtn}
                    onClick={() => {
                      setActionError(null);
                      setEditingUser(user);
                    }}
                    title="Edit User Profile"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button 
                    type="button" 
                    className={styles.iconBtn}
                    onClick={() => {
                      setActionError(null);
                      setGeneratedPass("");
                      setResettingUser(user);
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
                      setDeletingUser(user);
                    }}
                    disabled={user.id === currentUserId}
                    title={user.id === currentUserId ? "Cannot delete yourself" : "Delete User"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- ADD USER MODAL --- */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <UserPlus size={20} color="var(--brand-primary)" />
                Create New User Account
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await createUser(formData);
                  setIsAddModalOpen(false);
                } catch (err: any) {
                  setActionError(err.message || "Failed to create user");
                }
              });
            }}>
              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>Full Name *</label>
                  <input type="text" name="name" required placeholder="e.g. John Doe / Prof. Rajesh" />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Email Address *</label>
                    <input type="email" name="email" required placeholder="john@technext.com" />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Phone Number</label>
                    <input type="tel" name="phone" placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Role *</label>
                    <select name="role" required defaultValue="FACULTY">
                      <option value="FACULTY">🎓 Faculty / Instructor</option>
                      <option value="SALES">Sales Representative</option>
                      <option value="PROJECT">Project Manager</option>
                      <option value="SUPPORT">Support Agent</option>
                      <option value="HEAD">Department Head</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="SUPER_ADMIN">Super Administrator</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Designation / Title</label>
                    <input type="text" name="designation" placeholder="e.g. Full Stack Trainer" />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Department (Optional)</label>
                  <select name="departmentId">
                    <option value="">None / General</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Initial Password *</label>
                  <input type="text" name="password" required minLength={6} placeholder="e.g. TechNext@2026" />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Encrypted with bcrypt hash.</span>
                </div>

                <input type="hidden" name="isActive" value="true" />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {editingUser && (
        <div className={styles.modalOverlay} onClick={() => setEditingUser(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <Edit2 size={20} color="var(--brand-primary)" />
                Edit User Details
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setEditingUser(null)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await updateUser(formData);
                  setEditingUser(null);
                } catch (err: any) {
                  setActionError(err.message || "Failed to update user");
                }
              });
            }}>
              <input type="hidden" name="userId" value={editingUser.id} />

              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>Full Name *</label>
                  <input type="text" name="name" defaultValue={editingUser.name} required />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Email Address *</label>
                    <input type="email" name="email" defaultValue={editingUser.email} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Phone Number</label>
                    <input type="tel" name="phone" defaultValue={editingUser.phone || ""} />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Role *</label>
                    <select name="role" defaultValue={editingUser.role} required>
                      <option value="FACULTY">🎓 Faculty / Instructor</option>
                      <option value="SALES">Sales Representative</option>
                      <option value="PROJECT">Project Manager</option>
                      <option value="SUPPORT">Support Agent</option>
                      <option value="HEAD">Department Head</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="SUPER_ADMIN">Super Administrator</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Designation</label>
                    <input type="text" name="designation" defaultValue={editingUser.designation || ""} />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.inputGroup}>
                    <label>Department</label>
                    <select name="departmentId" defaultValue={editingUser.departmentId || ""}>
                      <option value="">None / General</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Account Status</label>
                    <select name="isActive" defaultValue={editingUser.isActive !== false ? "true" : "false"}>
                      <option value="true">Active Account</option>
                      <option value="false">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>
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
      {resettingUser && (
        <div className={styles.modalOverlay} onClick={() => setResettingUser(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <KeyRound size={20} color="var(--brand-primary)" />
                Reset User Password
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setResettingUser(null)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await resetUserPassword(formData);
                  alert(`Password for ${resettingUser.name} has been updated.`);
                  setResettingUser(null);
                } catch (err: any) {
                  setActionError(err.message || "Failed to reset password");
                }
              });
            }}>
              <input type="hidden" name="userId" value={resettingUser.id} />

              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                  Resetting password for <strong>{resettingUser.name}</strong> ({resettingUser.email})
                </p>

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
                      placeholder="Enter at least 6 characters..." 
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={generateRandomPassword}
                      style={{ whiteSpace: "nowrap", padding: "8px 12px", fontSize: "12px" }}
                    >
                      🎲 Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setResettingUser(null)}>
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
      {deletingUser && (
        <div className={styles.modalOverlay} onClick={() => setDeletingUser(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className={styles.modalHeader}>
              <h2 style={{ color: "#DC2626" }}>
                <ShieldAlert size={20} color="#DC2626" />
                Confirm Deletion
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setDeletingUser(null)}>
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await deleteUser(formData);
                  setDeletingUser(null);
                } catch (err: any) {
                  setActionError(err.message || "Failed to delete user");
                }
              });
            }}>
              <input type="hidden" name="userId" value={deletingUser.id} />

              <div className={styles.modalBody}>
                {actionError && (
                  <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                    {actionError}
                  </div>
                )}

                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete the account for <strong>{deletingUser.name}</strong> ({deletingUser.email})?
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: "6px" }}>
                  Warning: All assigned tasks, follow-ups, and logs associated with this user will be permanently unlinked.
                </p>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setDeletingUser(null)}>
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

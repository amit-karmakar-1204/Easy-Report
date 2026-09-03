"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { CreateUserPayload, UserProfile, UserRole, UserStatus } from "@/lib/auth/types";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";

export default function UserManagementPage() {
  const {
    user: currentUser,
    users,
    isDeveloper,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers,
  } = useAuth();

  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUserId, setCreateUserId] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("staff");
  const [createPassword, setCreatePassword] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Success credential display modal
  const [lastCreatedUser, setLastCreatedUser] = useState<UserProfile | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Deletion confirm modal
  const [deleteModalUser, setDeleteModalUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action status banner
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Guard: If not developer, redirect or lock
  useEffect(() => {
    if (!isLoading && !isDeveloper) {
      router.replace("/");
    }
  }, [isDeveloper, isLoading, router]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenCreateModal = () => {
    setCreateUserId("");
    setCreateEmail("");
    setCreateName("");
    setCreateRole("staff");
    setCreatePassword(handleGeneratePassword());
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleUserIdChange = (val: string) => {
    // Alphanumeric with underscore or hyphen
    const sanitized = val.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setCreateUserId(sanitized);
    // Suggest default email if empty or matches previous pattern
    if (!createEmail || createEmail.endsWith("@easyreport.erp")) {
      setCreateEmail(sanitized ? `${sanitized}@easyreport.erp` : "");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createUserId.trim()) {
      setCreateError("Please enter a User ID.");
      return;
    }

    if (!createEmail.trim() || !createEmail.includes("@")) {
      setCreateError("Please enter a valid email address.");
      return;
    }

    if (!createPassword || createPassword.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }

    setIsCreating(true);
    try {
      const payload: CreateUserPayload = {
        userId: createUserId.trim(),
        email: createEmail.trim(),
        displayName: createName.trim() || createUserId.trim(),
        role: createRole,
        password: createPassword.trim(),
      };

      const result = await createUser(payload);
      if (!result.success) {
        setCreateError(result.error || "Failed to create user.");
      } else {
        setIsCreateModalOpen(false);
        setLastCreatedUser(result.user || null);
        showNotification(
          "success",
          `User account "${payload.userId}" created successfully!`,
        );
      }
    } catch (err: any) {
      setCreateError(err.message || "Failed to provision user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus: UserStatus = user.status === "active" ? "suspended" : "active";
    const result = await updateUser(user.uid, { status: newStatus });
    if (result.success) {
      showNotification(
        "success",
        `User "${user.userId}" has been ${newStatus === "active" ? "activated" : "suspended"}.`,
      );
    } else {
      showNotification("error", result.error || "Failed to update user status.");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (!newPassword || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    setIsResetting(true);
    try {
      const result = await updateUser(resetModalUser.uid, { password: newPassword.trim() });
      if (result.success) {
        showNotification(
          "success",
          `Password for "${resetModalUser.userId}" updated successfully!`,
        );
        setResetModalUser(null);
        setNewPassword("");
      } else {
        setResetError(result.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setResetError(err.message || "Error updating password.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    try {
      const result = await deleteUser(deleteModalUser.uid);
      if (result.success) {
        showNotification("success", `User "${deleteModalUser.userId}" was deleted.`);
        setDeleteModalUser(null);
      } else {
        showNotification("error", result.error || "Failed to delete user.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading || !isDeveloper) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <ShieldAlert className="w-10 h-10 text-error mb-3" />
        <h2 className="text-base font-bold text-on-surface">
          Developer Clearance Required
        </h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Only authorized developers have clearance to view and provision system credentials.
        </p>
      </div>
    );
  }

  const activeCount = users.filter((u) => u.status === "active").length;
  const devCount = users.filter((u) => u.role === "developer").length;
  const staffCount = users.filter((u) => u.role === "staff" || u.role === "manager").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded border flex items-center justify-between text-xs animate-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-secondary-container/20 border-secondary text-secondary font-medium"
              : "bg-error-container/30 border-error text-error font-medium"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-error shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-primary text-on-primary">
              <Shield className="w-4 h-4" />
            </span>
            <h1 className="text-lg font-bold text-on-surface tracking-tight">
              Developer Credential & User Console
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono">
              Master Access
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Exclusive developer portal to provision IDs, passwords, and security clearance for ERP operators.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refreshUsers()}
            className="px-3 py-1.5 border border-outline-variant rounded text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-on-primary rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User ID & Password</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Total Accounts
          </div>
          <div className="text-xl font-bold font-mono text-primary mt-1">
            {users.length}
          </div>
        </div>
        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Active Accounts
          </div>
          <div className="text-xl font-bold font-mono text-secondary mt-1">
            {activeCount}
          </div>
        </div>
        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Developers
          </div>
          <div className="text-xl font-bold font-mono text-primary mt-1">
            {devCount}
          </div>
        </div>
        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Billing & Staff
          </div>
          <div className="text-xl font-bold font-mono text-on-surface mt-1">
            {staffCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-container-lowest p-3 border border-outline-variant rounded">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by ID, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-on-surface-variant font-medium">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Roles</option>
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff / Cashier</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low font-semibold text-on-surface-variant uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">User ID</th>
                <th className="py-2.5 px-4">Staff Name</th>
                <th className="py-2.5 px-4">Email Address</th>
                <th className="py-2.5 px-4">Clearance Role</th>
                <th className="py-2.5 px-4">Account Status</th>
                <th className="py-2.5 px-4">Created</th>
                <th className="py-2.5 px-4 text-right">Developer Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    No user accounts match your search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentDev = currentUser?.uid === u.uid;
                  const isMasterDev = u.userId.toLowerCase() === "developer";

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-primary flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-on-surface-variant" />
                        <span>{u.userId}</span>
                        {isCurrentDev && (
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-sans font-semibold">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-on-surface">
                        {u.displayName}
                      </td>
                      <td className="py-3 px-4 font-mono text-on-surface-variant text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                            u.role === "developer"
                              ? "bg-primary text-on-primary"
                              : u.role === "admin"
                                ? "bg-primary-container text-on-primary-container"
                                : u.role === "manager"
                                  ? "bg-surface-container-high text-on-surface"
                                  : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            u.status === "active"
                              ? "bg-secondary-container/30 text-secondary"
                              : "bg-error-container/40 text-error"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === "active" ? "bg-secondary" : "bg-error"
                            }`}
                          />
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-on-surface-variant text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword(handleGeneratePassword());
                              setResetError(null);
                            }}
                            title="Reset Password"
                            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Suspended */}
                          <button
                            type="button"
                            disabled={isMasterDev}
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === "active" ? "Suspend Account" : "Activate Account"}
                            className={`p-1 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.status === "active"
                                ? "text-on-surface-variant hover:text-error hover:bg-error-container/20"
                                : "text-on-surface-variant hover:text-secondary hover:bg-secondary-container/20"
                            }`}
                          >
                            {u.status === "active" ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete Account */}
                          <button
                            type="button"
                            disabled={isMasterDev || isCurrentDev}
                            onClick={() => setDeleteModalUser(u)}
                            title="Delete Account"
                            className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3.5 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <h3 id="create-user-title" className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Provision New User Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {createError && (
                <div className="p-2.5 rounded bg-error-container/40 border border-error/20 flex items-center gap-2 text-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="new-userId"
                  className="block font-semibold text-on-surface uppercase tracking-wider text-[11px]"
                >
                  User ID (Login Identifier) *
                </label>
                <input
                  id="new-userId"
                  type="text"
                  required
                  placeholder="e.g. cashier01, billing_staff"
                  value={createUserId}
                  onChange={(e) => handleUserIdChange(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
                <p className="text-[10px] text-on-surface-variant">
                  This is the unique ID the operator will use on the login screen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="new-name"
                    className="block font-semibold text-on-surface uppercase tracking-wider text-[11px]"
                  >
                    Full / Staff Name
                  </label>
                  <input
                    id="new-name"
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="new-email"
                    className="block font-semibold text-on-surface uppercase tracking-wider text-[11px]"
                  >
                    Email Address *
                  </label>
                  <input
                    id="new-email"
                    type="email"
                    required
                    placeholder="user@easyreport.erp"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full px-3 py-1.5 font-mono text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="new-role"
                  className="block font-semibold text-on-surface uppercase tracking-wider text-[11px]"
                >
                  Assigned Clearance Role *
                </label>
                <select
                  id="new-role"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-medium"
                >
                  <option value="staff">Staff / Cashier (Billing & POS Operations)</option>
                  <option value="manager">Manager (Stock, Inward, Reports)</option>
                  <option value="admin">Store Admin (Full ERP Access)</option>
                  <option value="developer">Developer (User Provisioning & System Access)</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="new-password"
                    className="block font-semibold text-on-surface uppercase tracking-wider text-[11px]"
                  >
                    Assigned Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreatePassword(handleGeneratePassword())}
                    className="text-[10px] text-secondary font-bold hover:underline cursor-pointer"
                  >
                    Generate Random Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="new-password"
                    type="text"
                    required
                    placeholder="Set user password (min 6 chars)"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full px-3 py-1.5 font-mono text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant">
                  Only you (the developer) can issue this password to the operator.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-outline-variant rounded font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 bg-primary text-on-primary rounded font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  {isCreating ? "Provisioning..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS ISSUED NOTICE MODAL */}
      {lastCreatedUser && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="credentials-issued-title"
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="h-1.5 bg-secondary w-full" />
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-2 text-secondary">
                <CheckCircle2 className="w-5 h-5" />
                <h3 id="credentials-issued-title" className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Credentials Created Successfully
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant">
                The account has been provisioned. Share these credentials with the operator:
              </p>

              <div className="bg-surface-container-low p-3 rounded border border-outline-variant space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">User ID:</span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    {lastCreatedUser.userId}
                    <button
                      type="button"
                      onClick={() => handleCopy(lastCreatedUser.userId, "id")}
                      className="p-1 hover:bg-surface-container rounded text-on-surface-variant"
                    >
                      {copiedField === "id" ? (
                        <Check className="w-3 h-3 text-secondary" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Email:</span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    {lastCreatedUser.email}
                    <button
                      type="button"
                      onClick={() => handleCopy(lastCreatedUser.email, "email")}
                      className="p-1 hover:bg-surface-container rounded text-on-surface-variant"
                    >
                      {copiedField === "email" ? (
                        <Check className="w-3 h-3 text-secondary" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Password:</span>
                  <span className="font-bold text-secondary flex items-center gap-1">
                    {lastCreatedUser.passwordPlainHint || "******"}
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(lastCreatedUser.passwordPlainHint || "", "pass")
                      }
                      className="p-1 hover:bg-surface-container rounded text-on-surface-variant"
                    >
                      {copiedField === "pass" ? (
                        <Check className="w-3 h-3 text-secondary" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/60">
                  <span className="text-on-surface-variant">Role:</span>
                  <span className="font-bold uppercase text-on-surface">
                    {lastCreatedUser.role}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setLastCreatedUser(null)}
                  className="px-4 py-1.5 bg-primary text-on-primary rounded font-semibold text-xs hover:bg-primary/90 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3.5 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <h3 id="reset-password-title" className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Reset Password for {resetModalUser.userId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4 text-xs">
              {resetError && (
                <div className="p-2.5 rounded bg-error-container/40 border border-error/20 flex items-center gap-2 text-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="reset-new-password"
                    className="block font-semibold text-on-surface uppercase tracking-wider text-[11px]"
                  >
                    New Assigned Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(handleGeneratePassword())}
                    className="text-[10px] text-secondary font-bold hover:underline cursor-pointer"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  id="reset-new-password"
                  type="text"
                  required
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 border border-outline-variant rounded font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-1.5 bg-primary text-on-primary rounded font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
                >
                  {isResetting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalUser && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-error">
                <Trash2 className="w-5 h-5" />
                <h3 id="delete-account-title" className="text-sm font-bold uppercase tracking-wider text-on-surface">
                  Confirm Deletion
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant">
                Are you sure you want to delete user account{" "}
                <strong className="text-primary font-mono">{deleteModalUser.userId}</strong>?
                This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  className="px-3 py-1.5 border border-outline-variant rounded font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteSubmit}
                  className="px-4 py-1.5 bg-error text-on-error rounded font-semibold hover:bg-error/90 disabled:opacity-60 cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

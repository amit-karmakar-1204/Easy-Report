"use client";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useMemo, useState } from "react";
import { type UserAccount, type UserRole, useAuth } from "@/lib/auth";

export default function UsersPage() {
  const {
    currentUser,
    users,
    isAdmin,
    createUser,
    adminResetPassword,
    deleteUser,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "admin" | "user">("ALL");

  // Create User Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Reset Password Modal state
  const [resetTargetUser, setResetTargetUser] = useState<UserAccount | null>(
    null,
  );
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Delete confirmation
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserAccount | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filtered users (Hook called unconditionally)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesRole = roleFilter === "ALL" ? true : u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const standardCount = users.filter((u) => u.role === "user").length;

  // Access check: only admin can view this page
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-surface-container-lowest border border-outline-variant rounded-sm text-center">
        <div className="w-12 h-12 rounded-sm bg-error-container text-error flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-primary">
          Access Restricted: Administrator Privileges Required
        </h1>
        <p className="text-xs text-on-surface-variant mt-2 max-w-md mx-auto leading-relaxed">
          The User Management module is restricted exclusively to system
          administrators. Standard users cannot view, edit, or create other user
          accounts.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleOpenCreateModal = () => {
    setNewUserId("");
    setNewDisplayName("");
    setNewEmail("");
    setNewRole("user");
    setNewPassword("");
    setNewConfirmPassword("");
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!newUserId.trim()) {
      setCreateError("User ID / Username is required.");
      return;
    }

    if (!newDisplayName.trim()) {
      setCreateError("Display Name is required.");
      return;
    }

    if (newPassword.length < 6) {
      setCreateError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== newConfirmPassword) {
      setCreateError("Passwords do not match.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createUser({
        userId: newUserId,
        displayName: newDisplayName,
        role: newRole,
        password: newPassword,
        email: newEmail || undefined,
      });

      if (res.success) {
        setCreateSuccess(
          `User account "${res.user?.userId}" created successfully with role ${res.user?.role.toUpperCase()}.`,
        );
        setTimeout(() => {
          setIsCreateModalOpen(false);
        }, 1200);
      } else {
        setCreateError(res.error || "Failed to create user account.");
      }
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError(null);
    setResetSuccess(null);

    if (adminNewPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }

    if (adminNewPassword !== adminConfirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await adminResetPassword(
        resetTargetUser.id,
        adminNewPassword,
      );
      if (res.success) {
        setResetSuccess(
          `Password for user "${resetTargetUser.userId}" has been reset.`,
        );
        setTimeout(() => {
          setResetTargetUser(null);
        }, 1200);
      } else {
        setResetError(res.error || "Failed to reset password.");
      }
    } catch (err) {
      setResetError((err as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetUser) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const res = await deleteUser(deleteTargetUser.id);
      if (res.success) {
        setDeleteTargetUser(null);
      } else {
        setDeleteError(res.error || "Failed to delete user.");
      }
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              User Management
            </h1>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Create system accounts, assign roles, and manage access credentials.
            Standard users cannot self-register.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-semibold text-xs rounded-sm hover:opacity-90 transition-all cursor-pointer shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Total Accounts
            </div>
            <div className="text-2xl font-bold text-primary mt-1">
              {users.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-sm bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Administrators
            </div>
            <div className="text-2xl font-bold text-primary mt-1">
              {adminCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-sm bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Standard Users
            </div>
            <div className="text-2xl font-bold text-secondary mt-1">
              {standardCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-sm bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest border border-outline-variant rounded-sm p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by User ID, Name, or Email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-on-surface-variant">
            Role:
          </span>
          <div className="inline-flex border border-outline-variant rounded-sm overflow-hidden text-xs">
            {(["ALL", "admin", "user"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 font-medium transition-colors cursor-pointer ${
                  roleFilter === r
                    ? "bg-primary text-on-primary font-semibold"
                    : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {r === "ALL" ? "All Roles" : r === "admin" ? "Admins" : "Users"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant">
                  User ID / Login
                </th>
                <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant">
                  Display Name
                </th>
                <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant">
                  Role
                </th>
                <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant">
                  Created Date
                </th>
                <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant">
                  Status
                </th>
                <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-on-surface-variant font-medium"
                  >
                    No user accounts match the current filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const formattedDate = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString()
                    : "-";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                            {u.userId.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface font-mono">
                              {u.userId}
                            </div>
                            {u.email && (
                              <div className="text-[10px] text-on-surface-variant">
                                {u.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <span>{u.displayName}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider bg-primary text-on-primary">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">
                            <UserCheck className="w-3 h-3" />
                            User
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-on-surface-variant">
                        <div>{formattedDate}</div>
                        {u.createdBy && (
                          <div className="text-[10px] text-on-surface-variant/70">
                            by {u.createdBy}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setResetTargetUser(u);
                              setAdminNewPassword("");
                              setAdminConfirmPassword("");
                              setResetError(null);
                              setResetSuccess(null);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-sm border border-outline-variant transition-colors cursor-pointer"
                            title="Reset User Password"
                          >
                            Reset Password
                          </button>
                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => {
                              setDeleteTargetUser(u);
                              setDeleteError(null);
                            }}
                            className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-sm border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title={
                              isCurrent
                                ? "Cannot delete your own account"
                                : "Delete Account"
                            }
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

      {/* Modal: Create User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-primary text-on-primary flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-primary tracking-tight">
                    Create New User Account
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Provision new access credentials for staff or administrator.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 text-xs bg-error-container text-on-error-container rounded-sm border border-error/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="p-3 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-sm border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* User ID */}
                <div>
                  <label
                    htmlFor="create-user-id"
                    className="block text-xs font-semibold text-on-surface mb-1"
                  >
                    User ID / Login Name *
                  </label>
                  <input
                    id="create-user-id"
                    type="text"
                    required
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    placeholder="e.g. john_doe"
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  />
                  <span className="text-[10px] text-on-surface-variant mt-0.5 block">
                    Alphanumeric, lowercase, no spaces.
                  </span>
                </div>

                {/* Display Name */}
                <div>
                  <label
                    htmlFor="create-display-name"
                    className="block text-xs font-semibold text-on-surface mb-1"
                  >
                    Full Name *
                  </label>
                  <input
                    id="create-display-name"
                    type="text"
                    required
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label
                    htmlFor="create-role"
                    className="block text-xs font-semibold text-on-surface mb-1"
                  >
                    Account Role *
                  </label>
                  <select
                    id="create-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="user">User (Standard Operator)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>

                {/* Optional Email */}
                <div>
                  <label
                    htmlFor="create-email"
                    className="block text-xs font-semibold text-on-surface mb-1"
                  >
                    Email Address (Optional)
                  </label>
                  <input
                    id="create-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. john@erp.com"
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label
                    htmlFor="create-password"
                    className="block text-xs font-semibold text-on-surface mb-1"
                  >
                    Initial Password *
                  </label>
                  <div className="relative">
                    <input
                      id="create-password"
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 pr-9 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer p-0.5"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="create-confirm-password"
                    className="block text-xs font-semibold text-on-surface mb-1"
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="create-confirm-password"
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newConfirmPassword}
                      onChange={(e) => setNewConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 pr-9 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  className="px-3.5 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm border border-outline-variant transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-sm hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating User...</span>
                    </>
                  ) : (
                    <span>Create User Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin Reset Password */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-primary tracking-tight">
                  Reset Password for {resetTargetUser.userId}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-5 space-y-4">
              {resetError && (
                <div className="p-3 text-xs bg-error-container text-on-error-container rounded-sm border border-error/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-sm border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-new-password"
                  className="block text-xs font-semibold text-on-surface mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="admin-new-password"
                    type={showAdminPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 pr-9 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer p-0.5"
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-confirm-password"
                  className="block text-xs font-semibold text-on-surface mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="admin-confirm-password"
                  type={showAdminPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  disabled={isResetting}
                  className="px-3.5 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm border border-outline-variant transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-sm hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete User Confirmation */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-sm shadow-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-sm bg-error-container text-error flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  Delete User Account
                </h3>
                <p className="text-xs text-on-surface-variant">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Are you sure you want to permanently delete account{" "}
              <strong className="text-on-surface font-mono">
                {deleteTargetUser.userId}
              </strong>{" "}
              ({deleteTargetUser.displayName})? The user will no longer be able
              to log in.
            </p>

            {deleteError && (
              <div className="mb-3 p-2 bg-error-container text-on-error-container text-xs rounded border border-error/20">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm border border-outline-variant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-error text-on-error rounded-sm hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete User</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { User, FlaggedReport, SiteProblem, AdminStats } from "../types";
import { api } from "../services/api";
import { ApiExplorerSection } from "./ApiExplorerSection";
import {
  ShieldAlert,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Database,
  Users,
  MessageSquare,
  Camera,
  CheckCircle,
  HelpCircle,
  Code2,
  SlidersHorizontal,
  UserCheck,
  UserX,
  Ban,
  Eye,
  EyeOff,
} from "lucide-react";

export const AdminSection: React.FC = () => {
  const [passkey, setPasskey] = useState(() => sessionStorage.getItem("adminPasskey") || "");
  const [showPasskey, setShowPasskey] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"moderation" | "api-docs">("moderation");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<FlaggedReport[]>([]);
  const [problems, setProblems] = useState<SiteProblem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Auto-attempt login if saved in sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("adminPasskey");
    if (saved && !isAuthenticated) {
      tryAutoAuth(saved.trim());
    }
  }, []);

  const tryAutoAuth = async (key: string) => {
    try {
      setLoading(true);
      const resUsers = await api.getAdminUsers(key);
      setUsers(resUsers);
      setIsAuthenticated(true);
      loadAllAdminData(key);
    } catch {
      // Stale or invalid key in session, clear it silently
      sessionStorage.removeItem("adminPasskey");
    } finally {
      setLoading(false);
    }
  };

  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const cleanKey = passkey.trim();
    if (!cleanKey) {
      setAuthError("Please enter the security passkey.");
      return;
    }

    try {
      setLoading(true);
      // Test passkey against admin users endpoint
      const resUsers = await api.getAdminUsers(cleanKey);
      setUsers(resUsers);
      setIsAuthenticated(true);
      sessionStorage.setItem("adminPasskey", cleanKey);
      loadAllAdminData(cleanKey);
    } catch (err: any) {
      setAuthError(err?.message || "Access Denied: Invalid Security Passkey.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllAdminData = async (key: string) => {
    try {
      const [s, u, r, p] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(key),
        api.getReports(key),
        api.getSiteProblems(key),
      ]);
      setStats(s);
      setUsers(u);
      setReports(r);
      setProblems(p);
    } catch (err) {
      console.error(err);
    }
  };

  // Set explicit user status (active, blocked, deactivated)
  const handleSetStatus = async (id: string, newStatus: "active" | "blocked" | "deactivated") => {
    try {
      await api.setUserStatus(id, newStatus, passkey);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
      );
      showNotice(`User status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      alert(err?.message || "Failed to update status");
    }
  };

  // Toggle user status (active vs blocked)
  const handleToggleStatus = async (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    const nextStatus = targetUser?.status === "blocked" ? "active" : "blocked";
    handleSetStatus(id, nextStatus);
  };

  // Delete user
  const handleDeleteUser = async (id: string, username?: string) => {
    if (!confirm(`Are you sure you want to permanently delete user @${username || id}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(id, passkey);
      setUsers((prev) => prev.filter((u) => u.id !== id && u.username !== id));
      const newStats = await api.getAdminStats();
      setStats(newStats);
      showNotice(`User @${username || id} permanently removed from database.`);
    } catch (err: any) {
      alert(err?.message || "Failed to delete user");
    }
  };

  // Dismiss report
  const handleDismissReport = async (id: string) => {
    try {
      await api.dismissReport(id, passkey);
      setReports(reports.filter((r) => r.id !== id));
      showNotice("Report dismissed.");
    } catch (err) {
      alert("Failed to dismiss report");
    }
  };

  // Dismiss problem
  const handleDismissProblem = async (id: string) => {
    try {
      await api.dismissProblem(id, passkey);
      setProblems(problems.filter((p) => p.id !== id));
      showNotice("Problem marked as resolved.");
    } catch (err) {
      alert("Failed to dismiss problem");
    }
  };

  // Wipe database
  const handleWipe = async () => {
    if (!confirm("FATAL ACTION: Are you sure you want to wipe the ENTIRE database clean? All student accounts, messages, photos, and memories will be permanently deleted.")) return;
    try {
      await api.wipeDatabase(passkey);
      setUsers([]);
      setReports([]);
      setProblems([]);
      await loadAllAdminData(passkey);
      showNotice("Database wiped clean successfully. All records removed.");
    } catch (err: any) {
      alert(err?.message || "Failed to wipe database");
    }
  };

  // Re-seed demo records
  const handleSeed = async () => {
    try {
      await api.seedDatabase(passkey);
      await loadAllAdminData(passkey);
      showNotice("Database re-seeded with demo students and memories.");
    } catch (err) {
      alert("Failed to seed database");
    }
  };

  const showNotice = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3500);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#003d80] text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-['Cormorant_Garamond',serif] text-3xl font-semibold text-[#1a2a40]">
            Moderation Console & REST API
          </h1>
          <p className="text-xs text-[#7a8fa8]">
            Restricted campus administrative dashboard & private RESTful API documentation.
          </p>
        </div>

        <form
          onSubmit={authenticate}
          className="bg-white rounded-2xl border border-[#1a2a40]/10 p-6 shadow-xs space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#4a5e7a]">
                Security Passkey
              </label>
              <button
                type="button"
                onClick={() => setShowPasskey(!showPasskey)}
                className="text-[11px] text-[#0056b3] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showPasskey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPasskey ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPasskey ? "text" : "password"}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter security passkey"
                className="w-full text-xs px-3 py-2.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80] pr-10"
                required
                autoFocus
              />
            </div>
          </div>

          {authError && (
            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Verifying passkey..." : "Unlock Admin Console & API"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2a40]/10 pb-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#0056b3] font-semibold">
            System Administration · ನಿರ್ವಹಣಾ ಫಲಕ
          </span>
          <h1 className="font-['Cormorant_Garamond',serif] text-3xl sm:text-4xl font-semibold text-[#1a2a40]">
            Admin Portal & RESTful API
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAllAdminData(passkey)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-[#1a2a40]/15 rounded-lg hover:bg-[#f0f4f8] text-[#4a5e7a] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer"
          >
            Lock Console
          </button>
        </div>
      </div>

      {/* Admin Sub-Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-[#1a2a40]/10 pb-2">
        <button
          onClick={() => setActiveTab("moderation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === "moderation"
              ? "bg-[#003d80] text-white shadow-xs"
              : "bg-white text-[#4a5e7a] hover:bg-[#f0f4f8] border border-[#1a2a40]/10"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Moderation & Database Controls</span>
        </button>

        <button
          onClick={() => setActiveTab("api-docs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === "api-docs"
              ? "bg-[#003d80] text-white shadow-xs"
              : "bg-white text-[#4a5e7a] hover:bg-[#f0f4f8] border border-[#1a2a40]/10"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>REST API Explorer & CRUD Docs</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in">
          {actionMsg}
        </div>
      )}

      {/* TAB 1: MODERATION & USER CONTROLS */}
      {activeTab === "moderation" && (
        <div className="space-y-8">
          {/* Overview Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#1a2a40]/10 shadow-2xs">
                <span className="text-[11px] text-[#7a8fa8] uppercase tracking-wider block">
                  Students
                </span>
                <span className="text-2xl font-semibold text-[#003d80]">
                  {stats.usersCount}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#1a2a40]/10 shadow-2xs">
                <span className="text-[11px] text-[#7a8fa8] uppercase tracking-wider block">
                  Public Chat
                </span>
                <span className="text-2xl font-semibold text-[#003d80]">
                  {stats.publicMsgsCount}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#1a2a40]/10 shadow-2xs">
                <span className="text-[11px] text-[#7a8fa8] uppercase tracking-wider block">
                  Yearbook
                </span>
                <span className="text-2xl font-semibold text-[#003d80]">
                  {stats.memoriesCount}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#1a2a40]/10 shadow-2xs">
                <span className="text-[11px] text-[#7a8fa8] uppercase tracking-wider block">
                  Quotes
                </span>
                <span className="text-2xl font-semibold text-[#003d80]">
                  {stats.quotesCount}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#1a2a40]/10 shadow-2xs">
                <span className="text-[11px] text-[#7a8fa8] uppercase tracking-wider block">
                  Confessions
                </span>
                <span className="text-2xl font-semibold text-[#003d80]">
                  {stats.confessionsCount}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#1a2a40]/10 shadow-2xs">
                <span className="text-[11px] text-[#7a8fa8] uppercase tracking-wider block">
                  Reports
                </span>
                <span className="text-2xl font-semibold text-red-600">
                  {stats.reportsCount}
                </span>
              </div>
            </div>
          )}

          {/* User Management Table */}
          <section className="bg-white rounded-2xl border border-[#1a2a40]/10 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0056b3]" />
                <h2 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                  Registered Student Accounts ({users.length})
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f0f4f8] text-[#4a5e7a] border-b border-[#1a2a40]/10 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Student UID</th>
                    <th className="p-3">Name / Username</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions (Block &bull; Activate &bull; Deactivate &bull; Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2a40]/5">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#7a8fa8]">
                        No student accounts found. Click "Re-seed Initial College Memories" to add demo accounts or register new accounts.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-mono text-[#0056b3]">{u.id}</td>
                        <td className="p-3">
                          <span className="font-semibold text-[#1a2a40] block">{u.name}</span>
                          <span className="text-[#7a8fa8] text-[11px]">@{u.username}</span>
                        </td>
                        <td className="p-3 text-[#4a5e7a]">{u.branch}</td>
                        <td className="p-3 text-[#7a8fa8] font-mono">{u.phone || "—"}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.status === "active"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : u.status === "blocked"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Block / Unblock Option */}
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                                u.status === "blocked"
                                  ? "bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300"
                                  : "bg-gray-100 hover:bg-gray-200 text-[#1a2a40]"
                              }`}
                              title={u.status === "blocked" ? "Unblock account" : "Block user"}
                            >
                              {u.status === "blocked" ? "Unblock" : "Block"}
                            </button>

                            {/* Activate Button (right side of block) */}
                            <button
                              onClick={() => handleSetStatus(u.id, "active")}
                              disabled={u.status === "active"}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                u.status === "active"
                                  ? "bg-emerald-50 text-emerald-600/50 border border-emerald-200/50 cursor-not-allowed"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                              }`}
                              title="Activate student account"
                            >
                              Activate
                            </button>

                            {/* Deactivate Button (right side of activate) */}
                            <button
                              onClick={() => handleSetStatus(u.id, "deactivated")}
                              disabled={u.status === "deactivated"}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                u.status === "deactivated"
                                  ? "bg-amber-50 text-amber-600/50 border border-amber-200/50 cursor-not-allowed"
                                  : "bg-amber-500 hover:bg-amber-600 text-white shadow-2xs"
                              }`}
                              title="Deactivate student account"
                            >
                              Deactivate
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                              title="Permanently delete user from database"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Reports & Problems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flagged Reports */}
            <section className="bg-white rounded-2xl border border-[#1a2a40]/10 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <h2 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                  Flagged Content Reports ({reports.length})
                </h2>
              </div>

              {reports.length === 0 ? (
                <p className="text-xs text-[#7a8fa8] py-4 text-center">
                  No pending abuse reports. Clean campus vibes!
                </p>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-red-700">Offender: {r.offender}</span>
                        <span className="text-[#7a8fa8]">{new Date(r.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-[#2a2a2a]">"{r.text}"</p>
                      <div className="flex justify-end pt-1 gap-2">
                        <button
                          onClick={() => handleToggleStatus(r.offender)}
                          className="text-xs text-amber-700 hover:underline cursor-pointer font-medium"
                        >
                          Block Offender
                        </button>
                        <button
                          onClick={() => handleDismissReport(r.id)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          Dismiss Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Site Problems */}
            <section className="bg-white rounded-2xl border border-[#1a2a40]/10 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#0056b3]">
                <HelpCircle className="w-4 h-4" />
                <h2 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                  Reported Site Issues ({problems.length})
                </h2>
              </div>

              {problems.length === 0 ? (
                <p className="text-xs text-[#7a8fa8] py-4 text-center">
                  No technical problems reported by students.
                </p>
              ) : (
                <div className="space-y-3">
                  {problems.map((p) => (
                    <div key={p.id} className="p-3 bg-[#f0f4f8] border border-[#1a2a40]/10 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#7a8fa8]">
                        <span>By: {p.reporter}</span>
                        <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-[#1a2a40]">{p.issue}</p>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleDismissProblem(p.id)}
                          className="text-xs text-[#0056b3] hover:underline cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Database Maintenance Actions */}
          <section className="bg-white rounded-2xl border border-[#1a2a40]/10 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#003d80]">
              <Database className="w-4 h-4 text-[#0056b3]" />
              <h2 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                Database Operations & Maintenance
              </h2>
            </div>
            <p className="text-xs text-[#7a8fa8]">
              Actions to seed demo batch content or completely wipe state from the persistent disk storage.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleSeed}
                className="px-4 py-2 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] cursor-pointer shadow-xs"
              >
                Re-seed Initial College Memories
              </button>
              <button
                onClick={handleWipe}
                className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 cursor-pointer shadow-xs"
              >
                ⚠️ Wipe Entire Database Clean
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: RESTful API EXPLORER & CRUD DOCUMENTATION */}
      {activeTab === "api-docs" && (
        <div className="space-y-4">
          <div className="bg-[#003d80]/5 border border-[#003d80]/15 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-[#003d80]">
                Admin RESTful API Console
              </h3>
              <p className="text-[11px] text-[#4a5e7a]">
                Live interactive testing sandbox for the Node.js Express RESTful backend with JWT auth and CRUD.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-white text-[#003d80] text-[10px] font-mono rounded-md border border-[#003d80]/20 font-bold">
              PORT 3000
            </span>
          </div>

          <ApiExplorerSection />
        </div>
      )}
    </div>
  );
};


"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserPlus,
  UserMinus,
  UserCog,
  KeyRound,
  Calendar,
  Clock,
  ArrowLeft,
  Search,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string | null;
  adminEmail: string;
  actionType: string;
  actionLabel: string;
  targetType: string | null;
  targetLabel: string | null;
  targetId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

interface Filters {
  actionTypes: { value: string; label: string }[];
  admins: { id: string; name: string }[];
}

interface LogsResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  totalPages: number;
  filters: Filters;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  VALIDATE_STEP: <CheckCircle className="h-4 w-4 text-green-600" />,
  REJECT_STEP: <XCircle className="h-4 w-4 text-red-600" />,
  CREATE_ADMIN: <UserPlus className="h-4 w-4 text-blue-600" />,
  UPDATE_ADMIN: <UserCog className="h-4 w-4 text-amber-600" />,
  DELETE_ADMIN: <UserMinus className="h-4 w-4 text-red-600" />,
  RESET_USER_PASSWORD: <KeyRound className="h-4 w-4 text-purple-600" />,
  APPROVE_APPOINTMENT: <Calendar className="h-4 w-4 text-green-600" />,
  REJECT_APPOINTMENT: <Calendar className="h-4 w-4 text-red-600" />,
  ADMIN_LOGIN: <Shield className="h-4 w-4 text-blue-600" />,
};

const ACTION_COLORS: Record<string, string> = {
  VALIDATE_STEP: "bg-green-50 border-green-200",
  REJECT_STEP: "bg-red-50 border-red-200",
  CREATE_ADMIN: "bg-blue-50 border-blue-200",
  UPDATE_ADMIN: "bg-amber-50 border-amber-200",
  DELETE_ADMIN: "bg-red-50 border-red-200",
  RESET_USER_PASSWORD: "bg-purple-50 border-purple-200",
  APPROVE_APPOINTMENT: "bg-green-50 border-green-200",
  REJECT_APPOINTMENT: "bg-red-50 border-red-200",
  ADMIN_LOGIN: "bg-blue-50 border-blue-200",
};

function getDetailsSummary(log: ActivityLog): string {
  const d = log.details;
  switch (log.actionType) {
    case "VALIDATE_STEP":
      return `A validé l'étape ${d.step} de ${d.studentName || "l'étudiant"}`;
    case "REJECT_STEP":
      return `A rejeté l'étape ${d.step} de ${d.studentName || "l'étudiant"}`;
    case "CREATE_ADMIN":
      return `A créé l'administrateur ${d.name || d.email}`;
    case "UPDATE_ADMIN":
      return `A modifié ${d.targetName || d.targetEmail} (${(d.changes as string[])?.join(", ") || "données"})`;
    case "DELETE_ADMIN":
      return `A supprimé ${d.deletedName || d.deletedEmail}`;
    case "RESET_USER_PASSWORD":
      return `A réinitialisé le mot de passe de ${d.targetName || d.targetEmail}`;
    case "APPROVE_APPOINTMENT":
      return `A approuvé le rendez-vous "${d.appointmentSubject}"`;
    case "REJECT_APPOINTMENT":
      return `A rejeté le rendez-vous "${d.appointmentSubject}"`;
    case "ADMIN_LOGIN":
      return "S'est connecté";
    default:
      return log.actionLabel;
  }
}

export default function ActivityLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  const fetchLogs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "30");
      if (selectedAdmin) params.set("adminId", selectedAdmin);
      if (selectedAction) params.set("actionType", selectedAction);
      if (startDate) params.set("startDate", new Date(startDate).toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.set("endDate", end.toISOString());
      }

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, selectedAdmin, selectedAction, startDate, endDate]);

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchLogs();
    }
  }, [session, fetchLogs]);

  const handleFilterReset = () => {
    setSelectedAdmin("");
    setSelectedAction("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-xl">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Journal d&apos;activités
                </h1>
                <p className="text-gray-600">
                  Historique complet des actions administratives
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                {data?.total || 0} action{(data?.total || 0) !== 1 ? "s" : ""}
              </Badge>
              <button
                onClick={() => fetchLogs(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Administrateur
                </label>
                <select
                  value={selectedAdmin}
                  onChange={(e) => { setSelectedAdmin(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Tous</option>
                  {data?.filters.admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Type d&apos;action
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Toutes</option>
                  {data?.filters.actionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleFilterReset}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <Card>
          <CardContent className="pt-6">
            {data?.logs && data.logs.length > 0 ? (
              <div className="space-y-3">
                {data.logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${
                      ACTION_COLORS[log.actionType] || "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5">
                          {ACTION_ICONS[log.actionType] || (
                            <Search className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">
                              {log.adminName || log.adminEmail}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {log.actionLabel}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {getDetailsSummary(log)}
                          </p>
                          {typeof log.details.comment === 'string' && log.details.comment && (
                            <p className="text-xs text-gray-500 mt-1 italic bg-white/50 px-2 py-1 rounded">
                              &quot;{log.details.comment}&quot;
                            </p>
                          )}
                          {log.targetId && log.targetType === "STUDENT" && (
                            <Link
                              href={`/admin/etudiants/${log.targetId}`}
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              Voir le dossier →
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDate(log.createdAt)}
                        </div>
                        {log.ipAddress && (
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            IP: {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Aucune activité enregistrée
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Les actions des administrateurs apparaîtront ici
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Page {data.page} sur {data.totalPages} ({data.total} résultats)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

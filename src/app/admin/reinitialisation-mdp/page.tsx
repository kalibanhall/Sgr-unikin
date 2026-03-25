"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  KeyRound,
  Check,
  X,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ResetRequest {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  user: {
    email: string;
    name: string | null;
    role: string;
  };
}

export default function AdminPasswordResetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, { link: string; expiresAt: string }>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/password-resets?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchRequests();
    }
  }, [session, fetchRequests]);

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setProcessingId(requestId);
    try {
      const res = await fetch("/api/admin/password-resets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      if (res.ok) {
        const data = await res.json();
        if (action === "APPROVE" && data.resetLink) {
          setGeneratedLinks(prev => ({
            ...prev,
            [requestId]: { link: data.resetLink, expiresAt: data.expiresAt },
          }));
        }
        // Rafraîchir si rejet
        if (action === "REJECT") {
          fetchRequests();
        } else {
          // Mettre à jour le statut localement
          setRequests(prev =>
            prev.map(r => r.id === requestId ? { ...r, status: "APPROVED" } : r)
          );
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const copyLink = async (requestId: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(requestId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(requestId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <KeyRound className="h-8 w-8 text-blue-600" />
            Demandes de réinitialisation de mot de passe
          </h1>
          <p className="text-gray-600 mt-1">
            Approuvez les demandes pour générer un lien de réinitialisation à transmettre à l&apos;utilisateur.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "PENDING", label: "En attente", icon: Clock },
            { value: "APPROVED", label: "Approuvées", icon: CheckCircle },
            { value: "REJECTED", label: "Rejetées", icon: XCircle },
          ].map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={statusFilter === value ? "default" : "outline"}
              onClick={() => setStatusFilter(value)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Requests list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <KeyRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Aucune demande {statusFilter === "PENDING" ? "en attente" : statusFilter === "APPROVED" ? "approuvée" : "rejetée"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <Card key={req.id} className={
                req.status === "PENDING" ? "border-l-4 border-l-amber-400" :
                req.status === "APPROVED" ? "border-l-4 border-l-green-400" :
                "border-l-4 border-l-red-400"
              }>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {req.user.name || req.user.email}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{req.user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={req.user.role === "STUDENT" ? "secondary" : "pending"}>
                        {req.user.role === "STUDENT" ? "Étudiant" : req.user.role === "ADMIN" ? "Admin" : req.user.role}
                      </Badge>
                      <Badge variant={
                        req.status === "PENDING" ? "pending" :
                        req.status === "APPROVED" ? "success" : "destructive"
                      }>
                        {req.status === "PENDING" ? "En attente" :
                         req.status === "APPROVED" ? "Approuvée" : "Rejetée"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Demande faite le {formatDate(req.createdAt)}
                  </p>

                  {/* Link generated */}
                  {generatedLinks[req.id] && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        Lien de réinitialisation généré ! Transmettez-le à l&apos;utilisateur :
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedLinks[req.id].link}
                          className="flex-1 text-xs p-2 bg-white border rounded font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyLink(req.id, generatedLinks[req.id].link)}
                          className="shrink-0"
                        >
                          {copiedId === req.id ? (
                            <><CheckCircle className="h-4 w-4 mr-1 text-green-600" /> Copié</>
                          ) : (
                            <><Copy className="h-4 w-4 mr-1" /> Copier</>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Ce lien expire dans 24 heures ({new Date(generatedLinks[req.id].expiresAt).toLocaleString("fr-FR")})
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {req.status === "PENDING" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAction(req.id, "APPROVE")}
                        disabled={processingId === req.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === req.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Approuver et générer le lien
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleAction(req.id, "REJECT")}
                        disabled={processingId === req.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

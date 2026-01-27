"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Mail,
  GraduationCap
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Appointment {
  id: string;
  targetRole: string;
  subject: string;
  message: string | null;
  requestedDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  approvedDate: string | null;
  createdAt: string;
  student: {
    firstName: string;
    lastName: string;
    studyLevel: string;
    faculty: string | null;
    user: {
      email: string;
    };
  };
}

const targetRoles = [
  { value: "SECRETAIRE_ACADEMIQUE", label: "Secrétaire Académique" },
  { value: "CHEF_DEPARTEMENT", label: "Chef de Département" },
  { value: "DIRECTEUR_RECHERCHE", label: "Directeur de la Recherche" },
  { value: "SECRETAIRE_GENERAL", label: "Secrétaire Général" },
];

export default function AdminAppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [approvedDate, setApprovedDate] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/admin/appointments");
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") {
      fetchAppointments();
    }
  }, [session]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "APPROVED" : "REJECTED",
          adminNote,
          approvedDate: action === "approve" ? approvedDate || selectedAppointment?.requestedDate : null,
        }),
      });

      if (res.ok) {
        const updatedAppointment = await res.json();
        setAppointments(appointments.map(a => 
          a.id === id ? { ...a, ...updatedAppointment } : a
        ));
        setSelectedAppointment(null);
        setAdminNote("");
        setApprovedDate("");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Approuvé</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Refusé</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
    }
  };

  const getTargetRoleLabel = (value: string) => {
    return targetRoles.find(r => r.value === value)?.label || value;
  };

  const filteredAppointments = appointments.filter(a => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const pendingCount = appointments.filter(a => a.status === "PENDING").length;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des rendez-vous</h1>
            <p className="text-gray-900 mt-1">
              {pendingCount > 0 ? `${pendingCount} demande(s) en attente` : "Aucune demande en attente"}
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "Tous" },
            { value: "PENDING", label: "En attente" },
            { value: "APPROVED", label: "Approuvés" },
            { value: "REJECTED", label: "Refusés" },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Liste des rendez-vous */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
                <p className="text-gray-600">
                  Aucune demande de rendez-vous correspondant à ce filtre
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className={selectedAppointment?.id === appointment.id ? "ring-2 ring-blue-500" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {appointment.student.firstName} {appointment.student.lastName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span>{appointment.student.user.email}</span>
                          </div>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                      
                      <div className="ml-12 space-y-2">
                        <p className="font-medium text-gray-900">{appointment.subject}</p>
                        <p className="text-sm text-gray-600">
                          Pour : {getTargetRoleLabel(appointment.targetRole)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(appointment.requestedDate)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(appointment.requestedDate).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center">
                            <GraduationCap className="h-4 w-4 mr-1" />
                            {appointment.student.studyLevel}
                          </span>
                        </div>
                        {appointment.message && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{appointment.message}</p>
                        )}
                        {appointment.adminNote && (
                          <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                            <span className="font-medium">Note :</span> {appointment.adminNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {appointment.status === "PENDING" && (
                      <div className="flex flex-col gap-2">
                        {selectedAppointment?.id === appointment.id ? (
                          <div className="space-y-3 p-4 bg-gray-50 rounded-lg min-w-[300px]">
                            <div className="space-y-2">
                              <Label htmlFor="approvedDate">Date confirmée</Label>
                              <Input
                                id="approvedDate"
                                type="datetime-local"
                                value={approvedDate}
                                onChange={(e) => setApprovedDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="adminNote">Note (optionnel)</Label>
                              <Textarea
                                id="adminNote"
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Note pour le candidat..."
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAction(appointment.id, "approve")}
                                disabled={processing === appointment.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processing === appointment.id && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction(appointment.id, "reject")}
                                disabled={processing === appointment.id}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Refuser
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAppointment(null);
                                  setAdminNote("");
                                  setApprovedDate("");
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            Traiter
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

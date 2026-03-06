"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Loader2,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users
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
}

// Destinataires des rendez-vous avec leurs informations
const destinataires = [
  { 
    id: "SGR", 
    nom: "Prof. Paulin MUTWALE KAPEPULA", 
    fonction: "SGR", 
    description: "Secrétaire Général à la Recherche",
    initiales: "PMK"
  },
  { 
    id: "AP", 
    nom: "Prof. KAPEMBO Michel", 
    fonction: "Assistant Principal", 
    description: "Assistant Principal du SGR",
    initiales: "KM"
  },
  { 
    id: "CHARGE_PUBLICATIONS", 
    nom: "Chargé des Publications", 
    fonction: "Publications et Recherche", 
    description: "Publications et recherche scientifique",
    initiales: "CP"
  },
  { 
    id: "CHARGE_ANTIPLAGIAT", 
    nom: "Chargé Anti-plagiat", 
    fonction: "Check Anti-plagiat", 
    description: "Vérification anti-plagiat des travaux",
    initiales: "CA"
  },
  { 
    id: "CHARGE_OIPR", 
    nom: "Chargé de l'OIPR", 
    fonction: "OIPR", 
    description: "Outil d'Inventaire et de Planification de la Recherche",
    initiales: "CO"
  },
];

export default function AppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [targetRole, setTargetRole] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [requestedDate, setRequestedDate] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/student/appointments");
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

    if (session?.user) {
      fetchAppointments();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/student/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          subject,
          message,
          requestedDate,
        }),
      });

      if (res.ok) {
        const newAppointment = await res.json();
        setAppointments([newAppointment, ...appointments]);
        setShowForm(false);
        setTargetRole("");
        setSubject("");
        setMessage("");
        setRequestedDate("");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setSubmitting(false);
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

  const getDestinataire = (value: string) => {
    return destinataires.find(d => d.id === value);
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes rendez-vous</h1>
            <p className="text-gray-700 mt-1">
              Demandez un rendez-vous avec l&apos;administration
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau rendez-vous
          </Button>
        </div>

        {/* Tableau des destinataires */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Responsables disponibles pour rendez-vous
            </CardTitle>
            <CardDescription>
              Sélectionnez l&apos;un de ces responsables lors de votre demande de rendez-vous
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {destinataires.map((dest) => (
                <div 
                  key={dest.id} 
                  className="bg-white border-2 border-blue-100 rounded-xl p-4 text-center hover:border-blue-300 hover:shadow-md transition-all"
                >
                  {/* Avatar avec initiales */}
                  <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-3 shadow-lg">
                    <span className="text-2xl font-bold text-white">{dest.initiales}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{dest.fonction}</h3>
                  <p className="text-blue-600 text-xs italic mt-1">{dest.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de demande */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Demander un rendez-vous</CardTitle>
              <CardDescription>
                Remplissez ce formulaire pour demander un rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetRole">Destinataire *</Label>
                    <Select value={targetRole} onValueChange={setTargetRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le destinataire" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinataires.map((dest) => (
                          <SelectItem key={dest.id} value={dest.id}>
                            {dest.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestedDate">Date souhaitée *</Label>
                    <Input
                      id="requestedDate"
                      type="datetime-local"
                      value={requestedDate}
                      onChange={(e) => setRequestedDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet *</Label>
                  <Input
                    id="subject"
                    placeholder="Objet du rendez-vous"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message (optionnel)</Label>
                  <Textarea
                    id="message"
                    placeholder="Détails supplémentaires..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting || !targetRole || !subject || !requestedDate}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Envoyer la demande
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Liste des rendez-vous */}
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
                <p className="text-gray-700 mb-4">
                  Vous n&apos;avez pas encore de demande de rendez-vous
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Demander un rendez-vous
                </Button>
              </CardContent>
            </Card>
          ) : (
            appointments.map((appointment) => {
              const dest = getDestinataire(appointment.targetRole);
              return (
              <Card key={appointment.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar du destinataire */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-blue-300/30">
                        <span className="text-sm font-bold text-white">{dest?.initiales || "?"}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{appointment.subject}</h3>
                        <p className="text-sm text-gray-700 font-medium">
                          {dest?.nom || appointment.targetRole}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dest?.fonction}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
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
                        </div>
                        {appointment.message && (
                          <p className="text-sm text-gray-700 mt-2">{appointment.message}</p>
                        )}
                        {appointment.adminNote && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                            <span className="font-medium">Note de l&apos;admin :</span> {appointment.adminNote}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(appointment.status)}
                      {appointment.status === "APPROVED" && appointment.approvedDate && (
                        <span className="text-xs text-green-600">
                          Confirmé pour le {formatDate(appointment.approvedDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })
          )}
        </div>

        {/* Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Information</p>
                <p>
                  Les demandes de rendez-vous sont traitées dans un délai de 48h ouvrables.
                  Vous recevrez une notification par email une fois votre demande traitée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

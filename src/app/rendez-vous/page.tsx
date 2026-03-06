"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  Loader2,
  CheckCircle,
  Users,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Send,
  AlertCircle
} from "lucide-react";

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

export default function PublicAppointmentPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [requestedDate, setRequestedDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          guestEmail,
          guestPhone,
          targetRole,
          subject,
          message,
          requestedDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setError("");
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setTargetRole("");
    setSubject("");
    setMessage("");
    setRequestedDate("");
  };

  const isFormValid = guestName && guestEmail && targetRole && subject && requestedDate;

  // Écran de succès
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-lg mx-auto px-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-3">
                Demande envoyée !
              </h2>
              <p className="text-green-800 mb-2">
                Votre demande de rendez-vous a été enregistrée avec succès.
              </p>
              <p className="text-green-700 text-sm mb-8">
                L&apos;administration traitera votre demande dans un délai de 48h ouvrables.
                Vous serez contacté(e) à l&apos;adresse <strong>{guestEmail}</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={resetForm} variant="outline">
                  Nouvelle demande
                </Button>
                <Link href="/">
                  <Button>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à l&apos;accueil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prendre un rendez-vous
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Demandez un rendez-vous avec les responsables du Secrétariat Général à la Recherche
            de l&apos;Université de Kinshasa — aucune inscription requise.
          </p>
        </div>

        {/* Tableau des destinataires */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Responsables disponibles
            </CardTitle>
            <CardDescription>
              Sélectionnez l&apos;un de ces responsables lors de votre demande
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {destinataires.map((dest) => (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => setTargetRole(dest.id)}
                  className={`rounded-xl p-4 text-center transition-all cursor-pointer border-2 ${
                    targetRole === dest.id
                      ? "bg-blue-50 border-blue-500 ring-2 ring-blue-300 ring-offset-1"
                      : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-md ${
                    targetRole === dest.id 
                      ? "bg-gradient-to-br from-blue-600 to-blue-800" 
                      : "bg-gradient-to-br from-blue-500 to-blue-700"
                  }`}>
                    <span className="text-lg font-bold text-white">{dest.initiales}</span>
                  </div>
                  <h3 className={`font-semibold text-xs ${targetRole === dest.id ? 'text-blue-800' : 'text-gray-900'}`}>{dest.fonction}</h3>
                  <p className="text-blue-600 text-[10px] italic mt-1 leading-tight">{dest.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Formulaire de demande
            </CardTitle>
            <CardDescription>
              Remplissez vos informations et les détails du rendez-vous souhaité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations personnelles */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Vos informations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName">Nom complet *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="guestName"
                        placeholder="Ex: Jean KABONGO"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestEmail">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="guestEmail"
                        type="email"
                        placeholder="votre@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestPhone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="guestPhone"
                        type="tel"
                        placeholder="+243 ..."
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails du rendez-vous */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Détails du rendez-vous
                </h3>
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
                            {dest.nom} ({dest.fonction})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestedDate">Date et heure souhaitées *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="requestedDate"
                        type="datetime-local"
                        value={requestedDate}
                        onChange={(e) => setRequestedDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="subject">Sujet / Motif du rendez-vous *</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Demande d'informations sur l'inscription en DEA"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="message">Message complémentaire (optionnel)</Label>
                  <Textarea
                    id="message"
                    placeholder="Précisez votre demande si nécessaire..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={submitting || !isFormValid}
                  className="flex-1 sm:flex-none"
                  size="lg"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Envoyer la demande
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline" size="lg">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informations importantes</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Les demandes sont traitées dans un délai de 48h ouvrables.</li>
                  <li>Vous serez contacté(e) par email pour la confirmation.</li>
                  <li>Si vous avez un compte étudiant, <Link href="/login" className="underline font-medium hover:text-blue-900">connectez-vous</Link> pour gérer vos rendez-vous depuis votre tableau de bord.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

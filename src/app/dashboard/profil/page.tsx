"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FACULTIES, STUDY_LEVELS } from "@/lib/constants";
import { Loader2, Save, CheckCircle, KeyRound, ShieldQuestion, Eye, EyeOff, AlertCircle } from "lucide-react";

const SECRET_QUESTIONS = [
  "Quel est le nom de votre premier animal de compagnie ?",
  "Quel est le nom de jeune fille de votre mère ?",
  "Dans quelle ville êtes-vous né(e) ?",
  "Quel est le prénom de votre meilleur ami d'enfance ?",
  "Quel était le nom de votre école primaire ?",
  "Quel est votre plat préféré ?",
  "Quel est le prénom de votre grand-père paternel ?",
  "Quel était votre surnom d'enfance ?",
];

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  nationality: string;
  gender: string | null;
  phone: string | null;
  address: string | null;
  faculty: string | null;
  department: string | null;
  studyLevel: "LICENCE" | "MASTER" | "DOCTORAT";
  specialization: string | null;
  thesisTitle: string | null;
  supervisor: string | null;
  coSupervisor: string | null;
  committeeMembers: string | null;
  user: {
    email: string;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Secret question state
  const [hasSecretQuestion, setHasSecretQuestion] = useState(false);
  const [currentSecretQuestion, setCurrentSecretQuestion] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [currentPasswordForSecret, setCurrentPasswordForSecret] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [savingSecret, setSavingSecret] = useState(false);
  const [secretMessage, setSecretMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    nationality: string;
    gender: string;
    phone: string;
    address: string;
    faculty: string;
    department: string;
    studyLevel: string;
    specialization: string;
    thesisTitle: string;
    supervisor: string;
    coSupervisor: string;
    committeeMembers: string;
  }>({
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      placeOfBirth: "",
      nationality: "Congolaise",
      gender: "",
      phone: "",
      address: "",
      faculty: "",
      department: "",
      studyLevel: "LICENCE" as const,
      specialization: "",
      thesisTitle: "",
      supervisor: "",
      coSupervisor: "",
      committeeMembers: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch secret question status
  useEffect(() => {
    const fetchSecretQuestion = async () => {
      try {
        const res = await fetch("/api/auth/secret-question");
        if (res.ok) {
          const data = await res.json();
          setHasSecretQuestion(data.hasSecretQuestion);
          setCurrentSecretQuestion(data.secretQuestion);
          if (data.secretQuestion) {
            setSelectedQuestion(data.secretQuestion);
          }
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    };

    if (session?.user) {
      fetchSecretQuestion();
    }
  }, [session]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/student/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          // Pré-remplir le formulaire
          reset({
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth?.split("T")[0] || "",
            placeOfBirth: data.placeOfBirth || "",
            nationality: data.nationality || "Congolaise",
            gender: data.gender || "",
            phone: data.phone || "",
            address: data.address || "",
            faculty: data.faculty || "",
            department: data.department || "",
            studyLevel: data.studyLevel,
            specialization: data.specialization || "",
            thesisTitle: data.thesisTitle || "",
            supervisor: data.supervisor || "",
            coSupervisor: data.coSupervisor || "",
            committeeMembers: data.committeeMembers || "",
          });
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session, reset]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecretQuestion = async () => {
    setSecretMessage(null);

    if (!selectedQuestion || !secretAnswer) {
      setSecretMessage({ type: "error", text: "Veuillez sélectionner une question et entrer une réponse" });
      return;
    }

    if (secretAnswer.length < 2) {
      setSecretMessage({ type: "error", text: "La réponse doit contenir au moins 2 caractères" });
      return;
    }

    if (hasSecretQuestion && !currentPasswordForSecret) {
      setSecretMessage({ type: "error", text: "Le mot de passe actuel est requis pour modifier la question" });
      return;
    }

    setSavingSecret(true);
    try {
      const res = await fetch("/api/auth/secret-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretQuestion: selectedQuestion,
          secretAnswer: secretAnswer,
          currentPassword: currentPasswordForSecret || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSecretMessage({ type: "success", text: "Question secrète enregistrée avec succès" });
        setHasSecretQuestion(true);
        setCurrentSecretQuestion(selectedQuestion);
        setSecretAnswer("");
        setCurrentPasswordForSecret("");
        setTimeout(() => setSecretMessage(null), 5000);
      } else {
        setSecretMessage({ type: "error", text: data.error || "Erreur lors de l'enregistrement" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setSecretMessage({ type: "error", text: "Erreur serveur" });
    } finally {
      setSavingSecret(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ type: "error", text: "Le mot de passe actuel est requis" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Mot de passe modifié avec succès" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordMessage(null), 5000);
      } else {
        setPasswordMessage({ type: "error", text: data.error || "Erreur lors du changement" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setPasswordMessage({ type: "error", text: "Erreur serveur" });
    } finally {
      setChangingPassword(false);
    }
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-900 mt-1">
            Gérez vos informations personnelles et académiques
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Informations personnelles */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Vos informations d&apos;identité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input id="firstName" {...register("firstName")} />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input id="lastName" {...register("lastName")} />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date de naissance</Label>
                  <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth">Lieu de naissance</Label>
                  <Input id="placeOfBirth" {...register("placeOfBirth")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationalité</Label>
                  <Input id="nationality" {...register("nationality")} />
                </div>
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select
                    onValueChange={(value) => setValue("gender", value)}
                    defaultValue={profile?.gender || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" type="tel" {...register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.user.email} disabled className="bg-gray-100" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea id="address" {...register("address")} rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Informations académiques */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informations académiques</CardTitle>
              <CardDescription>Vos informations d&apos;études</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Niveau d&apos;études *</Label>
                  <Select
                    onValueChange={(value) => setValue("studyLevel", value)}
                    defaultValue={profile?.studyLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Faculté</Label>
                  <Select
                    onValueChange={(value) => setValue("faculty", value)}
                    defaultValue={profile?.faculty || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACULTIES.map((faculty) => (
                        <SelectItem key={faculty.code} value={faculty.code}>
                          {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Département</Label>
                  <Input id="department" {...register("department")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Spécialisation</Label>
                  <Input id="specialization" {...register("specialization")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thesisTitle">Titre de la thèse/mémoire</Label>
                <Textarea id="thesisTitle" {...register("thesisTitle")} rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supervisor">Directeur de thèse</Label>
                  <Input id="supervisor" {...register("supervisor")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coSupervisor">Co-directeur (optionnel)</Label>
                  <Input id="coSupervisor" {...register("coSupervisor")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="committeeMembers">Membres du comité d&apos;encadrement</Label>
                <Textarea id="committeeMembers" {...register("committeeMembers")} rows={3} placeholder="Noms des membres du comité d'encadrement (un par ligne)" />
              </div>
            </CardContent>
          </Card>

          {/* Bouton de sauvegarde */}
          <div className="flex items-center gap-4 mb-8">
            <Button type="submit" disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
            {saved && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Modifications enregistrées</span>
              </div>
            )}
          </div>
        </form>

        {/* Question secrète pour récupération de mot de passe */}
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldQuestion className="h-5 w-5 text-amber-600" />
              Question secrète de récupération
            </CardTitle>
            <CardDescription>
              Configurez une question secrète pour récupérer votre mot de passe en cas d&apos;oubli
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasSecretQuestion && (
              <div className="p-3 bg-green-100 border border-green-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Question secrète configurée</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Question actuelle : &quot;{currentSecretQuestion}&quot;
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Sélectionnez une question secrète</Label>
              <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisissez une question..." />
                </SelectTrigger>
                <SelectContent>
                  {SECRET_QUESTIONS.map((q, i) => (
                    <SelectItem key={i} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretAnswer">Votre réponse secrète</Label>
              <div className="relative">
                <Input
                  id="secretAnswer"
                  type={showAnswer ? "text" : "password"}
                  value={secretAnswer}
                  onChange={(e) => setSecretAnswer(e.target.value)}
                  placeholder="Entrez votre réponse..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                La réponse est insensible à la casse (majuscules/minuscules)
              </p>
            </div>

            {hasSecretQuestion && (
              <div className="space-y-2">
                <Label htmlFor="currentPasswordForSecret">
                  Mot de passe actuel <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currentPasswordForSecret"
                  type="password"
                  value={currentPasswordForSecret}
                  onChange={(e) => setCurrentPasswordForSecret(e.target.value)}
                  placeholder="Requis pour modifier la question"
                />
              </div>
            )}

            {secretMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                secretMessage.type === "success" 
                  ? "bg-green-100 text-green-800 border border-green-200" 
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}>
                {secretMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{secretMessage.text}</span>
              </div>
            )}

            <Button 
              type="button" 
              onClick={handleSaveSecretQuestion} 
              disabled={savingSecret}
              variant="outline"
              className="border-amber-300 hover:bg-amber-100"
            >
              {savingSecret ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {hasSecretQuestion ? "Modifier la question secrète" : "Enregistrer la question secrète"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Changement de mot de passe */}
        <Card className="mb-6 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Changer mon mot de passe
            </CardTitle>
            <CardDescription>
              Modifiez votre mot de passe de connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPwd ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                type={showNewPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
              />
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                passwordMessage.type === "success" 
                  ? "bg-green-100 text-green-800 border border-green-200" 
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}>
                {passwordMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{passwordMessage.text}</span>
              </div>
            )}

            <Button 
              type="button" 
              onClick={handleChangePassword} 
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Changer le mot de passe
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

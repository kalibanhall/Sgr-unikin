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
import { Loader2, Save, CheckCircle } from "lucide-react";

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
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
            </CardContent>
          </Card>

          {/* Bouton de sauvegarde */}
          <div className="flex items-center gap-4">
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
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { FACULTIES, STUDY_LEVELS } from "@/lib/constants";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle, ShieldAlert, FileCheck } from "lucide-react";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmittedDossier, setHasSubmittedDossier] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Vérifier si l'utilisateur est admin ou a déjà soumis un dossier
  useEffect(() => {
    const checkUserStatus = async () => {
      if (status === "loading") return;
      
      // Si l'utilisateur est connecté
      if (session?.user) {
        // Rediriger les admins
        if (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") {
          setCheckingStatus(false);
          return;
        }

        // Vérifier si l'utilisateur a déjà soumis un dossier
        try {
          const res = await fetch("/api/student/profile");
          if (res.ok) {
            const profile = await res.json();
            if (profile.dossierStatus === "SUBMITTED" || profile.dossierStatus === "UNDER_REVIEW" || profile.dossierStatus === "APPROVED") {
              setHasSubmittedDossier(true);
            }
          }
        } catch (error) {
          console.error("Erreur vérification statut:", error);
        }
      }
      setCheckingStatus(false);
    };

    checkUserStatus();
  }, [session, status]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      studyLevel: "DOCTORAT",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Une erreur est survenue");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch {
      setError("Une erreur est survenue lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 py-12 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription réussie !</h2>
            <p className="text-gray-900 mb-4">
              Votre compte a été créé avec succès. Un email de confirmation vous a été envoyé.
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Écran de chargement
  if (status === "loading" || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Bloquer les administrateurs
  if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 py-12 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <ShieldAlert className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
            <p className="text-gray-600 mb-6">
              Les comptes administrateurs ne peuvent pas s&apos;inscrire en tant qu&apos;étudiant.
              Veuillez utiliser le tableau de bord administrateur.
            </p>
            <Link href="/admin">
              <Button className="w-full">Accéder au tableau de bord admin</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bloquer les utilisateurs ayant déjà soumis un dossier
  if (hasSubmittedDossier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 py-12 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="bg-amber-100 p-4 rounded-full">
                <FileCheck className="h-10 w-10 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dossier déjà soumis</h2>
            <p className="text-gray-600 mb-6">
              Vous avez déjà soumis un dossier d&apos;inscription. 
              Vous ne pouvez pas vous inscrire une deuxième fois.
              Consultez l&apos;état de votre dossier depuis votre tableau de bord.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Accéder à mon tableau de bord</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo-unikin.png" alt="Logo UNIKIN" width={80} height={80} className="h-20 w-20" />
          </div>
          <CardTitle className="text-2xl">Inscription</CardTitle>
          <CardDescription>
            Créez votre compte pour commencer votre inscription au troisième cycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    placeholder="Votre prénom"
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    placeholder="Votre nom"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+243 XXX XXX XXX"
                  {...register("phone")}
                />
              </div>
            </div>

            {/* Informations de compte */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Informations de compte</h3>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@unikin.ac.cd"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Informations académiques */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Informations académiques</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Niveau d&apos;études *</Label>
                  <Select
                    value={watch("studyLevel")}
                    onValueChange={(value) => setValue("studyLevel", value as "LICENCE" | "MASTER" | "DOCTORAT")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.studyLevel && (
                    <p className="text-sm text-red-500">{errors.studyLevel.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Faculté *</Label>
                  <Select onValueChange={(value) => setValue("faculty", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez la faculté" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACULTIES.map((faculty) => (
                        <SelectItem key={faculty.code} value={faculty.code}>
                          {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.faculty && (
                    <p className="text-sm text-red-500">{errors.faculty.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Département (optionnel)</Label>
                <Input
                  id="department"
                  placeholder="Votre département"
                  {...register("department")}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-900">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Se connecter
            </Link>
          </div>
          <BackButton variant="ghost" fallbackUrl="/" showIcon={false} className="text-sm text-gray-700 hover:text-gray-900 font-medium">
            ← Retour à l&apos;accueil
          </BackButton>
        </CardFooter>
      </Card>
    </div>
  );
}

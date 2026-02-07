"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { FACULTIES, REGISTRATION_TYPES, MASTER_SUSPENSION_ALERT } from "@/lib/constants";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle, ShieldAlert, FileCheck, ArrowLeft, Info } from "lucide-react";

function RegisterContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmittedDossier, setHasSubmittedDossier] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Type d'inscription sélectionné
  const typeFromUrl = searchParams.get("type");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Mapper les types d'URL aux types internes
  useEffect(() => {
    if (typeFromUrl) {
      const typeMapping: Record<string, string> = {
        "these": "INSCRIPTION_THESE",
        "soutenance-these": "SOUTENANCE_THESE",
        "master": "INSCRIPTION_MASTER",
        "soutenance-master": "SOUTENANCE_MASTER",
      };
      const mappedType = typeMapping[typeFromUrl];
      if (mappedType) {
        // Vérifier si c'est le type Master inscription (suspendu)
        const regType = REGISTRATION_TYPES.find(t => t.value === mappedType);
        if (regType && !regType.suspended) {
          setSelectedType(mappedType);
        } else if (regType?.suspended) {
          // Garder null pour afficher l'alerte de suspension
          setSelectedType(null);
        }
      }
    }
  }, [typeFromUrl]);

  // Vérifier si l'utilisateur est admin ou a déjà soumis un dossier
  useEffect(() => {
    const checkUserStatus = async () => {
      if (status === "loading") return;
      
      if (session?.user) {
        if (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") {
          setCheckingStatus(false);
          return;
        }

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

  // Trouver le type d'inscription sélectionné
  const currentRegType = REGISTRATION_TYPES.find(t => t.value === selectedType);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      studyLevel: (currentRegType?.studyLevel as "MASTER" | "DOCTORAT") || "DOCTORAT",
    },
  });

  // Mettre à jour le niveau d'études quand le type change
  useEffect(() => {
    if (currentRegType) {
      setValue("studyLevel", currentRegType.studyLevel as "MASTER" | "DOCTORAT");
    }
  }, [currentRegType, setValue]);

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          registrationType: selectedType, // Ajouter le type d'inscription
        }),
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

  // Afficher l'alerte si inscription Master est demandée (suspendue)
  if (typeFromUrl === "master") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 py-12 px-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="bg-amber-100 p-4 rounded-full">
                <AlertCircle className="h-10 w-10 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">{MASTER_SUSPENSION_ALERT.title}</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                {MASTER_SUSPENSION_ALERT.message}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à l&apos;accueil
                </Button>
              </Link>
              <Link href="/register?type=these">
                <Button className="w-full sm:w-auto">
                  S&apos;inscrire en Doctorat
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ÉTAPE 1 : Sélection du type d'inscription si pas encore choisi
  if (!selectedType) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Image src="/logo-unikin.png" alt="Logo UNIKIN" width={80} height={80} className="h-20 w-20" />
              </div>
              <CardTitle className="text-2xl">Créer un compte</CardTitle>
              <CardDescription className="text-base">
                Choisissez le type de demande pour lequel vous souhaitez vous inscrire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REGISTRATION_TYPES.map((regType) => (
                  <button
                    key={regType.value}
                    onClick={() => {
                      if (regType.suspended) {
                        router.push("/register?type=master");
                      } else {
                        setSelectedType(regType.value);
                      }
                    }}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg ${
                      regType.suspended 
                        ? "border-gray-200 bg-gray-50 opacity-60" 
                        : regType.color === "blue" 
                          ? "border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                          : regType.color === "emerald"
                            ? "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
                            : regType.color === "violet"
                              ? "border-violet-200 hover:border-violet-400 hover:bg-violet-50"
                              : "border-amber-200 hover:border-amber-400 hover:bg-amber-50"
                    }`}
                  >
                    {regType.suspended && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Suspendu
                      </span>
                    )}
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{regType.icon}</span>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg mb-1 ${regType.suspended ? "text-gray-500" : "text-gray-900"}`}>
                          {regType.shortLabel}
                        </h3>
                        <p className={`text-sm ${regType.suspended ? "text-gray-400" : "text-gray-600"}`}>
                          {regType.description}
                        </p>
                        <span className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded ${
                          regType.studyLevel === "DOCTORAT" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {regType.studyLevel === "DOCTORAT" ? "Niveau Doctorat" : "Niveau Master"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Important :</strong> Choisissez le type correspondant à votre demande. 
                    L&apos;inscription concerne l&apos;entrée dans un programme, tandis que la soutenance 
                    concerne la finalisation de votre parcours.
                  </div>
                </div>
              </div>
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
      </div>
    );
  }

  // ÉTAPE 2 : Formulaire d'inscription
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo-unikin.png" alt="Logo UNIKIN" width={80} height={80} className="h-20 w-20" />
          </div>
          <CardTitle className="text-2xl">Inscription</CardTitle>
          <CardDescription>
            {currentRegType?.label}
          </CardDescription>
          {/* Badge du type sélectionné */}
          <div className="flex justify-center mt-3">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              currentRegType?.color === "blue" 
                ? "bg-blue-100 text-blue-700"
                : currentRegType?.color === "emerald"
                  ? "bg-emerald-100 text-emerald-700"
                  : currentRegType?.color === "amber"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-violet-100 text-violet-700"
            }`}>
              <span>{currentRegType?.icon}</span>
              {currentRegType?.shortLabel}
            </span>
          </div>
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
              
              {/* Type de demande (lecture seule) */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-600">Type de demande</Label>
                    <p className="font-medium text-gray-900 mt-1">{currentRegType?.label}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedType(null)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Modifier
                  </Button>
                </div>
                {/* Champ caché pour le niveau d'études */}
                <input type="hidden" {...register("studyLevel")} value={currentRegType?.studyLevel} />
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

// Export avec Suspense pour useSearchParams
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}

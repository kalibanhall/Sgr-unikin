"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSchema, LoginInput } from "@/lib/validations";
import Image from "next/image";
import { Loader2, AlertCircle, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const watchedEmail = watch("email");

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail || watchedEmail }),
      });
      if (response.ok) {
        setResendSuccess(true);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setResendingEmail(false);
    }
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    setEmailNotVerified(false);
    setResendSuccess(false);
    setCurrentEmail(data.email);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("EMAIL_NOT_VERIFIED")) {
          setEmailNotVerified(true);
        } else {
          setError("Email ou mot de passe incorrect");
        }
      } else {
        // Récupérer le rôle utilisateur pour rediriger correctement
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        
        if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo-unikin.png" alt="Logo UNIKIN" width={80} height={80} className="h-20 w-20" />
          </div>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Accédez à votre espace SGR-UNIKIN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {emailNotVerified && !resendSuccess && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="text-sm font-medium">Email non vérifié</span>
                </div>
                <p className="text-sm mb-3">
                  Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte de réception.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="text-sm text-orange-800 hover:text-orange-900 underline font-medium disabled:opacity-50"
                >
                  {resendingEmail ? "Envoi en cours..." : "Renvoyer l'email de vérification"}
                </button>
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <span className="text-sm">Un nouveau lien de vérification a été envoyé à votre email.</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="text-right">
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-600 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-900">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              S&apos;inscrire
            </Link>
          </div>
          <Link href="/" className="text-sm text-gray-700 hover:text-gray-900 font-medium">
            ← Retour à l&apos;accueil
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

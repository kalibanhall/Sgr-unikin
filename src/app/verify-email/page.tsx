"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";

type VerificationStatus = "loading" | "success" | "already-verified" | "error" | "expired";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          if (data.alreadyVerified) {
            setStatus("already-verified");
            setMessage(data.message);
          } else {
            setStatus("success");
            setMessage(data.message);
          }
        } else {
          if (data.error?.includes("expiré")) {
            setStatus("expired");
          } else {
            setStatus("error");
          }
          setMessage(data.error);
        }
      } catch (error) {
        console.error("Erreur:", error);
        setStatus("error");
        setMessage("Une erreur est survenue lors de la vérification");
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setResendSuccess(true);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/unikin-logo.png"
              alt="UNIKIN"
              width={80}
              height={80}
              className="mx-auto"
            />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Vérification de l&apos;email
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {status === "loading" && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
              <p className="mt-4 text-gray-600">Vérification en cours...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Email vérifié avec succès !
              </h2>
              <p className="mt-2 text-gray-600">
                Votre compte a été activé. Vous pouvez maintenant vous connecter et accéder à votre espace étudiant.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {status === "already-verified" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Email déjà vérifié
              </h2>
              <p className="mt-2 text-gray-600">
                Votre email a déjà été vérifié. Vous pouvez vous connecter à votre compte.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {status === "expired" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-12 h-12 text-orange-600" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Lien expiré
              </h2>
              <p className="mt-2 text-gray-600">
                Le lien de vérification a expiré. Entrez votre email pour recevoir un nouveau lien.
              </p>
              
              {!resendSuccess ? (
                <div className="mt-6 space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleResendEmail}
                    disabled={!email || resending}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Renvoyer le lien
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-700">
                    Un nouveau lien de vérification a été envoyé à votre email.
                  </p>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Erreur de vérification
              </h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Créer un nouveau compte
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Besoin d&apos;aide ?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contactez-nous
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

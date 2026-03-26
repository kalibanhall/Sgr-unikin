'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle, Clock, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  // Écran de confirmation après soumission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Demande envoyée !
            </h1>
            <p className="text-gray-600 mb-6">
              Votre demande de réinitialisation de mot de passe a été transmise à l&apos;administrateur du SGR.
            </p>

            {/* Steps explanation */}
            <div className="text-left bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Prochaines étapes
              </h3>
              <ol className="space-y-3 text-sm text-blue-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">1</span>
                  <span>L&apos;administrateur examinera votre demande</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Une fois approuvée, un <strong>lien de réinitialisation</strong> sera généré</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">3</span>
                  <span>L&apos;administrateur vous transmettra ce lien (par email ou en personne)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">4</span>
                  <span>Utilisez ce lien pour définir un nouveau mot de passe</span>
                </li>
              </ol>
            </div>

            <p className="text-xs text-gray-500 mb-6">
              Si vous ne recevez pas de réponse, contactez directement le Secrétariat Général à la Recherche.
            </p>

            <button
              onClick={() => router.push('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </button>
          </div>

          <p className="text-center text-blue-300 text-sm mt-8">
            © 2025 Université de Kinshasa - SGR
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <KeyRound className="w-10 h-10 text-blue-300" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-blue-200">
            Soumettez une demande de réinitialisation à l&apos;administrateur
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* How it works */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Comment ça marche ?</strong> Entrez votre email, un administrateur examinera votre demande 
              et vous transmettra un lien sécurisé pour réinitialiser votre mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse email de votre compte
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="votre.email@example.com"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Soumettre la demande
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300 text-sm mt-8">
          © 2025 Université de Kinshasa - SGR
        </p>
      </div>
    </div>
  );
}

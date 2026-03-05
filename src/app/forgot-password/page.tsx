'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff, ShieldCheck, Smartphone } from 'lucide-react';

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  
  // Step 1: Email
  const [email, setEmail] = useState('');
  
  // OTP backend data
  const [userId, setUserId] = useState('');
  const [directOtpCode, setDirectOtpCode] = useState<string | null>(null);
  
  // Step 2: OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Step 3: Password
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Shared state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    if (currentStep !== 'otp' || canResend) return;
    
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep, canResend]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/login');
    }
  };

  // ========== STEP 1: SUBMIT EMAIL ==========
  const handleEmailSubmit = async (e: React.FormEvent) => {
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

      if (res.status === 429) {
        setError(data.error);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      if (data.success) {
        if (data.userId) {
          setUserId(data.userId);
        }
        if (data.directMode && data.otpCode) {
          setDirectOtpCode(data.otpCode);
        }
        setCurrentStep('otp');
        setResendTimer(60);
        setCanResend(false);
      } else {
        // Email not found but we still move to OTP step for security
        setCurrentStep('otp');
        setResendTimer(60);
        setCanResend(false);
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== STEP 2: OTP INPUT HANDLERS ==========
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are filled
    const complete = newDigits.every((d) => d !== '');
    if (complete) {
      verifyOtp(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);

    // Focus appropriate input
    const nextEmpty = Math.min(pasted.length, 5);
    inputRefs.current[nextEmpty]?.focus();

    // Auto-verify if all 6 digits
    if (pasted.length === 6) {
      verifyOtp(pasted);
    }
  };

  const verifyOtp = useCallback(async (code: string) => {
    if (!userId) {
      setError('Session invalide. Veuillez recommencer.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        // Clear OTP inputs on error
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      if (data.success && data.resetToken) {
        setResetToken(data.resetToken);
        setCurrentStep('password');
        setDirectOtpCode(null);
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setError('');
    setDirectOtpCode(null);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors du renvoi');
        return;
      }

      if (data.directMode && data.otpCode) {
        setDirectOtpCode(data.otpCode);
      }
      if (data.userId) {
        setUserId(data.userId);
      }

      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== STEP 3: PASSWORD RESET ==========
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la réinitialisation');
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== SUCCESS SCREEN ==========
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Mot de passe réinitialisé !
            </h1>
            <p className="text-gray-600 mb-6">
              Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Aller à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== STEP INDICATOR ==========
  const steps = [
    { key: 'email', label: 'Email', number: 1 },
    { key: 'otp', label: 'Code OTP', number: 2 },
    { key: 'password', label: 'Nouveau MDP', number: 3 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

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
            {currentStep === 'email' && 'Entrez votre adresse email pour recevoir un code'}
            {currentStep === 'otp' && 'Entrez le code de vérification à 6 chiffres'}
            {currentStep === 'password' && 'Choisissez votre nouveau mot de passe'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  index <= currentStepIndex
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-white/50'
                }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 ${
                    index < currentStepIndex ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ========== STEP 1: EMAIL ========== */}
          {currentStep === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Adresse email
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
                    <Smartphone className="w-5 h-5" />
                    Recevoir le code OTP
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========== STEP 2: OTP ========== */}
          {currentStep === 'otp' && (
            <div className="space-y-6">
              {/* Direct mode: display OTP code */}
              {directOtpCode && (
                <div className="p-4 bg-cyan-50 border-2 border-cyan-300 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-cyan-600" />
                    <span className="text-sm font-semibold text-cyan-700">
                      Mode direct — Votre code OTP
                    </span>
                  </div>
                  <p className="text-3xl font-mono font-bold text-cyan-900 tracking-[0.3em]">
                    {directOtpCode}
                  </p>
                  <p className="text-xs text-cyan-600 mt-2">
                    Ce code expire dans 10 minutes
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-600 text-center">
                Entrez le code à 6 chiffres{directOtpCode ? ' affiché ci-dessus' : ' envoyé à votre numéro'}
              </p>

              {/* 6-digit OTP inputs */}
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all focus:outline-none ${
                      digit
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                    autoFocus={index === 0}
                    disabled={isLoading}
                  />
                ))}
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Vérification...</span>
                </div>
              )}

              {/* Resend timer */}
              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm underline disabled:opacity-50"
                  >
                    Renvoyer le code
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Renvoyer le code dans{' '}
                    <span className="font-mono font-bold text-gray-700">
                      {resendTimer}s
                    </span>
                  </p>
                )}
              </div>

              {/* Back to email */}
              <button
                onClick={() => {
                  setCurrentStep('email');
                  setError('');
                  setOtpDigits(['', '', '', '', '', '']);
                  setDirectOtpCode(null);
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                ← Changer d&apos;adresse email
              </button>
            </div>
          )}

          {/* ========== STEP 3: NEW PASSWORD ========== */}
          {currentStep === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-green-700 font-medium">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Code vérifié ! Choisissez votre nouveau mot de passe.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Minimum 8 caractères"
                    required
                    minLength={8}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {newPassword && newPassword.length < 8 && (
                  <p className="text-xs text-red-500 mt-1">
                    Minimum 8 caractères ({8 - newPassword.length} restant{8 - newPassword.length > 1 ? 's' : ''})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-300 bg-red-50'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="Répétez le mot de passe"
                  required
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Réinitialisation...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    Réinitialiser le mot de passe
                  </>
                )}
              </button>
            </form>
          )}

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

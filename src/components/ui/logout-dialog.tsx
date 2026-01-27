"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Power } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutDialogProps {
  variant?: "ghost" | "outline" | "default";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function LogoutButton({ 
  variant = "ghost", 
  className = "", 
  showIcon = true,
  label = "Déconnexion"
}: LogoutDialogProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/" });
  };

  if (showConfirm) {
    return (
      <>
        <style jsx global>{`
          .logout-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
          }
          .logout-modal-content {
            background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%) !important;
            border-radius: 1rem;
            padding: 2rem;
            max-width: 28rem;
            margin: 1rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid #3b82f6;
          }
          .logout-modal-title {
            color: #ffffff !important;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
          }
          .logout-modal-text {
            color: #e2e8f0 !important;
            font-size: 1rem;
            line-height: 1.6;
          }
          .logout-modal-subtext {
            color: #93c5fd !important;
            font-size: 0.875rem;
            margin-top: 0.5rem;
          }
          .logout-btn-cancel {
            color: #1e3a5f !important;
            background-color: #ffffff !important;
            border: 2px solid #ffffff !important;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .logout-btn-cancel:hover {
            background-color: #f0f9ff !important;
          }
          .logout-btn-confirm {
            color: #1e3a5f !important;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
            border: none !important;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .logout-btn-confirm:hover {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
          }
        `}</style>
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '4rem', height: '4rem', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Power style={{ height: '2rem', width: '2rem', color: '#f59e0b' }} />
              </div>
              <h3 className="logout-modal-title">Confirmer la déconnexion</h3>
              <p className="logout-modal-text">
                Êtes-vous sûr de vouloir vous déconnecter de votre compte SGR-UNIKIN ?
              </p>
              <span className="logout-modal-subtext">Vous devrez vous reconnecter pour accéder à votre dossier.</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="logout-btn-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
              >
                Annuler
              </button>
              <button 
                className="logout-btn-confirm"
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => setShowConfirm(true)}
      className={className}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-1" />}
      {label}
    </Button>
  );
}

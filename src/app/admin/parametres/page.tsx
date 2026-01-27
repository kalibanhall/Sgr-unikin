"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Loader2,
  Users,
  Shield,
  Building,
  Plus,
  Trash2,
  CheckCircle
} from "lucide-react";

interface Faculty {
  id: string;
  name: string;
  code: string;
  _count: {
    departments: number;
  };
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  
  // Formulaire nouvelle faculté
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyCode, setNewFacultyCode] = useState("");
  
  // Formulaire nouvel admin
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facultiesRes, adminsRes] = await Promise.all([
          fetch("/api/admin/faculties"),
          fetch("/api/admin/users"),
        ]);
        
        if (facultiesRes.ok) {
          const data = await facultiesRes.json();
          setFaculties(data);
        }
        if (adminsRes.ok) {
          const data = await adminsRes.json();
          setAdmins(data);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") {
      fetchData();
    }
  }, [session]);

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/faculties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFacultyName, code: newFacultyCode }),
      });
      if (res.ok) {
        const faculty = await res.json();
        setFaculties([...faculties, { ...faculty, _count: { departments: 0 } }]);
        setNewFacultyName("");
        setNewFacultyCode("");
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette faculté ?")) return;
    try {
      const res = await fetch(`/api/admin/faculties/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFaculties(faculties.filter(f => f.id !== id));
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail,
          name: newAdminName,
          password: newAdminPassword,
          role: "ADMIN",
        }),
      });
      if (res.ok) {
        const admin = await res.json();
        setAdmins([...admins, admin]);
        setNewAdminEmail("");
        setNewAdminName("");
        setNewAdminPassword("");
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-gray-900">Configuration du système</p>
          </div>
          {saved && (
            <Badge className="bg-green-100 text-green-800 ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" /> Sauvegardé
            </Badge>
          )}
        </div>

        {/* Gestion des facultés */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <CardTitle>Facultés</CardTitle>
            </div>
            <CardDescription>Gérer les facultés et départements</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFaculty} className="flex gap-2 mb-4">
              <Input
                placeholder="Nom de la faculté"
                value={newFacultyName}
                onChange={(e) => setNewFacultyName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Code (ex: FSA)"
                value={newFacultyCode}
                onChange={(e) => setNewFacultyCode(e.target.value.toUpperCase())}
                className="w-32"
              />
              <Button type="submit" disabled={!newFacultyName || !newFacultyCode || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>
            
            <div className="space-y-2">
              {faculties.map((faculty) => (
                <div key={faculty.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{faculty.name}</span>
                    <span className="text-blue-700 font-semibold ml-2">({faculty.code})</span>
                    <span className="text-sm text-gray-700 ml-2">
                      • {faculty._count.departments} département(s)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFaculty(faculty.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {faculties.length === 0 && (
                <p className="text-center text-gray-900 py-4">Aucune faculté configurée</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gestion des administrateurs (Super Admin uniquement) */}
        {isSuperAdmin && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle>Administrateurs</CardTitle>
              </div>
              <CardDescription>Gérer les comptes administrateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
                <Input
                  placeholder="Email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                <Input
                  placeholder="Nom complet"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                />
                <Input
                  placeholder="Mot de passe"
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                />
                <Button type="submit" disabled={!newAdminEmail || !newAdminPassword || saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Ajouter
                </Button>
              </form>
              
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{admin.name || admin.email}</span>
                        {admin.name && <span className="text-gray-700 ml-2 text-sm">{admin.email}</span>}
                      </div>
                    </div>
                    <Badge className={admin.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                      {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations système */}
        <Card>
          <CardHeader>
            <CardTitle>Informations système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-700 font-medium">Version</Label>
                <p className="font-semibold text-gray-900">1.0.0</p>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Environnement</Label>
                <p className="font-semibold text-gray-900">{process.env.NODE_ENV || "development"}</p>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Base de données</Label>
                <p className="font-semibold text-gray-900">PostgreSQL (Supabase)</p>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Votre rôle</Label>
                <p className="font-semibold text-gray-900">{session?.user?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

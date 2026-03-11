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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Shield,
  ShieldCheck,
  Users,
  Mail,
  Calendar,
  Trash2,
  Eye,
  EyeOff,
  UserCog,
  AlertCircle,
  Pencil,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "SUPER_ADMIN";
  adminLevel: number | null;
  isAppointmentManager: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editData, setEditData] = useState({
    role: "ADMIN" as "ADMIN" | "SUPER_ADMIN",
    adminLevel: "1",
  });
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    role: "ADMIN" as "ADMIN" | "SUPER_ADMIN",
    adminLevel: "1",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des administrateurs");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = "L'adresse email est requise";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Adresse email invalide";
    }

    if (!formData.name.trim()) {
      errors.name = "Le nom est requis";
    }

    if (!formData.password) {
      errors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          role: formData.role,
          adminLevel: formData.adminLevel,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const newAdmin = await res.json();
      setAdmins((prev) => [newAdmin, ...prev]);
      setDialogOpen(false);
      resetForm();
      toast.success("Administrateur créé avec succès");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === session?.user?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte");
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cet administrateur ?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      setAdmins((prev) => prev.filter((a) => a.id !== id));
      toast.success("Administrateur supprimé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      role: "ADMIN",
      adminLevel: "1",
    });
    setFormErrors({});
    setShowPassword(false);
  };

  const openEditDialog = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditData({
      role: admin.role,
      adminLevel: admin.adminLevel?.toString() || "1",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingAdmin) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${editingAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editData.role,
          adminLevel: editData.adminLevel,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      const updated = await res.json();
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === editingAdmin.id
            ? { ...a, role: updated.role, adminLevel: updated.adminLevel }
            : a
        )
      );
      setEditDialogOpen(false);
      toast.success("Administrateur mis à jour avec succès");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAppointmentManager = async (admin: AdminUser) => {
    const newValue = !admin.isAppointmentManager;
    try {
      // Allow multiple appointment managers
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === admin.id ? { ...a, isAppointmentManager: newValue } : a
        )
      );

      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAppointmentManager: newValue }),
      });

      if (!res.ok) throw new Error("Erreur");

      toast.success(
        newValue
          ? `${admin.name} est maintenant responsable des rendez-vous`
          : `${admin.name} n'est plus responsable des rendez-vous`
      );
    } catch {
      fetchAdmins(); // Re-fetch on error
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (session?.user?.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Accès refusé</h2>
            <p className="text-slate-600">
              Seul le Super Administrateur peut accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <UserCog className="h-8 w-8 text-blue-600" />
              Gestion des Administrateurs
            </h1>
            <p className="text-slate-600 mt-1">
              Créez et gérez les comptes administrateurs de la plateforme
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Nouvel administrateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Créer un administrateur
                </DialogTitle>
                <DialogDescription>
                  Remplissez tous les champs pour créer un nouveau compte administrateur.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    placeholder="Jean Dupont"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@unikin.cd"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 caractères"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={formErrors.password ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirmer mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe <span className="text-red-500">*</span></Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Répétez le mot de passe"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={formErrors.confirmPassword ? "border-red-500" : ""}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Rôle */}
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "ADMIN" | "SUPER_ADMIN") => 
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          Administrateur
                        </div>
                      </SelectItem>
                      <SelectItem value="SUPER_ADMIN">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-purple-500" />
                          Super Administrateur
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Niveau d'administration */}
                <div className="space-y-2">
                  <Label htmlFor="adminLevel">Niveau d&apos;administration <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.adminLevel}
                    onValueChange={(value) => 
                      setFormData({ ...formData, adminLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        <span>Niveau 1 — Soumission & Réception dossier</span>
                      </SelectItem>
                      <SelectItem value="2">
                        <span>Niveau 2 — Analyse technique</span>
                      </SelectItem>
                      <SelectItem value="3">
                        <span>Niveau 3 — Décision finale</span>
                      </SelectItem>
                      <SelectItem value="4">
                        <span>Niveau 4 — Validation & Décision finale</span>
                      </SelectItem>
                      <SelectItem value="5">
                        <span>Niveau 5 — Accès complet</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Création...
                    </>
                  ) : (
                    "Créer l'administrateur"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total administrateurs</p>
                  <p className="text-2xl font-bold text-slate-900">{admins.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Super Administrateurs</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {admins.filter((a) => a.role === "SUPER_ADMIN").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Administrateurs</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {admins.filter((a) => a.role === "ADMIN").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des administrateurs</CardTitle>
            <CardDescription>
              Gérez les accès administrateurs de la plateforme SGR-UNIKIN
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Aucun administrateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            {admin.role === "SUPER_ADMIN" ? (
                              <ShieldCheck className="h-4 w-4 text-purple-600" />
                            ) : (
                              <Shield className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          {admin.name || "—"}
                          {admin.id === session?.user?.id && (
                            <Badge variant="outline" className="text-xs">Vous</Badge>
                          )}
                          {admin.isAppointmentManager && (
                            <Badge className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-200">
                              <CalendarCheck className="h-3 w-3 mr-1" />
                              RDV
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="h-4 w-4" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={admin.role === "SUPER_ADMIN" ? "default" : "secondary"}
                          className={
                            admin.role === "SUPER_ADMIN"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }
                        >
                          {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Administrateur"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admin.adminLevel ? (
                          <Badge variant="outline" className="font-mono">
                            Niveau {admin.adminLevel}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(admin.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {admin.id !== session?.user?.id && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAppointmentManager(admin)}
                              className={admin.isAppointmentManager
                                ? "text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                              }
                              title={admin.isAppointmentManager
                                ? "Retirer la responsabilité RDV"
                                : "Nommer responsable des RDV"
                              }
                            >
                              <CalendarCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(admin)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              title="Modifier le rôle"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(admin.id)}
                              disabled={deleting === admin.id}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Supprimer"
                            >
                              {deleting === admin.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-600" />
                Modifier le rôle
              </DialogTitle>
              <DialogDescription>
                {editingAdmin?.name} ({editingAdmin?.email})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={editData.role}
                  onValueChange={(value: "ADMIN" | "SUPER_ADMIN") =>
                    setEditData({ ...editData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        Administrateur
                      </div>
                    </SelectItem>
                    <SelectItem value="SUPER_ADMIN">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-purple-500" />
                        Super Administrateur
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Niveau d&apos;administration</Label>
                <Select
                  value={editData.adminLevel}
                  onValueChange={(value) =>
                    setEditData({ ...editData, adminLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Niveau 1 — Soumission & Réception</SelectItem>
                    <SelectItem value="2">Niveau 2 — Analyse technique</SelectItem>
                    <SelectItem value="3">Niveau 3 — Décision finale</SelectItem>
                    <SelectItem value="4">Niveau 4 — Validation & Décision</SelectItem>
                    <SelectItem value="5">Niveau 5 — Accès complet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Mise à jour...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

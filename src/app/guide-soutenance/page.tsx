import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText, Calendar, ClipboardCheck, Award, BookOpen, Users, GraduationCap, LogIn, Upload, Printer, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function GuideSoutenancePage() {
  const steps = [
    {
      number: 1,
      icon: LogIn,
      title: "Création du compte ou connexion",
      description: "Créez votre compte, ou connectez-vous si vous avez déjà un compte.",
      details: [
        "Si vous n'avez pas de compte, créez-en un avec vos informations personnelles",
        "Si vous avez déjà un compte (inscription), connectez-vous directement",
        "Sélectionnez le type de demande « Soutenance »",
      ],
      color: "blue",
    },
    {
      number: 2,
      icon: Upload,
      title: "Remplir les champs et téléverser les documents",
      description: "Remplissez les différents champs avec les fichiers PDF des éléments requis.",
      details: [
        "Complétez tous les champs d'informations demandés",
        "Téléversez les fichiers PDF de chaque document requis (max 10 Mo par fichier)",
        "Consultez la checklist PDF disponible pour vérifier les documents nécessaires",
        "Assurez-vous que tous les documents obligatoires sont bien fournis",
      ],
      color: "emerald",
    },
    {
      number: 3,
      icon: FileText,
      title: "Soumettre son dossier en ligne",
      description: "Soumettez votre dossier de soutenance en ligne et obtenez un certificat de soumission.",
      details: [
        "Vérifiez l'ensemble de vos informations et documents",
        "Cliquez sur « Soumettre le dossier »",
        "Réceptionnez votre certificat de soumission avec numéro de référence",
        "Conservez ce certificat précieusement",
      ],
      color: "amber",
    },
    {
      number: 4,
      icon: Printer,
      title: "Imprimer et déposer à la faculté",
      description: "Imprimez le certificat de soumission obtenu et déposez-le à la faculté avec votre dossier physique.",
      details: [
        "Imprimez le certificat de soumission obtenu en ligne",
        "Constituez votre dossier physique avec tous les originaux",
        "Déposez le certificat de soumission avec votre dossier physique à votre faculté",
        "La faculté transmettra votre dossier au Secrétariat Général à la Recherche",
      ],
      color: "purple",
    },
  ];

  const colorClasses: Record<string, { bg: string; border: string; text: string; light: string }> = {
    blue: { bg: "bg-blue-600", border: "border-blue-600", text: "text-blue-600", light: "bg-blue-50" },
    emerald: { bg: "bg-emerald-600", border: "border-emerald-600", text: "text-emerald-600", light: "bg-emerald-50" },
    amber: { bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-600", light: "bg-amber-50" },
    purple: { bg: "bg-purple-600", border: "border-purple-600", text: "text-purple-600", light: "bg-purple-50" },
  };

  const requiredDocuments = [
    { name: "Lettre de transmission du dossier par le Doyen", category: "Administratif", required: true },
    { name: "Notification ou décision rectorale d'inscription", category: "Académique", required: true },
    { name: "PV d'approbation du jury par le Conseil de Faculté", category: "Académique", required: true },
    { name: "PV de constitution du jury par le Conseil de Département", category: "Académique", required: true },
    { name: "Avis favorable du Comité d'encadrement", category: "Académique", required: true },
    { name: "Bordereaux de paiement des frais académiques", category: "Financier", required: true },
    { name: "Publications requises", category: "Académique", required: true },
    { name: "Volumes de dissertation avec synthèses", category: "Académique", required: true },
    { name: "Certificat d'analyse anti-plagiat (max 15% similitude)", category: "Académique", required: true },
    { name: "CV actualisé", category: "Personnel", required: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 mb-6">
            <Image src="/logo-unikin.png" alt="Logo UNIKIN" width={64} height={64} className="h-16 w-16" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Guide de Soutenance
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Toutes les étapes pour préparer et réussir votre soutenance de thèse ou mémoire à l&apos;Université de Kinshasa
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Timeline Steps */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 hidden md:block" />
          
          <div className="space-y-8">
            {steps.map((step) => {
              const colors = colorClasses[step.color];
              return (
                <div key={step.number} className="relative">
                  {/* Mobile number badge */}
                  <div className={`md:hidden w-12 h-12 rounded-full ${colors.bg} text-white flex items-center justify-center font-bold text-lg mb-4`}>
                    {step.number}
                  </div>
                  
                  <Card className={`md:ml-16 border-l-4 ${colors.border} hover:shadow-lg transition-shadow`}>
                    {/* Desktop number badge */}
                    <div className={`hidden md:flex absolute -left-6 top-6 w-12 h-12 rounded-full ${colors.bg} text-white items-center justify-center font-bold text-lg shadow-lg`}>
                      {step.number}
                    </div>
                    
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.light}`}>
                          <step.icon className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-slate-900">{step.title}</CardTitle>
                          <p className="text-slate-600 mt-1">{step.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className={`h-5 w-5 ${colors.text} shrink-0 mt-0.5`} />
                            <span className="text-slate-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents requis */}
        <Card className="mt-12 border-2 border-slate-200">
          <CardHeader className="bg-slate-100">
            <CardTitle className="flex items-center gap-3 text-slate-900">
              <ClipboardCheck className="h-6 w-6 text-slate-700" />
              Documents requis pour la soutenance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Document</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Catégorie</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {requiredDocuments.map((doc, index) => (
                    <tr key={index} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-800 font-medium">{doc.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {doc.required ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            Obligatoire
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Optionnel
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Note importante */}
        <Card className="mt-12 border-2 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="shrink-0">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 mb-2">NB : Information importante</h3>
                <p className="text-amber-800 leading-relaxed mb-3">
                  La faculté transmettra votre dossier physique au Secrétariat Général à la Recherche 
                  pour traitement. Le candidat est invité de suivre l&apos;évolution en ligne via le compte 
                  créé pour la soumission de son dossier en ligne.
                </p>
                <div className="flex items-center gap-2 text-amber-900 font-semibold">
                  <Clock className="h-5 w-5" />
                  <span>
                    Délai moyen pour le traitement du dossier : 5 jours ouvrables à partir de la 
                    réception du dossier physique au Secrétariat Général à la Recherche
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center bg-slate-900 text-white rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Des questions sur la soutenance ?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Notre équipe est disponible pour vous accompagner dans votre processus de soutenance
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8">
                Nous contacter
              </Button>
            </Link>
            <Link href="/rendez-vous">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8">
                Prendre rendez-vous
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

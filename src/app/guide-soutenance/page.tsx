import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText, Calendar, ClipboardCheck, Award, BookOpen, Users, GraduationCap, LogIn, Upload, Printer, AlertCircle, Clock, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CHECKLIST_PDFS } from "@/lib/constants";

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

  const checklists = [
    { ...CHECKLIST_PDFS.DOCTORAT.inscription, color: "blue" },
    { ...CHECKLIST_PDFS.DOCTORAT.soutenance, color: "emerald" },
    { ...CHECKLIST_PDFS.MASTER.soutenance, color: "amber" },
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

        {/* Checklists téléchargeables */}
        <Card className="mt-12 border-2 border-slate-200">
          <CardHeader className="bg-slate-100">
            <CardTitle className="flex items-center gap-3 text-slate-900">
              <ClipboardCheck className="h-6 w-6 text-slate-700" />
              Checklists des documents requis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-600 mb-6">
              Téléchargez la checklist correspondant à votre type de demande pour connaître la liste complète des documents requis.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {checklists.map((checklist, index) => {
                const colorMap: Record<string, { bg: string; border: string; text: string; hover: string }> = {
                  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", hover: "hover:bg-blue-100 hover:border-blue-300" },
                  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", hover: "hover:bg-emerald-100 hover:border-emerald-300" },
                  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", hover: "hover:bg-amber-100 hover:border-amber-300" },
                };
                const colors = colorMap[checklist.color];
                return (
                  <a
                    key={index}
                    href={checklist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 ${colors.bg} ${colors.border} ${colors.text} ${colors.hover} transition-all duration-200 shadow-sm hover:shadow-md`}
                  >
                    <Download className="h-8 w-8" />
                    <span className="text-sm font-semibold text-center">{checklist.label}</span>
                  </a>
                );
              })}
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText, Upload, UserCheck, Award, AlertCircle, Clock, Printer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function GuideInscriptionPage() {
  const steps = [
    {
      number: 1,
      icon: UserCheck,
      title: "Création du compte",
      description: "Créez votre compte en fournissant vos informations personnelles et académiques de base.",
      details: [
        "Renseignez votre nom, prénom et email",
        "Choisissez un mot de passe sécurisé",
        "Sélectionnez votre niveau d'études (Master, Doctorat)",
        "Indiquez votre faculté et département",
      ],
    },
    {
      number: 2,
      icon: Upload,
      title: "Téléverser les documents de la checklist",
      description: "Téléversez tous les documents requis selon la checklist disponible en PDF sur la plateforme.",
      details: [
        "Consultez la checklist des documents requis (PDF disponible en téléchargement)",
        "Préparez tous vos documents au format PDF (taille max : 10 Mo par fichier)",
        "Téléversez chaque document dans le champ correspondant",
        "Vérifiez que tous les documents obligatoires sont bien téléversés",
      ],
    },
    {
      number: 3,
      icon: FileText,
      title: "Soumettre son dossier en ligne",
      description: "Soumettez votre dossier en ligne et réceptionnez le certificat de soumission du dossier.",
      details: [
        "Vérifiez l'ensemble des informations et documents téléversés",
        "Cliquez sur « Soumettre le dossier »",
        "Réceptionnez votre certificat de soumission avec numéro de référence",
        "Conservez ce certificat précieusement (téléchargez-le ou imprimez-le)",
      ],
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
    },
  ];

  const requiredDocuments = [
    { name: "Photo d'identité", format: "JPG, PNG (max 10 Mo)", required: true },
    { name: "Diplôme ou attestation de réussite", format: "PDF (max 10 Mo)", required: true },
    { name: "Relevés de notes", format: "PDF (max 10 Mo)", required: true },
    { name: "Acte de naissance", format: "PDF (max 10 Mo)", required: true },
    { name: "Attestation d'inscription précédente", format: "PDF (max 10 Mo)", required: false },
    { name: "Curriculum Vitae", format: "PDF (max 10 Mo)", required: false },
    { name: "Lettre de motivation", format: "PDF (max 10 Mo)", required: false },
    { name: "Projet de recherche (Doctorat)", format: "PDF (max 10 Mo)", required: false },
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
            Guide d&apos;inscription au Troisième Cycle
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Suivez ces étapes pour compléter votre dossier d&apos;inscription au 3e Cycle à l&apos;Université de Kinshasa
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Steps */}
        <div className="space-y-8 mb-12">
          {steps.map((step) => (
            <Card key={step.number} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-600" />
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-xl">
                  {step.number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <step.icon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </div>
                  <p className="text-gray-900 mt-1">{step.description}</p>
                </div>
              </CardHeader>
              <CardContent className="ml-16">
                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Documents requis */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Documents requis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Document</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Format</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Obligatoire</th>
                  </tr>
                </thead>
                <tbody>
                  {requiredDocuments.map((doc, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="py-3 px-4 text-gray-900">{doc.name}</td>
                      <td className="py-3 px-4 text-gray-700">{doc.format}</td>
                      <td className="py-3 px-4">
                        {doc.required ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Obligatoire
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
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
        <Card className="mb-12 border-2 border-amber-200 bg-amber-50">
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
        <div className="text-center bg-slate-900 text-white rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Prêt à commencer ?</h2>
          <p className="text-slate-400 mb-8">
            Créez votre compte maintenant et démarrez votre processus d&apos;inscription
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8">
                Commencer l&apos;inscription
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8">
                Besoin d&apos;aide ?
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

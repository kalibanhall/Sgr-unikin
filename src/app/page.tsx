import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Users, 
  BookOpen, 
  Award, 
  Calendar,
  ArrowRight,
  CheckCircle,
  GraduationCap,
  Shield,
  Clock
} from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

export default function HomePage() {
  const features = [
    {
      icon: FileText,
      title: "Inscription en ligne",
      description: "Soumettez votre dossier d'inscription au troisième cycle entièrement en ligne",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: CheckCircle,
      title: "Suivi en temps réel",
      description: "Suivez l'état de validation de votre dossier à chaque étape",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: Calendar,
      title: "Prise de rendez-vous",
      description: "Planifiez vos rendez-vous avec les responsables du SGR",
      color: "from-violet-500 to-violet-600",
    },
    {
      icon: Award,
      title: "Soutenance de thèse",
      description: "Gérez votre processus de soutenance de thèse ou mémoire",
      color: "from-amber-500 to-amber-600",
    },
  ];

  const directions = [
    {
      title: "Direction des Recherches",
      icon: BookOpen,
      items: [
        "Division de production et publication scientifiques",
        "Division scientifique",
        "Division de Numérisation des Projets",
      ],
    },
    {
      title: "Direction de Suivi et d'Encadrement",
      icon: Users,
      items: [
        "Division du Suivi du Personnel Académique",
        "Division du Suivi et de l'Encadrement du Personnel Scientifique",
      ],
    },
    {
      title: "Direction Universitaire",
      icon: GraduationCap,
      items: [
        "Division de la Bibliothèque Centrale",
        "Division du Musée Universitaire",
      ],
    },
  ];

  const stats = [
    { value: "15+", label: "Facultés", icon: BookOpen },
    { value: "1000+", label: "Doctorants", icon: GraduationCap },
    { value: "100+", label: "Soutenances/an", icon: Award },
    { value: "24/7", label: "Accès en ligne", icon: Clock },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Design moderne avec dégradé subtil */}
      <section className="relative bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-white/10 rounded-full blur-xl" />
                <Image 
                  src="/logo-unikin.png" 
                  alt="Logo UNIKIN" 
                  width={140} 
                  height={140} 
                  className="relative h-32 w-32 drop-shadow-2xl"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              {APP_CONFIG.organization.name}
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 mb-2 font-medium">
              {APP_CONFIG.organization.university}
            </p>
            <p className="text-lg text-blue-300/80 mb-10 italic">
              {APP_CONFIG.organization.motto}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 hero-buttons">
              <a 
                href="/guide-inscription"
                className="hero-btn-white inline-flex items-center justify-center font-semibold px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Comment s&apos;inscrire
              </a>
              <a 
                href="/register"
                className="inline-flex items-center justify-center font-semibold px-8 py-4 text-lg rounded-xl border-2 border-blue-400 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer hover:scale-105 bg-blue-600"
              >
                Créer un compte
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-12 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* À propos */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              À propos de SGR-UNIKIN
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Le Secrétariat Général chargé à la Recherche est l&apos;organe du Comité de Gestion
              de l&apos;université ayant pour mission d&apos;initier, de faciliter, de superviser et de
              coordonner les activités scientifiques, l&apos;encadrement des Doctorants, les
              Publications, les missions scientifiques et l&apos;organisation des manifestations
              scientifiques.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Directions */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Directions supervisées
            </h2>
            <p className="text-slate-600">Structure organisationnelle du Secrétariat Général à la Recherche</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {directions.map((direction, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <direction.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg text-slate-900">{direction.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {direction.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-600 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à commencer votre inscription ?
          </h2>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-lg">
            Rejoignez la communauté académique de l&apos;Université de Kinshasa et poursuivez
            votre parcours vers l&apos;excellence.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <Button 
                size="lg" 
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8 py-6 text-lg rounded-xl shadow-xl"
              >
                <Users className="mr-2 h-5 w-5" />
                Créer un compte
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg" 
                className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-xl"
              >
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

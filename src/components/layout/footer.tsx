import Link from "next/link";
import Image from "next/image";
import { Facebook, Linkedin, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

export function Footer() {
  const { contact, social, organization } = APP_CONFIG;

  return (
    <footer className="bg-gray-900 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo-unikin.png" alt="Logo UNIKIN" width={48} height={48} className="h-12 w-12" />
              <h3 className="text-xl font-bold text-white">{organization.shortName}</h3>
            </div>
            <p className="text-sm mb-4 text-gray-300">
              Le Secrétariat Général chargé à la Recherche est l&apos;organe du Comité de Gestion
              de l&apos;université ayant pour mission d&apos;initier, de faciliter, de superviser et de
              coordonner les activités scientifiques.
            </p>
            <p className="text-sm font-semibold text-blue-400">
              {organization.motto}
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Liens rapides</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/guide-inscription" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">
                  Guide d&apos;inscription
                </Link>
              </li>
              <li>
                <Link href="/guide-soutenance" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">
                  Guide soutenance
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="text-sm text-gray-300">{contact.address}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="text-sm text-gray-300">{contact.phone}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="text-sm text-gray-300">{contact.email}</span>
              </li>
            </ul>

            {/* Réseaux sociaux */}
            <div className="flex space-x-4 mt-4">
              {social.facebook && (
                <a href={social.facebook} className="text-gray-300 hover:text-blue-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {social.twitter && (
                <a href={social.twitter} className="text-gray-300 hover:text-blue-400 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {social.linkedin && (
                <a href={social.linkedin} className="text-gray-300 hover:text-blue-400 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} className="text-gray-300 hover:text-blue-400 transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-300">
            © {new Date().getFullYear()} {organization.university} – Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
}

# SGR-UNIKIN - Plateforme d'inscription au 3ème cycle
## Université de Kinshasa - Secrétariat Général à la Recherche

## 🎓 Description

Plateforme complète de gestion des inscriptions au troisième cycle pour l'Université de Kinshasa (UNIKIN). Elle permet aux étudiants de soumettre leurs dossiers en ligne et aux administrateurs de gérer le processus de validation.

## 🛠️ Technologies

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Base de données**: PostgreSQL (client `pg` natif)
- **Authentication**: NextAuth.js v5 (beta)
- **PDF**: pdf-lib
- **Déploiement**: Vercel / Render / Railway

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- PostgreSQL (local ou cloud: Supabase, Neon, Railway, etc.)

## 🚀 Installation locale

### 1. Cloner le projet

```bash
git clone https://github.com/kalibanhall/Sgr-unikin.git
cd sgr-unikin
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Copiez le fichier `.env.example` en `.env` et configurez votre connexion PostgreSQL :

```bash
cp .env.example .env
```

Exemple de configuration :
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sgr_unikin"
NEXTAUTH_SECRET="votre-secret-genere-avec-openssl"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Créer la base de données PostgreSQL

Créez d'abord la base de données :
```bash
createdb sgr_unikin
```

Puis initialisez le schéma et les données :
```bash
psql -d sgr_unikin -f scripts/init-db.sql
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 🌐 Déploiement en Production

### Étape 1 : Créer une base PostgreSQL

Utilisez un service cloud comme :
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [Railway](https://railway.app)
- [Render](https://render.com)

### Étape 2 : Initialiser la base de données

Exécutez le script SQL sur votre base de données :
```bash
psql $DATABASE_URL -f scripts/init-db.sql
```

### Étape 3 : Déployer sur Vercel

1. Connectez votre dépôt GitHub à [Vercel](https://vercel.com)

2. Configurez les variables d'environnement :
   - `DATABASE_URL` : Connection string PostgreSQL
   - `NEXTAUTH_SECRET` : Générez avec `openssl rand -base64 32`
   - `NEXTAUTH_URL` : URL de votre app (ex: https://sgr-unikin.vercel.app)

3. Déployez !

## 🔑 Comptes par défaut

Après l'initialisation de la base de données, vous pouvez vous connecter avec :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | sg.recherche@unikin.ac.cd | superadmin123 |
| Admin | admin@unikin.ac.cd | admin123 |

⚠️ **Important** : Changez ces mots de passe en production !

## 📁 Structure du projet

```
sgr-unikin/
├── scripts/
│   └── init-db.sql            # Schéma PostgreSQL et données initiales
├── src/
│   ├── app/
│   │   ├── api/               # Routes API
│   │   ├── admin/             # Pages admin
│   │   ├── dashboard/         # Pages étudiant
│   │   └── ...
│   ├── components/            # Composants UI
│   ├── lib/
│   │   ├── db.ts              # Connexion PostgreSQL
│   │   ├── repositories.ts    # Opérations CRUD
│   │   └── auth.ts            # Configuration NextAuth
│   └── types/                 # Types TypeScript
├── vercel.json                # Config Vercel
└── ...
```

## 🔧 Scripts disponibles

```bash
npm run dev       # Serveur de développement
npm run build     # Build de production
npm run start     # Serveur de production
npm run lint      # Linting ESLint
```

## 📞 Contact

**Secrétariat Général à la Recherche - UNIKIN**
- Email : sg.recherche@unikin.ac.cd
- Site : https://sgr-unikin.com

## 📄 Licence

Ce projet est propriété de l'Université de Kinshasa.

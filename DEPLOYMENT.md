# 🚀 Guide de Déploiement SGR-UNIKIN

## Option 1 : Vercel + PostgreSQL externe

### Étape 1 : Créer une base PostgreSQL gratuite

Choisissez un provider PostgreSQL gratuit :

#### Option A : Neon (recommandé)
1. Créez un compte sur [neon.tech](https://neon.tech)
2. Créez un nouveau projet
3. Copiez le **Connection String** (format: `postgresql://user:pass@host/db`)

#### Option B : Supabase
1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **Settings > Database > Connection string**
4. Copiez le **URI** (pas le pooler)

#### Option C : Railway
1. Créez un compte sur [railway.app](https://railway.app)
2. New Project > Add PostgreSQL
3. Copiez le **DATABASE_URL** dans l'onglet Variables

### Étape 2 : Initialiser la base de données

Exécutez le script SQL sur votre base :

```bash
# Avec psql installé localement
psql "votre_connection_string" -f scripts/init-db.sql

# Ou via l'interface web de votre provider (copiez-collez le contenu de init-db.sql)
```

### Étape 3 : Déployer sur Vercel

1. **Connectez votre GitHub à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "New Project"
   - Importez le repo `kalibanhall/Sgr-unikin`

2. **Configurez les variables d'environnement**
   
   Dans Vercel > Settings > Environment Variables, ajoutez :

   | Variable | Valeur |
   |----------|--------|
   | `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` |
   | `NEXTAUTH_SECRET` | Générez avec `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://votre-app.vercel.app` |

3. **Déployez !**
   - Cliquez sur "Deploy"
   - Attendez que le build se termine

---

## Option 2 : Render (Tout-en-un)

Render permet d'héberger l'app ET la base de données sur la même plateforme.

### Méthode A : Déploiement automatique (Blueprint)

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **New > Blueprint**
3. Connectez votre repo GitHub `kalibanhall/Sgr-unikin`
4. Render détectera automatiquement le fichier `render.yaml`
5. Cliquez sur **Apply**

Render va créer :
- Une base PostgreSQL gratuite
- Un service web pour l'application

### Méthode B : Déploiement manuel

#### 1. Créer la base PostgreSQL
- Dashboard > New > PostgreSQL
- Name: `sgr-unikin-db`
- Plan: Free
- Créez et notez le **Internal Database URL**

#### 2. Créer le Web Service
- Dashboard > New > Web Service
- Connectez votre repo GitHub
- Configuration :
  - **Name**: `sgr-unikin`
  - **Runtime**: Node
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npm start`

#### 3. Variables d'environnement
Dans le service web, ajoutez :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | (copié depuis PostgreSQL > Connect > Internal URL) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://sgr-unikin.onrender.com` |
| `NODE_ENV` | `production` |

#### 4. Initialiser la base
- Allez dans PostgreSQL > Shell
- Collez le contenu de `scripts/init-db.sql`
- Exécutez

---

## 🔑 Comptes par défaut

Après l'initialisation de la base, vous pouvez vous connecter avec :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | sg.recherche@unikin.ac.cd | superadmin123 |
| Admin | admin@unikin.ac.cd | admin123 |

⚠️ **IMPORTANT** : Changez ces mots de passe immédiatement après le premier déploiement !

---

## 🔧 Dépannage

### Erreur "Cannot connect to database"
- Vérifiez que `DATABASE_URL` est correctement configuré
- Pour Render, utilisez l'**Internal Database URL** (pas l'External)

### Erreur "NEXTAUTH_URL mismatch"
- Assurez-vous que `NEXTAUTH_URL` correspond exactement à l'URL de votre app
- Pas de slash `/` à la fin

### Erreur de build
```bash
# Testez le build localement
npm run build
```

### Erreur 500 sur l'app
- Vérifiez les logs dans Vercel/Render
- Assurez-vous que la base de données est initialisée avec `init-db.sql`

---

## 📊 Comparaison Vercel vs Render

| Critère | Vercel | Render |
|---------|--------|--------|
| **Temps de démarrage** | Instantané (serverless) | ~30s (cold start sur free) |
| **Base de données** | Externe requise | Intégrée |
| **Free tier** | Généreux | 750h/mois |
| **SSL** | ✅ Automatique | ✅ Automatique |
| **Domaine custom** | ✅ Gratuit | ✅ Gratuit |
| **Logs** | ✅ | ✅ |

**Recommandation** : 
- **Vercel + Neon** pour de meilleures performances
- **Render** pour une solution tout-en-un plus simple

---

## 🌐 Domaine personnalisé

### Sur Vercel
1. Settings > Domains
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions

### Sur Render
1. Service > Settings > Custom Domains
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions

N'oubliez pas de mettre à jour `NEXTAUTH_URL` avec votre nouveau domaine !

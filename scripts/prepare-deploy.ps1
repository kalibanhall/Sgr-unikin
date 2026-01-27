# Script de préparation pour le déploiement sur Vercel/Supabase
# Exécutez ce script avant de déployer

Write-Host "=== Préparation du déploiement SGR-UNIKIN ===" -ForegroundColor Cyan

# 1. Sauvegarder le schéma SQLite actuel
Write-Host "`n1. Sauvegarde du schema SQLite..." -ForegroundColor Yellow
Copy-Item "prisma\schema.prisma" "prisma\schema.sqlite.backup.prisma"

# 2. Utiliser le schéma PostgreSQL
Write-Host "2. Configuration du schema PostgreSQL..." -ForegroundColor Yellow
Copy-Item "prisma\schema.postgresql.prisma" "prisma\schema.prisma"

Write-Host "`n=== Configuration terminée ===" -ForegroundColor Green
Write-Host "`nProchaines étapes:" -ForegroundColor White
Write-Host "1. Configurez vos variables d'environnement sur Vercel:" -ForegroundColor Gray
Write-Host "   - DATABASE_URL (Supabase Connection Pooler)" -ForegroundColor Gray
Write-Host "   - DIRECT_URL (Supabase Direct Connection)" -ForegroundColor Gray
Write-Host "   - NEXTAUTH_SECRET (openssl rand -base64 32)" -ForegroundColor Gray
Write-Host "   - NEXTAUTH_URL (https://votre-app.vercel.app)" -ForegroundColor Gray
Write-Host "`n2. Déployez sur Vercel" -ForegroundColor Gray
Write-Host "`n3. Après déploiement, initialisez la base avec:" -ForegroundColor Gray
Write-Host "   npx prisma db push" -ForegroundColor Gray
Write-Host "   npx tsx prisma/seed.ts" -ForegroundColor Gray

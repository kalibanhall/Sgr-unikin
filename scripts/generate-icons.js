/**
 * Script pour générer les icônes PWA à partir du logo
 * Usage: node scripts/generate-icons.js
 * 
 * Note: Ce script nécessite que vous ayez 'sharp' installé
 * npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

// Vérifier si sharp est disponible
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.log('⚠️  Le package "sharp" n\'est pas installé.');
  console.log('   Pour générer automatiquement les icônes, installez sharp:');
  console.log('   npm install sharp --save-dev');
  console.log('');
  console.log('📝 Alternative: Créez manuellement les icônes aux tailles suivantes:');
  console.log('   - 72x72, 96x96, 128x128, 144x144, 152x152, 180x180, 192x192, 384x384, 512x512');
  console.log('   Placez-les dans le dossier public/icons/');
  process.exit(0);
}

const ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const SOURCE_IMAGE = path.join(__dirname, '..', 'public', 'logo-unikin.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

async function generateIcons() {
  // Créer le dossier de sortie s'il n'existe pas
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Vérifier que l'image source existe
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('❌ Image source non trouvée:', SOURCE_IMAGE);
    process.exit(1);
  }

  console.log('🎨 Génération des icônes PWA...\n');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 30, g: 58, b: 138, alpha: 1 } // Bleu #1e3a8a
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Créé: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Erreur pour ${size}x${size}:`, error.message);
    }
  }

  // Créer aussi une icône 32x32 pour le favicon
  try {
    await sharp(SOURCE_IMAGE)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 30, g: 58, b: 138, alpha: 1 }
      })
      .png()
      .toFile(path.join(OUTPUT_DIR, 'icon-32x32.png'));
    
    console.log('✅ Créé: icon-32x32.png (favicon)');
  } catch (error) {
    console.error('❌ Erreur favicon:', error.message);
  }

  console.log('\n🎉 Génération terminée!');
  console.log(`📁 Les icônes sont dans: ${OUTPUT_DIR}`);
}

generateIcons().catch(console.error);

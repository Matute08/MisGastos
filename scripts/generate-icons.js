#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, '../public/miwalletlogo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Crear directorio de iconos si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  
  
  try {
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(inputFile)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      
      // Generado: icon-${size}x${size}.png
    }
    
    // Todos los iconos han sido generados exitosamente
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
  }
}

// Verificar si existe el archivo de entrada
if (!fs.existsSync(inputFile)) {
  console.error('❌ No se encontró miwalletlogo.png en public/');
  process.exit(1);
}

generateIcons(); 
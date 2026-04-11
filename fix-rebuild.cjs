const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'main.js');
let content = fs.readFileSync(filepath, 'utf-8');

// Add bloodSplatterTexture creation in rebuildScene
const target = '  particleSystem = new ParticleSystem(256);\n  syncBackButtonPosition();';
const replacement = '  particleSystem = new ParticleSystem(256);\n  bloodSplatterTexture = settings.bloodMode ? createBloodSplatterTexture(panel.width, panel.height) : null;\n  syncBackButtonPosition();';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log('Patched rebuildScene successfully!');
} else {
  // Try with \r\n
  const target2 = '  particleSystem = new ParticleSystem(256);\r\n  syncBackButtonPosition();';
  const replacement2 = '  particleSystem = new ParticleSystem(256);\r\n  bloodSplatterTexture = settings.bloodMode ? createBloodSplatterTexture(panel.width, panel.height) : null;\r\n  syncBackButtonPosition();';
  if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log('Patched rebuildScene successfully! (CRLF)');
  } else {
    console.error('Could not find target in rebuildScene!');
    // Debug: show what's around ParticleSystem
    const idx = content.indexOf('ParticleSystem(256)');
    if (idx >= 0) {
      const context = content.substring(idx - 10, idx + 100);
      console.log('Context around ParticleSystem:', JSON.stringify(context));
    }
  }
}

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Caminho do arquivo de config persistente
const configPath = path.join(app.getPath('userData'), 'config.json');

// Função para carregar config salva
function loadConfig() {
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);

      // Se backendUrl existir, retorna, senão usa padrão
      return {
        backendUrl: parsed.backendUrl || 'http://localhost:3000'
      };
    } catch (err) {
      console.error('❌ Erro ao ler config.json:', err);
    }
  }

  // Caso não exista, retorna um padrão
  return { backendUrl: 'http://localhost:3000' };
}

// Função para salvar config no disco
function saveConfig(newConfig) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    console.log(`✅ Configuração salva em ${configPath}`);
  } catch (err) {
    console.error('❌ Erro ao salvar config.json:', err);
  }
}

module.exports = { loadConfig, saveConfig };

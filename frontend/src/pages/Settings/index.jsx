import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import './styles.css';

function Settings() {
  const [config, setConfig] = useState({
    type: 'sqlite',
    host: '',
    port: '',
    user: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:3000/config";

  // Carregar configuração existente
  useEffect(() => {
    fetch(`${API_URL}/db`)
      .then((res) => res.json())
      .then((data) => {
        if (data.type) {
          setConfig({
            type: data.type || 'sqlite',
            host: data.host || '',
            port: data.port || '',
            user: data.user || '',
            password: data.password || '',
            name: data.name || ''
          });
        }
      })
      .catch(() => console.log("Nenhuma configuração salva ainda"));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/save-db-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setMessage(
          config.type === 'sqlite' 
            ? "✅ SQLite será usado como banco de dados padrão"
            : "✅ Configuração do banco de dados salva com sucesso!"
        );
      } else {
        setMessage("❌ Erro ao salvar configuração!");
      }
    } catch (error) {
      setMessage("❌ Erro ao conectar com o servidor");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setConfig({
      ...config,
      type: newType,
      // Reset outros campos se voltar para SQLite
      ...(newType === 'sqlite' && {
        host: '',
        port: '',
        user: '',
        password: '',
        name: ''
      })
    });
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙ Configurações do Banco de Dados</h1>
        <p>Configure seu banco de dados preferido</p>
      </div>

      <div className="settings-form">
        <div className="form-group">
          <label className="settings-label">
            Tipo de Banco de Dados:
          </label>
          <select
            className="settings-select"
            value={config.type}
            onChange={handleTypeChange}
          >
            <option value="sqlite">SQLite (Padrão)</option>
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
          </select>
        </div>

        {config.type !== 'sqlite' && (
          <>
            <div className="form-group">
              <label className="settings-label">Host:</label>
              <input
                className="settings-input"
                type="text"
                placeholder="ex: localhost"
                value={config.host}
                onChange={(e) => setConfig({...config, host: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="settings-label">Porta:</label>
              <input
                className="settings-input"
                type="text"
                placeholder="ex: 5432 para PostgreSQL"
                value={config.port}
                onChange={(e) => setConfig({...config, port: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="settings-label">Usuário:</label>
              <input
                className="settings-input"
                type="text"
                placeholder="Nome de usuário"
                value={config.user}
                onChange={(e) => setConfig({...config, user: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="settings-label">Senha:</label>
              <input
                className="settings-input"
                type="password"
                placeholder="Senha"
                value={config.password}
                onChange={(e) => setConfig({...config, password: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="settings-label">Nome do Banco:</label>
              <input
                className="settings-input"
                type="text"
                placeholder="Nome do banco de dados"
                value={config.name}
                onChange={(e) => setConfig({...config, name: e.target.value})}
              />
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          className="btn btn-save"
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar Configuração"}
        </button>

        {message && (
          <div className={`settings-message ${
            message.includes('✅') ? 'success' : 'error'
          }`}>
            {message}
          </div>
        )}

        <div className="settings-note">
          <p><strong>Observação:</strong> O servidor precisa ser reiniciado após alterar a configuração.</p>
        </div>
      </div>

      <div className="settings-footer">
        <Link to="/">
          <button className="btn btn-back">⬅ Voltar</button>
        </Link>
      </div>
    </div>
  );
}

export default Settings;
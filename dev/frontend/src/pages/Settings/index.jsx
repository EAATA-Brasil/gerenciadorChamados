import React, { useState, useEffect } from "react";
import styles from "./Settings.module.css";
import { Link } from "react-router-dom";
import { useBackend } from "../../context/BackendContext";

function Settings() {
  const { backendUrl, setBackendUrl } = useBackend();
  const [activeTab, setActiveTab] = useState("backend");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (window.electronAPI?.getNotificationPreference) {
      window.electronAPI.getNotificationPreference().then((enabled) => {
        setNotificationsEnabled(enabled);
      });
    }
  }, []);

  const handleToggleNotifications = (checked) => {
    setNotificationsEnabled(checked);
    if (window.electronAPI?.setNotificationPreference) {
      window.electronAPI.setNotificationPreference(checked);
    }
  };

  const [config, setConfig] = useState({
    type: "sqlite",
    host: "",
    port: "",
    user: "",
    password: "",
    name: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sectors, setSectors] = useState([]);
  const [newSectorName, setNewSectorName] = useState("");
  const [addingSector, setAddingSector] = useState(false);
  const [removingSector, setRemovingSector] = useState(null);
  const [sectorMessage, setSectorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Testar conexão backend
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const API_URL = `${backendUrl}config`;
  const SECTORS_API_URL = `${backendUrl}sectors`;

  const fetchSectors = async () => {
    try {
      const res = await fetch(SECTORS_API_URL);
      if (res.ok) {
        const data = await res.json();
        setSectors(data);
      } else {
        console.error("Erro ao buscar setores");
      }
    } catch (error) {
      console.error("Erro de rede ao buscar setores:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "sectors") {
      fetchSectors();
    }
  }, [activeTab, SECTORS_API_URL]);

  const handleAddSector = async () => {
    if (!newSectorName.trim()) {
      setSectorMessage("❌ O nome do setor não pode ser vazio!");
      return;
    }
    setAddingSector(true);
    setSectorMessage("");
    try {
      const res = await fetch(SECTORS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSectorName }),
      });
      if (res.ok) {
        setSectorMessage("✅ Setor adicionado com sucesso!");
        setNewSectorName("");
        fetchSectors();
      } else {
        const errorData = await res.json();
        setSectorMessage(
          `❌ Erro ao adicionar setor: ${errorData.message || res.statusText}`
        );
      }
    } catch (error) {
      setSectorMessage("❌ Erro de rede ao adicionar setor.");
      console.error(error);
    } finally {
      setAddingSector(false);
    }
  };

  const handleRemoveSector = async (id) => {
    setRemovingSector(id);
    setSectorMessage("");
    try {
      const res = await fetch(`${SECTORS_API_URL}/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSectorMessage("✅ Setor removido com sucesso!");
        fetchSectors();
      } else {
        const errorData = await res.json();
        setSectorMessage(
          `❌ Erro ao remover setor: ${errorData.message || res.statusText}`
        );
      }
    } catch (error) {
      setSectorMessage("❌ Erro de rede ao remover setor.");
      console.error(error);
    } finally {
      setRemovingSector(null);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/db`)
      .then((res) => res.json())
      .then((data) => {
        if (data.type) {
          setConfig({
            type: data.type || "sqlite",
            host: data.host || "",
            port: data.port || "",
            user: data.user || "",
            password: data.password || "",
            name: data.name || "",
          });
        }
      })
      .catch(() => console.log("Nenhuma configuração salva ainda"));
  }, [API_URL]);

  const handleSaveDB = async () => {
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
          config.type === "sqlite"
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
      ...(newType === "sqlite" && {
        host: "",
        port: "",
        user: "",
        password: "",
        name: "",
      }),
    });
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleTestConnection = async () => {
    if (!backendUrl) {
      setTestResult({
        success: false,
        message: "Informe a URL do backend para testar.",
      });
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(backendUrl, { method: "GET" });
      if (res.ok) {
        setTestResult({
          success: true,
          message: "✅ Conexão bem sucedida com o backend!",
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Resposta inesperada: ${res.status}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "❌ Erro ao conectar com o backend.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={styles["settings-container"]}>
      <div className={styles["settings-header"]}>
        <h1>⚙ Configurações</h1>
        <p>Gerencie as configurações do aplicativo</p>
      </div>

      <div className={styles["tab-header"]}>
        <button
          className={`${styles.tab} ${
            activeTab === "backend" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("backend")}
        >
          Backend
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "database" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("database")}
        >
          Banco de Dados
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "sectors" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("sectors")}
        >
          Setores
        </button>
      </div>

      {activeTab === "backend" && (
        <div className={styles["settings-form"]}>
          <div className={styles["form-group"]}>
            <label className={styles["settings-label"]} htmlFor="backend-url">
              URL do Backend:
            </label>
            <input
              id="backend-url"
              className={styles["settings-input"]}
              type="text"
              placeholder="http://localhost:3000"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
            />
          </div>
          <div className={styles["form-group"]}>
            <label className={styles["settings-label"]}>Notificações:</label>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
            />
            <span>
              {notificationsEnabled ? "Ativadas ✅" : "Desativadas ❌"}
            </span>
          </div>
          <button
            className={`${styles.btn} ${styles["btn-test-connection"]}`}
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? "Testando..." : "Testar Conexão"}
          </button>

          {testResult && (
            <div
              className={`${styles["settings-message"]} ${
                testResult.success ? styles.success : styles.error
              }`}
              role="alert"
            >
              {testResult.message}
            </div>
          )}
        </div>
      )}

      {activeTab === "database" && (
        <div className={styles["settings-form"]}>
          <div className={styles["form-group"]}>
            <label className={styles["settings-label"]} htmlFor="db-type">
              Tipo de Banco de Dados:
            </label>
            <select
              id="db-type"
              className={styles["settings-select"]}
              value={config.type}
              onChange={handleTypeChange}
            >
              <option value="sqlite">SQLite (Padrão)</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
            </select>
          </div>

          {config.type !== "sqlite" && (
            <>
              <div className={styles["form-group"]}>
                <label className={styles["settings-label"]} htmlFor="host">
                  Host:
                </label>
                <input
                  id="host"
                  className={styles["settings-input"]}
                  type="text"
                  placeholder="ex: localhost"
                  value={config.host}
                  onChange={(e) =>
                    setConfig({ ...config, host: e.target.value })
                  }
                />
              </div>

              <div className={styles["form-group"]}>
                <label className={styles["settings-label"]} htmlFor="port">
                  Porta:
                </label>
                <input
                  id="port"
                  className={styles["settings-input"]}
                  type="text"
                  placeholder="ex: 5432 para PostgreSQL"
                  value={config.port}
                  onChange={(e) =>
                    setConfig({ ...config, port: e.target.value })
                  }
                />
              </div>

              <div className={styles["form-group"]}>
                <label className={styles["settings-label"]} htmlFor="user">
                  Usuário:
                </label>
                <input
                  id="user"
                  className={styles["settings-input"]}
                  type="text"
                  placeholder="Nome de usuário"
                  value={config.user}
                  onChange={(e) =>
                    setConfig({ ...config, user: e.target.value })
                  }
                />
              </div>

              <div
                className={styles["form-group"]}
                style={{ position: "relative" }}
              >
                <label className={styles["settings-label"]}>Senha:</label>
                <input
                  className={styles["settings-input"]}
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={config.password}
                  onChange={(e) =>
                    setConfig({ ...config, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className={styles["password-toggle"]}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  tabIndex={-1}
                >
                  {showPassword ? "🐵" : "🙈"}
                </button>
              </div>

              <div className={styles["form-group"]}>
                <label className={styles["settings-label"]} htmlFor="dbname">
                  Nome do Banco:
                </label>
                <input
                  id="dbname"
                  className={styles["settings-input"]}
                  type="text"
                  placeholder="Nome do banco de dados"
                  value={config.name}
                  onChange={(e) =>
                    setConfig({ ...config, name: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <button
            className={`${styles.btn} ${styles["btn-save"]}`}
            onClick={handleSaveDB}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Salvando..." : "Salvar Configuração"}
          </button>

          {message && (
            <div
              className={`${styles["settings-message"]} ${
                message.includes("✅") ? styles.success : styles.error
              }`}
              role="alert"
            >
              {message}
            </div>
          )}

          <div className={styles["settings-note"]}>
            <p>
              <strong>Observação:</strong> O servidor precisa ser reiniciado
              após alterar a configuração.
            </p>
          </div>
        </div>
      )}

      {/* Aba Setores */}
      {activeTab === "sectors" && (
        <div className={styles["settings-form"]}>
          <h2>Gerenciar Setores</h2>
          <div className={styles["sector-add-container"]}>
            <input
              id="new-sector-name"
              className={styles["settings-input"]}
              type="text"
              placeholder="Nome do novo setor"
              value={newSectorName}
              onChange={(e) => setNewSectorName(e.target.value)}
            />
            <button
              className={`${styles.btn} ${styles["btn-add"]}`}
              onClick={handleAddSector}
              disabled={addingSector}
            >
              {addingSector ? "Adicionando..." : "Adicionar"}
            </button>
          </div>

          <h3>Setores Existentes</h3>
          {sectors.length === 0 ? (
            <p>Nenhum setor cadastrado.</p>
          ) : (
            <ul className={styles["sector-list"]}>
              {sectors.map((sector) => (
                <li key={sector.id} className={styles["sector-item"]}>
                  <span>{sector.name}</span>
                  <button
                    className={`${styles.btn} ${styles["btn-remove"]}`}
                    onClick={() => handleRemoveSector(sector.id)}
                    disabled={removingSector === sector.id}
                  >
                    {removingSector === sector.id ? (
                      "..."
                    ) : (
                      <span role="img" aria-label="lixeira">🗑️</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {sectorMessage && (
            <div
              className={`${styles["settings-message"]} ${
                sectorMessage.includes("✅") ? styles.success : styles.error
              }`}
              role="alert"
            >
              {sectorMessage}
            </div>
          )}
        </div>
      )}

      <div className={styles["settings-footer"]}>
        <Link to="/">
          <button className={`${styles.btn} ${styles["btn-back"]}`}>
            ⬅ Voltar
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Settings;
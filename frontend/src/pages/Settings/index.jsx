import React, { useState, useEffect } from "react";
import styles from "./Settings.module.css";
import { Link } from "react-router-dom";

function Settings() {
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
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = "http://localhost:3000/config";
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

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

  return (
    <div className={styles["settings-container"]}>
      <div className={styles["settings-header"]}>
        <h1>⚙ Configurações do Banco de Dados</h1>
        <p>Configure seu banco de dados preferido</p>
      </div>

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
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
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
                onChange={(e) => setConfig({ ...config, port: e.target.value })}
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
                onChange={(e) => setConfig({ ...config, user: e.target.value })}
              />
            </div>

            <div className={styles["form-group"]} style={{ position: "relative" }}>
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
              {/* Ícone do olho */}
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
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
              />
            </div>
          </>
        )}

        <button
          className={`${styles.btn} ${styles["btn-save"]}`}
          onClick={handleSave}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Salvando..." : "Salvar Configuração"}
        </button>

        {message && (
          <div
            className={`${styles["settings-message"]} ${
              message.includes("✅")
                ? styles.success
                : styles.error
            }`}
            role="alert"
          >
            {message}
          </div>
        )}

        <div className={styles["settings-note"]}>
          <p>
            <strong>Observação:</strong> O servidor precisa ser reiniciado após
            alterar a configuração.
          </p>
        </div>
      </div>

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

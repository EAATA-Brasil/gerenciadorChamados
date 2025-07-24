import React, { createContext, useContext, useState, useEffect } from "react";

const BackendContext = createContext();

export const useBackend = () => useContext(BackendContext);

export const BackendProvider = ({ children }) => {
  const [backendUrl, setBackendUrl] = useState("http://localhost:3000/");

  useEffect(() => {
    // ✅ Se estamos rodando no Electron, buscar a URL salva
    if (window.electronAPI?.getBackendUrl) {
      window.electronAPI.getBackendUrl().then((url) => {
        if (url) setBackendUrl(url);
      });

      // ✅ Ouvir mudanças do backendUrl vindas do Electron
      window.electronAPI.onBackendUrlUpdated((newUrl) => {
        setBackendUrl(newUrl);
      });
    } else {
      // Se não for Electron, carrega do localStorage
      const saved = localStorage.getItem("backendUrl");
      if (saved) setBackendUrl(saved);
    }
  }, []);

  // ✅ Sempre que mudar, salva no localStorage e avisa Electron (se existir)
  useEffect(() => {
    localStorage.setItem("backendUrl", backendUrl);

    if (window.electronAPI?.updateBackendUrl) {
      window.electronAPI.updateBackendUrl(backendUrl);
      
    }
  }, [backendUrl]);

  return (
    <BackendContext.Provider value={{ backendUrl, setBackendUrl }}>
      {children}
    </BackendContext.Provider>
  );
};

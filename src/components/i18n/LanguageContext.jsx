import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language or default to browser language
    const saved = localStorage.getItem("drift_language");
    if (saved) return saved;
    
    const browserLang = navigator.language.split("-")[0];
    return ["en", "es", "fr", "pt"].includes(browserLang) ? browserLang : "en";
  });

  useEffect(() => {
    localStorage.setItem("drift_language", language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
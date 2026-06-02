import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import {
  DEFAULT_APP_LANGUAGE,
  type AppLanguage,
} from "@contracts/settings";
import { translations, type TranslationDictionary } from "@services/settings/translations";
import { getAppSettings, setAppLanguage } from "@renderer/shared/app-settings";

type LanguageContextValue = {
  language: AppLanguage;
  direction: "ltr" | "rtl";
  copy: TranslationDictionary;
  setLanguage: (language: AppLanguage) => Promise<void>;
  isHydrated: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getDirection(language: AppLanguage) {
  return language === "ar" ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_APP_LANGUAGE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getAppSettings().then((snapshot) => {
      if (cancelled) {
        return;
      }

      startTransition(() => {
        setLanguageState(snapshot.language);
        setIsHydrated(true);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
  }, [language]);

  const value: LanguageContextValue = {
    language,
    direction: getDirection(language),
    copy: translations[language],
    isHydrated,
    async setLanguage(nextLanguage) {
      const snapshot = await setAppLanguage(nextLanguage);
      startTransition(() => {
        setLanguageState(snapshot.language);
      });
    },
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }

  return context;
}

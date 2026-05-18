import type { AppLanguage } from "@contracts/settings";

export type TranslationDictionary = {
  sidebarEyebrow: string;
  shellTitle: string;
  shellDescription: string;
  sidebarFooterLabel: string;
  sidebarFooterValue: string;
  settingsEyebrow: string;
  settingsTitle: string;
  settingsSummary: string;
  settingsCardPersistenceLabel: string;
  settingsCardPersistenceValue: string;
  settingsCardIpcLabel: string;
  settingsCardIpcValue: string;
  settingsCardLayoutLabel: string;
  settingsCardLayoutValue: string;
  settingsPanelTitle: string;
  settingsPanelCopy: string;
  languageLabel: string;
  languageHint: string;
  languageEnglish: string;
  languageArabic: string;
  persistenceStatus: string;
  persistedValueLabel: string;
  currentDirectionLabel: string;
  previewLabel: string;
  previewEnglish: string;
  previewArabic: string;
  futureLanguagesHint: string;
};

export const translations: Record<AppLanguage, TranslationDictionary> = {
  en: {
    sidebarEyebrow: "Windows-first shell",
    shellTitle: "FloirsMNH",
    shellDescription: "Windows-first reading shell with local persistence, Arabic-aware text, and room for source-driven growth.",
    sidebarFooterLabel: "Phase 1 proof",
    sidebarFooterValue: "Shell, routing, and settings persistence are live.",
    settingsEyebrow: "Persistence proof",
    settingsTitle: "Settings is now the first real persisted flow",
    settingsSummary: "Phase 1 proves the shell through a real language preference stored in the local database and read back through the approved Electron boundary.",
    settingsCardPersistenceLabel: "Persistence",
    settingsCardPersistenceValue: "SQLite",
    settingsCardIpcLabel: "IPC path",
    settingsCardIpcValue: "Preload bridge",
    settingsCardLayoutLabel: "Layout",
    settingsCardLayoutValue: "Stable shell, RTL text",
    settingsPanelTitle: "Language preference",
    settingsPanelCopy: "The shell stays layout-stable while the text system supports English now, Arabic correctly, and more languages later without redesigning the settings path.",
    languageLabel: "Application language",
    languageHint: "Switching language updates the shell copy immediately and persists across restarts.",
    languageEnglish: "English",
    languageArabic: "Arabic",
    persistenceStatus: "Persisted through SQLite + preload IPC",
    persistedValueLabel: "Saved language",
    currentDirectionLabel: "Text direction",
    previewLabel: "Preview",
    previewEnglish: "Library, settings, and future source details will use this same app-level language contract.",
    previewArabic: "المكتبة والإعدادات وصفحات العناوين المستقبلية ستعتمد على نفس عقد اللغة داخل التطبيق.",
    futureLanguagesHint: "The provider is keyed by language code so more locales can be added without changing the persistence model.",
  },
  ar: {
    sidebarEyebrow: "واجهة ويندوز الأساسية",
    shellTitle: "فلورز إم إن إتش",
    shellDescription: "واجهة قراءة محلية لويندوز مع حفظ فعلي للإعدادات ودعم نص عربي صحيح ومسار واضح لتوسعة المصادر.",
    sidebarFooterLabel: "إثبات المرحلة الأولى",
    sidebarFooterValue: "الواجهة والتنقل وحفظ الإعدادات أصبحت فعالة.",
    settingsEyebrow: "إثبات الحفظ",
    settingsTitle: "الإعدادات أصبحت أول مسار حقيقي محفوظ",
    settingsSummary: "المرحلة الأولى تثبت الواجهة عبر تفضيل لغة حقيقي يُحفظ داخل قاعدة البيانات المحلية ويُقرأ عبر حدود Electron المعتمدة.",
    settingsCardPersistenceLabel: "الحفظ",
    settingsCardPersistenceValue: "SQLite",
    settingsCardIpcLabel: "مسار IPC",
    settingsCardIpcValue: "واجهة preload",
    settingsCardLayoutLabel: "التخطيط",
    settingsCardLayoutValue: "واجهة ثابتة ونص RTL",
    settingsPanelTitle: "تفضيل اللغة",
    settingsPanelCopy: "يبقى تخطيط الواجهة ثابتًا بينما يدعم نظام النصوص الإنجليزية الآن والعربية بشكل صحيح ولغات أخرى لاحقًا دون إعادة تصميم المسار.",
    languageLabel: "لغة التطبيق",
    languageHint: "تغيير اللغة يحدّث نصوص الواجهة مباشرة ويظل محفوظًا بعد إعادة التشغيل.",
    languageEnglish: "الإنجليزية",
    languageArabic: "العربية",
    persistenceStatus: "محفوظ عبر SQLite وواجهة preload",
    persistedValueLabel: "اللغة المحفوظة",
    currentDirectionLabel: "اتجاه النص",
    previewLabel: "معاينة",
    previewEnglish: "Library, settings, and future source details will use this same app-level language contract.",
    previewArabic: "المكتبة والإعدادات وصفحات العناوين المستقبلية ستعتمد على نفس عقد اللغة داخل التطبيق.",
    futureLanguagesHint: "المزوّد يعتمد على رمز اللغة، لذلك يمكن إضافة لغات أخرى لاحقًا دون تغيير نموذج الحفظ.",
  },
};

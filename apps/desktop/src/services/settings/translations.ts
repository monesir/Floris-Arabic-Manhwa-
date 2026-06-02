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
  pluginsEyebrow: string;
  pluginsTitle: string;
  pluginsSummary: string;
  pluginsDirectoryLabel: string;
  pluginsValidationLabel: string;
  pluginsExecutionLabel: string;
  pluginsBuiltInValue: string;
  pluginsExternalValue: string;
  pluginsRuntimeValue: string;
  pluginsPanelTitle: string;
  pluginsPanelCopy: string;
  pluginsEmpty: string;
  pluginsSourcesLabel: string;
  pluginsFailureLabel: string;
  pluginsActionsLabel: string;
  pluginsRescanLabel: string;
  pluginsRescanningLabel: string;
  pluginsCompatibilityLabel: string;
  pluginsRuntimeModeLabel: string;
  pluginsEntryFileLabel: string;
  pluginsManifestLabel: string;
  pluginsLoadedSourcesLabel: string;
  pluginsSummaryExternalLabel: string;
  pluginsSummaryRuntimeLabel: string;
  pluginsCompatibilityCompatibleValue: string;
  pluginsCompatibilityIncompatibleValue: string;
  pluginsCompatibilityUnknownValue: string;
  pluginsNoEntryFile: string;
  pluginsNoManifest: string;
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
    pluginsEyebrow: "Plugin boundary",
    pluginsTitle: "Plugins is now backed by a real registry surface",
    pluginsSummary: "Built-in plugin runtime entries and external manifest validation now flow through the app's real registry path instead of static placeholder text.",
    pluginsDirectoryLabel: "Plugin directory",
    pluginsValidationLabel: "Validation",
    pluginsExecutionLabel: "Execution",
    pluginsBuiltInValue: "Built-in runtime active",
    pluginsExternalValue: "External discovery + validation",
    pluginsRuntimeValue: "External execution deferred",
    pluginsPanelTitle: "Registry state",
    pluginsPanelCopy: "The page reads the persisted plugin registry and source registry. External plugins may validate successfully here without being treated as active runtime sources yet.",
    pluginsEmpty: "No plugin records were discovered yet.",
    pluginsSourcesLabel: "Sources",
    pluginsFailureLabel: "Failure reason",
    pluginsActionsLabel: "Derived actions",
    pluginsRescanLabel: "Rescan plugins",
    pluginsRescanningLabel: "Rescanning...",
    pluginsCompatibilityLabel: "Compatibility",
    pluginsRuntimeModeLabel: "Runtime mode",
    pluginsEntryFileLabel: "Entry file",
    pluginsManifestLabel: "Manifest",
    pluginsLoadedSourcesLabel: "Loaded sources",
    pluginsSummaryExternalLabel: "External records",
    pluginsSummaryRuntimeLabel: "Runtime-ready",
    pluginsCompatibilityCompatibleValue: "Compatible",
    pluginsCompatibilityIncompatibleValue: "Incompatible",
    pluginsCompatibilityUnknownValue: "Unknown",
    pluginsNoEntryFile: "No entry file declared",
    pluginsNoManifest: "No manifest path recorded",
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
    pluginsEyebrow: "حد الإضافات",
    pluginsTitle: "صفحة الإضافات أصبحت مرتبطة بسجل حقيقي",
    pluginsSummary: "الإضافات المدمجة والتحقق من manifests الخارجية يمران الآن عبر سجل التطبيق الحقيقي بدل نص placeholder ثابت.",
    pluginsDirectoryLabel: "مجلد الإضافات",
    pluginsValidationLabel: "التحقق",
    pluginsExecutionLabel: "التنفيذ",
    pluginsBuiltInValue: "الإضافة المدمجة فعالة",
    pluginsExternalValue: "اكتشاف خارجي مع تحقق",
    pluginsRuntimeValue: "تنفيذ الخارجية مؤجل",
    pluginsPanelTitle: "حالة السجل",
    pluginsPanelCopy: "هذه الصفحة تقرأ سجل الإضافات وسجل المصادر الحقيقيين. قد تنجح الإضافة الخارجية في التحقق هنا دون أن تُعامل بعد كمصدر Runtime نشط.",
    pluginsEmpty: "لم يتم اكتشاف أي سجلات إضافات بعد.",
    pluginsSourcesLabel: "المصادر",
    pluginsFailureLabel: "سبب الفشل",
    pluginsActionsLabel: "الأفعال المشتقة",
    pluginsRescanLabel: "Rescan plugins",
    pluginsRescanningLabel: "Rescanning...",
    pluginsCompatibilityLabel: "Compatibility",
    pluginsRuntimeModeLabel: "Runtime mode",
    pluginsEntryFileLabel: "Entry file",
    pluginsManifestLabel: "Manifest",
    pluginsLoadedSourcesLabel: "Loaded sources",
    pluginsSummaryExternalLabel: "External records",
    pluginsSummaryRuntimeLabel: "Runtime-ready",
    pluginsCompatibilityCompatibleValue: "Compatible",
    pluginsCompatibilityIncompatibleValue: "Incompatible",
    pluginsCompatibilityUnknownValue: "Unknown",
    pluginsNoEntryFile: "No entry file declared",
    pluginsNoManifest: "No manifest path recorded",
  },
};

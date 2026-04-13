import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

export type Language = "en" | "ar";

interface Translations {
  [key: string]: string;
}

const en: Translations = {
  "tab.dashboard": "Dashboard",
  "tab.orders": "Orders",
  "tab.settled": "Settled",
  "tab.canceled": "Canceled",
  "tab.settings": "Settings",

  "dashboard.overview": "Overview",
  "dashboard.appName": "Ali Affiliate",
  "dashboard.live": "Live",
  "dashboard.updated": "Updated",
  "dashboard.fetching": "Fetching data…",
  "dashboard.error": "Failed to load dashboard. Check your credentials.",
  "dashboard.orderStatus": "Order Status",
  "dashboard.commissionSummary": "Commission Summary",
  "dashboard.setupRequired": "Setup Required",
  "dashboard.setupText": "Go to Settings and enter your AliExpress Affiliate App Key and Secret to get started.",

  "stat.paidPending": "Paid – Pending Delivery",
  "stat.paidPendingThisMonth": "Paid – Pending Delivery",
  "stat.thisMonth": "This Month",
  "stat.all": "All",
  "stat.receivedThisMonth": "Received This Month",
  "stat.receivedLastMonth": "Received Last Month",
  "stat.settledOrders": "Settled Orders",
  "stat.canceledOrders": "Canceled Orders",
  "stat.estCommission": "Est. Commission",
  "stat.settledCommission": "Paid Commission",
  "stat.commission": "Lost Commission",

  "commission.paidOrders": "Awaiting processing",
  "commission.thisMonth": "Received This Month",
  "commission.lastMonth": "Received Last Month",
  "commission.summary.thisMonth": "Pay Next Month",
  "commission.summary.lastMonth": "Pay This Month",

  "settled.title": "Settled",
  "settled.badge": "Completed",
  "settled.empty": "No settled orders in the last 5 months. Settled orders appear after commissions are confirmed by AliExpress.",
  "settled.setupText": "Enter your API credentials in Settings to view settled orders.",

  "canceled.title": "Canceled",
  "canceled.badge": "Void",
  "canceled.empty": "No canceled orders in the last 5 months.",
  "canceled.setupText": "Enter your API credentials in Settings to view canceled orders.",

  "orders.title": "Orders",
  "orders.badge": "Pending Delivery",
  "orders.tabSettled": "Settled",
  "orders.tabCanceled": "Canceled",
  "orders.empty": "No paid orders in the last 5 months.",
  "orders.setupText": "Enter your API credentials in Settings to view orders.",

  "orderCard.paid": "Paid",
  "orderCard.received": "Received",
  "orderCard.settled": "Settled",
  "orderCard.canceled": "Canceled",
  "orderCard.unknown": "Unknown",
  "orderCard.payment": "Payment",
  "orderCard.rate": "Rate",
  "orderCard.commission": "Commission",
  "orderCard.orderIdCopied": "Order ID copied",

  "ordersList.connectionError": "Connection Error",
  "ordersList.apiResponse": "API Response",
  "ordersList.retry": "Retry",
  "ordersList.tryAgain": "Try again",
  "ordersList.noOrders": "No orders found",
  "ordersList.noMatch": "No orders match this filter.",
  "ordersList.showing": "Showing",
  "ordersList.of": "of",
  "ordersList.orders": "orders",
  "ordersList.prev": "Prev",
  "ordersList.next": "Next",

  "settings.title": "Settings",
  "settings.subtitle": "Enter your AliExpress Affiliate credentials. Each user has their own keys.",
  "settings.apiCredentials": "API Credentials",
  "settings.appKey": "App Key",
  "settings.appSecret": "App Secret",
  "settings.enterAppKey": "Enter your App Key",
  "settings.enterAppSecret": "Enter your App Secret",
  "settings.saveSettings": "Save Settings",
  "settings.saved": "Saved!",
  "settings.testConnection": "Test Connection",
  "settings.testSuccess": "Connection successful! API is working.",
  "settings.testFail": "Connection failed. Check your credentials.",
  "settings.credentialsRequired": "App Key and App Secret are required.",
  "settings.saveFirst": "Save your credentials first.",
  "settings.securityNote": "Your credentials are stored locally on your device. They are sent securely to generate AliExpress API signatures.",
  "settings.about": "About",
  "settings.app": "App",
  "settings.version": "Version",
  "settings.api": "API",
  "settings.language": "Language",
  "settings.languageLabel": "App Language",
  "settings.english": "English",
  "settings.arabic": "العربية",
  "settings.appearance": "Appearance",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",

  "common.error": "Error",
  "common.back": "Back",

  "legal.disclaimer": "Disclaimer",
  "legal.terms": "Terms of Service",
  "legal.privacy": "Privacy Policy",
  "legal.about": "About the app",
  "legal.lastUpdated": "Effective: April 2025",
  "legal.footerNote": "This document is subject to change. Please review periodically.",

  "about.tagline": "Your AliExpress Affiliate tracking & link generation companion",
  "about.versionLabel": "Version",
  "about.whatIsIt": "What is AliAffiliate?",
  "about.description": "AliAffiliate is a powerful mobile tool built for AliExpress Affiliate Program members. It connects directly to your AliExpress Affiliate account using your personal API credentials, giving you a clean, real-time view of your earnings and orders — right from your phone.\n\nDesigned with simplicity and privacy in mind, the app keeps your credentials securely on your device and gives you the tools you need to manage your affiliate business efficiently.",
  "about.features": "Key Features",
  "about.appInfo": "App Information",
  "about.platform": "Platform",
  "about.madeWith": "Built with care for AliExpress Affiliate Program members · Not affiliated with AliExpress or Alibaba Group",

  "settings.legalSection": "Legal & Info",

  "apiError.signatureInvalid": "The request signature does not comply with the platform's standards, or there is an error in the application's secret key",
  "apiError.appKeyInvalid": "The specified App Key is invalid",
  "apiError.unexpectedFormat": "Unexpected API response format",
  "apiError.appKeySecretRequired": "App Key and App Secret are required",
  "apiError.statusRequired": "Order status parameter is required",

  "tab.generator": "Link Generator",

  "generator.title": "Affiliate Link Generator",
  "generator.subtitle": "Select a tracking ID, then paste any text containing an AliExpress link — the app will detect it automatically.",
  "generator.inputLabel": "Paste Link",
  "generator.inputPlaceholder": "Paste any text that contains an AliExpress link…",
  "generator.trackingId": "Tracking ID",
  "generator.loadingIds": "Loading tracking IDs…",
  "generator.errorLoadingIds": "Could not load tracking IDs. Check your credentials.",
  "generator.noIds": "No tracking IDs found in your account.",
  "generator.noIdSelected": "None selected",
  "generator.generateBtn": "Generate Affiliate Link",
  "generator.resultTitle": "Your Affiliate Link",
  "generator.copyBtn": "Copy Link",
  "generator.copied": "Link copied to clipboard!",
  "generator.errorEmpty": "Please paste a link or text containing an AliExpress product link.",
  "generator.errorInvalid": "No AliExpress link was found in the pasted text. Please make sure the text contains a valid AliExpress link.",
  "generator.errorNotAliExpress": "The link you pasted is not from AliExpress. Please use AliExpress product links only.",
  "generator.errorNoIdSelected": "Please select a tracking ID first.",
  "generator.errorApi": "Failed to generate link. Please try again.",
  "generator.errorNoResult": "Link not generated — not in affiliate program or check credentials",
  "generator.setupRequired": "Setup Required",
  "generator.setupText": "Go to Settings and enter your AliExpress Affiliate App Key and Secret to get started.",
  "generator.refresh": "Refresh",
};

const ar: Translations = {
  "tab.dashboard": "الرئيسية",
  "tab.orders": "الطلبات",
  "tab.settled": "المسوّاة",
  "tab.canceled": "الملغاة",
  "tab.settings": "الإعدادات",

  "dashboard.overview": "نظرة عامة",
  "dashboard.appName": "Ali Affiliate",
  "dashboard.live": "مباشر",
  "dashboard.updated": "آخر تحديث",
  "dashboard.fetching": "جارٍ جلب البيانات…",
  "dashboard.error": "فشل تحميل لوحة التحكم. تحقق من بيانات الاعتماد.",
  "dashboard.orderStatus": "حالة الطلبات",
  "dashboard.commissionSummary": "ملخص العمولات",
  "dashboard.setupRequired": "مطلوب إعداد",
  "dashboard.setupText": "اذهب إلى الإعدادات وأدخل مفتاح التطبيق والسر الخاص بحسابك في AliExpress للبدء.",

  "stat.paidPending": "مدفوعة – بانتظار التسليم",
  "stat.paidPendingThisMonth": "مدفوعة – بانتظار التسليم",
  "stat.thisMonth": "هذا الشهر",
  "stat.all": "الكل",
  "stat.receivedThisMonth": "مستلمة هذا الشهر",
  "stat.receivedLastMonth": "مستلمة الشهر الماضي",
  "stat.settledOrders": "طلبات تمت تسويتها",
  "stat.canceledOrders": "الطلبات الملغاة",
  "stat.estCommission": "العمولة المقدّرة",
  "stat.settledCommission": "عمولة تم دفعها",
  "stat.commission": "العمولة الضائعة",

  "commission.paidOrders": "في انتظار المعالجة",
  "commission.thisMonth": "مستلم هذا الشهر",
  "commission.lastMonth": "مستلم الشهر الماضي",
  "commission.summary.thisMonth": "تدفع الشهر القادم",
  "commission.summary.lastMonth": "تدفع هذا الشهر",

  "settled.title": "المسوّاة",
  "settled.badge": "مكتملة",
  "settled.empty": "لا توجد طلبات مسوّاة في آخر 5 أشهر. تظهر الطلبات المسوّاة بعد تأكيد العمولات من AliExpress.",
  "settled.setupText": "أدخل بيانات API في الإعدادات لعرض الطلبات المسوّاة.",

  "canceled.title": "الملغاة",
  "canceled.badge": "ملغاة",
  "canceled.empty": "لا توجد طلبات ملغاة في آخر 5 أشهر.",
  "canceled.setupText": "أدخل بيانات API في الإعدادات لعرض الطلبات الملغاة.",

  "orders.title": "الطلبات",
  "orders.badge": "بانتظار التسليم",
  "orders.tabSettled": "المسوّاة",
  "orders.tabCanceled": "الملغاة",
  "orders.empty": "لا توجد طلبات مدفوعة في آخر 5 أشهر.",
  "orders.setupText": "أدخل بيانات API في الإعدادات لعرض الطلبات.",

  "orderCard.paid": "مدفوع",
  "orderCard.received": "مستلم",
  "orderCard.settled": "مسوّى",
  "orderCard.canceled": "ملغى",
  "orderCard.unknown": "غير معروف",
  "orderCard.payment": "المبلغ",
  "orderCard.rate": "النسبة",
  "orderCard.commission": "العمولة",
  "orderCard.orderIdCopied": "تم نسخ رقم الطلب",

  "ordersList.connectionError": "خطأ في الاتصال",
  "ordersList.apiResponse": "استجابة API",
  "ordersList.retry": "إعادة المحاولة",
  "ordersList.tryAgain": "حاول مرة أخرى",
  "ordersList.noOrders": "لا توجد طلبات",
  "ordersList.noMatch": "لا توجد طلبات تطابق هذا الفلتر.",
  "ordersList.showing": "عرض",
  "ordersList.of": "من",
  "ordersList.orders": "طلبات",
  "ordersList.prev": "السابق",
  "ordersList.next": "التالي",

  "settings.title": "الإعدادات",
  "settings.subtitle": "أدخل بيانات اعتماد AliExpress Affiliate الخاصة بك. لكل مستخدم مفاتيحه الخاصة.",
  "settings.apiCredentials": "بيانات API",
  "settings.appKey": "مفتاح التطبيق",
  "settings.appSecret": "مفتاح سر التطبيق",
  "settings.enterAppKey": "أدخل مفتاح التطبيق",
  "settings.enterAppSecret": "أدخل مفتاح سر التطبيق",
  "settings.saveSettings": "حفظ الإعدادات",
  "settings.saved": "تم الحفظ!",
  "settings.testConnection": "اختبار الاتصال",
  "settings.testSuccess": "اتصال ناجح! API يعمل بشكل صحيح.",
  "settings.testFail": "فشل الاتصال. تحقق من بيانات الاعتماد.",
  "settings.credentialsRequired": "مفتاح التطبيق ومفتاح سر التطبيق مطلوبان.",
  "settings.saveFirst": "احفظ بيانات الاعتماد أولاً.",
  "settings.securityNote": "يتم تخزين بياناتك محلياً على جهازك. يتم إرسالها بشكل آمن لإنشاء توقيعات API الخاصة بـ AliExpress.",
  "settings.about": "حول التطبيق",
  "settings.app": "التطبيق",
  "settings.version": "الإصدار",
  "settings.api": "API",
  "settings.language": "اللغة",
  "settings.languageLabel": "لغة التطبيق",
  "settings.english": "English",
  "settings.arabic": "العربية",
  "settings.appearance": "المظهر",
  "settings.themeDark": "داكن",
  "settings.themeLight": "فاتح",

  "common.error": "خطأ",
  "common.back": "رجوع",

  "legal.disclaimer": "إخلاء المسؤولية",
  "legal.terms": "شروط الخدمة",
  "legal.privacy": "سياسة الخصوصية",
  "legal.about": "حول التطبيق",
  "legal.lastUpdated": "ساري من: أبريل 2025",
  "legal.footerNote": "هذه الوثيقة قابلة للتغيير. يُرجى مراجعتها بصفة دورية.",

  "about.tagline": "رفيقك في متابعة أرباح الأفلييت وإنشاء الروابط في AliExpress",
  "about.versionLabel": "الإصدار",
  "about.whatIsIt": "ما هو AliAffiliate؟",
  "about.description": "AliAffiliate هو تطبيق جوّال قوي مصمَّم لأعضاء برنامج الأفلييت في AliExpress. يتصل مباشرةً بحسابك في AliExpress Affiliate باستخدام بيانات اعتمادك الشخصية، مما يمنحك عرضاً نظيفاً ومباشراً لأرباحك وطلباتك — من هاتفك مباشرةً.\n\nمُصمَّم مع مراعاة البساطة والخصوصية، يحافظ التطبيق على بيانات اعتمادك بشكل آمن على جهازك ويمنحك الأدوات اللازمة لإدارة أعمالك في الأفلييت بكفاءة.",
  "about.features": "المميزات الرئيسية",
  "about.appInfo": "معلومات التطبيق",
  "about.platform": "المنصة",
  "about.madeWith": "مصنوع باعتناء لأعضاء برنامج الأفلييت في AliExpress · غير مرتبط بـ AliExpress أو مجموعة Alibaba",

  "settings.legalSection": "القانونية والمعلومات",

  "apiError.signatureInvalid": "توقيع الطلب لا يتوافق مع معايير المنصة أو هنالك خطأ في مفتاح سر التطبيق",
  "apiError.appKeyInvalid": "مفتاح التطبيق المحدد غير صالح",
  "apiError.unexpectedFormat": "تنسيق استجابة API غير متوقع",
  "apiError.appKeySecretRequired": "مفتاح التطبيق والسر مطلوبان",
  "apiError.statusRequired": "معامل حالة الطلب مطلوب",

  "tab.generator": "مولّد الروابط",

  "generator.title": "مولّد روابط الأفلييت",
  "generator.subtitle": "اختر معرّف التتبع، ثم الصق أي نص يحتوي على رابط AliExpress — سيكتشفه التطبيق تلقائياً.",
  "generator.inputLabel": "الصق الرابط",
  "generator.inputPlaceholder": "الصق أي نص يحتوي على رابط AliExpress…",
  "generator.trackingId": "معرّف التتبع",
  "generator.loadingIds": "جارٍ تحميل معرّفات التتبع…",
  "generator.errorLoadingIds": "تعذّر تحميل معرّفات التتبع. تحقق من بيانات الاعتماد.",
  "generator.noIds": "لم يُعثر على معرّفات تتبع في حسابك.",
  "generator.noIdSelected": "لم يتم الاختيار",
  "generator.generateBtn": "إنشاء رابط الأفلييت",
  "generator.resultTitle": "رابط الأفلييت الخاص بك",
  "generator.copyBtn": "نسخ الرابط",
  "generator.copied": "تم نسخ الرابط إلى الحافظة!",
  "generator.errorEmpty": "الرجاء لصق رابط أو نص يحتوي على رابط منتج AliExpress.",
  "generator.errorInvalid": "لم يُعثر على رابط AliExpress في النص الملصق. تأكد من أن النص يحتوي على رابط AliExpress صالح.",
  "generator.errorNotAliExpress": "الرابط الذي لصقته ليس من AliExpress. يُرجى استخدام روابط منتجات AliExpress فقط.",
  "generator.errorNoIdSelected": "الرجاء اختيار معرّف التتبع أولاً.",
  "generator.errorApi": "فشل إنشاء الرابط. يرجى المحاولة مرة أخرى.",
  "generator.errorNoResult": "لم يتم إعداد الرابط، ربما المنتج غير تابع لبرنامج العمولة، أو يمكنك التحقق من بيانات الإعتماد",
  "generator.setupRequired": "مطلوب إعداد",
  "generator.setupText": "اذهب إلى الإعدادات وأدخل مفتاح التطبيق والسر الخاص بحسابك في AliExpress للبدء.",
  "generator.refresh": "تحديث",
};

const translations: Record<Language, Translations> = { en, ar };

const API_ERROR_MAP: Record<string, string> = {
  "The request signature does not conform to platform standards": "apiError.signatureInvalid",
  "The specified App Key is invalid": "apiError.appKeyInvalid",
  "Unexpected API response format": "apiError.unexpectedFormat",
  "app_key and app_secret are required": "apiError.appKeySecretRequired",
  "status is required": "apiError.statusRequired",
};

export function translateApiError(msg: string, t: (key: string) => string): string {
  const key = API_ERROR_MAP[msg];
  if (key) return t(key);
  return msg;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LANG_STORAGE_KEY = "@aliaffiliate_language";

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>("ar");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANG_STORAGE_KEY).then((val) => {
      if (val === "en" || val === "ar") {
        setLang(val);
      }
      setIsReady(true);
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLang(lang);
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const isRTL = language === "ar";

  const value = useMemo(
    () => ({ language, setLanguage, t, isRTL }),
    [language]
  );

  if (!isReady) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
  return ctx;
}

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
  "stat.receivedThisMonth": "Received This Month",
  "stat.receivedLastMonth": "Received Last Month",
  "stat.settledOrders": "Settled Orders",
  "stat.canceledOrders": "Canceled Orders",
  "stat.estCommission": "Est. Commission",
  "stat.settledCommission": "Paid Commission",
  "stat.commission": "Lost Commission",

  "commission.paidOrders": "Awaiting processing",
  "commission.thisMonth": "Paid next month (may increase)",
  "commission.lastMonth": "Paid this month",

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

  "common.error": "Error",
  "common.back": "Back",
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
  "stat.receivedThisMonth": "مستلمة هذا الشهر",
  "stat.receivedLastMonth": "مستلمة الشهر الماضي",
  "stat.settledOrders": "طلبات تمت تسويتها",
  "stat.canceledOrders": "الطلبات الملغاة",
  "stat.estCommission": "العمولة المقدّرة",
  "stat.settledCommission": "عمولة تم دفعها",
  "stat.commission": "العمولة الضائعة",

  "commission.paidOrders": "في انتظار المعالجة",
  "commission.thisMonth": "تُدفع الشهر القادم (قد تزيد)",
  "commission.lastMonth": "تُدفع هذا الشهر",

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
  "settings.appSecret": "سر التطبيق",
  "settings.enterAppKey": "أدخل مفتاح التطبيق",
  "settings.enterAppSecret": "أدخل سر التطبيق",
  "settings.saveSettings": "حفظ الإعدادات",
  "settings.saved": "تم الحفظ!",
  "settings.testConnection": "اختبار الاتصال",
  "settings.testSuccess": "اتصال ناجح! API يعمل بشكل صحيح.",
  "settings.testFail": "فشل الاتصال. تحقق من بيانات الاعتماد.",
  "settings.credentialsRequired": "مفتاح التطبيق وسر التطبيق مطلوبان.",
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

  "common.error": "خطأ",
  "common.back": "رجوع",
};

const translations: Record<Language, Translations> = { en, ar };

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
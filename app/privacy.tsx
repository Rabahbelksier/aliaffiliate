import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import type { AppColors } from "@/constants/colors";

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 20 },
    header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20, marginTop: 8 },
    headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.success + "22", alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, color: c.text, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
    headerSubtitle: { fontSize: 13, color: c.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
    highlightCard: { backgroundColor: c.success + "15", borderRadius: 16, borderWidth: 1, borderColor: c.success + "40", marginBottom: 16, padding: 16 },
    highlightRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
    highlightText: { flex: 1, fontSize: 14, color: c.success, fontFamily: "Inter_500Medium", lineHeight: 22 },
    card: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.cardBorder, marginBottom: 16, padding: 16 },
    sectionTitle: { fontSize: 13, color: c.primary, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10 },
    paragraph: { fontSize: 14, color: c.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 22 },
    listItem: { flexDirection: "row", gap: 10, marginBottom: 8 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary, marginTop: 8 },
    listText: { flex: 1, fontSize: 14, color: c.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 22 },
    footer: { backgroundColor: c.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.cardBorder },
    footerText: { fontSize: 12, color: c.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18, textAlign: "center" },
  });
}

const HIGHLIGHTS_EN = [
  "We do NOT collect any personal data",
  "No analytics or tracking of any kind",
  "Your API keys are stored locally and encrypted on your device",
  "We do NOT send your data to external servers",
];

const HIGHLIGHTS_AR = [
  "لا نجمع أي بيانات شخصية إطلاقاً",
  "لا تحليلات ولا تتبّع من أي نوع",
  "مفاتيح API الخاصة بك مُخزَّنة محلياً ومشفّرة على جهازك",
  "لا نُرسل بياناتك إلى خوادم خارجية",
];

const SECTIONS_EN = [
  {
    title: "Information We Collect",
    body: "AliAffiliate does not collect, store, or transmit any personally identifiable information. We do not collect names, email addresses, phone numbers, location data, device identifiers, or any other personal information.",
  },
  {
    title: "API Credentials Storage",
    body: "Your AliExpress Affiliate App Key and App Secret are stored exclusively on your device using secure local storage (AsyncStorage). These credentials:",
    bullets: [
      "Are stored only on your device and never uploaded to any cloud service.",
      "Are used solely to sign API requests sent to AliExpress.",
      "Are transmitted over HTTPS to the app's backend solely for the purpose of generating AliExpress API request signatures.",
      "Are never stored, logged, or retained by the app's backend server.",
      "Remain entirely under your control — you can delete them at any time from the Settings screen.",
    ],
  },
  {
    title: "How Data Flows",
    body: "When you request data (orders, commissions, affiliate links), the app sends your credentials to a secure backend server over HTTPS. The backend uses these credentials only to sign the API request, then immediately forwards the request to AliExpress and returns the result to your device. No data is stored or logged on the backend.",
  },
  {
    title: "No Analytics or Tracking",
    body: "AliAffiliate does not use any analytics SDKs, crash reporting tools, advertising frameworks, or tracking libraries. We do not monitor how you use the application. There are no third-party SDKs that collect behavioral data.",
  },
  {
    title: "No Third-Party Data Sharing",
    body: "We do not sell, trade, rent, or share any user information with third parties. The only external communication the app makes is with the AliExpress Affiliate API on your behalf, using credentials you have provided.",
  },
  {
    title: "Data Security",
    body: "We take the security of your credentials seriously:",
    bullets: [
      "All network communication is encrypted using HTTPS/TLS.",
      "Credentials are stored locally using secure platform storage mechanisms.",
      "The backend server does not persist or log your credentials.",
      "No data is transmitted to any server other than the AliExpress API.",
    ],
  },
  {
    title: "Children's Privacy",
    body: "AliAffiliate is not intended for use by individuals under the age of 13. We do not knowingly collect any information from children under 13. If you believe a child has used this application, no personal data has been collected.",
  },
  {
    title: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Any changes will be reflected in the app. We encourage you to review this policy periodically. Continued use of the app following any changes constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact",
    body: "If you have any questions or concerns about this Privacy Policy or the handling of your information, please contact the developer through the app store listing.",
  },
];

const SECTIONS_AR = [
  {
    title: "المعلومات التي نجمعها",
    body: "لا يجمع تطبيق AliAffiliate أي معلومات تعريف شخصية ولا يخزّنها ولا يُرسلها. لا نجمع الأسماء أو عناوين البريد الإلكتروني أو أرقام الهواتف أو بيانات الموقع أو معرّفات الأجهزة أو أي معلومات شخصية أخرى.",
  },
  {
    title: "تخزين بيانات اعتماد API",
    body: "يُخزَّن مفتاح تطبيق AliExpress Affiliate وسرّه حصراً على جهازك باستخدام التخزين المحلي الآمن (AsyncStorage). هذه البيانات:",
    bullets: [
      "مُخزَّنة على جهازك فقط ولا تُرفع إلى أي خدمة سحابية.",
      "تُستخدم فقط لتوقيع طلبات API المُرسَلة إلى AliExpress.",
      "تُنقل عبر HTTPS إلى الخادم الخلفي للتطبيق لغرض وحيد هو توليد توقيعات طلبات AliExpress API.",
      "لا يُخزّنها الخادم الخلفي ولا يسجّلها ولا يحتفظ بها.",
      "تبقى تحت سيطرتك الكاملة — يمكنك حذفها في أي وقت من شاشة الإعدادات.",
    ],
  },
  {
    title: "كيف تتدفق البيانات",
    body: "عند طلب البيانات (طلبات، عمولات، روابط أفلييت)، يُرسل التطبيق بيانات اعتمادك إلى خادم خلفي آمن عبر HTTPS. يستخدم الخادم هذه البيانات فقط لتوقيع طلب API، ثم يُعيّد الطلب فوراً إلى AliExpress ويُعيد النتيجة إلى جهازك. لا يُخزَّن أي شيء في الخادم الخلفي.",
  },
  {
    title: "لا تحليلات ولا تتبّع",
    body: "لا يستخدم AliAffiliate أي حزم تحليلات أو أدوات الإبلاغ عن الأعطال أو أُطر الإعلانات أو مكتبات التتبّع. لا نراقب كيفية استخدامك للتطبيق. لا توجد حزم طرف ثالث تجمع بيانات سلوكية.",
  },
  {
    title: "عدم مشاركة البيانات مع أطراف ثالثة",
    body: "لا نبيع أي معلومات عن المستخدمين ولا نتاجر بها ولا نؤجّرها ولا نشاركها مع أطراف ثالثة. التواصل الخارجي الوحيد الذي يُجريه التطبيق هو مع AliExpress Affiliate API نيابةً عنك، باستخدام البيانات التي قدّمتها.",
  },
  {
    title: "أمان البيانات",
    body: "نحن نأخذ أمان بيانات اعتمادك على محمل الجد:",
    bullets: [
      "يتم تشفير جميع الاتصالات الشبكية باستخدام HTTPS/TLS.",
      "تُخزَّن بيانات الاعتماد محلياً باستخدام آليات التخزين الآمنة للمنصة.",
      "لا يحتفظ الخادم الخلفي ببيانات اعتمادك ولا يسجّلها.",
      "لا تُرسَل أي بيانات إلى أي خادم آخر غير AliExpress API.",
    ],
  },
  {
    title: "خصوصية الأطفال",
    body: "لا يستهدف AliAffiliate الأفراد الذين تقل أعمارهم عن 13 عاماً. لا نجمع عن علم أي معلومات من الأطفال دون سن 13. إن كنت تعتقد أن طفلاً استخدم هذا التطبيق، فاعلم أنه لم تُجمع أي بيانات شخصية.",
  },
  {
    title: "التغييرات على هذه السياسة",
    body: "قد نُحدّث سياسة الخصوصية هذه من وقت لآخر. ستنعكس أي تغييرات في التطبيق. نشجّعك على مراجعة هذه السياسة بصفة دورية. يُعدّ استمرار استخدامك للتطبيق بعد أي تغييرات موافقةً على السياسة المحدّثة.",
  },
  {
    title: "التواصل",
    body: "إن كانت لديك أي أسئلة أو مخاوف بشأن سياسة الخصوصية هذه أو طريقة التعامل مع معلوماتك، يُرجى التواصل مع المطوّر عبر صفحة التطبيق في متجر التطبيقات.",
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sections = language === "ar" ? SECTIONS_AR : SECTIONS_EN;
  const highlights = language === "ar" ? HIGHLIGHTS_AR : HIGHLIGHTS_EN;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <>
      <Stack.Screen options={{ title: t("legal.privacy") }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
          <View style={styles.headerIcon}>
            <Feather name="shield" size={22} color={colors.success} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { textAlign }]}>{t("legal.privacy")}</Text>
            <Text style={[styles.headerSubtitle, { textAlign }]}>{t("legal.lastUpdated")}</Text>
          </View>
        </View>

        <View style={styles.highlightCard}>
          {highlights.map((h, i) => (
            <View key={i} style={[styles.highlightRow, isRTL && { flexDirection: "row-reverse" }]}>
              <Feather name="check-circle" size={16} color={colors.success} style={{ marginTop: 3 }} />
              <Text style={[styles.highlightText, { textAlign }]}>{h}</Text>
            </View>
          ))}
        </View>

        {sections.map((sec, i) => (
          <View key={i} style={styles.card}>
            <Text style={[styles.sectionTitle, { textAlign }]}>{sec.title}</Text>
            <Text style={[styles.paragraph, { textAlign }]}>{sec.body}</Text>
            {sec.bullets && (
              <View style={{ marginTop: 10 }}>
                {sec.bullets.map((b, j) => (
                  <View key={j} style={[styles.listItem, isRTL && { flexDirection: "row-reverse" }]}>
                    <View style={styles.bullet} />
                    <Text style={[styles.listText, { textAlign }]}>{b}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("legal.footerNote")}</Text>
        </View>
      </ScrollView>
    </>
  );
}

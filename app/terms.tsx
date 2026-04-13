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
    headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.info + "22", alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, color: c.text, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
    headerSubtitle: { fontSize: 13, color: c.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
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

const SECTIONS_EN = [
  {
    title: "Acceptance of Terms",
    body: "By downloading or using Ali Affiliate, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.",
  },
  {
    title: "Purpose of the App",
    body: "Ali Affiliate is a personal productivity tool designed exclusively for members of the AliExpress Affiliate Program. It allows users to:",
    bullets: [
      "Monitor their affiliate orders and commission earnings.",
      "Track order statuses (paid, received, settled, canceled).",
      "Generate affiliate promotion links using their own tracking IDs.",
      "Manage their AliExpress Affiliate API credentials securely.",
    ],
  },
  {
    title: "User Responsibilities",
    body: "By using this application, you agree to:",
    bullets: [
      "Provide accurate AliExpress Affiliate API credentials (App Key and App Secret).",
      "Use the application solely for its intended purpose.",
      "Comply with AliExpress Affiliate Program's Terms and Conditions.",
      "Not attempt to reverse-engineer, copy, or distribute any part of this application.",
      "Not use the application for any unlawful or fraudulent purpose.",
    ],
  },
  {
    title: "API Credentials",
    body: "Your App Key and App Secret are your personal credentials issued by AliExpress. You are solely responsible for maintaining the confidentiality of these credentials. Do not share them with others. The developer of Ali Affiliate is not responsible for any unauthorized use of your credentials.",
  },
  {
    title: "Intellectual Property",
    body: "All content, design, and code within this application are the intellectual property of the developer. You may not reproduce, distribute, or create derivative works from any part of this application without prior written permission.",
  },
  {
    title: "Service Availability",
    body: "The application depends on the AliExpress Affiliate API for data. We do not guarantee continuous, uninterrupted access to the application or its features. Service availability may be affected by AliExpress API changes, maintenance, or outages.",
  },
  {
    title: "Changes to Terms",
    body: "We reserve the right to modify these Terms of Service at any time. Continued use of the application after any changes constitutes your acceptance of the new terms. We encourage you to review these terms periodically.",
  },
  {
    title: "Termination",
    body: "We reserve the right to terminate or restrict access to the application at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, the developer, or third parties.",
  },
];

const SECTIONS_AR = [
  {
    title: "قبول الشروط",
    body: "بتنزيل تطبيق Ali Affiliate أو استخدامه، فإنك توافق على الالتزام بشروط الخدمة هذه. إن لم توافق على هذه الشروط، يُرجى عدم استخدام التطبيق.",
  },
  {
    title: "الغرض من التطبيق",
    body: "تطبيق Ali Affiliate هو أداة إنتاجية شخصية مصمّمة حصراً لأعضاء برنامج الأفلييت في علي اكسبراس. \n  يتيح للمستخدمين:",
    bullets: [
      "متابعة طلبات الأفلييت وأرباح العمولات.",
      "تتبّع حالات الطلبات (مدفوعة، مستلمة، مسوّاة، ملغاة).",
      "إنشاء روابط ترويج أفلييت باستخدام معرّفات التتبع الخاصة بهم.",
      "إدارة بيانات اعتماد AliExpress Affiliate API بشكل آمن.",
    ],
  },
  {
    title: "مسؤوليات المستخدم",
    body: "باستخدام هذا التطبيق، فإنك توافق على:",
    bullets: [
      "تقديم بيانات اعتماد AliExpress Affiliate API الصحيحة (مفتاح التطبيق والسر).",
      "استخدام التطبيق للغرض المخصص له فقط.",
      "الامتثال لشروط وأحكام برنامج الأفلييت في علي اكسبراس.",
      "عدم محاولة عكس هندسة التطبيق أو نسخه أو توزيعه.",
      "عدم استخدام التطبيق لأي غرض غير مشروع أو احتيالي.",
    ],
  },
  {
    title: "بيانات اعتماد API",
    body: "مفتاح تطبيقك وسرّه هما بيانات اعتمادك الشخصية الصادرة عن علي اكسبراس. أنت المسؤول الوحيد عن الحفاظ على سرية هذه البيانات. لا تشاركها مع الآخرين. لا يتحمّل مطوّر Ali Affiliate مسؤولية أي استخدام غير مصرّح به لبيانات اعتمادك.",
  },
  {
    title: "الملكية الفكرية",
    body: "جميع المحتويات والتصميمات والأكواد البرمجية داخل هذا التطبيق هي ملكية فكرية للمطوّر. لا يجوز لك استنساخ أي جزء من التطبيق أو توزيعه أو إنشاء أعمال مشتقة منه دون إذن كتابي مسبق.",
  },
  {
    title: "توافر الخدمة",
    body: "يعتمد التطبيق على واجهة برمجة تطبيقات AliExpress Affiliate للحصول على البيانات. لا نضمن الوصول المستمر وغير المنقطع إلى التطبيق أو ميزاته. قد يتأثر توافر الخدمة بتغييرات AliExpress API أو أعمال الصيانة أو انقطاع الخدمة.",
  },
  {
    title: "التغييرات على الشروط",
    body: "نحتفظ بالحق في تعديل شروط الخدمة هذه في أي وقت. يُعدّ استمرار استخدامك للتطبيق بعد أي تغييرات موافقةً منك على الشروط الجديدة. نشجّعك على مراجعة هذه الشروط بصفة دورية.",
  },
  {
    title: "الإنهاء",
    body: "نحتفظ بالحق في إنهاء أو تقييد الوصول إلى التطبيق وفق تقديرنا المطلق ودون إشعار، في حال رأينا أن سلوكك يخالف شروط الخدمة هذه أو يضرّ بمستخدمين آخرين أو بالمطوّر أو بأطراف ثالثة.",
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sections = language === "ar" ? SECTIONS_AR : SECTIONS_EN;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <>
      <Stack.Screen options={{ title: t("legal.terms") }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
          <View style={styles.headerIcon}>
            <Feather name="file-text" size={22} color={colors.info} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { textAlign }]}>{t("legal.terms")}</Text>
            <Text style={[styles.headerSubtitle, { textAlign }]}>{t("legal.lastUpdated")}</Text>
          </View>
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

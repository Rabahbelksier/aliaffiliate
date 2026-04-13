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
    headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.warning + "22", alignItems: "center", justifyContent: "center" },
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
    title: "Independent Application",
    body: "Ali Affiliate is an independent application developed to assist AliExpress Affiliate Program members. It is not affiliated with, endorsed by, or in any way officially connected to AliExpress, Alibaba Group, or any of their subsidiaries.",
  },
  {
    title: "Earnings & Commissions",
    body: "All earnings, commission, and order data displayed in this application are retrieved directly from the AliExpress Affiliate API using your own credentials. This information is provided for reference and tracking purposes only.",
    bullets: [
      "Commission rates and amounts may vary based on AliExpress policies.",
      "Estimated commission values are approximations and are subject to change.",
      "Final settled amounts are determined solely by AliExpress.",
      "The app developer makes no guarantees regarding earnings accuracy.",
    ],
  },
  {
    title: "No Warranty",
    body: "This application is provided \"as is\" without warranty of any kind. The developer is not responsible for any errors, inaccuracies, or interruptions in the data provided. Use of this application is at your own risk.",
  },
  {
    title: "Third-Party Services",
    body: "This app interacts with the AliExpress Affiliate API. Your use of AliExpress services is governed by AliExpress's own Terms of Service and Affiliate Program Agreement. The app developer is not responsible for changes to AliExpress APIs or affiliate program terms.",
  },
  {
    title: "Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, the developer of Ali Affiliate shall not be liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use this application.",
  },
];

const SECTIONS_AR = [
  {
    title: "تطبيق مستقل",
    body: "تطبيق Ali Affiliate هو تطبيق مستقل تم تطويره لمساعدة أعضاء برنامج الأفلييت في علي اكسبراس. لا يرتبط هذا التطبيق بـ علي اكسبراس أو مجموعة علي بابا أو أي من شركاتها التابعة، ولم تقم تلك الجهات بإقراره أو التصريح به.",
  },
  {
    title: "الأرباح والعمولات",
    body: "جميع بيانات الأرباح والعمولات والطلبات المعروضة في هذا التطبيق يتم جلبها مباشرةً من واجهة برمجة تطبيقات AliExpress Affiliate باستخدام بيانات اعتمادك الخاصة، وهي مقدّمة لأغراض المرجعية والمتابعة فقط.",
    bullets: [
      "قد تتغيّر نسب وقيم العمولات بناءً على سياسات علي اكسبراس.",
      "قيم العمولة المقدّرة تقريبية وقابلة للتغيير.",
      "تحدّد علي اكسبراس وحدها المبالغ النهائية المسوّاة.",
      "لا يضمن مطوّر التطبيق دقة بيانات الأرباح.",
    ],
  },
  {
    title: "لا ضمان",
    body: "يُقدَّم هذا التطبيق \"كما هو\" دون أي ضمان من أي نوع. لا يتحمّل المطوّر المسؤولية عن أي أخطاء أو عدم دقة أو انقطاع في البيانات المقدّمة. استخدام هذا التطبيق يكون على مسؤوليتك الخاصة.",
  },
  {
    title: "خدمات الطرف الثالث",
    body: "يتفاعل هذا التطبيق مع واجهة برمجة تطبيقات AliExpress Affiliate. إن استخدامك لخدمات علي اكسبراس يخضع لشروط خدمة علي اكسبراس الخاصة وبنود برنامج الأفلييت. لا يتحمّل مطوّر التطبيق مسؤولية أي تغييرات في تلك الواجهات أو شروط البرنامج.",
  },
  {
    title: "حدود المسؤولية",
    body: "إلى الحدّ الأقصى الذي يسمح به القانون المعمول به، لا يتحمّل مطوّر Ali Affiliate مسؤولية أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية تنشأ عن استخدام هذا التطبيق أو عدم القدرة على استخدامه.",
  },
];

export default function DisclaimerScreen() {
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
      <Stack.Screen options={{ title: t("legal.disclaimer") }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
          <View style={styles.headerIcon}>
            <Feather name="alert-triangle" size={22} color={colors.warning} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { textAlign }]}>{t("legal.disclaimer")}</Text>
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

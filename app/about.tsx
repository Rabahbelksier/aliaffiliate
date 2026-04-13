import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Platform, Image } from "react-native";
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
    appHeader: { alignItems: "center", marginBottom: 28, marginTop: 8 },
    appLogo: { width: 80, height: 80, borderRadius: 22, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8, overflow: "hidden" },
    appName: { fontSize: 26, color: c.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 4 },
    appTagline: { fontSize: 14, color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
    versionBadge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.cardBorder },
    versionText: { fontSize: 12, color: c.textSecondary, fontFamily: "Inter_500Medium" },
    card: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.cardBorder, marginBottom: 16, padding: 16 },
    sectionTitle: { fontSize: 13, color: c.primary, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 12 },
    paragraph: { fontSize: 14, color: c.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 22 },
    featureRow: { flexDirection: "row", gap: 14, marginBottom: 14, alignItems: "flex-start" },
    featureIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    featureTitleText: { fontSize: 14, color: c.text, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    featureDesc: { fontSize: 13, color: c.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 19 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.cardBorder },
    infoRowLast: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11 },
    infoLabel: { fontSize: 14, color: c.textSecondary, fontFamily: "Inter_400Regular" },
    infoValue: { fontSize: 14, color: c.text, fontFamily: "Inter_500Medium" },
    footer: { backgroundColor: c.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.cardBorder, marginBottom: 8 },
    footerText: { fontSize: 12, color: c.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18, textAlign: "center" },
  });
}

const FEATURES_EN = [
  { icon: "bar-chart-2", color: "#4A90D9", bg: "#4A90D922", title: "Earnings Dashboard", desc: "Quickly check your account performance through a clear dashboard showing the number of orders and estimated commissions for each status, so you always stay updated on your earnings." },
  { icon: "list", color: "#FF6B35", bg: "#FF6B3522", title: "Order Management", desc: "Browse all your orders and filter them by status — paid and pending delivery, received, settled, and canceled." },
  { icon: "link", color: "#00D68F", bg: "#00D68F22", title: "Affiliate Link Generator", desc: "Paste any AliExpress product link or text containing one, select your tracking ID, and generate your affiliate promotion link instantly." },
  { icon: "globe", color: "#FFB800", bg: "#FFB80022", title: "Arabic & English Support", desc: "Full bilingual support with proper RTL layout for Arabic, making the app comfortable for users of both languages." },
  { icon: "moon", color: "#8888AA", bg: "#8888AA22", title: "Dark & Light Themes", desc: "Choose the visual style that's most comfortable for you. The theme adapts across all screens consistently." },
  { icon: "shield", color: "#00D68F", bg: "#00D68F22", title: "Privacy First", desc: "Your API keys are stored only on your device and are never shared or uploaded. The app collects zero personal data." },
];

const FEATURES_AR = [
  { icon: "bar-chart-2", color: "#4A90D9", bg: "#4A90D922", title: "لوحة الأرباح", desc: "اطّلع بسرعة على أداء حسابك من خلال لوحة واضحة تعرض عدد الطلبات والعمولات المقدّرة لكل حالة، لتبقى على اطلاع دائم بأرباحك." },
  { icon: "list", color: "#FF6B35", bg: "#FF6B3522", title: "إدارة الطلبات", desc: "تصفّح جميع طلبات الأفلييت وفلترها حسب الحالة —تصفّح جميع طلباتك وفلترها حسب الحالة — مدفوعة وبانتظار التسليم، مستلمة، مسوّاة، وملغاة." },
  { icon: "link", color: "#00D68F", bg: "#00D68F22", title: "مولّد روابط الأفلييت", desc: "الصق أي رابط منتج AliExpress أو نصاً يحتوي على رابط، اختر معرّف التتبع، واحصل على رابط الترويج فوراً." },
  { icon: "globe", color: "#FFB800", bg: "#FFB80022", title: "دعم العربية والإنجليزية", desc: "دعم كامل للغتين مع تخطيط RTL صحيح للعربية، مما يجعل التطبيق مريحاً لمستخدمي كلتا اللغتين." },
  { icon: "moon", color: "#8888AA", bg: "#8888AA22", title: "وضع داكن وفاتح", desc: "اختر النمط البصري الأكثر راحةً لك. يتكيّف الثيم بشكل متسق عبر جميع الشاشات." },
  { icon: "shield", color: "#00D68F", bg: "#00D68F22", title: "الخصوصية أولاً", desc: "تُخزَّن مفاتيح API الخاصة بك على جهازك فقط ولا تُشارك أبداً ولا تُرفع. التطبيق لا يجمع أي بيانات شخصية." },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const features = language === "ar" ? FEATURES_AR : FEATURES_EN;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <>
      <Stack.Screen options={{ title: t("legal.about") }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appHeader}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.appLogo}
            resizeMode="cover"
          />
          <Text style={styles.appName}>AliAffiliate</Text>
          <Text style={styles.appTagline}>{t("about.tagline")}</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>{t("about.versionLabel")} 1.0.0</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t("about.whatIsIt")}</Text>
          <Text style={[styles.paragraph, { textAlign }]}>{t("about.description")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t("about.features")}</Text>
          {features.map((f, i) => (
            <View key={i} style={[styles.featureRow, isRTL && { flexDirection: "row-reverse" }, i === features.length - 1 && { marginBottom: 0 }]}>
              <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                <Feather name={f.icon as any} size={18} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitleText, { textAlign }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { textAlign }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t("about.appInfo")}</Text>
          <View style={[styles.infoRow, isRTL && { flexDirection: "row-reverse" }]}>
            <Text style={styles.infoLabel}>{t("settings.app")}</Text>
            <Text style={styles.infoValue}>AliAffiliate</Text>
          </View>
          <View style={[styles.infoRow, isRTL && { flexDirection: "row-reverse" }]}>
            <Text style={styles.infoLabel}>{t("settings.version")}</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={[styles.infoRow, isRTL && { flexDirection: "row-reverse" }]}>
            <Text style={styles.infoLabel}>{t("settings.api")}</Text>
            <Text style={styles.infoValue}>AliExpress Affiliate v2.0</Text>
          </View>
          <View style={[styles.infoRowLast, isRTL && { flexDirection: "row-reverse" }]}>
            <Text style={styles.infoLabel}>{t("about.platform")}</Text>
            <Text style={styles.infoValue}>Android</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("about.madeWith")}</Text>
        </View>
      </ScrollView>
    </>
  );
}

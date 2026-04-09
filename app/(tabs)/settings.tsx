import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage, translateApiError, type Language } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { getApiUrl } from "@/lib/query-client";
import { fetch as nativeFetch } from "expo/fetch";
import type { AppColors } from "@/constants/colors";

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 16 },
    title: { fontSize: 28, color: c.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 6 },
    subtitle: { fontSize: 13, color: c.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 24 },
    section: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.cardBorder, marginBottom: 16, overflow: "hidden" },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    sectionHeaderExpanded: {
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    sectionTitle: { flex: 1, fontSize: 13, color: c.textSecondary, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },
    langRow: { flexDirection: "row", padding: 12, gap: 10 },
    toggleRow: { flexDirection: "row", padding: 12, gap: 10 },
    toggleBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.cardBorder },
    toggleBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    toggleBtnText: { fontSize: 14, color: c.textSecondary, fontFamily: "Inter_500Medium" },
    toggleBtnTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
    field: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.cardBorder },
    label: { fontSize: 11, color: c.textMuted, fontFamily: "Inter_500Medium", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
    input: { fontSize: 15, color: c.text, fontFamily: "Inter_400Regular", paddingVertical: 8, paddingHorizontal: 12, backgroundColor: c.surface, borderRadius: 10, borderWidth: 1, borderColor: c.cardBorder },
    inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    eyeBtn: { padding: 10, backgroundColor: c.surface, borderRadius: 10, borderWidth: 1, borderColor: c.cardBorder },
    buttonGroup: { gap: 10, marginBottom: 16 },
    saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16 },
    saveBtnText: { fontSize: 15, color: "#fff", fontFamily: "Inter_600SemiBold" },
    testBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: c.card, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: c.primary },
    testBtnText: { fontSize: 15, color: c.primary, fontFamily: "Inter_600SemiBold" },
    resultBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, padding: 14, marginBottom: 16 },
    resultText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
    infoCard: { backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.cardBorder, padding: 14, marginBottom: 16 },
    infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    infoText: { flex: 1, fontSize: 12, color: c.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18 },
    linkRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.cardBorder },
    linkRowLast: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
    linkIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 },
    linkLabel: { flex: 1, fontSize: 15, color: c.text, fontFamily: "Inter_500Medium" },
    linkLabelRTL: { flex: 1, fontSize: 15, color: c.text, fontFamily: "Inter_500Medium", textAlign: "right", marginRight: 0, marginLeft: 12 },
  });
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [appKey, setAppKey] = useState(settings.app_key);
  const [appSecret, setAppSecret] = useState(settings.app_secret);
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const [langExpanded, setLangExpanded] = useState(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);
  const [apiExpanded, setApiExpanded] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  const handleSave = async () => {
    if (!appKey.trim() || !appSecret.trim()) {
      Alert.alert(t("common.error"), t("settings.credentialsRequired"));
      return;
    }
    setIsSaving(true);
    await updateSettings({ app_key: appKey.trim(), app_secret: appSecret.trim() });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!appKey.trim() || !appSecret.trim()) {
      Alert.alert(t("common.error"), t("settings.saveFirst"));
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/orders", baseUrl).toString();
      const res = await nativeFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_key: appKey.trim(),
          app_secret: appSecret.trim(),
          status: "Payment Completed",
          page_no: 1,
          page_size: 1,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error && data.orders?.length === 0) {
        throw new Error(data.error);
      }
      setTestResult({ ok: true, message: t("settings.testSuccess") });
    } catch (err: any) {
      setTestResult({ ok: false, message: translateApiError(err?.message || "", t) || t("settings.testFail") });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: botPad + 120 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { textAlign }]}>{t("settings.title")}</Text>
      <Text style={[styles.subtitle, { textAlign }]}>{t("settings.subtitle")}</Text>

      {/* Language — Collapsible */}
      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [
            styles.sectionHeader,
            langExpanded && styles.sectionHeaderExpanded,
            isRTL && { flexDirection: "row-reverse" },
            { opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={() => setLangExpanded((v) => !v)}
        >
          <Feather name="globe" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
          <Feather
            name={langExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textMuted}
          />
        </Pressable>
        {langExpanded && (
          <View style={[styles.langRow, isRTL && { flexDirection: "row-reverse" }]}>
            <Pressable
              style={[styles.toggleBtn, language === "en" && styles.toggleBtnActive]}
              onPress={() => setLanguage("en" as Language)}
            >
              <Text style={[styles.toggleBtnText, language === "en" && styles.toggleBtnTextActive]}>
                {t("settings.english")}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, language === "ar" && styles.toggleBtnActive]}
              onPress={() => setLanguage("ar" as Language)}
            >
              <Text style={[styles.toggleBtnText, language === "ar" && styles.toggleBtnTextActive]}>
                {t("settings.arabic")}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Appearance — Collapsible */}
      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [
            styles.sectionHeader,
            appearanceExpanded && styles.sectionHeaderExpanded,
            isRTL && { flexDirection: "row-reverse" },
            { opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={() => setAppearanceExpanded((v) => !v)}
        >
          <Feather name="moon" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t("settings.appearance")}</Text>
          <Feather
            name={appearanceExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textMuted}
          />
        </Pressable>
        {appearanceExpanded && (
          <View style={[styles.toggleRow, isRTL && { flexDirection: "row-reverse" }]}>
            <Pressable
              style={[styles.toggleBtn, isDark && styles.toggleBtnActive]}
              onPress={() => { if (!isDark) toggleTheme(); }}
            >
              <Text style={[styles.toggleBtnText, isDark && styles.toggleBtnTextActive]}>
                {t("settings.themeDark")}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, !isDark && styles.toggleBtnActive]}
              onPress={() => { if (isDark) toggleTheme(); }}
            >
              <Text style={[styles.toggleBtnText, !isDark && styles.toggleBtnTextActive]}>
                {t("settings.themeLight")}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* API Credentials — Collapsible */}
      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [
            styles.sectionHeader,
            apiExpanded && styles.sectionHeaderExpanded,
            isRTL && { flexDirection: "row-reverse" },
            { opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={() => setApiExpanded((v) => !v)}
        >
          <Feather name="key" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t("settings.apiCredentials")}</Text>
          <Feather
            name={apiExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textMuted}
          />
        </Pressable>

        {apiExpanded && (
          <>
            <View style={styles.field}>
              <Text style={[styles.label, { textAlign }]}>{t("settings.appKey")}</Text>
              <TextInput
                style={[styles.input, { textAlign }]}
                value={appKey}
                onChangeText={setAppKey}
                placeholder={t("settings.enterAppKey")}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={[styles.field, { borderBottomWidth: 0 }]}>
              <Text style={[styles.label, { textAlign }]}>{t("settings.appSecret")}</Text>
              <View style={[styles.inputRow, isRTL && { flexDirection: "row-reverse" }]}>
                <TextInput
                  style={[styles.input, { flex: 1, textAlign }]}
                  value={appSecret}
                  onChangeText={setAppSecret}
                  placeholder={t("settings.enterAppSecret")}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showSecret}
                  returnKeyType="next"
                />
                <Pressable
                  style={styles.eyeBtn}
                  onPress={() => setShowSecret(!showSecret)}
                >
                  <Feather name={showSecret ? "eye-off" : "eye"} size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.buttonGroup}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: pressed ? 0.85 : 1 },
            saved && { backgroundColor: colors.success },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name={saved ? "check" : "save"} size={16} color="#fff" />
              <Text style={styles.saveBtnText}>{saved ? t("settings.saved") : t("settings.saveSettings")}</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.testBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={handleTest}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              <Feather name="wifi" size={16} color={colors.primary} />
              <Text style={styles.testBtnText}>{t("settings.testConnection")}</Text>
            </>
          )}
        </Pressable>
      </View>

      {testResult && (
        <View style={[
          styles.resultBanner,
          { backgroundColor: testResult.ok ? colors.success + "22" : colors.danger + "22" },
          isRTL && { flexDirection: "row-reverse" },
        ]}>
          <Feather
            name={testResult.ok ? "check-circle" : "alert-circle"}
            size={16}
            color={testResult.ok ? colors.success : colors.danger}
          />
          <Text style={[styles.resultText, { color: testResult.ok ? colors.success : colors.danger, textAlign }]}>
            {testResult.message}
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <View style={[styles.infoRow, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="shield" size={16} color={colors.textMuted} />
          <Text style={[styles.infoText, { textAlign }]}>{t("settings.securityNote")}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="info" size={16} color={colors.info} />
          <Text style={styles.sectionTitle}>{t("settings.legalSection")}</Text>
        </View>

        {[
          { route: "/about", icon: "info", color: colors.info, bg: colors.info + "20", label: t("legal.about") },
          { route: "/privacy", icon: "shield", color: colors.success, bg: colors.success + "20", label: t("legal.privacy") },
          { route: "/terms", icon: "file-text", color: colors.primary, bg: colors.primary + "20", label: t("legal.terms") },
          { route: "/disclaimer", icon: "alert-triangle", color: colors.warning, bg: colors.warning + "20", label: t("legal.disclaimer"), last: true },
        ].map(({ route, icon, color, bg, label, last }) => (
          <Pressable
            key={route}
            style={({ pressed }) => [
              last ? styles.linkRowLast : styles.linkRow,
              isRTL && { flexDirection: "row-reverse" },
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push(route as any)}
          >
            <View style={[styles.linkIcon, { backgroundColor: bg, marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]}>
              <Feather name={icon as any} size={16} color={color} />
            </View>
            <Text style={[styles.linkLabel, { textAlign }]}>{label}</Text>
            <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

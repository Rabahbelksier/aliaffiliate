import React, { useState } from "react";
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
import { Colors } from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/query-client";
import { fetch as nativeFetch } from "expo/fetch";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { t, language, setLanguage, isRTL } = useLanguage();

  const [appKey, setAppKey] = useState(settings.app_key);
  const [appSecret, setAppSecret] = useState(settings.app_secret);
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

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
      setTestResult({ ok: false, message: err?.message || t("settings.testFail") });
    } finally {
      setIsTesting(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
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

      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="globe" size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        </View>
        <View style={styles.langRow}>
          <Pressable
            style={[styles.langBtn, language === "en" && styles.langBtnActive]}
            onPress={() => handleLanguageChange("en")}
          >
            <Text style={[styles.langBtnText, language === "en" && styles.langBtnTextActive]}>
              {t("settings.english")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langBtn, language === "ar" && styles.langBtnActive]}
            onPress={() => handleLanguageChange("ar")}
          >
            <Text style={[styles.langBtnText, language === "ar" && styles.langBtnTextActive]}>
              {t("settings.arabic")}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="key" size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{t("settings.apiCredentials")}</Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { textAlign }]}>{t("settings.appKey")}</Text>
          <TextInput
            style={[styles.input, { textAlign }]}
            value={appKey}
            onChangeText={setAppKey}
            placeholder={t("settings.enterAppKey")}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { textAlign }]}>{t("settings.appSecret")}</Text>
          <View style={[styles.inputRow, isRTL && { flexDirection: "row-reverse" }]}>
            <TextInput
              style={[styles.input, { flex: 1, textAlign }]}
              value={appSecret}
              onChangeText={setAppSecret}
              placeholder={t("settings.enterAppSecret")}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showSecret}
              returnKeyType="next"
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowSecret(!showSecret)}
            >
              <Feather name={showSecret ? "eye-off" : "eye"} size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: pressed ? 0.85 : 1 },
            saved && { backgroundColor: Colors.success },
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
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <>
              <Feather name="wifi" size={16} color={Colors.primary} />
              <Text style={styles.testBtnText}>{t("settings.testConnection")}</Text>
            </>
          )}
        </Pressable>
      </View>

      {testResult && (
        <View style={[styles.resultBanner, { backgroundColor: testResult.ok ? Colors.success + "22" : Colors.danger + "22" }, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather
            name={testResult.ok ? "check-circle" : "alert-circle"}
            size={16}
            color={testResult.ok ? Colors.success : Colors.danger}
          />
          <Text style={[styles.resultText, { color: testResult.ok ? Colors.success : Colors.danger, textAlign }]}>
            {testResult.message}
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <View style={[styles.infoRow, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="shield" size={16} color={Colors.textMuted} />
          <Text style={[styles.infoText, { textAlign }]}>{t("settings.securityNote")}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="info" size={16} color={Colors.info} />
          <Text style={styles.sectionTitle}>{t("settings.about")}</Text>
        </View>
        <View style={[styles.aboutRow, isRTL && { flexDirection: "row-reverse" }]}>
          <Text style={styles.aboutLabel}>{t("settings.app")}</Text>
          <Text style={styles.aboutValue}>AliAffiliate</Text>
        </View>
        <View style={[styles.aboutRow, isRTL && { flexDirection: "row-reverse" }]}>
          <Text style={styles.aboutLabel}>{t("settings.version")}</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={[styles.aboutRow, isRTL && { flexDirection: "row-reverse" }]}>
          <Text style={styles.aboutLabel}>{t("settings.api")}</Text>
          <Text style={styles.aboutValue}>AliExpress Affiliate v2.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 24,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  langRow: {
    flexDirection: "row",
    padding: 12,
    gap: 10,
  },
  langBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  langBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  langBtnTextActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eyeBtn: {
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  buttonGroup: {
    gap: 10,
    marginBottom: 16,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveBtnText: {
    fontSize: 15,
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  testBtnText: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  resultBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  aboutLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  aboutValue: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: "Inter_500Medium",
  },
});

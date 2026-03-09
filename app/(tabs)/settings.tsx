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
import { fetchOrders } from "@/hooks/useOrders";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  const [appKey, setAppKey] = useState(settings.app_key);
  const [appSecret, setAppSecret] = useState(settings.app_secret);
  const [trackingId, setTrackingId] = useState(settings.tracking_id);
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = async () => {
    if (!appKey.trim() || !appSecret.trim()) {
      Alert.alert("Error", "App Key and App Secret are required.");
      return;
    }
    setIsSaving(true);
    await updateSettings({ app_key: appKey.trim(), app_secret: appSecret.trim(), tracking_id: trackingId.trim() });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!appKey.trim() || !appSecret.trim()) {
      Alert.alert("Error", "Save your credentials first.");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      await fetchOrders({
        app_key: appKey.trim(),
        app_secret: appSecret.trim(),
        status: "Payment Completed",
        page_no: 1,
        page_size: 1,
      });
      setTestResult({ ok: true, message: "Connection successful! API is working." });
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || "Connection failed. Check your credentials." });
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
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Your credentials are stored locally and never sent to our servers.</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="key" size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>API Credentials</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>App Key</Text>
          <TextInput
            style={styles.input}
            value={appKey}
            onChangeText={setAppKey}
            placeholder="Enter your App Key"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>App Secret</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={appSecret}
              onChangeText={setAppSecret}
              placeholder="Enter your App Secret"
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

        <View style={styles.field}>
          <Text style={styles.label}>Tracking ID (optional)</Text>
          <TextInput
            style={styles.input}
            value={trackingId}
            onChangeText={setTrackingId}
            placeholder="Your tracking ID"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
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
              <Text style={styles.saveBtnText}>{saved ? "Saved!" : "Save Settings"}</Text>
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
              <Text style={styles.testBtnText}>Test Connection</Text>
            </>
          )}
        </Pressable>
      </View>

      {testResult && (
        <View style={[styles.resultBanner, { backgroundColor: testResult.ok ? Colors.success + "22" : Colors.danger + "22" }]}>
          <Feather
            name={testResult.ok ? "check-circle" : "alert-circle"}
            size={16}
            color={testResult.ok ? Colors.success : Colors.danger}
          />
          <Text style={[styles.resultText, { color: testResult.ok ? Colors.success : Colors.danger }]}>
            {testResult.message}
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Feather name="shield" size={16} color={Colors.textMuted} />
          <Text style={styles.infoText}>
            All data is encrypted and stored on your device only. No credentials are transmitted to external servers beyond AliExpress API.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="info" size={16} color={Colors.info} />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App</Text>
          <Text style={styles.aboutValue}>AliAffiliate</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>API</Text>
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

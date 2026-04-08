import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { getApiUrl } from "@/lib/query-client";
import { fetch as nativeFetch } from "expo/fetch";
import type { AppColors } from "@/constants/colors";

const TRACKING_IDS_KEY = "@aliaffiliate_tracking_ids";
const SELECTED_ID_KEY = "@aliaffiliate_selected_tracking_id";
const DEFAULT_TRACKING_ID = "default";

interface GeneratedLink {
  source_value: string;
  promotion_link: string;
}

interface LinkGenerateResponse {
  aliexpress_affiliate_link_generate_response: {
    resp_result: {
      resp_code: number;
      resp_msg: string;
      result: {
        promotion_links: {
          promotion_link: GeneratedLink[];
        };
      };
    };
  };
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 16 },
    title: { fontSize: 28, color: c.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 6 },
    subtitle: { fontSize: 13, color: c.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 24 },
    section: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.cardBorder, marginBottom: 14, overflow: "hidden" },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.cardBorder },
    sectionTitle: { flex: 1, fontSize: 12, color: c.textSecondary, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },
    refreshBtn: { padding: 4 },
    idsLoading: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
    idsLoadingText: { fontSize: 13, color: c.textMuted, fontFamily: "Inter_400Regular" },
    idsEmpty: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16 },
    idsEmptyText: { fontSize: 13, color: c.textMuted, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
    dropdownContainer: { paddingHorizontal: 12, paddingVertical: 10 },
    dropdownButton: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.cardBorder, paddingHorizontal: 14, paddingVertical: 12 },
    dropdownButtonOpen: { borderColor: c.primary, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    dropdownSelected: { flex: 1, fontSize: 14, color: c.text, fontFamily: "Inter_500Medium" },
    dropdownList: { backgroundColor: c.surface, borderWidth: 1, borderTopWidth: 0, borderColor: c.primary, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: "hidden" },
    dropdownItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13, borderTopWidth: 1, borderTopColor: c.cardBorder },
    dropdownItemSelected: { backgroundColor: c.primary + "14" },
    dropdownItemText: { fontSize: 14, color: c.textSecondary, fontFamily: "Inter_400Regular", flex: 1 },
    dropdownItemTextSelected: { color: c.primary, fontFamily: "Inter_600SemiBold" },
    inputWrapper: { padding: 12 },
    textArea: { fontSize: 14, color: c.text, fontFamily: "Inter_400Regular", backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.cardBorder, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, minHeight: 80, textAlignVertical: "top" },
    errorBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: c.danger + "22", borderRadius: 12, padding: 14, marginBottom: 14 },
    errorText: { flex: 1, fontSize: 13, color: c.danger, fontFamily: "Inter_400Regular", lineHeight: 18 },
    generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, marginBottom: 20 },
    generateBtnText: { fontSize: 16, color: "#fff", fontFamily: "Inter_700Bold" },
    resultCard: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.success + "44", overflow: "hidden" },
    resultHeader: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: c.cardBorder },
    resultBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    resultBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    resultLink: { fontSize: 13, color: c.info, fontFamily: "Inter_400Regular", lineHeight: 20, padding: 14 },
    resultDivider: { height: 1, backgroundColor: c.cardBorder, marginHorizontal: 14 },
    copyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14 },
    copyBtnSuccess: { backgroundColor: c.success + "11" },
    copyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    unconfigured: { flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
    unconfiguredTitle: { fontSize: 22, color: c.text, fontFamily: "Inter_700Bold" },
    unconfiguredText: { fontSize: 14, color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  });
}

export default function GeneratorScreen() {
  const insets = useSafeAreaInsets();
  const { settings, isConfigured } = useSettings();
  const { t, isRTL } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [trackingIds, setTrackingIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoadingIds, setIsLoadingIds] = useState(false);
  const [idsError, setIdsError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [sourceUrl, setSourceUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  const pickDefaultId = useCallback((ids: string[], savedId?: string | null): string | null => {
    if (!ids.length) return null;
    if (savedId && ids.includes(savedId)) return savedId;
    if (ids.includes(DEFAULT_TRACKING_ID)) return DEFAULT_TRACKING_ID;
    return ids[0];
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    (async () => {
      try {
        const [cachedIdsRaw, cachedSelectedId] = await Promise.all([
          AsyncStorage.getItem(TRACKING_IDS_KEY),
          AsyncStorage.getItem(SELECTED_ID_KEY),
        ]);
        if (cachedIdsRaw) {
          const ids: string[] = JSON.parse(cachedIdsRaw);
          setTrackingIds(ids);
          const picked = pickDefaultId(ids, cachedSelectedId);
          setSelectedId(picked);
        } else {
          await fetchTrackingIds();
        }
      } catch {
        await fetchTrackingIds();
      }
    })();
  }, [isConfigured]);

  const fetchTrackingIds = useCallback(async () => {
    if (!isConfigured) return;
    setIsLoadingIds(true);
    setIdsError(null);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/tracking-ids", baseUrl).toString();
      const res = await nativeFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_key: settings.app_key, app_secret: settings.app_secret }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { tracking_ids: string[] } = await res.json();
      const ids = data.tracking_ids || [];
      setTrackingIds(ids);
      await AsyncStorage.setItem(TRACKING_IDS_KEY, JSON.stringify(ids));
      const picked = pickDefaultId(ids, selectedId);
      setSelectedId(picked);
      if (picked) await AsyncStorage.setItem(SELECTED_ID_KEY, picked);
    } catch {
      setIdsError(t("generator.errorLoadingIds"));
    } finally {
      setIsLoadingIds(false);
    }
  }, [isConfigured, settings.app_key, settings.app_secret, selectedId, pickDefaultId]);

  const handleSelectId = useCallback(async (id: string) => {
    setSelectedId(id);
    setDropdownOpen(false);
    await AsyncStorage.setItem(SELECTED_ID_KEY, id);
  }, []);

  const extractAliExpressUrl = (text: string): string | null => {
    const urlPattern = /https?:\/\/\S+/gi;
    const allUrls = (text.match(urlPattern) || []).map((url) =>
      url.replace(/[\u200F\u200E\u200B\u00A0)>\]}"'.,;:!?]+$/, "")
    );
    const aliUrl = allUrls.find((url) => /aliexpress\.com/i.test(url));
    return aliUrl ?? null;
  };

  const hasAnyUrl = (text: string): boolean =>
    /https?:\/\/\S+/i.test(text);

  const handleGenerate = async () => {
    setGenerateError(null);
    setResult(null);
    setCopied(false);

    if (!selectedId) {
      setGenerateError(t("generator.errorNoIdSelected"));
      return;
    }

    const rawText = sourceUrl.trim();
    if (!rawText) {
      setGenerateError(t("generator.errorEmpty"));
      return;
    }

    const extractedUrl = extractAliExpressUrl(rawText);
    if (!extractedUrl) {
      if (hasAnyUrl(rawText)) {
        setGenerateError(t("generator.errorNotAliExpress"));
      } else {
        setGenerateError(t("generator.errorInvalid"));
      }
      return;
    }

    setIsGenerating(true);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/links/generate", baseUrl).toString();
      const res = await nativeFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_key: settings.app_key,
          app_secret: settings.app_secret,
          source_values: extractedUrl,
          tracking_id: selectedId,
          promotion_link_type: 0,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LinkGenerateResponse = await res.json();
      const respResult = data?.aliexpress_affiliate_link_generate_response?.resp_result;
      if (!respResult) throw new Error(t("generator.errorApi"));
      if (respResult.resp_code !== 200) {
        throw new Error(respResult.resp_msg || t("generator.errorApi"));
      }
      const promotionLink =
        respResult?.result?.promotion_links?.promotion_link?.[0]?.promotion_link;
      if (!promotionLink) throw new Error(t("generator.errorNoResult"));
      setResult(promotionLink);
    } catch (err: any) {
      setGenerateError(err?.message || t("generator.errorApi"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await Clipboard.setStringAsync(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      Alert.alert("", t("generator.errorApi"));
    }
  };

  if (!isConfigured) {
    return (
      <View style={[styles.unconfigured, { paddingTop: topPad + 20 }]}>
        <Feather name="link" size={52} color={colors.textMuted} />
        <Text style={styles.unconfiguredTitle}>{t("generator.setupRequired")}</Text>
        <Text style={styles.unconfiguredText}>{t("generator.setupText")}</Text>
      </View>
    );
  }

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
      <Text style={[styles.title, { textAlign }]}>{t("generator.title")}</Text>
      <Text style={[styles.subtitle, { textAlign }]}>{t("generator.subtitle")}</Text>

      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="tag" size={16} color={colors.accent} />
          <Text style={styles.sectionTitle}>{t("generator.trackingId")}</Text>
          <Pressable
            style={({ pressed }) => [styles.refreshBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={fetchTrackingIds}
            disabled={isLoadingIds}
          >
            {isLoadingIds ? (
              <ActivityIndicator size={13} color={colors.textMuted} />
            ) : (
              <Feather name="refresh-cw" size={13} color={colors.textMuted} />
            )}
          </Pressable>
        </View>

        {isLoadingIds ? (
          <View style={styles.idsLoading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.idsLoadingText}>{t("generator.loadingIds")}</Text>
          </View>
        ) : idsError ? (
          <View style={[styles.idsEmpty, isRTL && { flexDirection: "row-reverse" }]}>
            <Feather name="alert-circle" size={15} color={colors.danger} />
            <Text style={[styles.idsEmptyText, { color: colors.danger }]}>{idsError}</Text>
          </View>
        ) : trackingIds.length === 0 ? (
          <View style={[styles.idsEmpty, isRTL && { flexDirection: "row-reverse" }]}>
            <Feather name="info" size={15} color={colors.textMuted} />
            <Text style={styles.idsEmptyText}>{t("generator.noIds")}</Text>
          </View>
        ) : (
          <View style={styles.dropdownContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.dropdownButton,
                dropdownOpen && styles.dropdownButtonOpen,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => setDropdownOpen((v) => !v)}
            >
              <Feather name="tag" size={14} color={colors.primary} />
              <Text style={styles.dropdownSelected} numberOfLines={1}>
                {selectedId || t("generator.selectId")}
              </Text>
              <Feather
                name={dropdownOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>

            {dropdownOpen && (
              <View style={styles.dropdownList}>
                {trackingIds.map((item) => {
                  const isSelected = selectedId === item;
                  return (
                    <Pressable
                      key={item}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                      onPress={() => handleSelectId(item)}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {item}
                      </Text>
                      {isSelected && (
                        <Feather name="check" size={14} color={colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="link-2" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t("generator.inputLabel")}</Text>
        </View>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.textArea, { textAlign }]}
            value={sourceUrl}
            onChangeText={(v) => {
              setSourceUrl(v);
              setGenerateError(null);
              setResult(null);
              setCopied(false);
            }}
            placeholder={t("generator.inputPlaceholder")}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {generateError && (
        <View style={[styles.errorBanner, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={[styles.errorText, { textAlign }]}>{generateError}</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.generateBtn,
          { opacity: pressed || isGenerating ? 0.8 : 1 },
        ]}
        onPress={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Feather name="zap" size={18} color="#fff" />
            <Text style={styles.generateBtnText}>{t("generator.generateBtn")}</Text>
          </>
        )}
      </Pressable>

      {result && (
        <View style={styles.resultCard}>
          <View style={[styles.resultHeader, isRTL && { flexDirection: "row-reverse" }]}>
            <View style={[styles.resultBadge, { backgroundColor: colors.success + "22" }]}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={[styles.resultBadgeText, { color: colors.success }]}>
                {t("generator.resultTitle")}
              </Text>
            </View>
          </View>
          <Text style={[styles.resultLink, { textAlign }]} selectable numberOfLines={0}>
            {result}
          </Text>
          <View style={styles.resultDivider} />
          <Pressable
            style={({ pressed }) => [
              styles.copyBtn,
              copied && styles.copyBtnSuccess,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleCopy}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={16}
              color={copied ? colors.success : colors.primary}
            />
            <Text style={[styles.copyBtnText, { color: copied ? colors.success : colors.primary }]}>
              {copied ? t("generator.copied") : t("generator.copyBtn")}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

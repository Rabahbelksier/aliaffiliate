import React, { useState, useCallback } from "react";
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
  FlatList,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/query-client";
import { fetch as nativeFetch } from "expo/fetch";

interface GeneratedLink {
  source_value: string;
  promotion_link: string;
}

interface LinkGenerateResponse {
  aliexpress_affiliate_link_generate_response: {
    resp_result: {
      result_code: number;
      result_msg: string;
      result: {
        promotion_links: {
          promotion_link: GeneratedLink[];
        };
      };
    };
  };
}

export default function GeneratorScreen() {
  const insets = useSafeAreaInsets();
  const { settings, isConfigured } = useSettings();
  const { t, isRTL } = useLanguage();

  const [trackingIds, setTrackingIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoadingIds, setIsLoadingIds] = useState(false);
  const [idsError, setIdsError] = useState<string | null>(null);

  const [sourceUrl, setSourceUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

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
      if (ids.length > 0 && !selectedId) {
        setSelectedId(ids[0]);
      }
    } catch {
      setIdsError(t("generator.errorLoadingIds"));
    } finally {
      setIsLoadingIds(false);
    }
  }, [isConfigured, settings.app_key, settings.app_secret]);

  useFocusEffect(
    useCallback(() => {
      fetchTrackingIds();
    }, [fetchTrackingIds])
  );

  const handleGenerate = async () => {
    setGenerateError(null);
    setResult(null);
    setCopied(false);

    if (!selectedId) {
      setGenerateError(t("generator.errorNoIdSelected"));
      return;
    }

    const trimmedUrl = sourceUrl.trim();
    if (!trimmedUrl) {
      setGenerateError(t("generator.errorEmpty"));
      return;
    }
    if (!trimmedUrl.includes("aliexpress.com")) {
      setGenerateError(t("generator.errorInvalid"));
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
          source_values: trimmedUrl,
          tracking_id: selectedId,
          promotion_link_type: 0,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LinkGenerateResponse = await res.json();
      const respResult = data?.aliexpress_affiliate_link_generate_response?.resp_result;
      if (!respResult) throw new Error(t("generator.errorApi"));
      if (respResult.result_code !== 200) {
        throw new Error(respResult.result_msg || t("generator.errorApi"));
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
        <Feather name="link" size={52} color={Colors.textMuted} />
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

      {/* Tracking ID Selector */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="tag" size={16} color={Colors.accent} />
          <Text style={styles.sectionTitle}>{t("generator.trackingId")}</Text>
          <Pressable
            style={({ pressed }) => [styles.refreshBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={fetchTrackingIds}
            disabled={isLoadingIds}
          >
            {isLoadingIds ? (
              <ActivityIndicator size={13} color={Colors.textMuted} />
            ) : (
              <Feather name="refresh-cw" size={13} color={Colors.textMuted} />
            )}
          </Pressable>
        </View>

        {isLoadingIds ? (
          <View style={styles.idsLoading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.idsLoadingText}>{t("generator.loadingIds")}</Text>
          </View>
        ) : idsError ? (
          <View style={[styles.idsEmpty, isRTL && { flexDirection: "row-reverse" }]}>
            <Feather name="alert-circle" size={15} color={Colors.danger} />
            <Text style={[styles.idsEmptyText, { color: Colors.danger }]}>{idsError}</Text>
          </View>
        ) : trackingIds.length === 0 ? (
          <View style={[styles.idsEmpty, isRTL && { flexDirection: "row-reverse" }]}>
            <Feather name="info" size={15} color={Colors.textMuted} />
            <Text style={styles.idsEmptyText}>{t("generator.noIds")}</Text>
          </View>
        ) : (
          <FlatList
            data={trackingIds}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsList}
            scrollEnabled={!!trackingIds.length}
            renderItem={({ item }) => {
              const isSelected = selectedId === item;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.chip,
                    isSelected && styles.chipSelected,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                  onPress={() => setSelectedId(item)}
                >
                  {isSelected && (
                    <Feather name="check" size={12} color={Colors.primary} />
                  )}
                  <Text
                    style={[styles.chipText, isSelected && styles.chipTextSelected]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}

        {selectedId && (
          <View style={[styles.selectedBadge, isRTL && { flexDirection: "row-reverse" }]}>
            <Feather name="check-circle" size={12} color={Colors.primary} />
            <Text style={styles.selectedBadgeText} numberOfLines={1}>
              {selectedId}
            </Text>
          </View>
        )}
      </View>

      {/* Product Link Input */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="link-2" size={16} color={Colors.primary} />
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
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {generateError && (
        <View style={[styles.errorBanner, isRTL && { flexDirection: "row-reverse" }]}>
          <Feather name="alert-triangle" size={16} color={Colors.danger} />
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
            <View style={[styles.resultBadge, { backgroundColor: Colors.success + "22" }]}>
              <Feather name="check-circle" size={14} color={Colors.success} />
              <Text style={[styles.resultBadgeText, { color: Colors.success }]}>
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
              color={copied ? Colors.success : Colors.primary}
            />
            <Text style={[styles.copyBtnText, { color: copied ? Colors.success : Colors.primary }]}>
              {copied ? t("generator.copied") : t("generator.copyBtn")}
            </Text>
          </Pressable>
        </View>
      )}
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
    marginBottom: 14,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  refreshBtn: {
    padding: 4,
  },
  idsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
  idsLoadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  idsEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  idsEmptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  chipsList: {
    padding: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "18",
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  chipTextSelected: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  selectedBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  inputWrapper: {
    padding: 12,
  },
  textArea: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.danger + "22",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.danger,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 20,
  },
  generateBtnText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.success + "44",
    overflow: "hidden",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  resultBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  resultLink: {
    fontSize: 13,
    color: Colors.info,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    padding: 14,
  },
  resultDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 14,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
  },
  copyBtnSuccess: {
    backgroundColor: Colors.success + "11",
  },
  copyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  unconfigured: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  unconfiguredTitle: {
    fontSize: 22,
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  unconfiguredText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetch } from "expo/fetch";
import Constants from "expo-constants";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/query-client";

interface AffiliateConfig {
  text_ar: string;
  text_en: string;
  btn_ar: string;
  btn_en: string;
  link: string;
  version: string;
  baner: string;
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

function getAppVersion(): string {
  return (Constants.expoConfig?.version ?? Constants.manifest?.version ?? "1.0.0") as string;
}

export function AffiliateModal() {
  const colors = useColors();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [config, setConfig] = useState<AffiliateConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const [canClose, setCanClose] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/affiliate-config", baseUrl);
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data: AffiliateConfig | null = await res.json();
      if (!data) return;

      const appVersion = getAppVersion();
      const isOutdated = compareVersions(appVersion, data.version) < 0;
      const isBanerOn = data.baner === "on";

      const shouldShow = isOutdated || isBanerOn;
      const allowClose = isBanerOn && !isOutdated;

      if (shouldShow) {
        setConfig(data);
        setCanClose(allowClose);
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
        ]).start();
      }
    } catch {
    }
  }

  function handleClose() {
    if (!canClose) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }

  function handleLinkPress() {
    if (config?.link) {
      Linking.openURL(config.link);
    }
  }

  if (!visible || !config) return null;

  const text = isRTL ? config.text_ar : config.text_en;
  const btnLabel = isRTL ? config.btn_ar : config.btn_en;
  const hasButton = btnLabel.trim().length > 0;

  const styles = createStyles(colors, isRTL);

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="none"
      onRequestClose={canClose ? handleClose : undefined}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          {canClose && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.text}>{text}</Text>

          {hasButton && config.link ? (
            <Pressable style={styles.actionBtn} onPress={handleLinkPress}>
              <Text style={styles.actionBtnText}>{btnLabel}</Text>
            </Pressable>
          ) : hasButton ? (
            <View style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>{btnLabel}</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useColors>, isRTL: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 24,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    closeBtn: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    closeBtnText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600" as const,
      lineHeight: 16,
    },
    text: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 24,
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
      marginTop: 8,
      marginBottom: 20,
      fontFamily: "Inter_400Regular",
    },
    actionBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 28,
      paddingVertical: 13,
      alignItems: "center",
      width: "100%",
    },
    actionBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
    },
  });
}

import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OrdersList } from "@/components/OrdersList";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { getMaxAllowedRange } from "@/hooks/useOrders";
import type { AppColors } from "@/constants/colors";

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
    title: { fontSize: 28, color: c.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    unconfigured: { flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
    unconfiguredTitle: { fontSize: 22, color: c.text, fontFamily: "Inter_700Bold" },
    unconfiguredText: { fontSize: 14, color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  });
}

export default function CanceledScreen() {
  const insets = useSafeAreaInsets();
  const { isConfigured } = useSettings();
  const { t, isRTL } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const last6Months = getMaxAllowedRange();

  if (!isConfigured) {
    return (
      <View style={[styles.unconfigured, { paddingTop: topPad + 20 }]}>
        <Feather name="settings" size={52} color={colors.textMuted} />
        <Text style={styles.unconfiguredTitle}>{t("dashboard.setupRequired")}</Text>
        <Text style={styles.unconfiguredText}>{t("canceled.setupText")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
        <Text style={[styles.title, { textAlign }]}>{t("canceled.title")}</Text>
        <View style={[styles.badge, { backgroundColor: colors.danger + "22" }]}>
          <Text style={[styles.badgeText, { color: colors.danger }]}>{t("canceled.badge")}</Text>
        </View>
      </View>
      <OrdersList status="Invalid" startTime={last6Months.start} endTime={last6Months.end} timeType="1" emptyLabel={t("canceled.empty")} />
    </View>
  );
}

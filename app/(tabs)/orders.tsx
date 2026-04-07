import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OrdersList } from "@/components/OrdersList";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { getMaxAllowedRange, getMonthString } from "@/hooks/useOrders";
import type { AppColors } from "@/constants/colors";

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: 16, paddingBottom: 12 },
    title: { fontSize: 28, color: c.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
    tabBar: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 },
    tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.cardBorder },
    tabActive: { backgroundColor: c.primary, borderColor: c.primary },
    tabText: { fontSize: 13, color: c.textSecondary, fontFamily: "Inter_500Medium" },
    tabTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
    content: { flex: 1 },
    unconfigured: { flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
    unconfiguredTitle: { fontSize: 22, color: c.text, fontFamily: "Inter_700Bold" },
    unconfiguredText: { fontSize: 14, color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  });
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { isConfigured } = useSettings();
  const { t, isRTL } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState(0);

  const pendingRange = getMaxAllowedRange();
  const thisMonthStr = getMonthString(0);
  const lastMonthStr = getMonthString(-1);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  const TABS = [
    { key: "paid", label: t("orders.badge") },
    { key: "received_this_month", label: t("commission.thisMonth") },
    { key: "received_last_month", label: t("commission.lastMonth") },
  ];

  if (!isConfigured) {
    return (
      <View style={[styles.unconfigured, { paddingTop: topPad + 20 }]}>
        <Feather name="settings" size={52} color={colors.textMuted} />
        <Text style={styles.unconfiguredTitle}>{t("dashboard.setupRequired")}</Text>
        <Text style={styles.unconfiguredText}>{t("orders.setupText")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign }]}>{t("orders.title")}</Text>
      </View>
      <View style={[styles.tabBar, isRTL && { flexDirection: "row-reverse" }]}>
        {TABS.map((tab, i) => (
          <Pressable key={tab.key} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.content}>
        {activeTab === 0 && <OrdersList status="Payment Completed" startTime={pendingRange.start} endTime={pendingRange.end} timeType="1" emptyLabel={t("orders.empty")} />}
        {activeTab === 1 && <OrdersList finished_month={thisMonthStr} emptyLabel={t("orders.empty")} />}
        {activeTab === 2 && <OrdersList finished_month={lastMonthStr} emptyLabel={t("orders.empty")} />}
      </View>
    </View>
  );
}

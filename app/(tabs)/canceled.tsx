import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { OrdersList } from "@/components/OrdersList";
import { useSettings } from "@/context/SettingsContext";
import { Feather } from "@expo/vector-icons";
import { formatDateForApi } from "@/hooks/useOrders";

export default function CanceledScreen() {
  const insets = useSafeAreaInsets();
  const { isConfigured } = useSettings();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const now = new Date();
  const last30 = formatDateForApi(new Date(now.getTime() - 30 * 24 * 3600 * 1000));
  const nowStr = formatDateForApi(now);

  if (!isConfigured) {
    return (
      <View style={[styles.unconfigured, { paddingTop: topPad + 20 }]}>
        <Feather name="settings" size={52} color={Colors.textMuted} />
        <Text style={styles.unconfiguredTitle}>Setup Required</Text>
        <Text style={styles.unconfiguredText}>
          Enter your API credentials in Settings to view canceled orders.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Canceled</Text>
        <View style={[styles.badge, { backgroundColor: Colors.danger + "22" }]}>
          <Text style={[styles.badgeText, { color: Colors.danger }]}>Void</Text>
        </View>
      </View>
      <OrdersList
        status="Invalid"
        startTime={last30}
        endTime={nowStr}
        timeType="1"
        emptyLabel="No canceled orders in the last 30 days."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
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

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { OrdersList } from "@/components/OrdersList";
import { useSettings } from "@/context/SettingsContext";
import { Feather } from "@expo/vector-icons";
import { getLast5MonthsRange } from "@/hooks/useOrders";

export default function SettledScreen() {
  const insets = useSafeAreaInsets();
  const { isConfigured } = useSettings();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const last5Months = getLast5MonthsRange();

  if (!isConfigured) {
    return (
      <View style={[styles.unconfigured, { paddingTop: topPad + 20 }]}>
        <Feather name="settings" size={52} color={Colors.textMuted} />
        <Text style={styles.unconfiguredTitle}>Setup Required</Text>
        <Text style={styles.unconfiguredText}>
          Enter your API credentials in Settings to view settled orders.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settled</Text>
        <View style={[styles.badge, { backgroundColor: Colors.accent + "22" }]}>
          <Text style={[styles.badgeText, { color: Colors.accent }]}>Completed</Text>
        </View>
      </View>
      <OrdersList
        status="Settled"
        startTime={last5Months.start}
        endTime={last5Months.end}
        timeType="1"
        emptyLabel="No settled orders in the last 5 months. Settled orders appear after commissions are confirmed by AliExpress."
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

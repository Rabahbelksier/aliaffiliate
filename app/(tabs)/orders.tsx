import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { OrdersList } from "@/components/OrdersList";
import { useSettings } from "@/context/SettingsContext";
import { Feather } from "@expo/vector-icons";
import { getMonthDateRange, formatDateForApi } from "@/hooks/useOrders";

const TABS = [
  { key: "paid", label: "Paid" },
  { key: "received_this_month", label: "This Month" },
  { key: "received_last_month", label: "Last Month" },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { isConfigured } = useSettings();
  const [activeTab, setActiveTab] = useState(0);

  const thisMonth = getMonthDateRange(0);
  const lastMonth = getMonthDateRange(-1);
  const now = new Date();
  const last30 = formatDateForApi(new Date(now.getTime() - 30 * 24 * 3600 * 1000));
  const nowStr = formatDateForApi(now);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!isConfigured) {
    return (
      <View style={[styles.unconfigured, { paddingTop: topPad + 20 }]}>
        <Feather name="settings" size={52} color={Colors.textMuted} />
        <Text style={styles.unconfiguredTitle}>Setup Required</Text>
        <Text style={styles.unconfiguredText}>
          Enter your API credentials in Settings to view orders.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 0 && (
          <OrdersList
            status="Payment Completed"
            startTime={last30}
            endTime={nowStr}
            timeType="1"
            emptyLabel="No paid orders waiting for delivery in the last 30 days."
          />
        )}
        {activeTab === 1 && (
          <OrdersList
            status="Buyer Confirmed Receipt"
            startTime={thisMonth.start}
            endTime={thisMonth.end}
            timeType="1"
            emptyLabel="No received orders this month."
          />
        )}
        {activeTab === 2 && (
          <OrdersList
            status="Buyer Confirmed Receipt"
            startTime={lastMonth.start}
            endTime={lastMonth.end}
            timeType="1"
            emptyLabel="No received orders last month."
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  tabTextActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    flex: 1,
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

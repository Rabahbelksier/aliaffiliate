import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { StatCard } from "@/components/StatCard";
import { useSettings } from "@/context/SettingsContext";
import { fetchOrders, type AliOrder } from "@/hooks/useOrders";

function getMonthRange(monthOffset = 0): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    start: String(start.getTime()),
    end: String(end.getTime()),
  };
}

interface DashboardData {
  paid: { count: number; commission: number };
  receivedThisMonth: { count: number; commission: number };
  receivedLastMonth: { count: number; commission: number };
  settled: { count: number };
  canceled: { count: number };
}

const emptyData: DashboardData = {
  paid: { count: 0, commission: 0 },
  receivedThisMonth: { count: 0, commission: 0 },
  receivedLastMonth: { count: 0, commission: 0 },
  settled: { count: 0 },
  canceled: { count: 0 },
};

function sumCommission(orders: AliOrder[]): number {
  return orders.reduce((acc, o) => {
    const v = parseFloat(o.estimated_paid_amount || "0") || 0;
    return acc + v;
  }, 0);
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { settings, isConfigured } = useSettings();
  const [data, setData] = useState<DashboardData>(emptyData);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (!isConfigured) return;
    setError(null);
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    const thisMonth = getMonthRange(0);
    const lastMonth = getMonthRange(-1);
    const base = { app_key: settings.app_key, app_secret: settings.app_secret, page_size: 50 };
    const fields = "order_id,estimated_paid_amount,commission_rate,payment_amount,status,created_time,paid_time";

    try {
      const [paidRes, thisMonthRes, lastMonthRes, settledRes, canceledRes] = await Promise.allSettled([
        fetchOrders({ ...base, status: "Payment Completed", fields }),
        fetchOrders({ ...base, status: "Buyer Confirmed Receipt", start_time: thisMonth.start, end_time: thisMonth.end, time_type: "1", fields }),
        fetchOrders({ ...base, status: "Buyer Confirmed Receipt", start_time: lastMonth.start, end_time: lastMonth.end, time_type: "1", fields }),
        fetchOrders({ ...base, status: "Settled", fields }),
        fetchOrders({ ...base, status: "Void", fields }),
      ]);

      const paid = paidRes.status === "fulfilled" ? paidRes.value : { orders: [], total_record_count: 0 };
      const thisM = thisMonthRes.status === "fulfilled" ? thisMonthRes.value : { orders: [], total_record_count: 0 };
      const lastM = lastMonthRes.status === "fulfilled" ? lastMonthRes.value : { orders: [], total_record_count: 0 };
      const settled = settledRes.status === "fulfilled" ? settledRes.value : { orders: [], total_record_count: 0 };
      const canceled = canceledRes.status === "fulfilled" ? canceledRes.value : { orders: [], total_record_count: 0 };

      setData({
        paid: { count: paid.total_record_count, commission: sumCommission(paid.orders) },
        receivedThisMonth: { count: thisM.total_record_count, commission: sumCommission(thisM.orders) },
        receivedLastMonth: { count: lastM.total_record_count, commission: sumCommission(lastM.orders) },
        settled: { count: settled.total_record_count },
        canceled: { count: canceled.total_record_count },
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [settings, isConfigured]);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!isConfigured) {
    return (
      <View style={[styles.unconfigured, { paddingTop: topPad + 20 }]}>
        <Feather name="settings" size={52} color={Colors.textMuted} />
        <Text style={styles.unconfiguredTitle}>Setup Required</Text>
        <Text style={styles.unconfiguredText}>
          Go to Settings and enter your AliExpress Affiliate App Key and Secret to get started.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadDashboard(true)}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Overview</Text>
          <Text style={styles.title}>AliAffiliate</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.primary + "22" }]}>
          <View style={[styles.badgeDot, { backgroundColor: Colors.success }]} />
          <Text style={[styles.badgeText, { color: Colors.primary }]}>Live</Text>
        </View>
      </View>

      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      )}

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching data…</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Order Status</Text>
      <View style={styles.statsGrid}>
        <StatCard
          label="Paid – Pending Delivery"
          value={data.paid.count}
          color={Colors.info}
          subLabel="Est. Commission"
          subValue={data.paid.commission > 0 ? `$${data.paid.commission.toFixed(2)}` : "—"}
        />
        <StatCard
          label="Received This Month"
          value={data.receivedThisMonth.count}
          color={Colors.success}
          subLabel="Est. Commission"
          subValue={data.receivedThisMonth.commission > 0 ? `$${data.receivedThisMonth.commission.toFixed(2)}` : "—"}
        />
        <StatCard
          label="Received Last Month"
          value={data.receivedLastMonth.count}
          color={Colors.primary}
          subLabel="Est. Commission"
          subValue={data.receivedLastMonth.commission > 0 ? `$${data.receivedLastMonth.commission.toFixed(2)}` : "—"}
        />
        <StatCard
          label="Settled Orders"
          value={data.settled.count}
          color={Colors.accent}
        />
        <StatCard
          label="Canceled Orders"
          value={data.canceled.count}
          color={Colors.danger}
        />
      </View>

      <Text style={styles.sectionTitle}>Commission Summary</Text>
      <View style={styles.commissionCard}>
        <View style={styles.commissionRow}>
          <View style={styles.commissionItem}>
            <Text style={styles.commissionLabel}>Paid Orders</Text>
            <Text style={[styles.commissionValue, { color: Colors.info }]}>
              {data.paid.commission > 0 ? `$${data.paid.commission.toFixed(2)}` : "—"}
            </Text>
          </View>
          <View style={styles.commissionDivider} />
          <View style={styles.commissionItem}>
            <Text style={styles.commissionLabel}>This Month</Text>
            <Text style={[styles.commissionValue, { color: Colors.success }]}>
              {data.receivedThisMonth.commission > 0 ? `$${data.receivedThisMonth.commission.toFixed(2)}` : "—"}
            </Text>
          </View>
          <View style={styles.commissionDivider} />
          <View style={styles.commissionItem}>
            <Text style={styles.commissionLabel}>Last Month</Text>
            <Text style={[styles.commissionValue, { color: Colors.primary }]}>
              {data.receivedLastMonth.commission > 0 ? `$${data.receivedLastMonth.commission.toFixed(2)}` : "—"}
            </Text>
          </View>
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  greeting: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  lastUpdated: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.danger + "22",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  commissionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
    marginBottom: 12,
  },
  commissionRow: {
    flexDirection: "row",
    padding: 16,
  },
  commissionItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  commissionDivider: {
    width: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 2,
  },
  commissionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  commissionValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
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

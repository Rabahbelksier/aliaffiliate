import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { StatCard } from "@/components/StatCard";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { fetchOrders, type AliOrder, getMaxAllowedRange, formatDateForApi, getMonthString, getCurrentMonthRange } from "@/hooks/useOrders";
import type { AppColors } from "@/constants/colors";

type RangePeriod = "1m" | "2m" | "3m" | "4m" | "5m" | "6m";

const RANGE_DAYS: Record<RangePeriod, number> = {
  "1m": 30,
  "2m": 60,
  "3m": 90,
  "4m": 120,
  "5m": 150,
  "6m": 179,
};

function getRangeByPeriod(days: number): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  return { start: formatDateForApi(start), end: formatDateForApi(now) };
}

interface DashboardData {
  paid: { count: number; commission: number };
  paidThisMonth: { count: number; commission: number };
  receivedThisMonth: { count: number; commission: number };
  receivedLastMonth: { count: number; commission: number };
  settled: { count: number; commission: number };
  canceled: { count: number; commission: number };
}

const emptyData: DashboardData = {
  paid: { count: 0, commission: 0 },
  paidThisMonth: { count: 0, commission: 0 },
  receivedThisMonth: { count: 0, commission: 0 },
  receivedLastMonth: { count: 0, commission: 0 },
  settled: { count: 0, commission: 0 },
  canceled: { count: 0, commission: 0 },
};

function sumCommission(orders: AliOrder[]): number {
  return orders.reduce((acc, o) => {
    const v = parseFloat(o.estimated_paid_amount || "0") || 0;
    return acc + v;
  }, 0);
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 16, paddingBottom: 120 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
    greeting: { fontSize: 13, color: c.textSecondary, fontFamily: "Inter_400Regular", letterSpacing: 0.5, textTransform: "uppercase" },
    title: { fontSize: 28, color: c.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginTop: 2 },
    badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 6 },
    badgeDot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    lastUpdated: { fontSize: 11, color: c.textMuted, fontFamily: "Inter_400Regular", marginBottom: 20 },
    loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
    loadingText: { fontSize: 13, color: c.textSecondary, fontFamily: "Inter_400Regular" },
    errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.danger + "22", borderRadius: 10, padding: 12, marginBottom: 16 },
    errorText: { fontSize: 13, color: c.danger, fontFamily: "Inter_400Regular", flex: 1 },
    sectionTitle: { fontSize: 13, color: c.textSecondary, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
    commissionCard: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.cardBorder, overflow: "hidden", marginBottom: 12 },
    commissionRow: { flexDirection: "row", padding: 16 },
    commissionItem: { flex: 1, alignItems: "center", gap: 6 },
    commissionDivider: { width: 1, backgroundColor: c.cardBorder, marginVertical: 2 },
    commissionLabel: { fontSize: 11, color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", alignSelf: "stretch", flexShrink: 1 },
    commissionValue: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
    unconfigured: { flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
    unconfiguredTitle: { fontSize: 22, color: c.text, fontFamily: "Inter_700Bold" },
    unconfiguredText: { fontSize: 14, color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
    dropdownCard: { backgroundColor: c.card, borderRadius: 18, borderWidth: 1, borderColor: c.cardBorder, width: "100%", overflow: "hidden", paddingVertical: 8 },
    dropdownTitle: { fontSize: 13, color: c.textMuted, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.cardBorder },
    dropdownOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
    dropdownOptionSelected: { backgroundColor: c.primary + "15" },
    dropdownOptionText: { fontSize: 16, color: c.text, fontFamily: "Inter_400Regular" },
    dropdownOptionTextSelected: { color: c.primary, fontFamily: "Inter_600SemiBold" },
    telegramLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 20 },
    telegramText: { fontSize: 14, color: c.textSecondary, fontFamily: "Inter_500Medium" },
  });
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, isConfigured } = useSettings();
  const { t, isRTL, language } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Stable ranges computed once per render (date-based, session-stable)
  const pendingRange = getMaxAllowedRange();
  const currentMonthRange = getCurrentMonthRange();
  const thisMonthStr = getMonthString(0);
  const lastMonthStr = getMonthString(-1);

  const [data, setData] = useState<DashboardData>(emptyData);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingSettled, setIsLoadingSettled] = useState(false);
  const [isLoadingCanceled, setIsLoadingCanceled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [settledRange, setSettledRangeState] = useState<RangePeriod>("6m");
  const [canceledRange, setCanceledRangeState] = useState<RangePeriod>("6m");
  const settledRangeRef = useRef<RangePeriod>("6m");
  const canceledRangeRef = useRef<RangePeriod>("6m");

  const [showDropdown, setShowDropdown] = useState<null | "settled" | "canceled">(null);

  function setSettledRange(r: RangePeriod) {
    settledRangeRef.current = r;
    setSettledRangeState(r);
  }
  function setCanceledRange(r: RangePeriod) {
    canceledRangeRef.current = r;
    setCanceledRangeState(r);
  }

  const RANGE_OPTIONS: Array<{ key: RangePeriod; label: string }> = [
    { key: "1m", label: language === "ar" ? "شهر" : "1 Month" },
    { key: "2m", label: language === "ar" ? "شهرين" : "2 Months" },
    { key: "3m", label: language === "ar" ? "3 أشهر" : "3 Months" },
    { key: "4m", label: language === "ar" ? "4 أشهر" : "4 Months" },
    { key: "5m", label: language === "ar" ? "5 أشهر" : "5 Months" },
    { key: "6m", label: language === "ar" ? "6 أشهر" : "6 Months" },
  ];

  const getRangeLabel = (range: RangePeriod) =>
    RANGE_OPTIONS.find((o) => o.key === range)?.label ?? range;

  const loadDashboard = useCallback(async (refresh = false) => {
    if (!isConfigured) return;
    setError(null);
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    const pendingRange = getMaxAllowedRange();
    const currentMonthRange = getCurrentMonthRange();
    const thisMonthStr = getMonthString(0);
    const lastMonthStr = getMonthString(-1);
    const settledRangeObj = getRangeByPeriod(RANGE_DAYS[settledRangeRef.current]);
    const canceledRangeObj = getRangeByPeriod(RANGE_DAYS[canceledRangeRef.current]);

    const b = {
      app_key: settings.app_key,
      app_secret: settings.app_secret,
      page_size: 50,
    };

    try {
      const [paidRes, paidThisMonthRes, thisMonthRes, lastMonthRes, settledRes, canceledRes] = await Promise.allSettled([
        fetchOrders({ ...b, status: "Payment Completed", start_time: pendingRange.start, end_time: pendingRange.end }),
        fetchOrders({ ...b, status: "Payment Completed", start_time: currentMonthRange.start, end_time: currentMonthRange.end }),
        fetchOrders({ ...b, finished_month: thisMonthStr }),
        fetchOrders({ ...b, finished_month: lastMonthStr }),
        fetchOrders({ ...b, status: "Completed Settlement", start_time: settledRangeObj.start, end_time: settledRangeObj.end }),
        fetchOrders({ ...b, status: "Invalid", start_time: canceledRangeObj.start, end_time: canceledRangeObj.end }),
      ]);

      const paid = paidRes.status === "fulfilled" ? paidRes.value : { orders: [], total_record_count: 0 };
      const paidThisMonth = paidThisMonthRes.status === "fulfilled" ? paidThisMonthRes.value : { orders: [], total_record_count: 0 };
      const thisM = thisMonthRes.status === "fulfilled" ? thisMonthRes.value : { orders: [], total_record_count: 0 };
      const lastM = lastMonthRes.status === "fulfilled" ? lastMonthRes.value : { orders: [], total_record_count: 0 };
      const settled = settledRes.status === "fulfilled" ? settledRes.value : { orders: [], total_record_count: 0 };
      const canceled = canceledRes.status === "fulfilled" ? canceledRes.value : { orders: [], total_record_count: 0 };

      setData({
        paid: { count: paid.total_record_count, commission: sumCommission(paid.orders) },
        paidThisMonth: { count: paidThisMonth.total_record_count, commission: sumCommission(paidThisMonth.orders) },
        receivedThisMonth: { count: thisM.total_record_count, commission: sumCommission(thisM.orders) },
        receivedLastMonth: { count: lastM.total_record_count, commission: sumCommission(lastM.orders) },
        settled: { count: settled.total_record_count, commission: sumCommission(settled.orders) },
        canceled: { count: canceled.total_record_count, commission: sumCommission(canceled.orders) },
      });
      setLastUpdated(new Date());
    } catch {
      setError(t("dashboard.error"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [settings, isConfigured]);

  const loadSettledStat = useCallback(async (range: RangePeriod) => {
    if (!isConfigured) return;
    setIsLoadingSettled(true);
    const rangeObj = getRangeByPeriod(RANGE_DAYS[range]);
    try {
      const res = await fetchOrders({
        app_key: settings.app_key,
        app_secret: settings.app_secret,
        page_size: 50,
        status: "Completed Settlement",
        start_time: rangeObj.start,
        end_time: rangeObj.end,
      });
      setData((prev) => ({
        ...prev,
        settled: { count: res.total_record_count, commission: sumCommission(res.orders) },
      }));
    } catch {
      setData((prev) => ({ ...prev, settled: { count: 0, commission: 0 } }));
    } finally { setIsLoadingSettled(false); }
  }, [settings, isConfigured]);

  const loadCanceledStat = useCallback(async (range: RangePeriod) => {
    if (!isConfigured) return;
    setIsLoadingCanceled(true);
    const rangeObj = getRangeByPeriod(RANGE_DAYS[range]);
    try {
      const res = await fetchOrders({
        app_key: settings.app_key,
        app_secret: settings.app_secret,
        page_size: 50,
        status: "Invalid",
        start_time: rangeObj.start,
        end_time: rangeObj.end,
      });
      setData((prev) => ({
        ...prev,
        canceled: { count: res.total_record_count, commission: sumCommission(res.orders) },
      }));
    } catch {
      setData((prev) => ({ ...prev, canceled: { count: 0, commission: 0 } }));
    } finally { setIsLoadingCanceled(false); }
  }, [settings, isConfigured]);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSettledRangeSelect = (range: RangePeriod) => {
    setShowDropdown(null);
    setSettledRange(range);
    loadSettledStat(range);
  };

  const handleCanceledRangeSelect = (range: RangePeriod) => {
    setShowDropdown(null);
    setCanceledRange(range);
    loadCanceledStat(range);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  if (!isConfigured) {
    return (
      <View style={[styles.unconfigured, { paddingTop: topPad + 20 }]}>
        <Feather name="settings" size={52} color={colors.textMuted} />
        <Text style={styles.unconfiguredTitle}>{t("dashboard.setupRequired")}</Text>
        <Text style={styles.unconfiguredText}>{t("dashboard.setupText")}</Text>
      </View>
    );
  }

  const locale = isRTL ? "ar-SA" : "en-US";

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
          <View>
            <Text style={[styles.greeting, { textAlign }]}>{t("dashboard.overview")}</Text>
            <Text style={[styles.title, { textAlign }]}>{t("dashboard.appName")}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.success + "22" }]}>
            <View style={[styles.badgeDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.badgeText, { color: colors.success }]}>{t("dashboard.live")}</Text>
          </View>
        </View>

        {lastUpdated && (
          <Text style={[styles.lastUpdated, { textAlign }]}>
            {t("dashboard.updated")} {lastUpdated.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </Text>
        )}

        {isLoading && (
          <View style={[styles.loadingRow, isRTL && { flexDirection: "row-reverse" }]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>{t("dashboard.fetching")}</Text>
          </View>
        )}

        {error && (
          <View style={[styles.errorBanner, isRTL && { flexDirection: "row-reverse" }]}>
            <Feather name="alert-triangle" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { textAlign }]}>{error}</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { textAlign }]}>{t("dashboard.orderStatus")}</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label={t("stat.paidPending")}
            value={data.paid.count}
            color={colors.info}
            subLabel={t("stat.estCommission")}
            subValue={data.paid.commission > 0 ? `$${data.paid.commission.toFixed(2)}` : "—"}
            isRTL={isRTL}
            badge={t("stat.all")}
            onPress={() => router.push({
              pathname: "/orders-list",
              params: {
                title: `${t("stat.paidPending")} · ${t("stat.all")}`,
                status: "Payment Completed",
                startTime: pendingRange.start,
                endTime: pendingRange.end,
                timeType: "1",
                emptyLabel: t("orders.empty"),
              },
            })}
          />
          <StatCard
            label={t("stat.paidPendingThisMonth")}
            value={data.paidThisMonth.count}
            color={colors.info}
            subLabel={t("stat.estCommission")}
            subValue={data.paidThisMonth.commission > 0 ? `$${data.paidThisMonth.commission.toFixed(2)}` : "—"}
            isRTL={isRTL}
            badge={t("stat.thisMonth")}
            onPress={() => router.push({
              pathname: "/orders-list",
              params: {
                title: `${t("stat.paidPendingThisMonth")} · ${t("stat.thisMonth")}`,
                status: "Payment Completed",
                startTime: currentMonthRange.start,
                endTime: currentMonthRange.end,
                timeType: "1",
                emptyLabel: t("orders.empty"),
              },
            })}
          />
          <StatCard
            label={t("stat.receivedThisMonth")}
            value={data.receivedThisMonth.count}
            color={colors.success}
            subLabel={t("stat.estCommission")}
            subValue={data.receivedThisMonth.commission > 0 ? `$${data.receivedThisMonth.commission.toFixed(2)}` : "—"}
            isRTL={isRTL}
            onPress={() => router.push({
              pathname: "/orders-list",
              params: {
                title: t("stat.receivedThisMonth"),
                finishedMonth: thisMonthStr,
                emptyLabel: t("orders.empty"),
              },
            })}
          />
          <StatCard
            label={t("stat.receivedLastMonth")}
            value={data.receivedLastMonth.count}
            color={colors.primary}
            subLabel={t("stat.estCommission")}
            subValue={data.receivedLastMonth.commission > 0 ? `$${data.receivedLastMonth.commission.toFixed(2)}` : "—"}
            isRTL={isRTL}
            onPress={() => router.push({
              pathname: "/orders-list",
              params: {
                title: t("stat.receivedLastMonth"),
                finishedMonth: lastMonthStr,
                emptyLabel: t("orders.empty"),
              },
            })}
          />
          <StatCard
            label={t("stat.settledOrders")}
            value={isLoadingSettled ? "…" : data.settled.count}
            color={colors.accent}
            subLabel={t("stat.settledCommission")}
            subValue={isLoadingSettled ? "…" : data.settled.commission > 0 ? `$${data.settled.commission.toFixed(2)}` : "—"}
            isRTL={isRTL}
            rangeLabel={getRangeLabel(settledRange)}
            onRangePress={() => setShowDropdown("settled")}
            onPress={() => {
              const rangeObj = getRangeByPeriod(RANGE_DAYS[settledRangeRef.current]);
              router.push({
                pathname: "/orders-list",
                params: {
                  title: `${t("stat.settledOrders")} · ${getRangeLabel(settledRange)}`,
                  status: "Completed Settlement",
                  startTime: rangeObj.start,
                  endTime: rangeObj.end,
                  timeType: "1",
                  emptyLabel: t("settled.empty"),
                },
              });
            }}
          />
          <StatCard
            label={t("stat.canceledOrders")}
            value={isLoadingCanceled ? "…" : data.canceled.count}
            color={colors.danger}
            subLabel={t("stat.commission")}
            subValue={isLoadingCanceled ? "…" : data.canceled.commission > 0 ? `$${data.canceled.commission.toFixed(2)}` : "—"}
            isRTL={isRTL}
            rangeLabel={getRangeLabel(canceledRange)}
            onRangePress={() => setShowDropdown("canceled")}
            onPress={() => {
              const rangeObj = getRangeByPeriod(RANGE_DAYS[canceledRangeRef.current]);
              router.push({
                pathname: "/orders-list",
                params: {
                  title: `${t("stat.canceledOrders")} · ${getRangeLabel(canceledRange)}`,
                  status: "Invalid",
                  startTime: rangeObj.start,
                  endTime: rangeObj.end,
                  timeType: "1",
                  emptyLabel: t("canceled.empty"),
                },
              });
            }}
          />
        </View>

        <Text style={[styles.sectionTitle, { textAlign }]}>{t("dashboard.commissionSummary")}</Text>
        <View style={styles.commissionCard}>
          <View style={[styles.commissionRow, isRTL && { flexDirection: "row-reverse" }]}>
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>{t("commission.paidOrders")}</Text>
              <Text style={[styles.commissionValue, { color: colors.info }]}>
                {data.paid.commission > 0 ? `$${data.paid.commission.toFixed(2)}` : "—"}
              </Text>
            </View>
            <View style={styles.commissionDivider} />
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>{t("commission.summary.thisMonth")}</Text>
              <Text style={[styles.commissionValue, { color: colors.success }]}>
                {data.receivedThisMonth.commission > 0 ? `$${data.receivedThisMonth.commission.toFixed(2)}` : "—"}
              </Text>
            </View>
            <View style={styles.commissionDivider} />
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>{t("commission.summary.lastMonth")}</Text>
              <Text style={[styles.commissionValue, { color: colors.primary }]}>
                {data.receivedLastMonth.commission > 0 ? `$${data.receivedLastMonth.commission.toFixed(2)}` : "—"}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.telegramLink} onPress={() => Linking.openURL("https://t.me/aliaffiliate213")}>
          <FontAwesome5 name="telegram" size={22} color="#229ED9" />
          <Text style={styles.telegramText}>{t("social.followTelegram")}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={showDropdown !== null} animationType="fade" onRequestClose={() => setShowDropdown(null)}>
        <TouchableWithoutFeedback onPress={() => setShowDropdown(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownCard}>
                <Text style={[styles.dropdownTitle, { textAlign }]}>
                  {showDropdown === "settled" ? t("stat.settledOrders") : t("stat.canceledOrders")}
                </Text>
                {RANGE_OPTIONS.map((opt) => {
                  const isSelected = showDropdown === "settled" ? settledRange === opt.key : canceledRange === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                      onPress={() => showDropdown === "settled" ? handleSettledRangeSelect(opt.key) : handleCanceledRangeSelect(opt.key)}
                    >
                      <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextSelected]}>{opt.label}</Text>
                      {isSelected && <Feather name="check" size={16} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

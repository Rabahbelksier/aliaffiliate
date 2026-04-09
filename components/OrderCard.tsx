import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Linking, Alert } from "react-native";
import { Image } from "expo-image";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import type { AliOrder } from "@/hooks/useOrders";
import type { AppColors } from "@/constants/colors";

interface OrderCardProps {
  order: AliOrder;
}

function statusLabel(status?: string, t?: (key: string) => string): string {
  const translate = t || ((k: string) => k);
  switch (status) {
    case "Payment Completed": return translate("orderCard.paid");
    case "Buyer Confirmed Receipt": return translate("orderCard.received");
    case "Completed Settlement": return translate("orderCard.settled");
    case "Settled": return translate("orderCard.settled");
    case "Invalid": return translate("orderCard.canceled");
    case "Void": return translate("orderCard.canceled");
    default: return status || translate("orderCard.unknown");
  }
}

function statusColor(status: string | undefined, c: AppColors): string {
  switch (status) {
    case "Payment Completed": return c.info;
    case "Buyer Confirmed Receipt": return c.success;
    case "Completed Settlement": return c.accent;
    case "Settled": return c.accent;
    case "Invalid": return c.danger;
    case "Void": return c.danger;
    default: return c.textMuted;
  }
}

function formatDate(ts?: string, locale?: string): string {
  if (!ts) return "—";
  const normalized = ts.includes("T") ? ts : ts.replace(" ", "T");
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString(locale || "en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  const ms = Number(ts);
  if (!isNaN(ms) && ms > 1e10) {
    return new Date(ms).toLocaleDateString(locale || "en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return ts;
}

function calcCommission(amount?: string, rate?: string): string {
  const a = parseFloat(amount || "0");
  const r = parseFloat(rate || "0");
  if (!a || !r) return "—";
  return (a * r / 100).toFixed(2);
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    card: { backgroundColor: c.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: c.cardBorder, overflow: "hidden" },
    row: { flexDirection: "row", padding: 14, gap: 12 },
    image: { width: 72, height: 72, borderRadius: 10, backgroundColor: c.surface, flexShrink: 0 },
    imagePlaceholder: { alignItems: "center", justifyContent: "center" },
    info: { flex: 1, gap: 4 },
    topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
    country: { fontSize: 11, color: c.textMuted, fontFamily: "Inter_400Regular" },
    title: { fontSize: 13, color: c.text, fontFamily: "Inter_500Medium", lineHeight: 18 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    meta: { fontSize: 11, color: c.textMuted, fontFamily: "Inter_400Regular" },
    orderIdRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    orderIdText: { fontSize: 11, color: c.textMuted, fontFamily: "Inter_400Regular", flex: 1 },
    divider: { height: 1, backgroundColor: c.cardBorder, marginHorizontal: 14 },
    financialRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
    finItem: { flex: 1, alignItems: "center", gap: 2 },
    finLabel: { fontSize: 10, color: c.textMuted, fontFamily: "Inter_400Regular" },
    finValue: { fontSize: 13, color: c.text, fontFamily: "Inter_600SemiBold" },
    finSep: { width: 1, height: 24, backgroundColor: c.cardBorder },
  });
}

export function OrderCard({ order }: OrderCardProps) {
  const { t, isRTL } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const commission = order.estimated_paid_amount || calcCommission(order.payment_amount, order.commission_rate);
  const sColor = statusColor(order.status, colors);
  const locale = isRTL ? "ar-SA" : "en-US";

  const handlePress = () => {
    if (order.product_detail_url) {
      Linking.openURL(order.product_detail_url);
    }
  };

  const handleCopyOrderId = async () => {
    if (!order.order_id) return;
    try {
      await Clipboard.setStringAsync(order.order_id);
      Alert.alert("", t("orderCard.orderIdCopied"));
    } catch {}
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
      onPress={handlePress}
    >
      <View style={[styles.row, isRTL && { flexDirection: "row-reverse" }]}>
        {order.product_main_image_url ? (
          <Image
            source={{ uri: order.product_main_image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Feather name="package" size={24} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.info}>
          <View style={[styles.topRow, isRTL && { flexDirection: "row-reverse" }]}>
            <View style={[styles.statusBadge, { backgroundColor: sColor + "22" }]}>
              <Text style={[styles.statusText, { color: sColor }]}>
                {statusLabel(order.status, t)}
              </Text>
            </View>
            {order.ship_to_country && (
              <Text style={styles.country}>{order.ship_to_country}</Text>
            )}
          </View>

          <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
            {order.product_title || `Order #${order.order_id}`}
          </Text>

          {order.order_id && (
            <Pressable
              style={({ pressed }) => [
                styles.orderIdRow,
                isRTL && { flexDirection: "row-reverse" },
                { opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={handleCopyOrderId}
            >
              <MaterialCommunityIcons name="pound" size={11} color={colors.primary} />
              <Text style={[styles.orderIdText, { color: colors.primary }]} numberOfLines={1}>
                {order.order_id}
              </Text>
              <Feather name="copy" size={10} color={colors.primary} />
            </Pressable>
          )}

          <View style={[styles.metaRow, isRTL && { flexDirection: "row-reverse" }]}>
            <Feather name="calendar" size={11} color={colors.textMuted} />
            <Text style={styles.meta}>
              {formatDate(order.created_time || order.paid_time, locale)}
            </Text>
          </View>

          {order.tracking_id && (
            <View style={[styles.metaRow, isRTL && { flexDirection: "row-reverse" }]}>
              <MaterialCommunityIcons name="tag-outline" size={11} color={colors.textMuted} />
              <Text style={styles.meta}>{order.tracking_id}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={[styles.financialRow, isRTL && { flexDirection: "row-reverse" }]}>
        <View style={styles.finItem}>
          <Text style={styles.finLabel}>{t("orderCard.payment")}</Text>
          <Text style={styles.finValue}>
            {order.payment_amount ? `$${parseFloat(order.payment_amount).toFixed(2)}` : "—"}
          </Text>
        </View>

        <View style={styles.finSep} />

        <View style={styles.finItem}>
          <Text style={styles.finLabel}>{t("orderCard.rate")}</Text>
          <Text style={styles.finValue}>
            {order.commission_rate
              ? order.commission_rate.includes("%")
                ? order.commission_rate
                : `${order.commission_rate}%`
              : "—"}
          </Text>
        </View>

        <View style={styles.finSep} />

        <View style={styles.finItem}>
          <Text style={styles.finLabel}>{t("orderCard.commission")}</Text>
          <Text style={[styles.finValue, { color: colors.success }]}>
            {commission !== "—" ? `$${parseFloat(commission).toFixed(2)}` : "—"}
          </Text>
        </View>

        <Feather name="external-link" size={14} color={colors.textMuted} style={{ alignSelf: "center" }} />
      </View>
    </Pressable>
  );
}

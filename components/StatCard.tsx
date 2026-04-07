import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { AppColors } from "@/constants/colors";

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  subValue?: string;
  color?: string;
  onPress?: () => void;
  isRTL?: boolean;
  rangeLabel?: string;
  onRangePress?: () => void;
  badge?: string;
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    card: { backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.cardBorder, minWidth: "47%", flex: 1 },
    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    rangeBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: c.cardBorder, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    rangeBtnText: { fontSize: 10, color: c.textMuted, fontFamily: "Inter_500Medium" },
    value: { fontSize: 28, fontWeight: "700", color: c.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
    label: { fontSize: 12, color: c.textSecondary, marginTop: 4, fontFamily: "Inter_400Regular", lineHeight: 16 },
    subRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.cardBorder },
    subLabel: { fontSize: 11, color: c.textMuted, fontFamily: "Inter_400Regular" },
    subValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  });
}

export function StatCard({ label, value, subLabel, subValue, color, onPress, isRTL, rangeLabel, onRangePress, badge }: StatCardProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dotColor = color ?? colors.primary;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.topRow, isRTL && { flexDirection: "row-reverse" }]}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {badge && (
          <View style={[styles.badge, { backgroundColor: dotColor + "22" }]}>
            <Text style={[styles.badgeText, { color: dotColor }]}>{badge}</Text>
          </View>
        )}
        {rangeLabel && onRangePress && (
          <Pressable
            onPress={onRangePress}
            style={({ pressed }) => [styles.rangeBtn, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={8}
          >
            <Text style={styles.rangeBtnText}>{rangeLabel}</Text>
            <Feather name="chevron-down" size={10} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      <Text style={[styles.value, { textAlign }]}>{value}</Text>
      <Text style={[styles.label, { textAlign }]}>{label}</Text>
      {subLabel && subValue && (
        <View style={[styles.subRow, isRTL && { flexDirection: "row-reverse" }]}>
          <Text style={styles.subLabel}>{subLabel}</Text>
          <Text style={[styles.subValue, { color: dotColor }]}>{subValue}</Text>
        </View>
      )}
    </Pressable>
  );
}

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

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

export function StatCard({ label, value, subLabel, subValue, color = Colors.primary, onPress, isRTL, rangeLabel, onRangePress, badge }: StatCardProps) {
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.topRow, isRTL && { flexDirection: "row-reverse" }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        {badge && (
          <View style={[styles.badge, { backgroundColor: color + "22" }]}>
            <Text style={[styles.badgeText, { color }]}>{badge}</Text>
          </View>
        )}
        {rangeLabel && onRangePress && (
          <Pressable
            onPress={onRangePress}
            style={({ pressed }) => [styles.rangeBtn, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={8}
          >
            <Text style={styles.rangeBtnText}>{rangeLabel}</Text>
            <Feather name="chevron-down" size={10} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>
      <Text style={[styles.value, { textAlign }]}>{value}</Text>
      <Text style={[styles.label, { textAlign }]}>{label}</Text>
      {subLabel && subValue && (
        <View style={[styles.subRow, isRTL && { flexDirection: "row-reverse" }]}>
          <Text style={styles.subLabel}>{subLabel}</Text>
          <Text style={[styles.subValue, { color }]}>{subValue}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: "47%",
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  rangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  rangeBtnText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  subRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  subLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  subValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});

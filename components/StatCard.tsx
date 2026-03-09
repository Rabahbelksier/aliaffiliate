import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors } from "@/constants/colors";

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  subValue?: string;
  color?: string;
  onPress?: () => void;
}

export function StatCard({ label, value, subLabel, subValue, color = Colors.primary, onPress }: StatCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subLabel && subValue && (
        <View style={styles.subRow}>
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
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

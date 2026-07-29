import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { OrdersList } from "@/components/OrdersList";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import type { AppColors } from "@/constants/colors";

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    title: {
      flex: 1,
      fontSize: 20,
      color: c.text,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.3,
    },
  });
}

export default function OrdersListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isRTL, t } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const params = useLocalSearchParams<{
    title?: string;
    status?: string;
    startTime?: string;
    endTime?: string;
    timeType?: string;
    finishedMonth?: string;
    emptyLabel?: string;
  }>();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Feather
            name={isRTL ? "chevron-right" : "chevron-left"}
            size={20}
            color={colors.text}
          />
        </Pressable>
        <Text style={[styles.title, { textAlign }]} numberOfLines={2}>
          {params.title || t("orders.title")}
        </Text>
      </View>

      <OrdersList
        status={params.status || undefined}
        startTime={params.startTime || undefined}
        endTime={params.endTime || undefined}
        timeType={params.timeType || undefined}
        finished_month={params.finishedMonth || undefined}
        emptyLabel={params.emptyLabel || undefined}
      />
    </View>
  );
}

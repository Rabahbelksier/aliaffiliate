import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";

interface PayoutModalProps {
  /** Commission amount to display, or null when hidden. */
  amount: number | null;
  onClose: () => void;
}

export function PayoutModal({ amount, onClose }: PayoutModalProps) {
  const colors = useColors();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  const visible = amount !== null && amount > 0;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.88);
    }
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  if (!visible || amount === null) return null;

  const styles = createStyles(colors, isRTL);
  const formattedAmount = `$${amount.toFixed(2)}`;

  const title = isRTL ? "تم صب عمولة هذا الشهر 🎉" : "Commission Paid This Month 🎉";
  const message = isRTL ? "عمولتك جاهزة للسحب" : "Your commission is ready to withdraw";
  const amountLabel = isRTL ? "قيمة العمولة" : "Commission Amount";

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Feather name="check-circle" size={32} color={colors.success} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Amount pill */}
          <View style={styles.amountWrapper}>
            <Text style={styles.amountLabel}>{amountLabel}</Text>
            <Text style={styles.amountValue}>{formattedAmount}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useColors>, isRTL: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.success + "44",
      padding: 28,
      alignItems: "center",
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 14,
    },
    closeBtn: {
      position: "absolute",
      top: 14,
      right: 14,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    closeBtnText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600" as const,
      lineHeight: 16,
    },
    iconWrapper: {
      marginBottom: 16,
      marginTop: 8,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.success + "1A",
      borderWidth: 1,
      borderColor: colors.success + "44",
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    message: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    amountWrapper: {
      backgroundColor: colors.success + "1A",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.success + "44",
      paddingHorizontal: 28,
      paddingVertical: 14,
      alignItems: "center",
      width: "100%",
    },
    amountLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: colors.success,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: 4,
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    amountValue: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: colors.success,
      letterSpacing: -0.5,
    },
  });
}

const primary = "#FF6B35";
const primaryDark = "#E55A25";
const accent = "#FFB800";
const success = "#00D68F";
const warning = "#FFB800";
const danger = "#FF4757";
const info = "#4A90D9";

export const Colors = {
  primary,
  primaryDark,
  accent,
  success,
  warning,
  danger,
  info,

  background: "#0A0A12",
  backgroundSecondary: "#12121E",
  card: "#1A1A28",
  cardBorder: "#252540",
  surface: "#1E1E32",

  text: "#FFFFFF",
  textSecondary: "#8888AA",
  textMuted: "#555575",

  tabBar: "#0E0E1A",
  tabBarBorder: "#1E1E35",
  tabActive: primary,
  tabInactive: "#555575",
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: Colors.tabInactive,
    tabIconSelected: Colors.primary,
  },
};

const primary = "#FF6B35";
const primaryDark = "#E55A25";
const accent = "#FFB800";
const success = "#00D68F";
const warning = "#FFB800";
const danger = "#FF4757";
const info = "#4A90D9";

const semantic = { primary, primaryDark, accent, success, warning, danger, info };

export const darkColors = {
  ...semantic,
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

export const lightColors = {
  ...semantic,
  background: "#F4F4FC",
  backgroundSecondary: "#EAEAF5",
  card: "#FFFFFF",
  cardBorder: "#E0E0F0",
  surface: "#EEEEF8",
  text: "#0F0F2A",
  textSecondary: "#5A5A8A",
  textMuted: "#9090B8",
  tabBar: "#FFFFFF",
  tabBarBorder: "#E0E0F0",
  tabActive: primary,
  tabInactive: "#9090B8",
};

export type AppColors = typeof darkColors;

export const Colors = darkColors;

export default {
  light: {
    text: lightColors.text,
    background: lightColors.background,
    tint: lightColors.primary,
    tabIconDefault: lightColors.tabInactive,
    tabIconSelected: lightColors.primary,
  },
};

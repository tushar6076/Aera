import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { colors, typography, shadows } from "../../styles/theme";
import { Wind, History, Sliders, Wifi, WifiOff } from "lucide-react-native";

export default function AppNavbar({ isConnected = false, selectedDeviceId }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.navbarWrapper, { paddingTop: insets.top }]}>
      <View style={styles.navbar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Wind size={16} color={colors.card} />
          </View>
          <Text style={styles.brandText}>
            AERA<Text style={{ color: colors.primary }}>.</Text>
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Badge variant="outline" style={styles.statusBadge}>
            {isConnected ? (
              <Wifi size={11} color={colors.success} />
            ) : (
              <WifiOff size={11} color={colors.danger} />
            )}
            <Text
              style={[
                styles.statusText,
                { color: isConnected ? colors.success : colors.danger },
              ]}
            >
              {isConnected ? "Live" : "Offline"}
            </Text>
          </Badge>

          <Button
            variant="outline"
            size="icon"
            onPress={() =>
              navigation.navigate("History", { deviceId: selectedDeviceId })
            }
            style={styles.iconBtn}
          >
            <History size={15} color={colors.textSecondary} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onPress={() => navigation.navigate("Settings")}
            style={styles.iconBtn}
          >
            <Sliders size={15} color={colors.textSecondary} />
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbarWrapper: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.soft,
  },
  navbar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    color: colors.text,
    letterSpacing: -0.3,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    backgroundColor: colors.backgroundSubtle,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  },
});
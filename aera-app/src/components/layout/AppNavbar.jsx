// aera-app/src/components/layout/AppNavbar.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDevice } from "../../hooks/useDevice";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { colors, typography, shadows } from "../../styles/theme";
import { Wind, History, Sliders, Wifi, WifiOff, Globe } from "lucide-react-native";

export default function AppNavbar({ isConnected = false, selectedDeviceId }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const { selectedDevice, deviceLiveState } = useDevice();
  const activeDeviceId = selectedDeviceId ?? selectedDevice?.id;
  const hasHardware = Boolean(activeDeviceId);

  // Hardware is truly active only if Redis confirms it or live telemetry packets are actively arriving
  const isOnline = hasHardware && (deviceLiveState ? deviceLiveState.is_online : isConnected);

  const getStatusConfig = () => {
    if (!hasHardware) {
      return {
        label: "Ambient",
        color: colors.primary,
        bgColor: colors.primaryLight,
        borderColor: colors.primaryBorder,
        Icon: Globe,
      };
    }
    if (isOnline) {
      return {
        label: "Live",
        color: colors.success,
        bgColor: colors.successLight,
        borderColor: colors.successBorder,
        Icon: Wifi,
      };
    }
    return {
      label: "Offline",
      color: colors.danger,
      bgColor: colors.dangerLight,
      borderColor: colors.dangerBorder,
      Icon: WifiOff,
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.Icon;

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
          <Badge
            variant="outline"
            style={[
              styles.statusBadge,
              { backgroundColor: status.bgColor, borderColor: status.borderColor },
            ]}
          >
            <StatusIcon size={11} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </Badge>

          <Button
            variant="outline"
            size="icon"
            onPress={() =>
              navigation.navigate("History", { deviceId: activeDeviceId })
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
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
});
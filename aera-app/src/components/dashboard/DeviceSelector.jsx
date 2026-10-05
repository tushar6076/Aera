// aera-app/src/components/dashboard/DeviceSelector.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { colors, typography, shadows } from "../../styles/theme";
import { Cpu, Compass, Plus, Unlink } from "lucide-react-native";
import { deviceService } from "../../services/device";

export default function DeviceSelector({
  devices = [],
  selectedDevice = null,
  onSelectDevice,
  onOpenPairModal,
  onDeviceUnlinked,
  locationName = "Regional",
  isOnline = false,
}) {
  const handleUnlink = (deviceId, deviceName) => {
    Alert.alert(
      "Unlink Station",
      `Are you sure you want to release "${deviceName || deviceId}"? Telemetry will stop streaming to your account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            try {
              await deviceService.releaseDevice(deviceId);
              if (selectedDevice?.id === deviceId) {
                onSelectDevice(null);
              }
              if (onDeviceUnlinked) onDeviceUnlinked();
            } catch (err) {
              Alert.alert("Error", err.response?.data?.detail || "Failed to release node.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Ambient Mode Pill */}
        <TouchableOpacity
          style={[
            styles.pill,
            selectedDevice === null && styles.pillActive,
          ]}
          onPress={() => onSelectDevice(null)}
          activeOpacity={0.8}
        >
          <Compass
            size={13}
            color={selectedDevice === null ? colors.primary : colors.textDim}
          />
          <Text
            style={[
              styles.pillText,
              selectedDevice === null && styles.pillTextActive,
            ]}
          >
            Ambient ({locationName})
          </Text>
        </TouchableOpacity>

        {/* Claimed Nodes */}
        {devices.map((d) => {
          const active = selectedDevice?.id === d.id;
          return (
            <TouchableOpacity
              key={d.id}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onSelectDevice(d)}
              activeOpacity={0.8}
            >
              <Cpu
                size={13}
                color={active ? colors.primary : colors.textDim}
              />
              <Text
                style={[
                  styles.pillText,
                  active && styles.pillTextActive,
                ]}
              >
                {d.name || d.id}
              </Text>
              
              {active && (
                <View
                  style={[
                    styles.onlineDot,
                    { backgroundColor: isOnline ? colors.success : colors.textDim },
                  ]}
                />
              )}

              {/* Unlink button within the pill */}
              <TouchableOpacity
                onPress={() => handleUnlink(d.id, d.name)}
                style={styles.unlinkIconBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Unlink size={11} color={colors.textDim} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* Pair New Node Trigger */}
        <TouchableOpacity
          style={styles.addPill}
          onPress={onOpenPairModal}
          activeOpacity={0.8}
        >
          <Plus size={13} color={colors.primary} />
          <Text style={styles.addText}>Pair Node</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  pillActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight,
  },
  pillText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unlinkIconBtn: {
    marginLeft: 2,
    padding: 2,
  },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: "dashed",
  },
  addText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});
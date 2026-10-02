// aera-app/src/components/dashboard/DeviceSelector.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { colors, typography, shadows } from "../../styles/theme";
import { Cpu, Compass, Plus } from "lucide-react-native";

export default function DeviceSelector({
  devices = [],
  selectedDevice = null,
  onSelectDevice,
  onOpenPairModal,
  locationName = "Regional",
  isOnline = false,
}) {
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
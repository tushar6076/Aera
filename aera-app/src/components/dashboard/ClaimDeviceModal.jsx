// aera-app/src/components/dashboard/ClaimDeviceModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, typography, shadows } from "../../styles/theme";
import { deviceService } from "../../services/device";
import { Cpu, RefreshCw, X, AlertCircle } from "lucide-react-native";

export default function ClaimDeviceModal({
  visible,
  onClose,
  onDeviceClaimed,
}) {
  const [unclaimedList, setUnclaimedList] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const scanForNodes = async () => {
    try {
      setScanning(true);
      setError(null);
      const list = await deviceService.getUnclaimedDevices();
      setUnclaimedList(list || []);
    } catch (e) {
      console.warn("Mobile scan error:", e);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (visible) {
      scanForNodes();
      setDeviceIdInput("");
      setDeviceNameInput("");
      setError(null);
    }
  }, [visible]);

  const handleClaim = async (targetId, friendlyName) => {
    if (!targetId || !targetId.trim()) {
      setError("Provide a valid Hardware Node ID.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const claimed = await deviceService.claimDevice(
        targetId.trim().toUpperCase(),
        friendlyName?.trim() || `Node ${targetId.slice(-6)}`
      );
      if (onDeviceClaimed) onDeviceClaimed(claimed);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not pair station.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Cpu size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Pair Aera Hardware Node</Text>
                <Text style={styles.subtitle}>Link station using its Node ID</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={colors.textDim} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={14} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {/* Broadcasting Discovery */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Broadcasting Nodes</Text>
              <TouchableOpacity
                onPress={scanForNodes}
                disabled={scanning}
                style={styles.rescanBtn}
              >
                {scanning ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <RefreshCw size={12} color={colors.primary} />
                    <Text style={styles.rescanText}>Rescan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {unclaimedList.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No unclaimed nodes detected broadcasting.</Text>
                <Text style={styles.emptySubText}>Ensure ESP32 is powered and connected to Wi-Fi.</Text>
              </View>
            ) : (
              unclaimedList.map((id) => (
                <View key={id} style={styles.discoveredRow}>
                  <View>
                    <Text style={styles.nodeIdText}>{id}</Text>
                    <Text style={styles.nodeSubText}>Awaiting account pair</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pairSmallBtn}
                    onPress={() => handleClaim(id, `Station ${id.slice(-4)}`)}
                    disabled={submitting}
                  >
                    <Text style={styles.pairSmallBtnText}>Pair</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Manual Registration */}
            <View style={styles.manualSection}>
              <Text style={styles.sectionTitle}>Or Register Manually</Text>
              <TextInput
                style={[styles.input, styles.monoInput]}
                placeholder="NODE ID (E.G. AERA-B21A80)"
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
                value={deviceIdInput}
                onChangeText={setDeviceIdInput}
              />
              <TextInput
                style={styles.input}
                placeholder="Friendly Name (e.g. Living Room)"
                placeholderTextColor={colors.textDim}
                value={deviceNameInput}
                onChangeText={setDeviceNameInput}
              />
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!deviceIdInput.trim() || submitting) && styles.submitBtnDisabled,
                ]}
                disabled={!deviceIdInput.trim() || submitting}
                onPress={() => handleClaim(deviceIdInput, deviceNameInput)}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.card} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Claim & Authorize</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    flex: 1,
  },
  scrollArea: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rescanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rescanText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  emptyBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.backgroundSubtle,
    alignItems: "center",
    marginBottom: 14,
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  emptySubText: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  discoveredRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  nodeIdText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.mono,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  nodeSubText: {
    fontSize: 10,
    color: colors.textDim,
  },
  pairSmallBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pairSmallBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.card,
  },
  manualSection: {
    marginTop: 12,
    gap: 10,
  },
  input: {
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  monoInput: {
    fontFamily: typography.mono,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
    ...shadows.soft,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.card,
  },
});
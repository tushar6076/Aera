// aera-app/src/screens/SettingsScreen.jsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useDevice } from "../hooks/useDevice";
import api from "../services/api";
import { colors, typography, shadows } from "../styles/theme";

import Header from "../components/layout/Header";
import ScreenLayout from "../components/layout/ScreenLayout";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  User,
  Mail,
  Cpu,
  Trash2,
  LogOut,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react-native";

export default function SettingsScreen() {
  const { user, setUser, logout } = useAuth();
  const { 
    devices, 
    selectedDevice, 
    setSelectedDevice, 
    release, 
    refreshDevices 
  } = useDevice();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [targetDevice, setTargetDevice] = useState(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  const handleSaveProfile = async () => {
    setSuccessMsg("");
    setSaving(true);
    try {
      const res = await api.patch("/v1/user/me", {
        full_name: fullName.trim() || undefined,
        email: email.trim(),
      });
      setUser(res.data);
      setSuccessMsg("Profile saved successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      Alert.alert(
        "Update Failed",
        err.response?.data?.detail || "Could not update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmUnlink = async () => {
    if (!targetDevice) return;
    setIsUnlinking(true);
    try {
      // 1. Release node via global DeviceContext (handles API call and list refresh)
      await release(targetDevice.id);

      // 2. If the unlinked node was active on the dashboard, reset to Ambient
      if (selectedDevice?.id === targetDevice.id) {
        setSelectedDevice(null);
      }

      setTargetDevice(null);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to release node.");
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="System Settings" subtitle="Identity and node management" />

      <ScreenLayout
        edges={["bottom", "left", "right"]}
        contentContainerStyle={styles.content}
      >
        {successMsg ? (
          <Badge variant="outline" style={styles.successBanner}>
            <CheckCircle2 size={14} color={colors.success} />
            <Text style={styles.successBannerText}>{successMsg}</Text>
          </Badge>
        ) : null}

        {/* Profile Card */}
        <Text style={styles.sectionTitle}>Operator Identity</Text>
        <Card style={styles.formCard}>
          <Text style={styles.label}>Display Name</Text>
          <Input
            icon={User}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            placeholderTextColor={colors.textDim}
            style={styles.field}
          />

          <Text style={styles.label}>Account Email</Text>
          <Input
            icon={Mail}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@domain.com"
            placeholderTextColor={colors.textDim}
            style={styles.field}
          />

          <Button
            loading={saving}
            onPress={handleSaveProfile}
            style={styles.actionBtn}
          >
            <Save size={16} color={colors.card} />
            <Text style={styles.btnText}>Save Changes</Text>
          </Button>
        </Card>

        {/* Claimed Nodes Card */}
        <Text style={styles.sectionTitle}>
          Claimed Hardware Units ({devices.length})
        </Text>
        <Card style={styles.formCard}>
          {devices.length === 0 ? (
            <Text style={styles.emptyText}>No hardware nodes connected.</Text>
          ) : (
            devices.map((d) => (
              <View key={d.id} style={styles.deviceRow}>
                <View style={styles.deviceInfo}>
                  <Cpu size={16} color={colors.primary} />
                  <View>
                    <Text style={styles.deviceName}>{d.name || d.id}</Text>
                    <Text style={styles.deviceId}>ID: {d.id}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.unlinkBtn}
                  onPress={() => setTargetDevice(d)}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        {/* Logout Button */}
        <Button variant="outline" onPress={logout} style={styles.logoutBtn}>
          <LogOut size={16} color={colors.danger} />
          <Text style={styles.logoutText}>Sign Out of Station</Text>
        </Button>
      </ScreenLayout>

      {/* Confirmation Dialog */}
      <Dialog
        open={Boolean(targetDevice)}
        onOpenChange={(open) => !open && setTargetDevice(null)}
      >
        <DialogContent>
          <DialogHeader>
            <View style={styles.dialogIconWrap}>
              <AlertTriangle size={20} color={colors.danger} />
            </View>
            <DialogTitle>Unlink Station Node</DialogTitle>
            <DialogDescription>
              Are you sure you want to release node{" "}
              <Text style={styles.boldMono}>
                "{targetDevice?.name || targetDevice?.id}"
              </Text>
              ? Telemetry updates from this hardware unit will stop streaming immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isUnlinking}
              onPress={() => setTargetDevice(null)}
              style={styles.dialogCancelBtn}
            >
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </Button>
            <Button
              loading={isUnlinking}
              onPress={confirmUnlink}
              style={styles.dialogConfirmBtn}
            >
              <Text style={styles.dialogConfirmText}>Release Node</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 14,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    padding: 10,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
    borderWidth: 1,
    gap: 8,
  },
  successBannerText: {
    color: colors.success,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  formCard: {
    padding: 16,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 16,
    ...shadows.soft,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: typography.weights.semibold,
  },
  field: {
    marginBottom: 12,
  },
  actionBtn: {
    marginTop: 4,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadows.soft,
  },
  btnText: {
    color: colors.card,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  deviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deviceName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  deviceId: {
    fontSize: typography.sizes.xs,
    color: colors.textDim,
    fontFamily: typography.mono,
  },
  unlinkBtn: {
    padding: 8,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: typography.sizes.xs,
    textAlign: "center",
    paddingVertical: 8,
  },
  logoutBtn: {
    marginTop: 4,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  dialogIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  boldMono: {
    fontFamily: typography.mono,
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  dialogCancelBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
  dialogCancelText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  dialogConfirmBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.danger,
  },
  dialogConfirmText: {
    color: colors.card,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
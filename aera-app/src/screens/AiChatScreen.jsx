// aera-app/src/screens/AiChatScreen.jsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, shadows } from "../styles/theme";
import { useChat } from "../hooks/useChat";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Cpu,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react-native";

export default function AiChatScreen({ route, navigation }) {
  const {
    activeDeviceId = null,
    activeDeviceName = "Ambient Grid",
    currentReading = null,
  } = route?.params || {};

  const { messages, loading, sendMessage, clearChat } = useChat(
    activeDeviceId,
    currentReading
  );
  const [inputText, setInputText] = useState("");
  const listRef = useRef(null);

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    const text = inputText;
    setInputText("");
    sendMessage(text);
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.bubbleRow,
          isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarBot}>
            <Bot size={13} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? styles.bubbleUser
              : item.isError
              ? styles.bubbleError
              : styles.bubbleAssistant,
          ]}
        >
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content}
          </Text>
          {!isUser && item.telemetryInjected && (
            <View style={styles.injectedBadge}>
              <ShieldCheck size={11} color={colors.primary} />
              <Text style={styles.injectedText}>Live sensor telemetry evaluated</Text>
            </View>
          )}
        </View>
        {isUser && (
          <View style={styles.avatarUser}>
            <User size={13} color={colors.textMuted} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Top Header with Back Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.aiBadge}>
            <Sparkles size={14} color={colors.primary} />
          </View>

          <View>
            <Text style={styles.title}>Aera Atmospheric AI</Text>
            <View style={styles.targetRow}>
              <Cpu size={11} color={colors.primary} />
              <Text style={styles.targetText}>{activeDeviceName}</Text>
            </View>
          </View>
        </View>

        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Trash2 size={16} color={colors.textDim} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sync Sub-bar */}
      {currentReading && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncLabel}>Live Sensor Sync</Text>
          <Text style={styles.syncValues}>
            AQI {currentReading.aqi ?? "--"} · PM2.5 {currentReading.pm2_5 ?? "--"} µg/m³
          </Text>
        </View>
      )}

      {/* Message Stream */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Bot size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Atmospheric Intelligence</Text>
            <Text style={styles.emptySubtitle}>
              Ask about current particulate levels, ventilation timing, or outdoor safety.
            </Text>
          </View>
        }
      />

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Synthesizing atmospheric readings...</Text>
        </View>
      )}

      {/* Input Dock */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.inputDock}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask Aera about your air quality..."
            placeholderTextColor={colors.textDim}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || loading) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <Send size={15} color={colors.card} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.card,
    ...shadows.soft,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
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
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  targetText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  syncBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.backgroundSubtle,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  syncLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  syncValues: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.mono,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    marginTop: 60,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  bubbleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowAssistant: {
    justifyContent: "flex-start",
  },
  avatarBot: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarUser: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
  },
  bubbleAssistant: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  bubbleError: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  bubbleText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    lineHeight: 18,
  },
  bubbleTextUser: {
    color: colors.card,
  },
  injectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  injectedText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  inputDock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
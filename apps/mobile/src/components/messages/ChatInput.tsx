import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, TouchTarget, Typography } from '../../constants/tokens';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');

  const canSend = text.trim().length > 0 && !disabled;

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Votre message..."
        placeholderTextColor={Colors.placeholder}
        multiline
        maxLength={2000}
        editable={!disabled}
        returnKeyType="default"
      />
      <TouchableOpacity
        style={[styles.sendButton, canSend ? styles.sendButtonActive : styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.7}
      >
        <Ionicons name="send" size={20} color={canSend ? Colors.textInverse : Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: TouchTarget.min,
    maxHeight: 120,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * 1.5,
  },
  sendButton: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.borderLight,
  },
});

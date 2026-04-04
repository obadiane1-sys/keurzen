import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/tokens';
import type { SharedListItemFormValues, SharedListType } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPlaceholder(listType: SharedListType): string {
  switch (listType) {
    case 'shopping':
      return 'Ajouter un article...';
    case 'todo':
      return 'Ajouter un élément...';
    case 'custom':
    default:
      return 'Ajouter...';
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AddItemInputProps {
  listType: SharedListType;
  onAdd: (values: SharedListItemFormValues) => void;
  isLoading?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AddItemInput({ listType, onAdd, isLoading = false }: AddItemInputProps) {
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');

  const titleInputRef = useRef<TextInput>(null);

  const canSubmit = title.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;

    const values: SharedListItemFormValues = {
      title: title.trim(),
      ...(listType === 'shopping' && quantity.trim() ? { quantity: quantity.trim() } : {}),
    };

    onAdd(values);
    setTitle('');
    setQuantity('');
    titleInputRef.current?.focus();
  }

  return (
    <View style={styles.container}>
      {/* Plus icon */}
      <Ionicons
        name="add-circle-outline"
        size={22}
        color={Colors.terracotta}
        style={styles.addIcon}
      />

      {/* Title input */}
      <TextInput
        ref={titleInputRef}
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder={getPlaceholder(listType)}
        placeholderTextColor={Colors.textMuted}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        editable={!isLoading}
      />

      {/* Quantity input — shopping only */}
      {listType === 'shopping' && (
        <TextInput
          style={styles.quantityInput}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Qté"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          textAlign="center"
          editable={!isLoading}
        />
      )}

      {/* Submit / loading */}
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={Colors.terracotta}
          style={styles.submitArea}
        />
      ) : canSubmit ? (
        <TouchableOpacity
          onPress={handleSubmit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.submitArea}
          accessibilityLabel="Ajouter"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-forward-circle" size={28} color={Colors.terracotta} />
        </TouchableOpacity>
      ) : (
        // Reserve the same space so layout stays stable
        <View style={styles.submitAreaPlaceholder} />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  addIcon: {
    flexShrink: 0,
  },
  titleInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  quantityInput: {
    width: 60,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    textAlign: 'center',
    flexShrink: 0,
  },
  submitArea: {
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitAreaPlaceholder: {
    width: 28,
    height: 28,
    flexShrink: 0,
  },
});

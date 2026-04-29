import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Text } from './Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';

interface DateTimePickerSheetProps {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  minuteInterval?: 1 | 5 | 10 | 15 | 30;
}

export function DateTimePickerSheet({
  visible,
  value,
  onChange,
  onClose,
  title = 'Choisir une date',
  subtitle,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  minuteInterval = 5,
}: DateTimePickerSheetProps) {
  const [tempDate, setTempDate] = useState(value);

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    onChange(tempDate);
    onClose();
  }, [tempDate, onChange, onClose]);

  // Reset temp date when sheet opens
  React.useEffect(() => {
    if (visible) {
      setTempDate(value);
    }
  }, [visible, value]);

  // Android shows a native dialog, no need for our sheet
  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={tempDate}
        mode={mode === 'datetime' ? 'date' : mode}
        display="default"
        onChange={(event, date) => {
          if (event.type === 'dismissed') {
            onClose();
            return;
          }
          if (date) {
            if (mode === 'datetime') {
              // After date picked, show time picker
              setTempDate(date);
              // For simplicity in V1, just confirm with date
              onChange(date);
            } else {
              onChange(date);
            }
          }
          onClose();
        }}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        minuteInterval={minuteInterval}
      />
    );
  }

  // iOS: bottom sheet with inline spinner
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Title */}
        <Text variant="h3" weight="bold" style={styles.title}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}

        {/* Native iOS Wheel Picker */}
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={tempDate}
            mode={mode}
            display="spinner"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            minuteInterval={minuteInterval}
            locale="fr-FR"
            textColor={Colors.textPrimary}
            style={styles.picker}
          />
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text variant="body" weight="bold" style={styles.confirmText}>
            Confirmer
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.gray300,
  },
  title: {
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  pickerContainer: {
    marginVertical: 8,
  },
  picker: {
    height: 200,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmText: {
    fontSize: 16,
    color: Colors.textInverse,
  },
});

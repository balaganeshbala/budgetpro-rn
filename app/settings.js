import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Appearance, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardView } from '../src/components/common/CardView';
import { SectionHeader } from '../src/components/common/SectionHeader';
import { colors, radius, spacing, typography } from '../src/constants/theme';

const THEME_KEY = '@theme_preference';
const BIOMETRIC_LOCK_KEY = '@biometric_lock_enabled';
const LOCK_TIMEOUT_KEY = '@biometric_lock_timeout';

const LOCK_TIMEOUT_OPTIONS = [
  { value: 0,  label: 'Immediately' },
  { value: 10, label: 'After 10 seconds' },
  { value: 30, label: 'After 30 seconds' },
  { value: 60, label: 'After 1 minute' },
];

const THEME_OPTIONS = [
  { value: 'system', label: 'System Default', iconName: 'contrast-outline', color: '#8E8E93' },
  { value: 'light',  label: 'Light',          iconName: 'sunny-outline',     color: '#FF9500' },
  { value: 'dark',   label: 'Dark',           iconName: 'moon-outline',      color: '#5856D6' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const [preference, setPreference] = useState('system');
  const [pickerVisible, setPickerVisible] = useState(false);

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [lockTimeout, setLockTimeout] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [lockPickerVisible, setLockPickerVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved) setPreference(saved);
    });
    Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      AsyncStorage.getItem(BIOMETRIC_LOCK_KEY),
      AsyncStorage.getItem(LOCK_TIMEOUT_KEY),
    ]).then(([hasHardware, isEnrolled, enabled, timeout]) => {
      setBiometricAvailable(hasHardware && isEnrolled);
      setBiometricEnabled(enabled === 'true');
      setLockTimeout(parseInt(timeout ?? '0', 10));
    });
  }, []);

  async function handleSelect(value) {
    setPreference(value);
    setPickerVisible(false);
    await AsyncStorage.setItem(THEME_KEY, value);
    Appearance.setColorScheme(value === 'system' ? null : value);
  }

  async function handleBiometricToggle(value) {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to enable biometric lock',
        disableDeviceFallback: false,
      });
      if (!result.success) return;
    }
    setBiometricEnabled(value);
    await AsyncStorage.setItem(BIOMETRIC_LOCK_KEY, value ? 'true' : 'false');
  }

  async function handleLockTimeoutSelect(value) {
    setLockTimeout(value);
    setLockPickerVisible(false);
    await AsyncStorage.setItem(LOCK_TIMEOUT_KEY, String(value));
  }

  const selectedLabel = THEME_OPTIONS.find(o => o.value === preference)?.label ?? 'System Default';
  const selectedTimeoutLabel = LOCK_TIMEOUT_OPTIONS.find(o => o.value === lockTimeout)?.label ?? 'Immediately';

  return (
    <View style={[styles.container, { backgroundColor: themeColors.groupedBackground }]}>
      <Stack.Screen options={{ title: 'Settings', headerBackTitle: '' }} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <SectionHeader title="Appearance" style={styles.sectionHeader} />
        <CardView padding={0}>
          <TouchableOpacity style={styles.row} onPress={() => setPickerVisible(true)} activeOpacity={0.7}>
            <View style={[styles.iconBg, { backgroundColor: themeColors.primary + '18' }]}>
              <Ionicons name="contrast-outline" size={20} color={themeColors.primary} />
            </View>
            <Text style={[styles.rowTitle, { color: themeColors.text }]}>Theme</Text>
            <Text style={[styles.rowValue, { color: themeColors.secondaryText }]}>{selectedLabel}</Text>
            <Ionicons name="chevron-forward" size={16} color={themeColors.secondaryText} />
          </TouchableOpacity>
        </CardView>

        <SectionHeader title="Security" style={styles.sectionHeader} />
        <CardView padding={0}>
          <View style={styles.row}>
            <View style={[styles.iconBg, { backgroundColor: '#FF9500' + '18' }]}>
              <Ionicons name="finger-print" size={20} color="#FF9500" />
            </View>
            <Text style={[styles.rowTitle, { color: biometricAvailable ? themeColors.text : themeColors.secondaryText }]}>
              Biometric Lock
            </Text>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: themeColors.separator, true: themeColors.primary }}
              disabled={!biometricAvailable}
            />
          </View>
          {biometricEnabled && (
            <>
              <View style={[styles.rowSeparator, { backgroundColor: themeColors.separator }]} />
              <TouchableOpacity style={styles.row} onPress={() => setLockPickerVisible(true)} activeOpacity={0.7}>
                <View style={[styles.iconBg, { backgroundColor: themeColors.primary + '18' }]}>
                  <Ionicons name="timer-outline" size={20} color={themeColors.primary} />
                </View>
                <Text style={[styles.rowTitle, { color: themeColors.text }]}>Lock After</Text>
                <Text style={[styles.rowValue, { color: themeColors.secondaryText }]}>{selectedTimeoutLabel}</Text>
                <Ionicons name="chevron-forward" size={16} color={themeColors.secondaryText} />
              </TouchableOpacity>
            </>
          )}
        </CardView>
        {!biometricAvailable && (
          <Text style={[styles.sectionNote, { color: themeColors.secondaryText }]}>
            No biometrics are enrolled on this device.
          </Text>
        )}
      </ScrollView>

      <Modal visible={pickerVisible} animationType="none" transparent onRequestClose={() => setPickerVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>Theme</Text>
                  <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={themeColors.secondaryText} />
                  </TouchableOpacity>
                </View>
                {THEME_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionItem, { borderBottomColor: themeColors.separator }]}
                    onPress={() => handleSelect(option.value)}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons name={option.iconName} size={24} color={option.color} style={{ marginRight: spacing.md }} />
                      <Text style={[styles.optionText, { color: themeColors.text }]}>{option.label}</Text>
                    </View>
                    {preference === option.value && (
                      <Ionicons name="checkmark" size={24} color={themeColors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={lockPickerVisible} animationType="none" transparent onRequestClose={() => setLockPickerVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setLockPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>Lock After</Text>
                  <TouchableOpacity onPress={() => setLockPickerVisible(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={themeColors.secondaryText} />
                  </TouchableOpacity>
                </View>
                {LOCK_TIMEOUT_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionItem, { borderBottomColor: themeColors.separator }]}
                    onPress={() => handleLockTimeoutSelect(option.value)}
                  >
                    <Text style={[styles.optionText, { color: themeColors.text }]}>{option.label}</Text>
                    {lockTimeout === option.value && (
                      <Ionicons name="checkmark" size={24} color={themeColors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  sectionHeader: { marginTop: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
  },
  rowValue: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.4)',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    position: 'relative',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.xl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.medium,
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
  sectionNote: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
});

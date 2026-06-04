import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { AppButton } from './common/AppButton';
import { SectionHeader } from './common/SectionHeader';

/**
 * Mirrors EmptyDataIndicatorView.swift.
 * Props:
 *   icon        – Ionicons name
 *   title       – bold heading
 *   bodyText    – (optional) subtitle
 *   actionLabel – (optional) button label
 *   onAction    – (optional) button handler
 */
export default function EmptyDataIndicatorView({ icon, title, bodyText, actionLabel, onAction }) {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    return (
        <View style={styles.container}>
            <View style={[styles.iconCircle, { backgroundColor: themeColors.secondaryText + '20' }]}>
                <Ionicons name={icon} size={32} color={themeColors.secondaryText} />
            </View>
            <SectionHeader title={title} />
            {bodyText ? (
                <Text style={[styles.bodyText, { color: themeColors.secondaryText }]}>{bodyText}</Text>
            ) : null}
            {actionLabel && onAction ? (
                <AppButton title={actionLabel} onPress={onAction} style={styles.button} />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    title: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.semibold,
        textAlign: 'center',
    },
    bodyText: {
        fontSize: typography.sizes.sm,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
    },
    button: {
        marginTop: spacing.md,
    },
});

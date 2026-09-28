import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { clinicColors as colors } from './clinicTheme';

export default function DrawerMenuButton({ onPress }: { onPress: () => void }) {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" onPress={onPress} style={styles.button}>
            <View style={styles.lines}>
                <View style={styles.line} />
                <View style={[styles.line, styles.middleLine]} />
                <View style={styles.line} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: { width: 42, height: 42, borderWidth: 1, borderColor: colors.line, borderRadius: 6, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    lines: { width: 17, gap: 4 },
    line: { height: 2, width: 17, backgroundColor: colors.ink, borderRadius: 1 },
    middleLine: { width: 12 },
});
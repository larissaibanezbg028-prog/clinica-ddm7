import React from 'react';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { MainTabParamList } from '../App';
import DrawerMenuButton from './DrawerMenuButton';
import { clinicColors as colors } from './clinicTheme';

type SpecialtyNavigation = BottomTabNavigationProp<MainTabParamList, 'Especialidades'>;

const specialties = [
    { name: 'Clínica geral', description: 'Prevenção, avaliação e acompanhamento integral da saúde.', mark: 'CG' },
    { name: 'Cardiologia', description: 'Cuidado preventivo e acompanhamento da saúde do coração.', mark: 'CA' },
    { name: 'Dermatologia', description: 'Avaliação e tratamento da pele, cabelos e unhas.', mark: 'DE' },
    { name: 'Pediatria', description: 'Atenção à saúde e ao desenvolvimento de crianças e adolescentes.', mark: 'PE' },
    { name: 'Ortopedia', description: 'Cuidado de ossos, articulações e movimento.', mark: 'OR' },
];

export default function Especialidades() {
    const navigation = useNavigation<SpecialtyNavigation>();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.topBar}>
                    <DrawerMenuButton onPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
                    <Text style={styles.brand}>SEREIA  /  CLÍNICA INTEGRADA</Text>
                </View>
                <View style={styles.hero}>
                    <Text style={styles.eyebrow}>CUIDADO INTEGRAL</Text>
                    <Text style={styles.title}>Especialidades</Text>
                    <Text style={styles.intro}>Um olhar atento para cada etapa da sua saúde.</Text>
                    <View style={styles.heroFooter}>
                        <View style={styles.heroRule} />
                        <Text style={styles.heroCount}>05 ÁREAS DE ATENDIMENTO</Text>
                    </View>
                </View>

                {specialties.map((specialty) => (
                    <View key={specialty.name} style={styles.specialtyRow}>
                        <View style={styles.mark}>
                            <Text style={styles.markText}>{specialty.mark}</Text>
                        </View>
                        <View style={styles.description}>
                            <Text style={styles.name}>{specialty.name}</Text>
                            <Text style={styles.detail}>{specialty.description}</Text>
                        </View>
                    </View>
                ))}

                <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => navigation.navigate('Agenda')}>
                    <Text style={styles.primaryButtonText}>Voltar para a agenda</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24 },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 25 },
    brand: { color: colors.muted, fontSize: 10, fontWeight: '700' },
    hero: { backgroundColor: colors.panel, borderRadius: 8, padding: 24, marginBottom: 20 },
    eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '700', marginBottom: 8 },
    title: { color: '#FFFFFF', fontSize: 31, lineHeight: 38, fontWeight: '600', fontFamily: 'Georgia' },
    intro: { color: colors.panelMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
    heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
    heroRule: { width: 30, height: 2, backgroundColor: colors.gold },
    heroCount: { color: colors.gold, fontSize: 10, fontWeight: '700' },
    specialtyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
    mark: { width: 44, height: 44, borderRadius: 6, backgroundColor: colors.pale, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    markText: { color: colors.green, fontSize: 12, fontWeight: '700' },
    description: { flex: 1 },
    name: { color: colors.ink, fontSize: 15, fontWeight: '700' },
    detail: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
    primaryButton: { height: 50, borderRadius: 6, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
    primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
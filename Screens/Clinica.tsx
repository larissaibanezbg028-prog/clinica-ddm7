import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { MainDrawerParamList } from '../App';
import DrawerMenuButton from './DrawerMenuButton';
import { clinicColors as colors } from './clinicTheme';

type ClinicNavigation = DrawerNavigationProp<MainDrawerParamList, 'Clinica'>;

const values = [
    { number: '01', title: 'Escuta atenta', copy: 'Cada consulta considera a história e as necessidades de cada pessoa.' },
    { number: '02', title: 'Cuidado integrado', copy: 'Especialidades diferentes em uma agenda organizada e acessível.' },
    { number: '03', title: 'Acompanhamento próximo', copy: 'Informações reunidas para apoiar a continuidade do atendimento.' },
];

export default function Clinica() {
    const navigation = useNavigation<ClinicNavigation>();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.topBar}>
                    <DrawerMenuButton onPress={() => navigation.openDrawer()} />
                    <Text style={styles.brand}>SEREIA  /  CLÍNICA INTEGRADA</Text>
                </View>
                <View style={styles.hero}>
                    <Text style={styles.eyebrow}>SOBRE A CLÍNICA</Text>
                    <Text style={styles.title}>Cuidado que acompanha.</Text>
                    <Text style={styles.intro}>A Clínica Sereia reúne agenda, profissionais e especialidades em um só lugar.</Text>
                    <View style={styles.heroRule} />
                    <Text style={styles.heroFoot}>SAÚDE  ·  PRESENÇA  ·  CONTINUIDADE</Text>
                </View>

                <View style={styles.values}>
                    {values.map((value) => (
                        <View key={value.number} style={styles.valueRow}>
                            <Text style={styles.valueNumber}>{value.number}</Text>
                            <View style={styles.valueCopy}>
                                <Text style={styles.valueTitle}>{value.title}</Text>
                                <Text style={styles.valueDescription}>{value.copy}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { width: '100%', maxWidth: 820, alignSelf: 'center', padding: 22, paddingBottom: 36 },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 25 },
    brand: { color: colors.muted, fontSize: 10, fontWeight: '700' },
    hero: { minHeight: 290, justifyContent: 'center', padding: 28, borderRadius: 8, backgroundColor: colors.panel },
    eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '700', marginBottom: 10 },
    title: { maxWidth: 540, color: '#FFFFFF', fontSize: 34, lineHeight: 41, fontWeight: '600', fontFamily: 'Georgia' },
    intro: { maxWidth: 460, color: colors.panelMuted, fontSize: 15, lineHeight: 23, marginTop: 10 },
    heroRule: { width: 42, height: 3, backgroundColor: colors.gold, marginTop: 25, marginBottom: 12 },
    heroFoot: { color: colors.gold, fontSize: 10, fontWeight: '700' },
    values: { marginTop: 22, borderTopWidth: 1, borderTopColor: colors.line },
    valueRow: { flexDirection: 'row', paddingVertical: 19, borderBottomWidth: 1, borderBottomColor: colors.line },
    valueNumber: { width: 52, color: colors.green, fontSize: 12, fontWeight: '700' },
    valueCopy: { flex: 1 },
    valueTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
    valueDescription: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 5 },
});
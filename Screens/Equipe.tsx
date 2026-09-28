import React, { useEffect, useState } from 'react';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import type { MainTabParamList } from '../App';
import DrawerMenuButton from './DrawerMenuButton';
import { auth, db } from '../firebase';
import { doctors, specialties, type Doctor } from './clinicData';
import { clinicColors as colors } from './clinicTheme';

type TeamNavigation = BottomTabNavigationProp<MainTabParamList, 'Equipe'>;
const doctorsCollection = collection(db, 'medicos');

export default function Equipe() {
    const navigation = useNavigation<TeamNavigation>();
    const userId = auth.currentUser?.uid;
    const [team, setTeam] = useState<Doctor[]>(doctors);
    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [crm, setCrm] = useState('');
    const [specialty, setSpecialty] = useState(specialties[0]);
    const [feedback, setFeedback] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const userDoctors = query(doctorsCollection, where('userId', '==', userId));
        return onSnapshot(userDoctors, (snapshot) => {
            const savedDoctors = snapshot.docs.map((doctorDoc) => {
                const data = doctorDoc.data();
                return {
                    id: doctorDoc.id,
                    name: data.name as string,
                    crm: data.crm as string,
                    specialty: data.specialty as string,
                    initials: data.initials as string,
                };
            });
            const savedNames = new Set(savedDoctors.map((doctor) => doctor.name));
            setTeam([...doctors.filter((doctor) => !savedNames.has(doctor.name)), ...savedDoctors]);
        }, () => Alert.alert('Erro', 'Não foi possível carregar a equipe médica.'));
    }, [userId]);

    const saveDoctor = async () => {
        const normalizedName = name.trim();
        const normalizedCrm = crm.trim().toUpperCase();
        if (!normalizedName || !normalizedCrm) {
            setFeedback('Preencha o nome e o CRM do profissional.');
            return;
        }
        if (team.some((doctor) => doctor.name.toLowerCase() === normalizedName.toLowerCase())) {
            setFeedback('Já existe um profissional com esse nome na equipe.');
            return;
        }
        if (team.some((doctor) => doctor.crm !== 'CRM/UF a cadastrar' && doctor.crm.toLowerCase() === normalizedCrm.toLowerCase())) {
            setFeedback('Esse CRM já está cadastrado na equipe.');
            return;
        }
        if (!userId) {
            setFeedback('Entre novamente para cadastrar um profissional.');
            return;
        }

        const initials = normalizedName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
        setSaving(true);
        setFeedback('');
        try {
            await addDoc(doctorsCollection, {
                name: normalizedName,
                crm: normalizedCrm,
                specialty,
                initials,
                userId,
                createdAt: new Date(),
            });
            setName('');
            setCrm('');
            setSpecialty(specialties[0]);
            setModalVisible(false);
        } catch {
            setFeedback('Não foi possível salvar. Verifique a conexão e tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.topBar}>
                    <DrawerMenuButton onPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
                    <Text style={styles.brand}>SEREIA  /  CLÍNICA INTEGRADA</Text>
                </View>
                <View style={styles.hero}>
                    <Text style={styles.eyebrow}>QUEM CUIDA DE VOCÊ</Text>
                    <Text style={styles.title}>Equipe médica</Text>
                    <Text style={styles.intro}>Profissionais e especialidades disponíveis na clínica.</Text>
                </View>

                <View style={styles.listHeading}>
                    <Text style={styles.listTitle}>Profissionais cadastrados</Text>
                    <Pressable accessibilityRole="button" style={styles.addButton} onPress={() => {
                        setFeedback('');
                        setModalVisible(true);
                    }}>
                        <Text style={styles.addButtonText}>+  Adicionar</Text>
                    </Pressable>
                </View>

                <View style={styles.list}>
                    {team.map((doctor, index) => (
                        <View key={doctor.id} style={styles.doctorRow}>
                            <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
                            <View style={styles.initials}><Text style={styles.initialsText}>{doctor.initials}</Text></View>
                            <View style={styles.doctorInfo}>
                                <Text style={styles.doctorName}>{doctor.name}</Text>
                                <Text style={styles.specialty}>{doctor.specialty}</Text>
                                <Text style={styles.crm}>{doctor.crm}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeading}>
                            <View>
                                <Text style={styles.modalEyebrow}>NOVA PESSOA</Text>
                                <Text style={styles.modalTitle}>Adicionar à equipe</Text>
                            </View>
                            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Text style={styles.closeText}>×</Text>
                            </Pressable>
                        </View>

                        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            <Text style={styles.fieldLabel}>Nome do profissional</Text>
                            <TextInput
                                accessibilityLabel="Nome do profissional"
                                style={styles.input}
                                placeholder="Ex.: Dra. Ana Souza"
                                placeholderTextColor="#71817F"
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.fieldLabel}>CRM</Text>
                            <TextInput
                                accessibilityLabel="CRM"
                                style={styles.input}
                                placeholder="Ex.: CRM/SP 123456"
                                placeholderTextColor="#71817F"
                                value={crm}
                                onChangeText={setCrm}
                                autoCapitalize="characters"
                            />

                            <Text style={styles.fieldLabel}>Especialidade</Text>
                            <View style={styles.specialties}>
                                {specialties.map((option) => (
                                    <Pressable
                                        accessibilityRole="button"
                                        key={option}
                                        onPress={() => setSpecialty(option)}
                                        style={[styles.specialtyOption, specialty === option && styles.specialtyOptionSelected]}
                                    >
                                        <Text style={[styles.specialtyOptionText, specialty === option && styles.specialtyOptionTextSelected]}>{option}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            {feedback ? <Text accessibilityRole="alert" style={styles.feedback}>{feedback}</Text> : null}

                            <Pressable accessibilityRole="button" disabled={saving} style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={saveDoctor}>
                                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Salvar profissional</Text>}
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { width: '100%', maxWidth: 820, alignSelf: 'center', padding: 22, paddingBottom: 36 },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 25 },
    brand: { color: colors.muted, fontSize: 10, fontWeight: '700' },
    hero: { padding: 24, backgroundColor: colors.panel, borderRadius: 8, marginBottom: 20 },
    eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '700', marginBottom: 8 },
    title: { color: '#FFFFFF', fontSize: 31, lineHeight: 38, fontWeight: '600', fontFamily: 'Georgia' },
    intro: { color: colors.panelMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
    listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 13 },
    listTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
    addButton: { height: 40, paddingHorizontal: 13, borderRadius: 5, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: colors.white, fontSize: 12, fontWeight: '700' },
    list: { borderTopWidth: 1, borderTopColor: colors.line },
    doctorRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 14 },
    number: { width: 34, color: colors.muted, fontSize: 11, fontWeight: '600' },
    initials: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    initialsText: { color: colors.green, fontSize: 12, fontWeight: '700' },
    doctorInfo: { flex: 1 },
    doctorName: { color: colors.ink, fontSize: 15, fontWeight: '700' },
    specialty: { color: colors.green, fontSize: 12, marginTop: 4 },
    crm: { color: colors.muted, fontSize: 11, marginTop: 3 },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(15, 35, 34, 0.48)' },
    modalSheet: { width: '100%', maxWidth: 560, maxHeight: '90%', padding: 22, paddingBottom: 28, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: colors.background },
    modalHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
    modalEyebrow: { color: colors.green, fontSize: 10, fontWeight: '700', marginBottom: 5 },
    modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', fontFamily: 'Georgia' },
    closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
    closeText: { color: colors.ink, fontSize: 24, lineHeight: 27 },
    fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 13, marginBottom: 7 },
    input: { height: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white, color: colors.ink, fontSize: 14 },
    specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    specialtyOption: { paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white },
    specialtyOptionSelected: { borderColor: colors.green, backgroundColor: colors.pale },
    specialtyOptionText: { color: colors.muted, fontSize: 11 },
    specialtyOptionTextSelected: { color: colors.green, fontWeight: '700' },
    feedback: { color: colors.coral, backgroundColor: colors.dangerSurface, padding: 10, borderRadius: 5, marginTop: 14, fontSize: 13 },
    saveButton: { height: 48, backgroundColor: colors.green, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
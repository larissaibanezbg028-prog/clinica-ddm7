import React, { useEffect, useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';

import type { MainDrawerParamList, MainTabParamList, RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doctors, type Doctor } from './clinicData';
import DrawerMenuButton from './DrawerMenuButton';
import { clinicColors as colors } from './clinicTheme';

type HomeNavigation = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Agenda'>,
    CompositeNavigationProp<
        DrawerNavigationProp<MainDrawerParamList, 'Atendimento'>,
        NativeStackNavigationProp<RootStackParamList, 'Main'>
    >
>;
type Appointment = {
    id: string;
    patient: string;
    doctorId: string;
    doctorName: string;
    doctorCrm: string;
    specialty: string;
    scheduledAt: Date;
};

const appointmentsRef = collection(db, 'consultas');
const doctorsCollectionRef = collection(db, 'medicos');
const browserInputStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    height: 42,
    padding: '0 10px',
    color: colors.ink,
    backgroundColor: '#FFFFFF',
    border: `1px solid ${colors.line}`,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'inherit',
};

function initialAppointmentDate() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
    return date;
}

function formatLocalDate(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function formatLocalTime(date: Date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

export default function Home() {
    const navigation = useNavigation<HomeNavigation>();
    const isWide = useWindowDimensions().width >= 1020;
    const userId = auth.currentUser?.uid;
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
    const [deleteError, setDeleteError] = useState('');
    const [patient, setPatient] = useState('');
    const [doctor, setDoctor] = useState(doctors[0]);
    const [availableDoctors, setAvailableDoctors] = useState(doctors);
    const [scheduledAt, setScheduledAt] = useState(initialAppointmentDate);
    const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const userAppointments = query(appointmentsRef, where('userId', '==', userId));
        const unsubscribe = onSnapshot(userAppointments, (snapshot) => {
            const items = snapshot.docs.map((appointmentDoc) => {
                const data = appointmentDoc.data();
                return {
                    id: appointmentDoc.id,
                    patient: data.patient as string,
                    doctorId: (data.doctorId as string) ?? '',
                    doctorName: (data.doctorName as string) ?? 'Profissional não informado',
                    doctorCrm: (data.doctorCrm as string) ?? 'CRM não informado',
                    specialty: data.specialty as string,
                    scheduledAt: data.scheduledAt.toDate() as Date,
                };
            });
            items.sort((first, second) => first.scheduledAt.getTime() - second.scheduledAt.getTime());
            setAppointments(items);
            setLoading(false);
        }, () => {
            setLoading(false);
            Alert.alert('Erro', 'Não foi possível carregar as consultas.');
        });

        return unsubscribe;
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        const userDoctors = query(doctorsCollectionRef, where('userId', '==', userId));
        const unsubscribe = onSnapshot(userDoctors, (snapshot) => {
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
            const savedNames = new Set(savedDoctors.map((item) => item.name));
            setAvailableDoctors([
                ...doctors.filter((item) => !savedNames.has(item.name)),
                ...savedDoctors,
            ]);
        }, () => Alert.alert('Erro', 'Não foi possível carregar a equipe médica.'));

        return unsubscribe;
    }, [userId]);

    const resetForm = () => {
        setPatient('');
        setDoctor(availableDoctors[0] ?? doctors[0]);
        setScheduledAt(initialAppointmentDate());
        setPickerMode(null);
    };

    const openNewAppointment = () => {
        resetForm();
        setEditingAppointmentId(null);
        setModalVisible(true);
    };

    const openEditAppointment = (appointment: Appointment) => {
        setPatient(appointment.patient);
        setDoctor(availableDoctors.find((item) => item.id === appointment.doctorId)
            ?? availableDoctors.find((item) => item.name === appointment.doctorName)
            ?? doctors[0]);
        setScheduledAt(appointment.scheduledAt);
        setPickerMode(null);
        setEditingAppointmentId(appointment.id);
        setModalVisible(true);
    };

    const saveAppointment = async () => {
        if (!patient.trim()) {
            Alert.alert('Campo obrigatório', 'Informe o nome do paciente.');
            return;
        }
        if (!userId) {
            Alert.alert('Sessão encerrada', 'Entre novamente para agendar uma consulta.');
            return;
        }
        if (scheduledAt.getTime() < Date.now()) {
            Alert.alert('Data inválida', 'Escolha uma data e horário futuros.');
            return;
        }

        setSaving(true);
        try {
            const appointmentData = {
                patient: patient.trim(),
                doctorId: doctor.id,
                doctorName: doctor.name,
                doctorCrm: doctor.crm,
                specialty: doctor.specialty,
                scheduledAt,
                userId,
            };
            if (editingAppointmentId) {
                await updateDoc(doc(db, 'consultas', editingAppointmentId), {
                    ...appointmentData,
                    updatedAt: new Date(),
                });
            } else {
                await addDoc(appointmentsRef, { ...appointmentData, createdAt: new Date() });
            }
            setModalVisible(false);
            setEditingAppointmentId(null);
            resetForm();
            if (Platform.OS !== 'web') {
                Alert.alert(editingAppointmentId ? 'Consulta atualizada' : 'Consulta agendada', 'As alterações foram salvas.');
            }
        } catch {
            Alert.alert('Erro', 'Não foi possível salvar a consulta. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const deleteAppointment = async () => {
        if (!appointmentToDelete) return;

        setSaving(true);
        setDeleteError('');
        try {
            await deleteDoc(doc(db, 'consultas', appointmentToDelete.id));
            setAppointmentToDelete(null);
        } catch {
            setDeleteError('Não foi possível excluir. Verifique sua conexão e tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const updateDateTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setPickerMode(null);
            return;
        }
        if (selectedDate) setScheduledAt(selectedDate);
        if (Platform.OS !== 'ios') setPickerMode(null);
    };

    const updateWebDateTime = (mode: 'date' | 'time', value: string) => {
        if (!value) return;

        const nextDate = new Date(scheduledAt);
        if (mode === 'date') {
            const [year, month, day] = value.split('-').map(Number);
            nextDate.setFullYear(year, month - 1, day);
        } else {
            const [hours, minutes] = value.split(':').map(Number);
            nextDate.setHours(hours, minutes, 0, 0);
        }
        setScheduledAt(nextDate);
    };

    const logout = async () => {
        try {
            await signOut(auth);
            navigation.replace('Login');
        } catch {
            Alert.alert('Erro', 'Não foi possível sair da conta.');
        }
    };

    const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short',
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerIdentity}>
                        <DrawerMenuButton onPress={() => navigation.openDrawer()} />
                        <View style={styles.brandMark}><Text style={styles.brandMarkText}>+</Text></View>
                        <View>
                            <Text style={styles.eyebrow}>CLÍNICA SEREIA</Text>
                            <Text style={styles.title}>Agenda médica</Text>
                            <Text style={styles.email}>{auth.currentUser?.email}</Text>
                        </View>
                    </View>
                    <Pressable accessibilityRole="button" onPress={logout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Sair da conta</Text>
                    </Pressable>
                </View>

                <View style={styles.summary}>
                    <View>
                        <Text style={styles.summaryLabel}>AGENDA ATIVA</Text>
                        <Text style={styles.summaryCount}>{appointments.length}</Text>
                        <Text style={styles.summaryCopy}>consultas registradas</Text>
                    </View>
                    <View style={styles.summaryNote}>
                        <View style={styles.summaryDot} />
                        <View>
                            <Text style={styles.summaryNoteLabel}>SEU CONSULTÓRIO</Text>
                            <Text style={styles.summaryNoteText}>Um atendimento organizado começa com uma agenda clara.</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.agendaLayout, isWide && styles.agendaLayoutWide]}>
                    <View style={styles.agendaColumn}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Próximos atendimentos</Text>
                            <View style={styles.sectionActions}>
                                <Pressable onPress={() => navigation.navigate('Especialidades')}>
                                    <Text style={styles.link}>Especialidades</Text>
                                </Pressable>
                                <Pressable accessibilityRole="button" style={styles.addButton} onPress={openNewAppointment}>
                                    <Text style={styles.addButtonText}>+  Agendar consulta</Text>
                                </Pressable>
                            </View>
                        </View>

                        {loading ? (
                            <ActivityIndicator color={colors.green} style={styles.loader} />
                        ) : (
                            <FlatList
                                data={appointments}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={appointments.length === 0 ? styles.emptyList : styles.list}
                                ListEmptyComponent={(
                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyMark}><Text style={styles.emptyMarkText}>+</Text></View>
                                        <Text style={styles.emptyTitle}>Sua agenda está livre</Text>
                                        <Text style={styles.emptyCopy}>Agende a primeira consulta para organizar seu dia.</Text>
                                    </View>
                                )}
                                renderItem={({ item }) => (
                                    <View style={styles.appointmentCard}>
                                        <View style={styles.appointmentMain}>
                                            <View style={styles.dateBlock}>
                                                <Text style={styles.dateDay}>{item.scheduledAt.toLocaleDateString('pt-BR', { day: '2-digit' })}</Text>
                                                <Text style={styles.dateMonth}>{item.scheduledAt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</Text>
                                            </View>
                                            <View style={styles.appointmentInfo}>
                                                <Text style={styles.patientName}>{item.patient}</Text>
                                                <Text style={styles.appointmentMeta}>{item.doctorName} · {item.doctorCrm}</Text>
                                                <Text style={styles.appointmentDate}>{item.specialty} · {formatDate(item.scheduledAt)}</Text>
                                            </View>
                                            <Text style={styles.appointmentTime}>{item.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                                        </View>
                                        <View style={styles.appointmentActions}>
                                            <Pressable accessibilityRole="button" accessibilityLabel={`Editar consulta de ${item.patient}`} onPress={() => openEditAppointment(item)} style={styles.editButton}>
                                                <Text style={styles.editButtonText}>Editar</Text>
                                            </Pressable>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Excluir consulta de ${item.patient}`}
                                                onPress={() => {
                                                    setDeleteError('');
                                                    setAppointmentToDelete(item);
                                                }}
                                                style={styles.deleteButton}
                                            >
                                                <Text style={styles.deleteButtonText}>Excluir</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                )}
                            />
                        )}
                    </View>

                    {isWide && (
                        <View style={styles.teamAside}>
                            <Text style={styles.asideEyebrow}>CUIDADO EM EQUIPE</Text>
                            <View style={styles.asideCountRow}>
                                <Text style={styles.asideCount}>{availableDoctors.length}</Text>
                                <Text style={styles.asideCountLabel}>profissionais</Text>
                            </View>
                            <View style={styles.asideDivider} />
                            {availableDoctors.slice(0, 3).map((member) => (
                                <View key={member.id} style={styles.asideDoctor}>
                                    <View style={styles.asideInitials}><Text style={styles.asideInitialsText}>{member.initials}</Text></View>
                                    <View style={styles.asideDoctorInfo}>
                                        <Text numberOfLines={1} style={styles.asideDoctorName}>{member.name}</Text>
                                        <Text numberOfLines={1} style={styles.asideSpecialty}>{member.specialty}</Text>
                                    </View>
                                </View>
                            ))}
                            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Equipe')} style={styles.asideLink}>
                                <Text style={styles.asideLinkText}>Ver equipe completa  →</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                    <View style={styles.modalBackdrop}>
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardSafe}>
                            <View style={styles.modalSheet}>
                                <View style={styles.modalHeading}>
                                    <View>
                                        <Text style={styles.eyebrow}>NOVA CONSULTA</Text>
                                        <Text style={styles.modalTitle}>{editingAppointmentId ? 'Editar consulta' : 'Adicionar à agenda'}</Text>
                                    </View>
                                    <Pressable accessibilityRole="button" onPress={() => {
                                        setModalVisible(false);
                                        setEditingAppointmentId(null);
                                        setPickerMode(null);
                                    }} style={styles.closeButton}>
                                        <Text style={styles.closeText}>×</Text>
                                    </Pressable>
                                </View>

                                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                    <Text style={styles.fieldLabel}>Nome do paciente</Text>
                                    <TextInput
                                        accessibilityLabel="Nome do paciente"
                                        style={styles.input}
                                        placeholder="Ex.: Ana Souza"
                                        placeholderTextColor={colors.muted}
                                        value={patient}
                                        onChangeText={setPatient}
                                    />

                                    <Text style={styles.fieldLabel}>Médico</Text>
                                    <View style={styles.doctorOptions}>
                                        {availableDoctors.map((option) => (
                                            <Pressable
                                                accessibilityRole="button"
                                                key={option.id}
                                                onPress={() => setDoctor(option)}
                                                style={[styles.doctorOption, doctor.id === option.id && styles.doctorOptionSelected]}
                                            >
                                                <View style={styles.doctorInitials}>
                                                    <Text style={styles.doctorInitialsText}>{option.initials}</Text>
                                                </View>
                                                <View style={styles.doctorInfo}>
                                                    <Text style={styles.doctorName}>{option.name}</Text>
                                                    <Text style={styles.doctorCrm}>{option.crm}</Text>
                                                    <Text style={styles.doctorSpecialty}>{option.specialty}</Text>
                                                </View>
                                                {doctor.id === option.id && <Text style={styles.doctorCheck}>✓</Text>}
                                            </Pressable>
                                        ))}
                                    </View>

                                    <Text style={styles.fieldLabel}>Data e horário</Text>
                                    <View style={styles.dateTimeRow}>
                                        {Platform.OS === 'web' ? (
                                            <>
                                                <View style={styles.webDateField}>
                                                    <Text style={styles.dateTimeCaption}>DATA</Text>
                                                    {React.createElement('input' as React.ElementType, {
                                                        type: 'date',
                                                        value: formatLocalDate(scheduledAt),
                                                        min: formatLocalDate(new Date()),
                                                        'aria-label': 'Data da consulta',
                                                        onChange: (event: { currentTarget: { value: string } }) => updateWebDateTime('date', event.currentTarget.value),
                                                        style: browserInputStyle,
                                                    })}
                                                </View>
                                                <View style={styles.webDateField}>
                                                    <Text style={styles.dateTimeCaption}>HORÁRIO</Text>
                                                    {React.createElement('input' as React.ElementType, {
                                                        type: 'time',
                                                        value: formatLocalTime(scheduledAt),
                                                        'aria-label': 'Horário da consulta',
                                                        onChange: (event: { currentTarget: { value: string } }) => updateWebDateTime('time', event.currentTarget.value),
                                                        style: browserInputStyle,
                                                    })}
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <Pressable style={styles.dateTimeButton} onPress={() => setPickerMode('date')}>
                                                    <Text style={styles.dateTimeCaption}>DATA</Text>
                                                    <Text style={styles.dateTimeValue}>{scheduledAt.toLocaleDateString('pt-BR')}</Text>
                                                </Pressable>
                                                <Pressable style={styles.dateTimeButton} onPress={() => setPickerMode('time')}>
                                                    <Text style={styles.dateTimeCaption}>HORÁRIO</Text>
                                                    <Text style={styles.dateTimeValue}>{scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                                                </Pressable>
                                            </>
                                        )}
                                    </View>

                                    {Platform.OS !== 'web' && pickerMode && (
                                        <View style={styles.pickerContainer}>
                                            <DateTimePicker
                                                value={scheduledAt}
                                                mode={pickerMode}
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                minimumDate={pickerMode === 'date' ? new Date() : undefined}
                                                onChange={updateDateTime}
                                            />
                                            {Platform.OS === 'ios' && (
                                                <Pressable style={styles.pickerDone} onPress={() => setPickerMode(null)}>
                                                    <Text style={styles.pickerDoneText}>Concluir</Text>
                                                </Pressable>
                                            )}
                                        </View>
                                    )}

                                    <Pressable accessibilityRole="button" disabled={saving} style={[styles.primaryButton, styles.saveButton]} onPress={saveAppointment}>
                                        {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>{editingAppointmentId ? 'Salvar alterações' : 'Salvar consulta'}</Text>}
                                    </Pressable>
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                <Modal
                    visible={appointmentToDelete !== null}
                    transparent
                    animationType="fade"
                    onRequestClose={() => {
                        if (!saving) setAppointmentToDelete(null);
                    }}
                >
                    <View style={styles.deleteBackdrop}>
                        <View style={styles.deleteDialog}>
                            <Text style={styles.eyebrow}>REMOVER DA AGENDA</Text>
                            <Text style={styles.deleteTitle}>Excluir consulta?</Text>
                            <Text style={styles.deleteCopy}>
                                A consulta de {appointmentToDelete?.patient} será removida permanentemente.
                            </Text>
                            {deleteError ? <Text accessibilityRole="alert" style={styles.deleteError}>{deleteError}</Text> : null}
                            <View style={styles.deleteActions}>
                                <Pressable accessibilityRole="button" disabled={saving} onPress={() => setAppointmentToDelete(null)} style={styles.cancelButton}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </Pressable>
                                <Pressable accessibilityRole="button" disabled={saving} onPress={deleteAppointment} style={styles.confirmDeleteButton}>
                                    {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.confirmDeleteText}>Excluir</Text>}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    page: { width: '100%', maxWidth: 1080, flex: 1, alignSelf: 'center' },
    agendaLayout: { flex: 1 },
    agendaLayoutWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 26 },
    agendaColumn: { flex: 1.55, minWidth: 0 },
    teamAside: { flex: 0.8, minWidth: 230, maxWidth: 300, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 8, marginTop: 3 },
    asideEyebrow: { color: colors.green, fontSize: 10, fontWeight: '700' },
    asideCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
    asideCount: { color: colors.ink, fontSize: 30, fontWeight: '700', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) },
    asideCountLabel: { color: colors.muted, fontSize: 12 },
    asideDivider: { height: 1, backgroundColor: colors.line, marginVertical: 14 },
    asideDoctor: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    asideInitials: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
    asideInitialsText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
    asideDoctorInfo: { flex: 1, minWidth: 0 },
    asideDoctorName: { color: colors.ink, fontSize: 12, fontWeight: '700' },
    asideSpecialty: { color: colors.muted, fontSize: 10, marginTop: 3 },
    asideLink: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 13, marginTop: 3 },
    asideLinkText: { color: colors.green, fontSize: 12, fontWeight: '700' },
    header: { paddingTop: 26, paddingBottom: 23, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14 },
    headerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 13 },
    brandMark: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
    brandMarkText: { color: colors.gold, fontSize: 30, fontWeight: '400', lineHeight: 34 },
    eyebrow: { color: colors.green, fontSize: 10, fontWeight: '700', marginBottom: 5 },
    title: { color: colors.ink, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }), fontSize: 29, fontWeight: '700' },
    email: { color: colors.muted, fontSize: 12, marginTop: 4 },
    logoutButton: { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 6, backgroundColor: colors.white },
    logoutText: { color: colors.coral, fontSize: 13, fontWeight: '600' },
    summary: { backgroundColor: colors.ink, borderRadius: 8, padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 26 },
    summaryLabel: { color: colors.panelMuted, fontSize: 10, fontWeight: '700' },
    summaryCount: { color: colors.white, fontSize: 38, fontWeight: '700', marginTop: 6, lineHeight: 42 },
    summaryCopy: { color: colors.panelMuted, fontSize: 13, marginTop: 2 },
    summaryNote: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: 310 },
    summaryDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
    summaryNoteLabel: { color: colors.gold, fontSize: 10, fontWeight: '700', marginBottom: 5 },
    summaryNoteText: { color: colors.white, fontSize: 14, lineHeight: 20, maxWidth: 270 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 13, marginTop: 4 },
    sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
    link: { color: colors.green, fontSize: 13, fontWeight: '600' },
    addButton: { height: 40, paddingHorizontal: 13, borderRadius: 5, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: colors.white, fontSize: 12, fontWeight: '700' },
    loader: { marginTop: 45 },
    list: { paddingBottom: 18 },
    emptyList: { paddingTop: 8, paddingBottom: 18 },
    emptyState: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 26, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8 },
    emptyMark: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    emptyMarkText: { color: colors.green, fontSize: 23, lineHeight: 27 },
    emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
    emptyCopy: { color: colors.muted, fontSize: 13, marginTop: 6, textAlign: 'center' },
    appointmentCard: { flexDirection: 'column', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 4, borderLeftColor: colors.green, borderRadius: 7, padding: 14, marginBottom: 10 },
    appointmentMain: { flexDirection: 'row', alignItems: 'center' },
    dateBlock: { width: 48, height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pale, borderRadius: 5, marginRight: 13 },
    dateDay: { color: colors.green, fontSize: 18, fontWeight: '700' },
    dateMonth: { color: colors.green, fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
    appointmentInfo: { flex: 1 },
    patientName: { color: colors.ink, fontSize: 15, fontWeight: '700' },
    appointmentMeta: { color: colors.muted, fontSize: 12, marginTop: 5 },
    appointmentDate: { color: colors.green, fontSize: 11, marginTop: 4, fontWeight: '600' },
    appointmentTime: { color: colors.ink, fontSize: 13, fontWeight: '600', marginLeft: 8 },
    appointmentActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 11, paddingTop: 9 },
    editButton: { minWidth: 74, height: 34, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
    editButtonText: { color: colors.green, fontSize: 12, fontWeight: '700' },
    deleteButton: { minWidth: 74, height: 34, paddingHorizontal: 12, borderRadius: 5, backgroundColor: colors.dangerSurface, alignItems: 'center', justifyContent: 'center' },
    deleteButtonText: { color: colors.coral, fontSize: 12, fontWeight: '700' },
    primaryButton: { height: 52, borderRadius: 6, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(48, 35, 63, 0.48)', justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end', alignItems: 'center' },
    keyboardSafe: { flex: 1, width: '100%', maxWidth: 560, justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end' },
    modalSheet: { width: '100%', maxHeight: '92%', alignSelf: 'center', backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 22, paddingTop: 23, paddingBottom: 20 },
    modalHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '700' },
    closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
    closeText: { color: colors.ink, fontSize: 25, lineHeight: 28 },
    fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 14 },
    input: { height: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 6, backgroundColor: colors.white, paddingHorizontal: 13, color: colors.ink, fontSize: 15 },
    doctorOptions: { gap: 7 },
    doctorOption: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
    doctorOptionSelected: { borderColor: colors.green, backgroundColor: colors.pale },
    doctorInitials: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F8F0DF', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
    doctorInitialsText: { color: '#87652A', fontSize: 11, fontWeight: '700' },
    doctorInfo: { flex: 1 },
    doctorName: { color: colors.ink, fontSize: 13, fontWeight: '700' },
    doctorCrm: { color: colors.muted, fontSize: 10, marginTop: 2 },
    doctorSpecialty: { color: colors.green, fontSize: 10, marginTop: 2 },
    doctorCheck: { color: colors.green, fontSize: 17, fontWeight: '700', paddingHorizontal: 7 },
    dateTimeRow: { flexDirection: 'row', gap: 10 },
    webDateField: { flex: 1, gap: 7 },
    dateTimeButton: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 12, backgroundColor: colors.white },
    dateTimeCaption: { color: colors.muted, fontSize: 10, fontWeight: '700' },
    dateTimeValue: { color: colors.ink, fontSize: 15, fontWeight: '600', marginTop: 5 },
    pickerContainer: { marginTop: 10, alignItems: 'center' },
    pickerDone: { alignSelf: 'flex-end', padding: 9 },
    pickerDoneText: { color: colors.green, fontWeight: '700' },
    saveButton: { marginTop: 22, marginBottom: 2 },
    deleteBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(48, 35, 63, 0.48)' },
    deleteDialog: { width: '100%', maxWidth: 420, padding: 22, backgroundColor: colors.white, borderRadius: 8 },
    deleteTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', marginTop: 3 },
    deleteCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 9 },
    deleteError: { color: colors.coral, fontSize: 13, marginTop: 12 },
    deleteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
    cancelButton: { height: 42, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
    cancelButtonText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
    confirmDeleteButton: { minWidth: 90, height: 42, paddingHorizontal: 15, backgroundColor: colors.coral, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
    confirmDeleteText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../App';
import { auth } from '../firebase';
import { clinicColors as colors } from './clinicTheme';

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const navigation = useNavigation<LoginScreenProp>();
    const isWide = useWindowDimensions().width >= 760;

    const logar = () => {
        if (!email || !senha) {
            setFeedback('Preencha o e-mail e a senha para continuar.');
            return;
        }
        setFeedback('');
        setIsSigningIn(true);
        signInWithEmailAndPassword(auth, email.trim(), senha)
            .then(() => navigation.replace('Main'))
            .catch((error: { code?: string }) => {
                const messages: Record<string, string> = {
                    'auth/invalid-credential': 'E-mail ou senha incorretos. Confira os dados ou crie uma conta.',
                    'auth/wrong-password': 'E-mail ou senha incorretos. Confira os dados ou crie uma conta.',
                    'auth/user-not-found': 'E-mail ou senha incorretos. Confira os dados ou crie uma conta.',
                    'auth/operation-not-allowed': 'O login por e-mail precisa ser ativado no Firebase Authentication.',
                    'auth/unauthorized-domain': 'Este endereço precisa ser autorizado nas configurações do Firebase.',
                    'auth/network-request-failed': 'Sem conexão com a internet. Tente novamente.',
                    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
                };
                setFeedback(messages[error.code ?? ''] ?? 'Não foi possível entrar. Verifique sua conexão e a configuração do Firebase.');
            })
            .finally(() => setIsSigningIn(false));
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardArea}>
                    <View style={[styles.frame, isWide && styles.frameWide]}>
                        <View style={[styles.brandPanel, isWide && styles.brandPanelWide]}>
                            <View>
                                <View style={styles.brandRow}>
                                    <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
                                    <View>
                                        <Text style={styles.brandName}>SEREIA</Text>
                                        <Text style={styles.brandCaption}>CLÍNICA INTEGRADA</Text>
                                    </View>
                                </View>
                                <Text style={styles.panelKicker}>CUIDADO COM PRESENÇA</Text>
                                <Text style={styles.panelTitle}>Saúde bem cuidada começa pela escuta.</Text>
                                <View style={styles.goldRule} />
                                <Text style={styles.panelCopy}>Um espaço simples para organizar cada consulta e acolher cada pessoa.</Text>
                            </View>
                            <Text style={styles.panelFooter}>AGENDA · CONSULTAS · CUIDADO</Text>
                        </View>

                        <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
                            <Text style={styles.formKicker}>ÁREA DA EQUIPE</Text>
                            <Text style={styles.title}>Bem-vindo de volta.</Text>
                            <Text style={styles.subtitle}>Entre para acessar a agenda do consultório.</Text>

                            <Text style={styles.label}>E-mail</Text>
                            <TextInput
                                accessibilityLabel="E-mail"
                                style={styles.input}
                                placeholder="seu@email.com"
                                placeholderTextColor={colors.muted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onChangeText={(value) => {
                                    setEmail(value);
                                    setFeedback('');
                                }}
                                value={email}
                            />

                            <Text style={styles.label}>Senha</Text>
                            <TextInput
                                accessibilityLabel="Senha"
                                style={styles.input}
                                placeholder="Sua senha"
                                placeholderTextColor={colors.muted}
                                secureTextEntry
                                onChangeText={(value) => {
                                    setSenha(value);
                                    setFeedback('');
                                }}
                                value={senha}
                                onSubmitEditing={logar}
                            />

                            {feedback ? (
                                <Text accessibilityRole="alert" style={styles.feedback}>{feedback}</Text>
                            ) : null}

                            <Pressable accessibilityRole="button" disabled={isSigningIn} style={[styles.primaryButton, isSigningIn && styles.primaryButtonDisabled]} onPress={logar}>
                                {isSigningIn ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>Entrar na agenda</Text>
                                        <Text style={styles.buttonArrow}>→</Text>
                                    </>
                                )}
                            </Pressable>

                            <View style={styles.formFooter}>
                                <Text style={styles.footerText}>Ainda não tem acesso?</Text>
                                <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.footerLink}>Criar conta</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flexGrow: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 },
    keyboardArea: { width: '100%', flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
    frame: { width: '100%', maxWidth: 1100, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, overflow: 'hidden' },
    frameWide: { minHeight: 540, flexDirection: 'row' },
    brandPanel: { minHeight: 230, justifyContent: 'space-between', paddingHorizontal: 27, paddingVertical: 25, backgroundColor: colors.panel },
    brandPanelWide: { width: '43%', minHeight: 540, paddingHorizontal: 42, paddingVertical: 42 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    brandMark: { width: 43, height: 43, borderWidth: 1, borderColor: colors.gold, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    brandMarkText: { color: colors.gold, fontSize: 23, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) },
    brandName: { color: colors.white, fontSize: 13, fontWeight: '700' },
    brandCaption: { color: colors.panelMuted, fontSize: 9, marginTop: 3 },
    panelKicker: { color: colors.gold, fontSize: 10, fontWeight: '700', marginTop: 30, marginBottom: 12 },
    panelTitle: { maxWidth: 360, color: '#FFFFFF', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }), fontSize: 34, lineHeight: 42 },
    goldRule: { width: 44, height: 3, backgroundColor: colors.gold, marginTop: 19, marginBottom: 14 },
    panelCopy: { maxWidth: 320, color: colors.panelMuted, fontSize: 14, lineHeight: 22 },
    panelFooter: { color: colors.panelSubtle, fontSize: 9, marginTop: 24 },
    formPanel: { paddingHorizontal: 25, paddingVertical: 29 },
    formPanelWide: { flex: 1, justifyContent: 'center', paddingHorizontal: 64, paddingVertical: 48 },
    formKicker: { color: colors.green, fontSize: 10, fontWeight: '700', marginBottom: 9 },
    title: { color: colors.ink, fontSize: 31, lineHeight: 38, fontWeight: '600', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) },
    subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 26 },
    label: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
    input: { height: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.field, color: colors.ink, paddingHorizontal: 13, fontSize: 14, marginBottom: 17 },
    primaryButton: { height: 50, borderRadius: 5, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 7 },
    primaryButtonDisabled: { opacity: 0.7 },
    primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    buttonArrow: { color: colors.gold, fontSize: 20, marginLeft: 10, marginTop: -2 },
    feedback: { color: colors.coral, backgroundColor: colors.dangerSurface, borderRadius: 5, padding: 11, marginBottom: 10, fontSize: 13, lineHeight: 18 },
    formFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 22 },
    footerText: { color: colors.muted, fontSize: 13 },
    footerLink: { color: colors.green, fontSize: 13, fontWeight: '700' },
});
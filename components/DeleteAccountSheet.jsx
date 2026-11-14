import { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../lib/auth';
import { Glass, GlassBackground, GlassButton, Notice } from './ui';

const RED = '#dc2626';

const WHAT_GETS_DELETED = [
    'Your account and profile',
    'All your bots and their connected channels',
    'Every waiting, published and failed post in your queues',
];

// Slide-up sheet that confirms with the account password, then calls DELETE /api/auth/user.
// On success the auth context signs out, which swaps the whole app back to the login screen.
export default function DeleteAccountSheet({ visible, onClose }) {
    const insets = useSafeAreaInsets();
    const { deleteAccount, handleAuthError } = useAuth();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const close = () => {
        if (deleting) return;
        setPassword('');
        setShowPassword(false);
        setError('');
        onClose();
    };

    const runDelete = async () => {
        setError('');
        setDeleting(true);
        try {
            await deleteAccount(password);
            // Signed out now; this sheet unmounts with the Profile screen.
        } catch (err) {
            setDeleting(false);
            if (!handleAuthError(err)) setError(err.message);
        }
    };

    // Last chance: a native alert so it can't be triggered by a stray tap on the button.
    const confirmDelete = () => {
        if (!password) return setError('Enter your password to continue.');
        Alert.alert('Delete account permanently?', "This can't be undone.", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: runDelete },
        ]);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <GlassBackground />
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 16, paddingBottom: insets.bottom + 24 }}
                    contentContainerClassName="px-5"
                >
                    <View className="mb-6 flex-row items-center justify-between">
                        <Text className="text-2xl font-bold text-slate-900">Delete account</Text>
                        <Pressable onPress={close} hitSlop={10} accessibilityLabel="Close" className="active:opacity-60">
                            <Ionicons name="close-circle" size={28} color="#94a3b8" />
                        </Pressable>
                    </View>

                    <Glass className="mb-4 gap-3 rounded-[28px] p-5">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="warning-outline" size={20} color={RED} />
                            <Text className="text-base font-semibold text-red-700">This is permanent</Text>
                        </View>
                        <Text className="text-[15px] text-slate-700">Deleting your account removes:</Text>
                        {WHAT_GETS_DELETED.map((line) => (
                            <View key={line} className="flex-row items-start gap-2">
                                <Ionicons name="close" size={16} color={RED} style={{ marginTop: 2 }} />
                                <Text className="flex-1 text-[15px] text-slate-700">{line}</Text>
                            </View>
                        ))}
                        <Text className="text-sm text-slate-500">
                            Posts already published stay on your Telegram channel. You can sign up again later with the same email.
                        </Text>
                    </Glass>

                    <Glass className="gap-4 rounded-[28px] p-5">
                        {error ? <Notice>{error}</Notice> : null}

                        <Text className="text-sm font-medium text-slate-700">Enter your password to confirm</Text>
                        <View
                            className={`flex-row items-center gap-3 rounded-2xl border px-4 ${
                                focused ? 'border-red-500 bg-white/90' : 'border-white/80 bg-white/60'
                            }`}
                        >
                            <Ionicons name="lock-closed-outline" size={18} color={focused ? RED : '#64748b'} />
                            {/* text-[16px], not text-base: text-base also sets a line height, which clips g, y, p in iOS inputs. */}
                            <TextInput
                                className="flex-1 py-3.5 text-[16px] text-slate-900"
                                placeholder="Password"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="current-password"
                                textContentType="password"
                                returnKeyType="done"
                                onSubmitEditing={confirmDelete}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                            />
                            <Pressable
                                onPress={() => setShowPassword((v) => !v)}
                                hitSlop={10}
                                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                            </Pressable>
                        </View>

                        <GlassButton onPress={confirmDelete} disabled={deleting} tint={RED} className="mt-1 rounded-full py-4">
                            {deleting ? <ActivityIndicator color="#fff" /> : <Ionicons name="trash-outline" size={18} color="#fff" />}
                            <Text className="text-[16px] font-semibold text-white">{deleting ? 'Deleting...' : 'Delete my account'}</Text>
                        </GlassButton>
                    </Glass>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

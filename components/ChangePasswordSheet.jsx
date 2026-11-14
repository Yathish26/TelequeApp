import { useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../lib/auth';
import { BLUE, Glass, GlassBackground, GlassButton, Notice } from './ui';

const MIN_PASSWORD = 6;

// Slide-up sheet with current / new / confirm password fields. Calls PUT /api/auth/password.
export default function ChangePasswordSheet({ visible, onClose }) {
    const insets = useSafeAreaInsets();
    const { changePassword, handleAuthError } = useAuth();
    const newRef = useRef(null);
    const confirmRef = useRef(null);
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const close = () => {
        if (saving) return;
        setCurrent('');
        setNext('');
        setConfirm('');
        setShowPasswords(false);
        setError('');
        onClose();
    };

    const validate = () => {
        if (!current || !next || !confirm) return 'Fill in all three fields.';
        if (next.length < MIN_PASSWORD) return `New password must be at least ${MIN_PASSWORD} characters.`;
        if (next !== confirm) return "The new passwords don't match.";
        if (next === current) return 'New password must be different from your current one.';
        return '';
    };

    const handleSave = async () => {
        const problem = validate();
        if (problem) return setError(problem);
        setError('');
        setSaving(true);
        try {
            await changePassword(current, next);
            setSaving(false);
            Alert.alert('Password changed', 'Use your new password next time you sign in.');
            setCurrent('');
            setNext('');
            setConfirm('');
            onClose();
        } catch (err) {
            setSaving(false);
            if (!handleAuthError(err)) setError(err.message);
        }
    };

    const fieldProps = {
        secureTextEntry: !showPasswords,
        autoCapitalize: 'none',
        autoCorrect: false,
        submitBehavior: 'submit',
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
                        <Text className="text-2xl font-bold text-slate-900">Change password</Text>
                        <Pressable onPress={close} hitSlop={10} accessibilityLabel="Close" className="active:opacity-60">
                            <Ionicons name="close-circle" size={28} color="#94a3b8" />
                        </Pressable>
                    </View>

                    <Glass className="gap-4 rounded-[28px] p-5">
                        {error ? <Notice>{error}</Notice> : null}

                        <PasswordField
                            icon="lock-closed-outline"
                            value={current}
                            onChangeText={setCurrent}
                            placeholder="Current password"
                            autoComplete="current-password"
                            textContentType="password"
                            returnKeyType="next"
                            onSubmitEditing={() => newRef.current?.focus()}
                            {...fieldProps}
                        />
                        <PasswordField
                            ref={newRef}
                            icon="key-outline"
                            value={next}
                            onChangeText={setNext}
                            placeholder={`New password (${MIN_PASSWORD}+ characters)`}
                            autoComplete="new-password"
                            textContentType="newPassword"
                            returnKeyType="next"
                            onSubmitEditing={() => confirmRef.current?.focus()}
                            {...fieldProps}
                        />
                        <PasswordField
                            ref={confirmRef}
                            icon="checkmark-circle-outline"
                            value={confirm}
                            onChangeText={setConfirm}
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                            textContentType="newPassword"
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                            {...fieldProps}
                        />

                        <Pressable
                            onPress={() => setShowPasswords((v) => !v)}
                            className="flex-row items-center gap-2 self-start active:opacity-60"
                            hitSlop={8}
                        >
                            <Ionicons name={showPasswords ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                            <Text className="text-sm text-slate-600">{showPasswords ? 'Hide passwords' : 'Show passwords'}</Text>
                        </Pressable>

                        <GlassButton onPress={handleSave} disabled={saving} className="mt-1 rounded-full py-4">
                            {saving ? <ActivityIndicator color="#fff" /> : null}
                            <Text className="text-[16px] font-semibold text-white">{saving ? 'Saving...' : 'Update password'}</Text>
                        </GlassButton>
                    </Glass>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// Same look as the login inputs: leading icon, blue border while focused.
function PasswordField({ ref, icon, ...inputProps }) {
    const [focused, setFocused] = useState(false);
    return (
        <View
            className={`flex-row items-center gap-3 rounded-2xl border px-4 ${
                focused ? 'border-blue-500 bg-white/90' : 'border-white/80 bg-white/60'
            }`}
        >
            <Ionicons name={icon} size={18} color={focused ? BLUE : '#64748b'} />
            {/* text-[16px], not text-base: text-base also sets a line height, which clips g, y, p in iOS inputs. */}
            <TextInput
                ref={ref}
                className="flex-1 py-3.5 text-[16px] text-slate-900"
                placeholderTextColor="#94a3b8"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...inputProps}
            />
        </View>
    );
}

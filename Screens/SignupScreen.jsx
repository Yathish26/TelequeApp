import { useState } from 'react';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../lib/auth';
import { Glass, GlassBackground, GlassButton, Notice, TelegramLogo } from '../components/ui';

// text-[16px] (not text-base): text-base also sets a line height, which clips the bottom of g, y, p in iOS inputs.
const INPUT = 'rounded-xl border border-white/80 bg-white/60 px-4 py-3.5 text-[16px] text-slate-900';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

// Creates an account (POST /api/auth/register), then signs straight in.
export default function SignupScreen({ onShowLogin }) {
    const insets = useSafeAreaInsets();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = () => {
        if (!name.trim()) return 'Enter your name.';
        if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
        if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
        if (password !== confirm) return 'Passwords don’t match.';
        return '';
    };

    const handleSubmit = async () => {
        const problem = validate();
        if (problem) return setError(problem);
        setError('');
        setLoading(true);
        try {
            await signUp(name, email, password);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <GlassBackground />
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
                contentContainerClassName="justify-center px-6"
            >
                <View className="mb-8 items-center">
                    <TelegramLogo size={64} />
                    <Text className="mt-4 text-3xl font-bold text-slate-900">Create account</Text>
                    <Text className="mt-1 text-center text-slate-500">Start scheduling your Telegram posts for free</Text>
                </View>

                <Glass className="gap-4 rounded-3xl p-6">
                    {error ? <Notice>{error}</Notice> : null}
                    <TextInput
                        className={INPUT}
                        value={name}
                        onChangeText={setName}
                        placeholder="Full name"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                        autoComplete="name"
                        textContentType="name"
                        returnKeyType="next"
                    />
                    <TextInput
                        className={INPUT}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="next"
                    />
                    <View className="justify-center">
                        <TextInput
                            className={`${INPUT} pr-12`}
                            value={password}
                            onChangeText={setPassword}
                            placeholder={`Password (at least ${MIN_PASSWORD} characters)`}
                            placeholderTextColor="#94a3b8"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            textContentType="newPassword"
                            returnKeyType="next"
                        />
                        <Pressable
                            onPress={() => setShowPassword((v) => !v)}
                            className="absolute right-3 p-1"
                            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        >
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                        </Pressable>
                    </View>
                    <TextInput
                        className={INPUT}
                        value={confirm}
                        onChangeText={setConfirm}
                        placeholder="Confirm password"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="new-password"
                        textContentType="newPassword"
                        returnKeyType="go"
                        onSubmitEditing={handleSubmit}
                    />
                    <GlassButton onPress={handleSubmit} disabled={loading} className="mt-2 rounded-full py-4">
                        {loading && <ActivityIndicator color="#fff" />}
                        <Text className="font-semibold text-white">{loading ? 'Creating account...' : 'Create account'}</Text>
                    </GlassButton>
                </Glass>

                <Pressable onPress={onShowLogin} className="mt-6 items-center py-2">
                    <Text className="text-slate-500">
                        Already have an account? <Text className="font-semibold text-blue-600">Sign in</Text>
                    </Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

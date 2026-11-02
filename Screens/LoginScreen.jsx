import { useState } from 'react';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../lib/auth';
import { Glass, GlassBackground, GlassButton, Notice, TelegramLogo } from '../components/ui';

const INPUT = 'rounded-xl border border-white/80 bg-white/60 px-4 py-3.5 text-base text-slate-900';

export default function LoginScreen({ onShowSignup }) {
    const insets = useSafeAreaInsets();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim() || !password) return setError('Enter your email and password.');
        setError('');
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (err) {
            setError(err.status === 401 ? 'Email or password is incorrect.' : err.message);
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
                    <Text className="mt-4 text-3xl font-bold text-slate-900">TeleQueue</Text>
                    <Text className="mt-1 text-center text-slate-500">Sign in to manage your Telegram bots</Text>
                </View>

                <Glass className="gap-4 rounded-3xl p-6">
                    {error ? <Notice>{error}</Notice> : null}
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
                            placeholder="Password"
                            placeholderTextColor="#94a3b8"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="current-password"
                            textContentType="password"
                            returnKeyType="go"
                            onSubmitEditing={handleSubmit}
                        />
                        <Pressable
                            onPress={() => setShowPassword((v) => !v)}
                            className="absolute right-3 p-1"
                            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        >
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                        </Pressable>
                    </View>
                    <GlassButton onPress={handleSubmit} disabled={loading} className="mt-2 rounded-full py-4">
                        {loading && <ActivityIndicator color="#fff" />}
                        <Text className="font-semibold text-white">{loading ? 'Signing in...' : 'Sign in'}</Text>
                    </GlassButton>
                </Glass>

                <Pressable onPress={onShowSignup} className="mt-6 items-center py-2">
                    <Text className="text-slate-500">
                        No account? <Text className="font-semibold text-blue-600">Create one</Text>
                    </Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

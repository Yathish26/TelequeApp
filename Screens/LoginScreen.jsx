import { useRef, useState } from 'react';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../lib/auth';
import { BLUE, Glass, GlassBackground, GlassButton, Notice, TelegramLogo } from '../components/ui';

const HIGHLIGHTS = [
    { icon: 'flash-outline', label: 'Auto-publish' },
    { icon: 'layers-outline', label: 'Bulk upload' },
    { icon: 'gift-outline', label: '100% free' },
];

export default function LoginScreen({ onShowSignup }) {
    const insets = useSafeAreaInsets();
    const { signIn } = useAuth();
    const passwordRef = useRef(null);
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
                {/* Brand */}
                <View className="mb-8 items-center">
                    <Glass className="mb-5 h-24 w-24 items-center justify-center rounded-full">
                        <TelegramLogo size={68} />
                    </Glass>
                    <Text className="text-3xl font-bold text-slate-900">TeleQueue</Text>
                    <Text className="mt-1.5 text-center text-[15px] text-slate-600">
                        Schedule posts to your Telegram channel automatically.
                    </Text>
                </View>

                {/* Form */}
                <Glass className="gap-4 rounded-[28px] p-5">
                    {error ? <Notice>{error}</Notice> : null}

                    <InputField
                        icon="mail-outline"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        submitBehavior="submit"
                    />

                    <InputField
                        ref={passwordRef}
                        icon="lock-closed-outline"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="current-password"
                        textContentType="password"
                        returnKeyType="go"
                        onSubmitEditing={handleSubmit}
                        trailing={(
                            <Pressable
                                onPress={() => setShowPassword((v) => !v)}
                                hitSlop={10}
                                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                            </Pressable>
                        )}
                    />

                    <GlassButton onPress={handleSubmit} disabled={loading} className="mt-1 rounded-full py-4">
                        {loading ? <ActivityIndicator color="#fff" /> : null}
                        <Text className="text-[16px] font-semibold text-white">{loading ? 'Signing in...' : 'Sign in'}</Text>
                        {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                    </GlassButton>
                </Glass>

                {/* What you get */}
                <View className="mt-6 flex-row justify-center gap-2">
                    {HIGHLIGHTS.map((item) => (
                        <Glass key={item.label} className="flex-row items-center gap-1.5 rounded-full px-3 py-2">
                            <Ionicons name={item.icon} size={14} color={BLUE} />
                            <Text className="text-xs font-medium text-slate-700">{item.label}</Text>
                        </Glass>
                    ))}
                </View>

                {/* Sign up */}
                <View className="mt-8 flex-row items-center gap-3">
                    <View className="h-px flex-1 bg-slate-900/10" />
                    <Text className="text-xs font-medium uppercase tracking-wide text-slate-500">New here?</Text>
                    <View className="h-px flex-1 bg-slate-900/10" />
                </View>
                <Pressable onPress={onShowSignup} className="mt-4 active:opacity-70">
                    <Glass interactive className="flex-row items-center justify-center gap-2 rounded-full py-3.5">
                        <Ionicons name="person-add-outline" size={18} color={BLUE} />
                        <Text className="text-[15px] font-semibold text-blue-700">Create a free account</Text>
                    </Glass>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Input with a leading icon; the border turns blue while it's focused.
function InputField({ ref, icon, trailing, ...inputProps }) {
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
            {trailing}
        </View>
    );
}

import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { APP_VERSION } from '../version';
import { telegram } from '../lib/api';
import { useAuth } from '../lib/auth';
import { BLUE, Glass, GlassBackground, GlassButton } from '../components/ui';

const initialsOf = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';

export default function ProfileScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user, signOut, refreshUser, handleAuthError } = useAuth();
    const [totals, setTotals] = useState({ bots: 0, pending: 0, sent: 0 });
    const [refreshing, setRefreshing] = useState(false);

    // Bot totals across all of the user's bots, from the same endpoint the Bots tab uses.
    const loadTotals = useCallback(async () => {
        try {
            const { bots } = await telegram('get', '/bots');
            setTotals({
                bots: bots.length,
                pending: bots.reduce((sum, b) => sum + b.counts.pending, 0),
                sent: bots.reduce((sum, b) => sum + b.counts.sent, 0),
            });
        } catch (err) {
            handleAuthError(err);
        }
    }, [handleAuthError]);

    useFocusEffect(useCallback(() => { loadTotals(); }, [loadTotals]));

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refreshUser().catch(handleAuthError), loadTotals()]);
        setRefreshing(false);
    };

    const confirmSignOut = () => {
        Alert.alert('Log out?', 'You can sign back in with your email and password.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: signOut },
        ]);
    };

    const stats = [
        { label: 'Bots', value: totals.bots },
        { label: 'Waiting', value: totals.pending },
        { label: 'Published', value: totals.sent },
    ];

    const links = [
        { icon: 'paper-plane-outline', label: 'My Bots', onPress: () => navigation.navigate('Bots') },
        { icon: 'help-circle-outline', label: 'How it works', onPress: () => navigation.navigate('Home') },
    ];

    return (
        <View className="flex-1">
            <GlassBackground />
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }}
                contentContainerClassName="px-5"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} colors={[BLUE]} />}
            >
                <Text className="mb-6 text-3xl font-bold text-slate-900">Profile</Text>

                <Glass className="mb-6 items-center rounded-3xl p-6">
                    {user?.profileImage ? (
                        <Image source={{ uri: user.profileImage }} className="mb-3 h-24 w-24 rounded-full bg-blue-100" />
                    ) : (
                        <View className="mb-3 h-24 w-24 items-center justify-center rounded-full bg-blue-600">
                            <Text className="text-3xl font-bold text-white">{initialsOf(user?.name)}</Text>
                        </View>
                    )}
                    <Text className="text-xl font-semibold text-slate-900">{user?.name || 'TeleQueue user'}</Text>
                    <View className="mt-1 flex-row items-center gap-1.5">
                        <Ionicons name="mail-outline" size={14} color="#475569" />
                        <Text className="text-slate-600">{user?.email}</Text>
                    </View>
                    {user?.phoneNumber ? (
                        <View className="mt-1 flex-row items-center gap-1.5">
                            <Ionicons name="call-outline" size={14} color="#475569" />
                            <Text className="text-slate-600">{user.phoneNumber}</Text>
                        </View>
                    ) : null}

                    <View className="mt-5 w-full flex-row justify-around border-t border-slate-900/10 pt-4">
                        {stats.map((s) => (
                            <View key={s.label} className="items-center">
                                <Text className="text-lg font-bold text-blue-600">{s.value}</Text>
                                <Text className="text-xs text-slate-600">{s.label}</Text>
                            </View>
                        ))}
                    </View>
                </Glass>

                <Glass className="overflow-hidden rounded-3xl">
                    {links.map((item, i) => (
                        <Pressable
                            key={item.label}
                            onPress={item.onPress}
                            className={`flex-row items-center gap-3 px-4 py-4 active:opacity-60 ${i < links.length - 1 ? 'border-b border-slate-900/10' : ''}`}
                        >
                            <Ionicons name={item.icon} size={20} color={BLUE} />
                            <Text className="flex-1 text-base text-slate-900">{item.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#64748b" />
                        </Pressable>
                    ))}
                </Glass>

                <GlassButton onPress={confirmSignOut} className="mt-6 rounded-full py-4">
                    <Ionicons name="log-out-outline" size={18} color="#fff" />
                    <Text className="font-semibold text-white">Log out</Text>
                </GlassButton>

                <Text className="mt-6 text-center text-xs text-slate-500">Version {APP_VERSION}</Text>
            </ScrollView>
        </View>
    );
}

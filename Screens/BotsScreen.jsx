import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, RefreshControl,
    ScrollView, Switch, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { telegram } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatDateTime, formatInterval } from '../lib/format';
import { BLUE, Glass, GlassBackground, GlassButton, Notice } from '../components/ui';

const AUTO_REFRESH_MS = 30 * 1000;

// Mobile version of hafrontend/src/TelegramDashboard.jsx, using the same /api/telegram endpoints.
export default function BotsScreen() {
    const insets = useSafeAreaInsets();
    const { handleAuthError } = useAuth();
    const [bots, setBots] = useState([]);
    const [options, setOptions] = useState({ intervalOptions: [], maxBots: 5, runnerEnabled: true });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [formBot, setFormBot] = useState(null); // null = closed, {} = create, bot = edit
    const [queueBot, setQueueBot] = useState(null);

    const showError = useCallback((err) => {
        if (!handleAuthError(err)) setError(err.message);
    }, [handleAuthError]);

    const loadBots = useCallback(async () => {
        try {
            const data = await telegram('get', '/bots');
            setBots(data.bots);
            setError('');
        } catch (err) {
            showError(err);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        telegram('get', '/options').then(setOptions).catch(showError);
    }, [showError]);

    // Reload when the tab opens, and keep queue counts and "next post" times current while it's open.
    useFocusEffect(useCallback(() => {
        loadBots();
        const timer = setInterval(loadBots, AUTO_REFRESH_MS);
        return () => clearInterval(timer);
    }, [loadBots]));

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBots();
        setRefreshing(false);
    };

    const replaceBot = (bot) => setBots((current) => current.map((b) => (b.id === bot.id ? bot : b)));

    const handleSaved = (bot, isNew) => {
        setBots((current) => (isNew ? [bot, ...current] : current.map((b) => (b.id === bot.id ? bot : b))));
        setFormBot(null);
    };

    const togglePause = async (bot) => {
        try {
            const data = await telegram('patch', `/bots/${bot.id}`, { isPaused: !bot.isPaused });
            replaceBot(data.bot);
        } catch (err) {
            showError(err);
        }
    };

    const confirmDelete = (bot) => {
        Alert.alert(
            'Delete bot?',
            `${bot.name} will stop publishing to ${bot.channel}, and its ${bot.counts.pending} waiting post(s) will be deleted. Your bot itself stays in Telegram; you can connect it again later.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete bot',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await telegram('delete', `/bots/${bot.id}`);
                            setBots((current) => current.filter((b) => b.id !== bot.id));
                        } catch (err) {
                            showError(err);
                        }
                    },
                },
            ],
        );
    };

    const atLimit = bots.length >= options.maxBots;

    return (
        <View className="flex-1">
            <GlassBackground />
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }}
                contentContainerClassName="gap-4 px-5"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} colors={[BLUE]} />}
            >
                <View className="flex-row items-end justify-between gap-3">
                    <View className="flex-1">
                        <Text className="text-3xl font-bold text-slate-900">My Bots</Text>
                        <Text className="mt-0.5 text-sm text-slate-500">Send your bot posts and they publish on your schedule.</Text>
                    </View>
                    <GlassButton
                        onPress={() => (atLimit ? Alert.alert('Bot limit reached', `You can connect up to ${options.maxBots} bots.`) : setFormBot({}))}
                        tint={atLimit ? '#94a3b8' : BLUE}
                        className="h-12 w-12 rounded-full"
                        accessibilityLabel="Create a bot"
                    >
                        <Ionicons name="add" size={26} color="#fff" />
                    </GlassButton>
                </View>

                {!options.runnerEnabled && (
                    <Notice tone="amber">
                        Publishing is switched off on this server, so bots won't receive or post messages here. You can still set them up.
                    </Notice>
                )}
                {error ? <Notice>{error}</Notice> : null}

                {loading ? (
                    <ActivityIndicator className="py-20" color={BLUE} />
                ) : bots.length === 0 ? (
                    <EmptyState onCreate={() => setFormBot({})} />
                ) : (
                    <>
                        <Text className="text-sm text-slate-600">{bots.length} of {options.maxBots} bots · pull down to refresh</Text>
                        {bots.map((bot) => (
                            <BotCard
                                key={bot.id}
                                bot={bot}
                                onEdit={() => setFormBot(bot)}
                                onTogglePause={() => togglePause(bot)}
                                onQueue={() => setQueueBot(bot)}
                                onDelete={() => confirmDelete(bot)}
                            />
                        ))}
                    </>
                )}
            </ScrollView>

            {formBot && (
                <BotFormModal
                    bot={formBot.id ? formBot : null}
                    intervalOptions={options.intervalOptions}
                    onClose={() => setFormBot(null)}
                    onSaved={handleSaved}
                    onAuthError={handleAuthError}
                />
            )}
            {queueBot && (
                <QueueModal
                    bot={queueBot}
                    onClose={() => {
                        setQueueBot(null);
                        loadBots();
                    }}
                    onAuthError={handleAuthError}
                />
            )}
        </View>
    );
}

const SETUP_STEPS = [
    { title: 'Create a bot with @BotFather', text: 'Open @BotFather in Telegram, send /newbot, and copy the token it gives you.' },
    { title: 'Make it a channel admin', text: 'Add your bot to your channel as an administrator with permission to post messages.' },
    { title: 'Connect it here', text: 'Paste the token, enter your channel and choose how often to publish.' },
    { title: 'Send it your posts', text: 'Open your bot in Telegram and send it posts. They publish to your channel on your schedule.' },
];

function SetupSteps() {
    return (
        <View className="gap-3">
            {SETUP_STEPS.map((step, index) => (
                <View key={step.title} className="flex-row gap-3">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                        <Text className="text-xs font-bold text-blue-600">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-semibold text-slate-900">{step.title}</Text>
                        <Text className="text-xs text-slate-500">{step.text}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

function EmptyState({ onCreate }) {
    return (
        <Glass className="rounded-3xl p-6">
            <View className="items-center">
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15">
                    <Ionicons name="paper-plane" size={28} color={BLUE} />
                </View>
                <Text className="mb-1 text-xl font-bold text-slate-900">Connect your first bot</Text>
                <Text className="mb-5 text-center text-sm text-slate-600">It takes about two minutes. You'll need a Telegram channel you manage.</Text>
                <GlassButton onPress={onCreate} className="mb-6 rounded-full px-6 py-3">
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text className="font-semibold text-white">Create a bot</Text>
                </GlassButton>
            </View>
            <SetupSteps />
        </Glass>
    );
}

function StatusBadge({ bot }) {
    let style = ['bg-green-100', 'text-green-700'];
    let label = 'Active';
    if (bot.lastError) [style, label] = [['bg-red-100', 'text-red-700'], 'Needs attention'];
    else if (bot.isPaused) [style, label] = [['bg-slate-200', 'text-slate-700'], 'Paused'];
    return (
        <View className={`rounded-full px-2.5 py-1 ${style[0]}`}>
            <Text className={`text-xs font-semibold ${style[1]}`}>{label}</Text>
        </View>
    );
}

function BotCard({ bot, onEdit, onTogglePause, onQueue, onDelete }) {
    const nextPost = bot.isPaused
        ? 'Paused'
        : bot.counts.pending === 0
            ? 'Queue is empty'
            : bot.nextPostAt ? formatDateTime(bot.nextPostAt) : 'Within a minute';

    return (
        <Glass className="overflow-hidden rounded-3xl">
            <View className="p-4">
                <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 flex-row items-center gap-3">
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-blue-500/15">
                            <Ionicons name="paper-plane" size={20} color={BLUE} />
                        </View>
                        <View className="flex-1">
                            <Text className="font-semibold text-slate-900" numberOfLines={1}>{bot.name}</Text>
                            <Text className="text-sm text-slate-500" numberOfLines={1}>
                                @{bot.botUsername} → {bot.channelTitle ? `${bot.channelTitle} (${bot.channel})` : bot.channel}
                            </Text>
                        </View>
                    </View>
                    <StatusBadge bot={bot} />
                </View>

                {bot.lastError && (
                    <View className="mt-4"><Notice>{bot.lastError} Fix it, then save the bot's settings to try again.</Notice></View>
                )}

                <View className="mt-4 flex-row flex-wrap justify-between gap-y-2">
                    <Stat label="Waiting" value={bot.counts.pending} />
                    <Stat label="Published" value={bot.counts.sent} />
                    <Stat label="Failed" value={bot.counts.failed} highlight={bot.counts.failed > 0} />
                    <Stat label="Next post" value={nextPost} small />
                </View>

                <View className="mt-3 gap-1">
                    <View className="flex-row items-center gap-1.5">
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text className="text-xs text-slate-500">{formatInterval(bot.intervalMinutes)}</Text>
                    </View>
                    <Text className="text-xs text-slate-500">
                        Forwarded captions: {bot.removeForwardCaptions ? 'removed' : 'kept'} · Queue confirmations: {bot.notifyOnQueue ? 'on' : 'off'}
                    </Text>
                </View>
            </View>

            <View className="flex-row flex-wrap gap-2 border-t border-slate-900/10 px-4 py-3">
                <GlassButton onPress={() => Linking.openURL(bot.botUrl)} className="gap-1.5 rounded-full px-3.5 py-2">
                    <Ionicons name="open-outline" size={16} color="#fff" />
                    <Text className="text-sm font-semibold text-white">Send posts</Text>
                </GlassButton>
                <ActionButton icon="list" onPress={onQueue}>Queue</ActionButton>
                <ActionButton icon={bot.isPaused ? 'play' : 'pause'} onPress={onTogglePause}>{bot.isPaused ? 'Resume' : 'Pause'}</ActionButton>
                <ActionButton icon="create-outline" onPress={onEdit}>Edit</ActionButton>
                <ActionButton icon="trash-outline" onPress={onDelete} danger>Delete</ActionButton>
            </View>
        </Glass>
    );
}

function Stat({ label, value, small = false, highlight = false }) {
    return (
        <View className="w-[48.5%] rounded-2xl bg-white/50 px-3 py-2.5">
            <Text className="text-[11px] uppercase tracking-wide text-slate-500">{label}</Text>
            <Text className={`font-bold ${small ? 'mt-1 text-sm' : 'text-xl'} ${highlight ? 'text-red-600' : 'text-slate-900'}`}>{value}</Text>
        </View>
    );
}

function ActionButton({ icon, onPress, danger = false, children }) {
    const color = danger ? '#dc2626' : BLUE;
    return (
        <Pressable onPress={onPress} className={`flex-row items-center gap-1.5 rounded-full bg-white/40 px-3 py-2 ${danger ? 'active:bg-red-500/15' : 'active:bg-blue-500/15'}`}>
            <Ionicons name={icon} size={16} color={color} />
            <Text style={{ color }} className="text-sm font-medium">{children}</Text>
        </Pressable>
    );
}

// Native page sheet on iOS, full screen on Android.
function Sheet({ title, onClose, children }) {
    const insets = useSafeAreaInsets();
    const isAndroid = Platform.OS === 'android';
    return (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <GlassBackground />
                <View
                    style={{ paddingTop: isAndroid ? insets.top + 12 : 16 }}
                    className="flex-row items-center justify-between px-5 pb-3"
                >
                    <Text className="flex-1 text-lg font-bold text-slate-900" numberOfLines={1}>{title}</Text>
                    <Pressable onPress={onClose} accessibilityLabel="Close">
                        <Glass interactive className="h-9 w-9 items-center justify-center rounded-full">
                            <Ionicons name="close" size={20} color="#334155" />
                        </Glass>
                    </Pressable>
                </View>
                {children}
            </KeyboardAvoidingView>
        </Modal>
    );
}

// text-[16px] (not text-base): text-base also sets a line height, which clips the bottom of g, y, p in iOS inputs.
const INPUT = 'rounded-xl border border-white/80 bg-white/60 px-4 py-3 text-[16px] text-slate-900';

function Field({ label, hint, children }) {
    return (
        <View>
            <Text className="mb-1.5 text-sm font-semibold text-slate-800">{label}</Text>
            {children}
            {hint && <Text className="mt-1 text-xs text-slate-500">{hint}</Text>}
        </View>
    );
}

function Toggle({ value, onChange, title, description }) {
    return (
        <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-800">{title}</Text>
                <Text className="text-xs text-slate-500">{description}</Text>
            </View>
            <Switch value={value} onValueChange={onChange} trackColor={{ true: BLUE, false: '#cbd5e1' }} thumbColor="#fff" />
        </View>
    );
}

function BotFormModal({ bot, intervalOptions, onClose, onSaved, onAuthError }) {
    const insets = useSafeAreaInsets();
    const isEdit = Boolean(bot);
    const [form, setForm] = useState({
        name: bot?.name || '',
        token: '',
        channel: bot?.channel || '',
        intervalMinutes: bot?.intervalMinutes ?? 180, // ?? so Instant (0) isn't replaced by the default
        removeForwardCaptions: bot?.removeForwardCaptions ?? true,
        notifyOnQueue: bot?.notifyOnQueue ?? true,
    });
    const [showToken, setShowToken] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const set = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));

    const handleSubmit = async () => {
        if (!isEdit && !form.token.trim()) return setError('Paste your bot token from @BotFather.');
        if (!form.channel.trim()) return setError('Enter your channel.');
        setError('');
        setSaving(true);
        // On edit, an empty token field means "keep the current token".
        const payload = { ...form, intervalMinutes: Number(form.intervalMinutes) };
        if (isEdit && !payload.token.trim()) delete payload.token;
        try {
            const data = isEdit
                ? await telegram('patch', `/bots/${bot.id}`, payload)
                : await telegram('post', '/bots', payload);
            onSaved(data.bot, !isEdit);
        } catch (err) {
            if (!onAuthError(err)) setError(err.message);
            setSaving(false);
        }
    };

    return (
        <Sheet title={isEdit ? `Edit ${bot.name}` : 'Create a bot'} onClose={onClose}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                contentContainerClassName="gap-5 px-5 pt-5"
            >
                {error ? <Notice>{error}</Notice> : null}

                {!isEdit && (
                    <Glass className="rounded-3xl p-4">
                        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-600">Before you start</Text>
                        <SetupSteps />
                    </Glass>
                )}

                <Field label="Bot token" hint={isEdit ? `Current: ${bot.tokenPreview}. Leave empty to keep it.` : 'From @BotFather. It looks like 123456789:AAF…'}>
                    <View className="justify-center">
                        <TextInput
                            className={`${INPUT} pr-12 font-mono`}
                            value={form.token}
                            onChangeText={set('token')}
                            placeholder={isEdit ? 'Paste a new token to replace it' : 'Paste your bot token'}
                            placeholderTextColor="#94a3b8"
                            secureTextEntry={!showToken}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Pressable onPress={() => setShowToken((v) => !v)} className="absolute right-3 p-1" accessibilityLabel={showToken ? 'Hide token' : 'Show token'}>
                            <Ionicons name={showToken ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                        </Pressable>
                    </View>
                </Field>

                <Field label="Channel" hint="Your channel's @username or t.me link. The bot must be an admin there.">
                    <TextInput
                        className={INPUT}
                        value={form.channel}
                        onChangeText={set('channel')}
                        placeholder="@yourchannel"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </Field>

                <Field label="Posting frequency" hint="How long to wait between posts. Albums count as one post.">
                    <View className="flex-row flex-wrap gap-2">
                        {intervalOptions.map((minutes) => {
                            const selected = Number(form.intervalMinutes) === minutes;
                            return (
                                <Pressable
                                    key={minutes}
                                    onPress={() => set('intervalMinutes')(minutes)}
                                    className={`rounded-full border px-3.5 py-2 ${selected ? 'border-blue-600 bg-blue-600' : 'border-white/80 bg-white/60 active:bg-blue-500/15'}`}
                                >
                                    <Text className={`text-sm ${selected ? 'font-semibold text-white' : 'text-slate-700'}`}>
                                        {minutes === 0 ? 'Instant' : formatInterval(minutes)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Field>

                {Number(form.intervalMinutes) === 0 && (
                    <Notice tone="blue">
                        Telegram's speed limit: a bot can post about 20 messages a minute to a channel. If you send more at once,
                        the extra posts wait and go out automatically. Nothing is lost or counted as failed.
                    </Notice>
                )}

                <Field label="Name (optional)" hint="Only shown in this app and on your dashboard.">
                    <TextInput
                        className={INPUT}
                        value={form.name}
                        onChangeText={set('name')}
                        placeholder="e.g. Daily wallpapers"
                        placeholderTextColor="#94a3b8"
                        maxLength={60}
                    />
                </Field>

                <Glass className="gap-4 rounded-3xl p-4">
                    <Toggle
                        value={form.removeForwardCaptions}
                        onChange={set('removeForwardCaptions')}
                        title="Remove captions from forwarded posts"
                        description="When you forward media from another channel, its original caption is dropped."
                    />
                    <Toggle
                        value={form.notifyOnQueue}
                        onChange={set('notifyOnQueue')}
                        title="Confirm each queued post"
                        description="The bot replies in your chat whenever something is added to the queue."
                    />
                </Glass>

                <GlassButton onPress={handleSubmit} disabled={saving} className="rounded-full py-4">
                    {saving && <ActivityIndicator color="#fff" />}
                    <Text className="font-semibold text-white">
                        {saving ? 'Checking with Telegram...' : isEdit ? 'Save changes' : 'Create bot'}
                    </Text>
                </GlassButton>
            </ScrollView>
        </Sheet>
    );
}

const MEDIA_ICONS = { photo: 'image-outline', video: 'videocam-outline', document: 'document-text-outline' };

function describeItem(item) {
    if (item.kind === 'text') return { icon: 'text', label: 'Text', preview: item.text };
    const [first] = item.media;
    if (item.media.length > 1) return { icon: 'images-outline', label: `Album · ${item.media.length} items`, preview: first.caption };
    const labels = { photo: 'Photo', video: 'Video', document: 'File' };
    return { icon: MEDIA_ICONS[first.type], label: labels[first.type], preview: first.caption };
}

function QueueModal({ bot, onClose, onAuthError }) {
    const insets = useSafeAreaInsets();
    const [status, setStatus] = useState('pending');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await telegram('get', `/bots/${bot.id}/queue?status=${status}`);
            setItems(data.items);
            setError('');
        } catch (err) {
            if (!onAuthError(err)) setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [bot.id, status, onAuthError]);

    useEffect(() => { load(); }, [load]);

    const run = async (method, path) => {
        try {
            await telegram(method, path);
            await load();
        } catch (err) {
            if (!onAuthError(err)) setError(err.message);
        }
    };

    const confirmClear = () => {
        Alert.alert('Clear queue?', `Remove all ${items.length} waiting posts?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear queue', style: 'destructive', onPress: () => run('delete', `/bots/${bot.id}/queue`) },
        ]);
    };

    const tabs = [['pending', 'Waiting'], ['sent', 'Published'], ['failed', 'Failed']];

    return (
        <Sheet title={`${bot.name} · Queue`} onClose={onClose}>
            <View className="flex-row items-center justify-between gap-3 px-5 pt-4">
                <Glass className="flex-row gap-1 rounded-full p-1">
                    {tabs.map(([value, label]) => (
                        <Pressable
                            key={value}
                            onPress={() => setStatus(value)}
                            className={`rounded-full px-3.5 py-1.5 ${status === value ? 'bg-white' : ''}`}
                        >
                            <Text className={`text-sm font-medium ${status === value ? 'text-blue-600' : 'text-slate-600'}`}>{label}</Text>
                        </Pressable>
                    ))}
                </Glass>
                {status === 'pending' && items.length > 0 && (
                    <Pressable onPress={confirmClear}>
                        <Text className="text-sm font-medium text-red-600">Clear</Text>
                    </Pressable>
                )}
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} contentContainerClassName="px-5 pt-4">
                {error ? <View className="mb-4"><Notice>{error}</Notice></View> : null}

                {loading ? (
                    <ActivityIndicator className="py-10" color={BLUE} />
                ) : items.length === 0 ? (
                    <View className="items-center py-10">
                        {status === 'pending' ? (
                            <>
                                <Text className="text-center text-sm text-slate-500">Nothing waiting. Send posts to your bot to queue them.</Text>
                                <Pressable onPress={() => Linking.openURL(`https://t.me/${bot.botUsername}`)} className="mt-2 flex-row items-center gap-1">
                                    <Text className="text-sm font-semibold text-blue-600">@{bot.botUsername}</Text>
                                    <Ionicons name="open-outline" size={14} color={BLUE} />
                                </Pressable>
                            </>
                        ) : (
                            <Text className="text-sm text-slate-500">{status === 'sent' ? 'No published posts yet.' : 'No failed posts. 🎉'}</Text>
                        )}
                    </View>
                ) : (
                    <Glass className="overflow-hidden rounded-3xl">
                        {items.map((item, index) => {
                            const { icon, label, preview } = describeItem(item);
                            return (
                                <View key={item.id} className={`flex-row items-start gap-3 p-3 ${index > 0 ? 'border-t border-slate-900/10' : ''}`}>
                                    {status === 'pending' && <Text className="w-5 pt-2.5 text-right text-xs font-bold text-slate-400">{index + 1}</Text>}
                                    <View className="h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                        <Ionicons name={icon} size={16} color={BLUE} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-slate-900">{label}</Text>
                                        {preview
                                            ? <Text className="text-sm text-slate-600" numberOfLines={1}>{preview}</Text>
                                            : <Text className="text-sm italic text-slate-400">No caption</Text>}
                                        <Text className="mt-0.5 text-xs text-slate-400">
                                            {status === 'sent' && item.sentAt ? `Published ${formatDateTime(item.sentAt)}` : `Added ${formatDateTime(item.createdAt)}`}
                                        </Text>
                                        {item.lastError && <Text className="mt-1 text-xs text-red-600">{item.lastError}</Text>}
                                    </View>
                                    <View className="flex-row">
                                        {status === 'failed' && (
                                            <Pressable onPress={() => run('post', `/bots/${bot.id}/queue/${item.id}/retry`)} className="rounded-full p-2 active:bg-blue-50" accessibilityLabel="Try again">
                                                <Ionicons name="refresh" size={18} color={BLUE} />
                                            </Pressable>
                                        )}
                                        {status !== 'sent' && (
                                            <Pressable onPress={() => run('delete', `/bots/${bot.id}/queue/${item.id}`)} className="rounded-full p-2 active:bg-red-50" accessibilityLabel="Remove">
                                                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                            </Pressable>
                                        )}
                                        {status === 'sent' && <Ionicons name="checkmark" size={18} color="#16a34a" style={{ margin: 8 }} />}
                                    </View>
                                </View>
                            );
                        })}
                    </Glass>
                )}
            </ScrollView>
        </Sheet>
    );
}

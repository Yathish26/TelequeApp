import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { telegram } from '../lib/api';
import { BLUE, Glass, GlassBackground, GlassButton, TelegramLogo } from '../components/ui';

// Content mirrors hafrontend/src/TelegramBots.jsx — keep in sync if the bot changes.
const features = [
    { title: 'Bulk Post Upload', description: 'Send or forward dozens or hundreds of posts to your bot at once instead of publishing them manually.' },
    { title: 'Custom Posting Frequency', description: 'Publish instantly as you send them, every 30 seconds, every few minutes, hourly or once a day.' },
    { title: 'Simple Telegram Setup', description: 'Connect your Telegram bot and channel in just a few steps.' },
    { title: 'Automatic Publishing', description: 'Once your queue is running, your posts are published automatically.' },
];

const postTypes = [
    { icon: 'text', title: 'Text Posts', description: 'Any text message is queued as a text post for your channel.' },
    { icon: 'image-outline', title: 'Photos', description: 'Published in the highest quality Telegram provides, with your caption.' },
    { icon: 'videocam-outline', title: 'Videos', description: 'Queued and published with their captions, just as you sent them.' },
    { icon: 'document-text-outline', title: 'Files & Documents', description: 'PDFs, archives, GIFs and other files are published as documents.' },
    { icon: 'images-outline', title: 'Albums', description: 'Photos or videos sent together are published together as one album.' },
    { icon: 'ban-outline', title: 'Not Supported', description: 'Stickers, voice notes, audio, video notes, polls, locations and contacts are skipped.', muted: true },
];

const postingRules = [
    { title: 'One post at a time', description: 'Each item is published as its own post, spaced out by your chosen interval.' },
    { title: 'Albums count as one post', description: 'An album is published in one go and takes a single slot in your schedule.' },
    { title: 'First in, first out', description: 'Posts are published in the order your bot receives them.' },
    { title: 'Captions are kept', description: 'Captions on your photos, videos and files are published with them.' },
    { title: 'Clean forwards', description: 'Media forwarded from another channel has its original caption removed.' },
    { title: 'Instant first post', description: 'If your queue is empty, the next post goes out right away; later posts follow your interval.' },
    { title: 'Telegram speed limit', description: 'A bot can post about 20 messages a minute. On Instant, extra posts wait and go out automatically.' },
];

const steps = [
    {
        title: 'Create your bot in Telegram',
        points: [
            'Open Telegram and search for @BotFather (the official account with a blue tick).',
            'Tap Start, then send /newbot.',
            'Type a display name, then a username that ends in "bot".',
            'BotFather replies with a token like 123456789:AAF… Copy it.',
        ],
        tip: 'Keep your token private. Anyone who has it can control your bot.',
    },
    {
        title: 'Make the bot an admin of your channel',
        points: [
            'Open your channel and tap its name at the top.',
            'Go to Administrators → Add Admin and pick your bot.',
            'Make sure Post Messages is on, then tap Save.',
        ],
    },
    {
        title: 'Connect it in the Bots tab',
        points: [
            'Tap Create a bot and paste the token from BotFather.',
            'Enter your channel’s @username or t.me link.',
            'Choose how long to wait between posts, then tap Create bot.',
        ],
    },
    {
        title: 'Send your posts to the bot',
        points: [
            'Tap Send posts on your bot, or search for its username in Telegram.',
            'Send or forward text, photos, videos, files or albums.',
            'Your bot replies ✅ to confirm each post joins the queue.',
        ],
        tip: 'Send as many posts as you like in one go. TeleQueue spaces them out for you.',
    },
    {
        title: 'Sit back and manage your queue',
        points: [
            'Send /status to your bot to see how many posts are waiting.',
            'Open View queue to see what is waiting, published or failed.',
            'Remove, retry, pause or resume whenever you want.',
        ],
    },
];

const faqs = [
    { question: 'Do I need to give you my Telegram account?', answer: 'No. You only connect your Telegram bot. Your personal Telegram login is never required.' },
    { question: 'Where do I send my posts?', answer: 'Open a private chat with your own bot in Telegram (tap "Send posts" on your bot) and send or forward your posts there. The bot publishes them to your channel for you.' },
    { question: 'How do I know my post was added?', answer: 'Your bot replies with ✅ and the number of posts waiting. You can also send /status to the bot or open "View queue".' },
    { question: 'Can I schedule hundreds of posts?', answer: 'Yes. Add as many posts as you like to your publishing queue.' },
    { question: 'Is TeleQueue free?', answer: 'Yes. TeleQueue is completely free to use. No plans or payment required.' },
    { question: 'Is there a limit on how fast posts go out?', answer: 'Telegram limits every bot to about 20 posts a minute in a channel. On Instant, extra posts wait in your queue and are published automatically. They are not lost.' },
    { question: 'Can I pause my queue?', answer: 'Yes. You can pause and resume your publishing schedule whenever you want.' },
    { question: 'How are albums published?', answer: 'Send your photos or videos together as one album. They are published together as a single post, using one slot in your schedule.' },
    { question: 'What happens to captions on forwarded posts?', answer: 'Captions you write are always kept. Media forwarded from another channel has its original caption removed by default. You can turn this off in your bot’s settings.' },
];

const queuePreview = ['Post 01', 'Post 02', 'Post 03', 'Post 04'];

export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [botCount, setBotCount] = useState(0);
    const [openFaq, setOpenFaq] = useState(0);

    // Users who already have bots get a shortcut to them. Any failure just hides it.
    useFocusEffect(useCallback(() => {
        telegram('get', '/bots').then((data) => setBotCount(data.bots?.length || 0)).catch(() => {});
    }, []));

    const goToBots = () => navigation.navigate('Bots');
    const ctaLabel = botCount > 0 ? `My Bots (${botCount})` : 'Create Your Bot';

    return (
        <View className="flex-1">
            <GlassBackground />
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }}
                contentContainerClassName="px-5"
            >
                {/* Hero */}
                <View className="mb-1 flex-row items-center gap-2">
                    <TelegramLogo size={20} />
                    <Text className="text-xs font-semibold uppercase tracking-wide text-sky-700">Telegram Automation</Text>
                </View>
                <Text className="mb-2 text-3xl font-bold text-slate-900">Schedule Your Telegram Posts Automatically</Text>
                <Text className="mb-6 text-base text-slate-600">
                    Upload your posts once, choose how often they should be published, and let TeleQueue handle the rest.
                </Text>

                <Glass tint={BLUE} className="mb-8 rounded-3xl p-5">
                    <View className="mb-4 flex-row items-center gap-3 border-b border-white/25 pb-4">
                        <View className="rounded-full bg-white p-0.5"><TelegramLogo size={36} /></View>
                        <View className="flex-1">
                            <Text className="font-semibold text-white">Telegram Channel</Text>
                            <Text className="text-xs text-blue-100">@yourchannel</Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                            <View className="h-1.5 w-1.5 rounded-full bg-green-300" />
                            <Text className="text-xs font-medium text-green-200">Connected</Text>
                        </View>
                    </View>
                    <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-100">Post Queue</Text>
                    <View className="mb-4 gap-2">
                        {queuePreview.map((post, index) => (
                            <View key={post} className="flex-row items-center gap-3 rounded-xl bg-white/15 px-3 py-2">
                                <View className="h-5 w-5 items-center justify-center rounded-full bg-white">
                                    <Text className="text-[11px] font-bold text-blue-600">{index + 1}</Text>
                                </View>
                                <Text className="text-sm text-white">{post}</Text>
                            </View>
                        ))}
                    </View>
                    <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-blue-100">Publishing every 15 minutes</Text>
                        <Text className="text-xs font-semibold text-white">Next: 12:45 PM</Text>
                    </View>
                    <GlassButton onPress={goToBots} tint="#ffffff" className="mt-5 rounded-full py-3">
                        <Ionicons name={botCount > 0 ? 'paper-plane' : 'add'} size={18} color={BLUE} />
                        <Text className="font-semibold text-blue-600">{ctaLabel}</Text>
                    </GlassButton>
                </Glass>

                {/* Features */}
                <SectionTitle title="Everything You Need" subtitle="Stop manually publishing posts throughout the day." />
                <View className="mb-8 gap-3">
                    {features.map((feature) => (
                        <Glass key={feature.title} className="flex-row gap-3 rounded-2xl p-4">
                            <View className="h-9 w-9 items-center justify-center rounded-full bg-blue-500/15">
                                <Ionicons name="checkmark" size={18} color={BLUE} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-slate-900">{feature.title}</Text>
                                <Text className="mt-0.5 text-sm text-slate-600">{feature.description}</Text>
                            </View>
                        </Glass>
                    ))}
                </View>

                {/* What you can post */}
                <SectionTitle title="What You Can Post" subtitle="Send content to your bot just like any Telegram chat." />
                <View className="mb-8 flex-row flex-wrap justify-between gap-y-3">
                    {postTypes.map(({ icon, title, description, muted }) => (
                        <Glass key={title} className={`w-[48.5%] rounded-2xl p-4 ${muted ? 'opacity-70' : ''}`}>
                            <View className={`mb-2 h-9 w-9 items-center justify-center rounded-full ${muted ? 'bg-slate-500/15' : 'bg-blue-500/15'}`}>
                                <Ionicons name={icon} size={18} color={muted ? '#64748b' : BLUE} />
                            </View>
                            <Text className={`font-semibold ${muted ? 'text-slate-600' : 'text-slate-900'}`}>{title}</Text>
                            <Text className="mt-0.5 text-xs text-slate-600">{description}</Text>
                        </Glass>
                    ))}
                </View>

                {/* How publishing works */}
                <SectionTitle title="How Your Queue Publishes" subtitle="Simple, predictable rules so you always know what goes out." />
                <Glass className="mb-8 gap-4 rounded-3xl p-4">
                    {postingRules.map((rule, index) => (
                        <View key={rule.title} className="flex-row gap-3">
                            <View className="h-7 w-7 items-center justify-center rounded-full bg-blue-600">
                                <Text className="text-xs font-bold text-white">{index + 1}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="font-semibold text-slate-900">{rule.title}</Text>
                                <Text className="text-sm text-slate-600">{rule.description}</Text>
                            </View>
                        </View>
                    ))}
                </Glass>

                {/* How it works */}
                <SectionTitle title="How It Works" subtitle="Setup takes about two minutes. All you need is a channel you manage." />
                <Glass className="mb-4 rounded-3xl p-4">
                    <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">Where do I send my posts?</Text>
                    <Text className="mb-3 font-semibold text-slate-900">To your bot in a private chat, not to your channel.</Text>
                    <View className="gap-2">
                        <FlowStep logo>You send posts to <Text className="font-bold">@your_bot</Text></FlowStep>
                        <FlowStep>TeleQueue keeps them <Text className="font-bold">in order</Text></FlowStep>
                        <FlowStep logo>Bot posts them to <Text className="font-bold">@yourchannel</Text></FlowStep>
                    </View>
                </Glass>
                <Glass className="mb-8 gap-5 rounded-3xl p-4">
                    {steps.map((step, index) => (
                        <View key={step.title} className="flex-row gap-3">
                            <View className="h-9 w-9 items-center justify-center rounded-full bg-blue-600">
                                <Text className="text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="mb-1.5 text-base font-semibold text-slate-900">{step.title}</Text>
                                {step.points.map((point) => (
                                    <View key={point} className="mb-1 flex-row gap-2">
                                        <Ionicons name="checkmark" size={14} color={BLUE} style={{ marginTop: 3 }} />
                                        <Text className="flex-1 text-sm text-slate-600">{point}</Text>
                                    </View>
                                ))}
                                {step.tip && (
                                    <Text className="mt-2 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-800">
                                        <Text className="font-bold">Tip: </Text>{step.tip}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                </Glass>

                {/* FAQ */}
                <SectionTitle title="Frequently Asked Questions" />
                <View className="mb-8 gap-2">
                    {faqs.map((faq, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <Glass key={faq.question} className="overflow-hidden rounded-2xl">
                                <Pressable
                                    onPress={() => setOpenFaq(isOpen ? -1 : index)}
                                    className="flex-row items-center justify-between gap-3 px-4 py-3.5 active:opacity-70"
                                >
                                    <Text className="flex-1 font-semibold text-slate-900">{faq.question}</Text>
                                    <Ionicons name={isOpen ? 'remove' : 'add'} size={20} color={BLUE} />
                                </Pressable>
                                {isOpen && <Text className="px-4 pb-4 text-sm text-slate-600">{faq.answer}</Text>}
                            </Glass>
                        );
                    })}
                </View>

                {/* Final CTA */}
                <Glass tint={BLUE} className="items-center rounded-3xl p-6">
                    <View className="rounded-full bg-white p-0.5"><TelegramLogo size={48} /></View>
                    <Text className="mt-4 text-center text-xl font-bold text-white">Ready to automate your Telegram channel?</Text>
                    <Text className="mt-1 text-center text-blue-100">TeleQueue is completely free. No plans, no hidden fees.</Text>
                    <GlassButton onPress={goToBots} tint="#ffffff" className="mt-5 rounded-full px-6 py-3">
                        <Text className="font-semibold text-blue-600">{botCount > 0 ? `Go to ${ctaLabel}` : 'Create Your Bot for Free'}</Text>
                    </GlassButton>
                </Glass>
            </ScrollView>
        </View>
    );
}

function SectionTitle({ title, subtitle }) {
    return (
        <View className="mb-3">
            <Text className="text-xl font-bold text-slate-900">{title}</Text>
            {subtitle && <Text className="mt-0.5 text-sm text-slate-600">{subtitle}</Text>}
        </View>
    );
}

function FlowStep({ logo = false, children }) {
    return (
        <View className="flex-row items-center gap-2 rounded-xl bg-white/50 px-3 py-2.5">
            {logo ? <TelegramLogo size={20} /> : <Ionicons name="list" size={18} color={BLUE} />}
            <Text className="flex-1 text-sm text-slate-700">{children}</Text>
        </View>
    );
}

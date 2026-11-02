import { Pressable, StyleSheet, Text, View } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { cssInterop } from 'nativewind';
import Ionicons from '@expo/vector-icons/Ionicons';

export const BLUE = '#2563eb';
export const TELEGRAM_BLUE = '#229ED9';

// GlassView from expo-glass-effect. Builds made before expo-glass-effect was added don't have its
// native code (importing it would crash with "Cannot find native module 'ExpoGlassEffect'"), so it's
// only loaded when the native module exists; until the next `eas build` a plain View stands in.
const { GlassView, isLiquidGlassAvailable } = requireOptionalNativeModule('ExpoGlassEffect')
    ? require('expo-glass-effect')
    : { GlassView: View, isLiquidGlassAvailable: () => false };

// Lets GlassView take Tailwind classes (rounded-3xl, p-6...) like any other view.
if (GlassView !== View) cssInterop(GlassView, { className: 'style' });

// GlassView only draws Liquid Glass on iOS 26+. Elsewhere (Android, older iOS, older builds) it's a
// plain view, so it gets a frosted white (or tint-coloured) background to keep the same look.
const liquidGlass = isLiquidGlassAvailable();

// A GlassView surface. `tint` colours it (e.g. a blue button); `interactive` makes it react to touches.
export function Glass({ tint, interactive = false, className = '', style, children, ...props }) {
    return (
        <GlassView
            glassEffectStyle="regular"
            tintColor={tint}
            isInteractive={interactive}
            className={`${liquidGlass || tint ? '' : 'border border-white/80 bg-white/75'} ${className}`}
            style={[!liquidGlass && tint && { backgroundColor: tint }, style]}
            {...props}
        >
            {children}
        </GlassView>
    );
}

// A tinted glass button (solid blue where Liquid Glass isn't available).
export function GlassButton({ onPress, disabled = false, tint = BLUE, className = '', children, ...props }) {
    return (
        <Pressable onPress={onPress} disabled={disabled} className={disabled ? 'opacity-60' : 'active:opacity-80'} {...props}>
            <Glass tint={tint} interactive className={`flex-row items-center justify-center gap-2 ${className}`}>
                {children}
            </Glass>
        </Pressable>
    );
}

// Soft blue colour wash behind every screen, so the glass has something to refract.
const BACKGROUND = [
    'radial-gradient(circle at 10% 5%, rgba(59, 130, 246, 0.45), transparent 45%)',
    'radial-gradient(circle at 95% 30%, rgba(14, 165, 233, 0.35), transparent 40%)',
    'radial-gradient(circle at 15% 75%, rgba(99, 102, 241, 0.30), transparent 45%)',
    'radial-gradient(circle at 85% 95%, rgba(56, 189, 248, 0.35), transparent 40%)',
    'linear-gradient(180deg, #eff6ff, #dbeafe)',
].join(', ');

export function GlassBackground() {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { experimental_backgroundImage: BACKGROUND }]} />;
}

// Telegram's look (blue circle with a paper plane), so it reads as a Telegram feature.
export function TelegramLogo({ size = 24 }) {
    return (
        <View
            style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: TELEGRAM_BLUE }}
            className="items-center justify-center"
        >
            <Ionicons name="paper-plane" size={size * 0.5} color="#fff" style={{ marginLeft: -size * 0.05 }} />
        </View>
    );
}

export function Notice({ tone = 'red', children }) {
    const styles = {
        amber: ['bg-amber-50/90 border-amber-200', 'text-amber-800', '#92400e'],
        red: ['bg-red-50/90 border-red-200', 'text-red-700', '#b91c1c'],
        blue: ['bg-sky-50/90 border-sky-200', 'text-sky-900', '#0c4a6e'],
    };
    const [box, text, icon] = styles[tone];
    return (
        <View className={`flex-row items-start gap-3 rounded-xl border px-4 py-3 ${box}`}>
            <Ionicons name={tone === 'blue' ? 'time-outline' : 'alert-circle-outline'} size={18} color={icon} />
            <Text className={`flex-1 text-sm ${text}`}>{children}</Text>
        </View>
    );
}

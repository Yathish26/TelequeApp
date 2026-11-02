import './global.css';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';

import { AuthProvider, useAuth } from './lib/auth';
import BotsScreen from './Screens/BotsScreen';
import GuideScreen from './Screens/GuideScreen';
import ProfileScreen from './Screens/ProfileScreen';
import LoginScreen from './Screens/LoginScreen';
import SignupScreen from './Screens/SignupScreen';

const BLUE = '#2563eb';
const isAndroid = Platform.OS === 'android';

// Every screen in the bottom tab bar. iOS uses SF Symbols; Android uses Ionicons.
// LoginScreen and SignupScreen aren't tabs: they're shown instead of the tabs until the user signs in.
const screens = [
  { name: 'Bots', component: BotsScreen, sf: ['paperplane', 'paperplane.fill'], androidIcon: 'paper-plane' },
  { name: 'Guide', component: GuideScreen, sf: ['book', 'book.fill'], androidIcon: 'book' },
  { name: 'Profile', component: ProfileScreen, sf: ['person', 'person.fill'], androidIcon: 'person' },
];

const Tab = createNativeBottomTabNavigator();

// The native Android tab bar only accepts images, so render the Ionicons glyphs to images first.
function useAndroidIcons() {
  const [icons, setIcons] = useState(isAndroid ? null : {});

  useEffect(() => {
    if (!isAndroid) return;
    Promise.all(screens.map((s) => Ionicons.getImageSource(s.androidIcon, 24, BLUE))).then((sources) =>
      setIcons(Object.fromEntries(screens.map((s, i) => [s.name, sources[i]]))),
    );
  }, []);

  return icons;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

function Root() {
  const icons = useAndroidIcons();
  const { status } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (!icons || status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-blue-50">
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }
  if (status === 'signedOut') {
    return showSignup
      ? <SignupScreen onShowLogin={() => setShowSignup(false)} />
      : <LoginScreen onShowSignup={() => setShowSignup(true)} />;
  }

  return (
    <NavigationContainer>
      {/* On iOS 26+ this is the system Liquid Glass tab bar; on Android a Material 3 bottom nav. */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: BLUE,
          tabBarInactiveTintColor: '#64748b',
          tabBarActiveIndicatorColor: '#dbeafe',
          tabBarRippleColor: '#dbeafe',
          tabBarStyle: isAndroid ? { backgroundColor: '#ffffff' } : undefined,
        }}
      >
        {screens.map((s) => (
          <Tab.Screen
            key={s.name}
            name={s.name}
            component={s.component}
            options={{
              tabBarIcon: isAndroid
                ? { type: 'image', source: icons[s.name] }
                : ({ focused }) => ({ type: 'sfSymbol', name: focused ? s.sf[1] : s.sf[0] }),
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

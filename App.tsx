import './global.css';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="mb-2 text-4xl font-bold text-gray-900">TelApp</Text>
      <Text className="mb-8 text-center text-base text-gray-600">
        Welcome! Your Expo app is up and running.
      </Text>

      <Pressable
        className="rounded-xl bg-blue-600 px-7 py-3.5 active:opacity-80"
        onPress={() => setCount((c) => c + 1)}
      >
        <Text className="text-base font-semibold text-white">
          Tapped {count} {count === 1 ? 'time' : 'times'}
        </Text>
      </Pressable>

      <StatusBar style="auto" />
    </View>
  );
}

<p align="center">
  <img src="assets/icon.png" alt="Teleque logo" width="160" />
</p>

<h1 align="center">Teleque</h1>

<p align="center">Schedule and auto-publish posts to your Telegram channels.</p>

Teleque is the mobile app for **TeleQueue**, the Hire Arrive service that schedules posts to Telegram channels. You connect your own Telegram bot and channel, send or forward posts to the bot in bulk, and TeleQueue publishes them to the channel one at a time at the interval you pick.

The app is built with Expo and React Native and runs on Android and iOS. It talks to the Hire Arrive backend (`habackend`) and mirrors the Telegram dashboard in the web frontend (`hafrontend`).

## Features

- **Account**: sign up, log in, log out, change password, and delete account (email and password).
- **Bots tab**: create, edit, pause, resume and delete Telegram bots. Each bot card shows its channel, interval and queue counts, and the list refreshes automatically every 30 seconds.
- **Bot settings**: bot token from @BotFather, target channel (`@username` or `t.me` link), posting frequency (from Instant up to once a day), optional name, an option to strip captions from forwarded media, and an option to have the bot confirm each queued post.
- **Queue viewer**: see posts that are waiting, published or failed. You can retry a failed post, remove a single post, or clear the whole queue.
- **Guide tab**: setup steps, the post types that are supported, the publishing rules, and an FAQ.
- **Profile tab**: account details, totals across all bots (bots, waiting, published), and the app version.
- **Native UI**: the native bottom tab bar (Liquid Glass on iOS 26+ with SF Symbols, Material 3 on Android with Ionicons) and glass-effect surfaces where the device supports them.

### Supported post types

Text, photos, videos, files and documents (PDFs, archives, GIFs), and albums. An album is published as one post. Stickers, voice notes, audio, video notes, polls, locations and contacts are skipped.

## Tech stack

| Area | Library |
| --- | --- |
| Framework | Expo SDK 58, React Native 0.88, React 19.3 |
| Navigation | React Navigation 7 (native bottom tabs) |
| Styling | NativeWind 4 (Tailwind CSS 3) |
| Token storage | `expo-secure-store` (Keychain/Keystore), with a file fallback through `expo-file-system` |
| UI effects | `expo-glass-effect`, `react-native-reanimated` |
| Icons | `@expo/vector-icons` (Ionicons) and SF Symbols |
| Builds | EAS Build and Submit |

## Project structure

```
Teleque/
├── index.js                 # Entry point, registers App
├── App.jsx                  # Auth gate and bottom tab navigator (Bots, Guide, Profile)
├── config.js                # API_URL of the backend
├── version.jsx              # APP_VERSION shown on the Profile screen
├── global.css               # Tailwind directives for NativeWind
├── Screens/
│   ├── LoginScreen.jsx
│   ├── SignupScreen.jsx
│   ├── BotsScreen.jsx       # Bot list, create/edit form, queue viewer
│   ├── GuideScreen.jsx      # How it works, post types, FAQ
│   └── ProfileScreen.jsx
├── components/
│   ├── ui.jsx               # Glass, GlassButton, Notice, logos, colors
│   ├── ChangePasswordSheet.jsx
│   └── DeleteAccountSheet.jsx
├── lib/
│   ├── api.js               # fetch wrapper, token storage, telegram() helper
│   ├── auth.jsx             # AuthProvider / useAuth (sign in, sign up, sign out, ...)
│   └── format.js            # Interval and date formatting
├── assets/                  # App icon, adaptive icons, splash, favicon
├── app.json                 # Expo config (name, bundle IDs, plugins)
├── eas.json                 # EAS build profiles
├── babel.config.js / metro.config.js / tailwind.config.js
└── src/app/index.js         # Unused leftover from the Expo template
```

Navigation is handled by React Navigation in `App.jsx`. `index.js` registers `App` as the root component, so `src/app/` is not used for routing.

## Getting started

### Prerequisites

- Node.js (LTS) and npm
- An Android or iOS device or emulator
- A **development build** of the app. The project uses `expo-dev-client` and native modules such as `expo-secure-store` and `expo-glass-effect`, so Expo Go is not enough.

### Install

```bash
cd Teleque
npm install
```

Add new packages with `npx expo install <package>` so you get versions that match the SDK.

### Configure the backend

Set the backend address in [config.js](config.js):

```js
export const API_URL = 'https://api.hirearrive.in';
```

To test against a local backend, use your computer's Wi-Fi IP address (find it with `ipconfig` or `ifconfig`), for example `http://192.168.1.20:5000`. A phone cannot reach `127.0.0.1` on your computer.

### Run

```bash
npm start          # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
```

To create and install a development build:

```bash
npx expo run:android      # or: npx expo run:ios  (local native build)
# or in the cloud:
npx eas-cli@latest build --profile development --platform android
```

## Building and releasing

EAS profiles in [eas.json](eas.json):

| Profile | Purpose |
| --- | --- |
| `development` | Development client, internal distribution |
| `preview` | Internal test build |
| `production` | Store build. The build number is incremented automatically (app version is managed remotely). |

```bash
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --profile production
```

- Bundle ID / package name: `com.yathz.teleque`
- URL scheme: `teleque://`
- The `ios/` and `android/` folders are generated by Expo (Continuous Native Generation) and are git-ignored. Change native settings in `app.json`, not in those folders.
- Update the version shown in the app in [version.jsx](version.jsx), and the store version in [app.json](app.json).

## Backend API

All requests go to `API_URL` with a JSON body and an `Authorization: Bearer <token>` header once the user is signed in.

**Auth** (`/api/auth`)

| Method | Path | Used for |
| --- | --- | --- |
| POST | `/register` | Sign up (then logs in automatically) |
| POST | `/login` | Log in, returns `token` |
| GET | `/me` | Current user |
| POST | `/logout` | Log out |
| PUT | `/password` | Change password |
| DELETE | `/user` | Delete account (requires password) |

**TeleQueue** (`/api/telegram`, defined in `habackend/telegram/routes/telegram.routes.js`)

| Method | Path | Used for |
| --- | --- | --- |
| GET | `/options` | Interval options, bot limit, runner status |
| GET | `/bots` | List bots with queue counts |
| POST | `/bots` | Create bot |
| PATCH | `/bots/:id` | Edit, pause or resume bot |
| DELETE | `/bots/:id` | Delete bot |
| GET | `/bots/:id/queue?status=pending\|sent\|failed` | List queue items |
| DELETE | `/bots/:id/queue` | Clear waiting posts |
| DELETE | `/bots/:id/queue/:itemId` | Remove one post |
| POST | `/bots/:id/queue/:itemId/retry` | Retry a failed post |

A `401` or `403` response signs the user out and returns them to the login screen. If the server can't be reached, the saved session is kept.

## How to use the app

1. In Telegram, open **@BotFather**, send `/newbot`, and copy the bot token.
2. Add the bot as an **admin** of your channel with **Post Messages** turned on.
3. In the **Bots** tab, tap **Create a bot**, paste the token, enter the channel, and pick a posting frequency.
4. Tap **Send posts** to open a chat with your bot, then send or forward your posts. The bot replies ✅ for each post it queues.
5. Send `/status` to the bot, or open **View queue** in the app, to track progress.

Telegram limits a bot to about 20 posts a minute in a channel. On Instant, any extra posts wait in the queue and go out automatically.

## Keeping in sync with the web app

Some content is shared with the web frontend. Update both when you change it:

- [lib/format.js](lib/format.js) uses the same interval wording as `hafrontend/src/TelegramDashboard.jsx`.
- [Screens/GuideScreen.jsx](Screens/GuideScreen.jsx) uses the same text as `hafrontend/src/TelegramBots.jsx`.
- [Screens/BotsScreen.jsx](Screens/BotsScreen.jsx) is the mobile version of `TelegramDashboard.jsx`.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

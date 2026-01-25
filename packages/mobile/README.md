# w-ai Mobile App

React Native mobile application for w-ai platform using Expo.

## Features

- **Customer Management**: View, search, and add customers
- **Chat**: Real-time messaging with customers via WhatsApp
- **Authentication**: Login with WorkOS (account creation must be done on web)

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your configuration:
   - `EXPO_PUBLIC_CONVEX_URL`: Your Convex deployment URL (same as web app)
   - `EXPO_PUBLIC_WORKOS_CLIENT_ID`: Your WorkOS client ID
   - `EXPO_PUBLIC_WORKOS_CLIENT_SECRET`: Your WorkOS client secret
   - `EXPO_PUBLIC_WORKOS_REDIRECT_URI`: OAuth redirect URI (default: `w-ai-mobile://auth/callback`)
   - `EXPO_PUBLIC_WORKOS_DOMAIN`: Your WorkOS domain
   - `EXPO_PUBLIC_WEB_APP_URL`: Web app URL for signup redirects

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web (for testing)
npm run web
```

## Project Structure

```
packages/mobile/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── customers/         # Customer-related components
│   └── chat/              # Chat-related components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and helpers
└── app.json               # Expo configuration
```

## Authentication

The mobile app uses WorkOS for authentication. Users can only **login** through the app - account creation must be done through the web application.

## Environment Variables

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

## Building for Production

See [Expo documentation](https://docs.expo.dev/build/introduction/) for building production apps.

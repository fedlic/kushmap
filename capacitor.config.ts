import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kushmap.app',
  appName: 'KUSHMAP',
  webDir: 'out',
  server: {
    iosScheme: 'https',
    hostname: 'kushmap.app',
    allowNavigation: [
      'rslfdzotloaupwohqmop.supabase.co',
      '*.supabase.co',
      'maps.googleapis.com',
      '*.googleapis.com',
    ],
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e',
    },
  },
};

export default config;

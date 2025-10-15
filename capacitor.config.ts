import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.guestnest.app',
  appName: 'GuestNest',
  webDir: 'dist',
  server: {
    url: 'https://037d24a7-141e-4cc4-b1a0-fc9894fc702c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;


import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'remote-video-recorder',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    cleartext: true,
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: false,
      backgroundColor: "#ffffff"
    }
  }
};

export default config;

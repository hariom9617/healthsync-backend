/** @type {import('detox').DetoxConfig} */
export default {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'mobile/e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },

  apps: {
    'android.debug': {
      type: 'android.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
    },
    'android.release': {
      type: 'android.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
    },
  },

  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_33', // Android API 33+
      },
    },
  },

  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
}

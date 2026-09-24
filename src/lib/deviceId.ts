import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A random id for this device, created once and kept in AsyncStorage. The
 * server only ever stores its SHA-256, and uses it to count one review
 * request, report and rating per device (0008, 0010). Not a security
 * secret -- it only stops one device counting twice.
 */

const DEVICE_ID_KEY = 'safe-bites/device-id';

let cached: string | null = null;

export async function deviceId(): Promise<string> {
  if (cached) return cached;
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    cached = existing;
    return existing;
  }
  let id = '';
  for (let i = 0; i < 32; i++) id += Math.floor(Math.random() * 16).toString(16);
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  cached = id;
  return id;
}

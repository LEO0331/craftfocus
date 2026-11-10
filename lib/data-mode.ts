import { Platform } from 'react-native';

export const isLocalMode = Platform.OS === 'web' && process.env.EXPO_PUBLIC_DATA_MODE === 'local';
export const LOCAL_USER_ID = 'craftfocus-local-player';

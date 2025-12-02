import Constants from "expo-constants";

// EAS build'de manifestExtra, dev'de expoConfig.extra kullanılır
const extra = Constants.expoConfig?.extra ?? Constants.manifestExtra ?? {};

export const BASE_URL = extra.BASE_URL;
export const IMAGE_BASE_URL = extra.IMAGE_BASE_URL;

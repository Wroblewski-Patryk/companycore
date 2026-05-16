export const supportedLocales = ["en", "pl"] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";
export const localeStorageKey = "companycoreLocale";

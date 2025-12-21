import { createI18n } from "vue-i18n";
import ru from "./ru.json";
import en from "./en.json";

export type Locale = "ru" | "en";
export type LocaleSetting = "system" | Locale;

export const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {
    ru: {},
    en: {},
  },
});

let systemLocale: Locale = "en";
let currentSetting: LocaleSetting = "system";

/**
 * Определяет локаль на основе языка из VK.
 */
function getLocaleFromVk(vkLang: number | string | undefined): Locale {
  const ruLangs = [0, 1, 2, 97, "ru", "uk", "be", "kk"];
  return ruLangs.includes(vkLang as any) ? "ru" : "en";
}

/**
 * Устанавливает системную локаль на основе языка из VK.
 */
export function setLocaleFromVk(vkLang: number | string | undefined) {
  systemLocale = getLocaleFromVk(vkLang);
  // Применяем только если не установлен принудительный язык
  if (currentSetting === "system") {
    i18n.global.locale.value = systemLocale;
  }
}

/**
 * Устанавливает локаль вручную или возвращает к системной.
 */
export function setLocale(setting: LocaleSetting) {
  currentSetting = setting;
  i18n.global.locale.value = setting === "system" ? systemLocale : setting;
}

const globalMessages = { ru, en };

type MessageKeys =
  | `groups.${keyof typeof en.groups}`
  | `counters.${keyof typeof en.counters}`
  | `albums.${keyof typeof en.albums}`
  | `gallery.${keyof typeof en.gallery}`
  | `storage.${keyof typeof en.storage}`
  | `welcome.${keyof typeof en.welcome}`
  | `errors.${keyof typeof en.errors}`
  | `validation.${keyof typeof en.validation}`;

export function t(
  key: MessageKeys,
  params?: Record<string, string | number>,
): string {
  const locale = i18n.global.locale.value as Locale;
  const [section, subKey] = key.split(".") as [keyof typeof en, string];
  const messages = globalMessages[locale] as typeof en;
  let message =
    (messages[section] as Record<string, string>)?.[subKey] ||
    (globalMessages.en[section] as Record<string, string>)?.[subKey] ||
    key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      message = message.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return message;
}

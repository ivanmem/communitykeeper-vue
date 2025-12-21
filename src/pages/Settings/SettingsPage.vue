<script lang="ts" setup>
import { useAppCaption } from "@/shared/composables/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import { useVk } from "@/store/vk/vk";
import {
  actionSwipesDefaults,
  actionSwipesSelectAppendIcon,
  styledIcons,
  VK_MAX_PHOTO_SIZE,
} from "@/shared/constants/consts";
import { useDialog } from "@/store/dialog/dialog";
import SettingsDisabledCookies from "@/pages/Settings/SettingsDisabledCookies.vue";
import FixedTeleport from "@/components/FixedTeleport";
import { useApp } from "@/store/app/app";
import PhotoCounter from "@/pages/Album/PhotoCounter.vue";
import { computed, h, watch } from "vue";
import {
  Icon24SunOutline,
  Icon12View,
  Icon24ShadowsOutline,
  Icon24Bug,
  Icon24QuestionOutline,
  Icon24Attachments,
  Icon240CircleOutline,
  Icon24MemoryCard,
  Icon24CloudOutline,
  Icon24RectangleHandPointUp,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";
import { setLocale } from "@/i18n";
import { applyTheme } from "@/shared/composables/useColorScheme";

const { t } = useI18n({
  messages: {
    ru: {
      title: "Настройки",
      main: "🔧 Основные",
      autoSave: "Автосохранение групп",
      autoSaveHint:
        "Запросы ограничены до тысячи в час; За этот сеанс Вы уже сделали: {count}. Если Вы попытаетесь сохраниться при лимите - все группы будут утеряны! Этот параметр не влияет на сохранение настроек. Они будут сохраняться автоматически в любом случае.",
      saveGroups: "Сохранить группы",
      showCounters: "Отображать счётчики количества фото/видео и так далее",
      showCountersHint:
        "Если опция выключена, то Вы можете вручную загрузить счётчики по клику на аватарку группы.",
      gallery: "🌅 Галерея",
      builtInGallery: "Встроенная галерея",
      builtInGalleryHint:
        "По возможности будет использоваться встроенная галерея. Например, при клике по счётчикам фото/альбомов.",
      counterOpacity: "Непрозрачность счётчика при просмотре фото",
      counterOpacityHint:
        "Вы можете установить минимальное значение, чтобы скрыть счётчик.",
      swipeActions: "Действия жестов для сенсорного экрана при просмотре фото",
      previewShadow: "Подсвечивать миниатюры с учётом разрешения фото",
      previewShadowHint:
        "Фото с низким разрешением будет подсвечено красным цветом, а с высоким - зелёным. Разрешение Вашего экрана не влияет - учитывается максимальное разрешение для ВКонтакте ({width}x{height}).",
      testing: "🐞 Тестирование",
      debug: "Отладка (eruda)",
      clearCache: "Очистить кэш счётчиков",
      repeatWelcome: "Повторить приветствие",
      storageUsed:
        "У Вас занято {percent}% из доступного для групп места. Если занять более 100%, то данные не смогут сохраниться.",
      appearance: "🎨 Внешний вид",
      language: "Язык",
      langSystem: "Системный",
      langRu: "Русский",
      langEn: "English",
      theme: "Тема",
      themeSystem: "Системная",
      themeLight: "Светлая",
      themeDark: "Тёмная",
      // Swipe labels
      swipeUp: "Свайп вверх",
      swipeDown: "Свайп вниз",
      swipeLeft: "Свайп влево",
      swipeRight: "Свайп вправо",
      // Swipe actions
      actionGoToPhoto: "Перейти к фото",
      actionOpenOriginal: "Открыть оригинал",
      actionCopyLink: "Копировать ссылку",
      actionCopyDirectLink: "Копировать прямую ссылку",
      actionDownload: "Скачать",
      actionSearchOriginal: "Поиск оригинала",
      actionShowOriginalSize: "Отображать фото в оригинальном размере",
      actionInfo: "Информация",
      actionSkipSettings: "Настройки пропуска фото",
      actionExit: "Выйти из просмотра фото",
      actionPrev: "Предыдущее фото",
      actionNext: "Следующее фото",
      actionNothing: "Ничего не делать",
    },
    en: {
      title: "Settings",
      main: "🔧 Main",
      autoSave: "Auto-save groups",
      autoSaveHint:
        "Requests are limited to a thousand per hour; This session you have already made: {count}. If you try to save at the limit - all groups will be lost! This setting does not affect saving settings. They will be saved automatically anyway.",
      saveGroups: "Save groups",
      showCounters: "Show photo/video counters etc.",
      showCountersHint:
        "If disabled, you can manually load counters by clicking on the group avatar.",
      gallery: "🌅 Gallery",
      builtInGallery: "Built-in gallery",
      builtInGalleryHint:
        "The built-in gallery will be used when possible. For example, when clicking on photo/album counters.",
      counterOpacity: "Counter opacity when viewing photos",
      counterOpacityHint: "You can set the minimum value to hide the counter.",
      swipeActions: "Touch screen gesture actions when viewing photos",
      previewShadow: "Highlight thumbnails based on photo resolution",
      previewShadowHint:
        "Low resolution photos will be highlighted in red, high resolution in green. Your screen resolution does not matter - the maximum resolution for VK ({width}x{height}) is considered.",
      testing: "🐞 Testing",
      debug: "Debug (eruda)",
      clearCache: "Clear counters cache",
      repeatWelcome: "Repeat welcome",
      storageUsed:
        "You have used {percent}% of available space for groups. If you use more than 100%, data cannot be saved.",
      appearance: "🎨 Appearance",
      language: "Language",
      langSystem: "System",
      langRu: "Русский",
      langEn: "English",
      theme: "Theme",
      themeSystem: "System",
      themeLight: "Light",
      themeDark: "Dark",
      // Swipe labels
      swipeUp: "Swipe up",
      swipeDown: "Swipe down",
      swipeLeft: "Swipe left",
      swipeRight: "Swipe right",
      // Swipe actions
      actionGoToPhoto: "Go to photo",
      actionOpenOriginal: "Open original",
      actionCopyLink: "Copy link",
      actionCopyDirectLink: "Copy direct link",
      actionDownload: "Download",
      actionSearchOriginal: "Search original",
      actionShowOriginalSize: "Show photo in original size",
      actionInfo: "Information",
      actionSkipSettings: "Photo skip settings",
      actionExit: "Exit photo view",
      actionPrev: "Previous photo",
      actionNext: "Next photo",
      actionNothing: "Do nothing",
    },
  },
});

useAppCaption(computed(() => t("title")));
const appStore = useApp();
const groupsStore = useGroups();
const vkStore = useVk();
const dialogStore = useDialog();

// Язык
const localeOptions = computed(() => [
  { title: t("langSystem"), value: "system" },
  { title: t("langRu"), value: "ru" },
  { title: t("langEn"), value: "en" },
]);

const currentLocale = computed({
  get: () => appStore.config.locale ?? "system",
  set: (val) => {
    const locale = val ?? "system";
    appStore.config.locale = locale;
    setLocale(locale);
  },
});

// Тема
const themeOptions = computed(() => [
  { title: t("themeSystem"), value: "system" },
  { title: t("themeLight"), value: "light" },
  { title: t("themeDark"), value: "dark" },
]);

const currentTheme = computed({
  get: () => appStore.config.theme ?? "system",
  set: (val) => {
    const theme = val ?? "system";
    appStore.config.theme = theme;
    applyTheme(theme);
  },
});

// Локализованные swipe labels
const swipeLabels = computed(() => ({
  onUp: t("swipeUp"),
  onDown: t("swipeDown"),
  onLeft: t("swipeLeft"),
  onRight: t("swipeRight"),
}));

// Локализованные swipe options
const swipeOptions = computed(() => [
  { title: t("actionGoToPhoto"), value: "op" },
  { title: t("actionOpenOriginal"), value: "oosp" },
  { title: t("actionCopyLink"), value: "cl" },
  { title: t("actionCopyDirectLink"), value: "cdl" },
  { title: t("actionDownload"), value: "d" },
  { title: t("actionSearchOriginal"), value: "so" },
  { title: t("actionShowOriginalSize"), value: "sos" },
  { title: t("actionInfo"), value: "smi" },
  { title: t("actionSkipSettings"), value: "oss" },
  { title: t("actionExit"), value: "pe" },
  { title: t("actionPrev"), value: "pp" },
  { title: t("actionNext"), value: "pn" },
  { title: t("actionNothing"), value: "passive" },
]);
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn
      :color="
        groupsStore.spaceUsed >= 80 ? 'deep-orange-darken-4' : 'green-darken-3'
      "
      :icon="Icon24CloudOutline"
      variant="text"
      @click="
        dialogStore.alert(t('storageUsed', { percent: groupsStore.spaceUsed }))
      "
    />
  </FixedTeleport>
  <VCard class="overflow-block a-settings">
    <div class="d-flex flex-wrap">
      <SettingsDisabledCookies />
    </div>
    <VCardSubtitle style="padding-block: 12px">{{
      t("appearance")
    }}</VCardSubtitle>
    <VDivider />
    <VCardItem>
      <VSelect
        v-model="currentLocale"
        :items="localeOptions"
        :label="t('language')"
        item-title="title"
        item-value="value"
        hide-details
        style="max-width: 300px"
      />
    </VCardItem>
    <VCardItem>
      <VSelect
        v-model="currentTheme"
        :items="themeOptions"
        :label="t('theme')"
        item-title="title"
        item-value="value"
        hide-details
        style="max-width: 300px"
      />
    </VCardItem>
    <VDivider />
    <VCardSubtitle style="padding-block: 12px">
      {{ t("main") }}
    </VCardSubtitle>
    <VDivider />
    <VCardItem :append-icon="Icon24MemoryCard">
      <VSwitch
        v-model="groupsStore.config.autoSave"
        hide-details
        :label="t('autoSave')"
      />
      <span class="a-mini-text">
        {{ t("autoSaveHint", { count: vkStore.vkWebAppStorageSetCount }) }}
      </span>
      <VBtn
        v-if="!groupsStore.config.autoSave"
        style="margin-top: 10px"
        variant="tonal"
        @click="groupsStore.saveCurrentLocalGroups()"
      >
        {{ t("saveGroups") }}
      </VBtn>
    </VCardItem>
    <VDivider />
    <VCardItem :append-icon="Icon240CircleOutline">
      <VSwitch
        v-model="groupsStore.config.showCounters"
        hide-details
        :label="t('showCounters')"
      />
      <span class="a-mini-text">
        {{ t("showCountersHint") }}
      </span>
    </VCardItem>
    <VDivider />
    <VCardSubtitle style="padding-block: 12px">{{
      t("gallery")
    }}</VCardSubtitle>
    <VDivider />
    <VCardItem :append-icon="Icon24Attachments">
      <VSwitch
        v-model="groupsStore.config.gallery"
        hide-details
        :label="t('builtInGallery')"
      />
      <span class="a-mini-text">
        {{ t("builtInGalleryHint") }}
      </span>
    </VCardItem>
    <VDivider />
    <VCardItem :append-icon="Icon24SunOutline" style="margin-top: 10px">
      <div style="margin-bottom: 10px">
        {{ t("counterOpacity") }}
      </div>
      <VSlider
        :append-icon="Icon12View"
        :max="100"
        :min="0"
        :model-value="groupsStore.config.opacityGalleryCounter ?? 100"
        :prepend-icon="h(Icon12View, { style: { opacity: 0.1 } }) as any"
        hide-details
        thumb-label
        @update:model-value="groupsStore.config.opacityGalleryCounter = $event"
      />
      <span class="a-mini-text">
        {{ t("counterOpacityHint") }}
      </span>
      <PhotoCounter
        :size="100"
        :photo-index="0"
        date-time="01.01.2024, 00:00"
        show-info
        style="margin-top: 5px"
      />
    </VCardItem>
    <VDivider />
    <VCardItem
      :append-icon="Icon24RectangleHandPointUp"
      style="margin-top: 10px"
    >
      <div style="margin-bottom: 10px">
        {{ t("swipeActions") }}
      </div>
      <VSelect
        v-for="swipeKey of Object.keys(actionSwipesDefaults)"
        :key="swipeKey"
        :items="swipeOptions"
        :label="swipeLabels[swipeKey as keyof typeof swipeLabels]"
        :model-value="groupsStore.swipesConfig[swipeKey as never]"
        item-title="title"
        :append-inner-icon="actionSwipesSelectAppendIcon[swipeKey as never]"
        item-value="value"
        style="max-width: 450px"
        @update:model-value="groupsStore.setSwipeKey(swipeKey as never, $event)"
      >
      </VSelect>
    </VCardItem>
    <VDivider />
    <VCardItem :append-icon="Icon24ShadowsOutline">
      <VSwitch
        v-model="groupsStore.config.previewSizeShadow"
        hide-details
        :label="t('previewShadow')"
      />
      <span class="a-mini-text">
        {{
          t("previewShadowHint", {
            width: VK_MAX_PHOTO_SIZE.width,
            height: VK_MAX_PHOTO_SIZE.height,
          })
        }}
      </span>
    </VCardItem>
    <VDivider />
    <VCardSubtitle style="padding-block: 12px">{{
      t("testing")
    }}</VCardSubtitle>
    <VDivider />
    <VCardItem :append-icon="Icon24Bug">
      <VSwitch
        v-model="appStore.config.eruda"
        hide-details
        :label="t('debug')"
      />
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardItem :append-icon="styledIcons.Icon24ClearDataOutline">
      <VBtn variant="tonal" @click="groupsStore.clearCachedGroups()">
        {{ t("clearCache") }}
      </VBtn>
    </VCardItem>
    <VCardItem :append-icon="Icon24QuestionOutline">
      <VBtn variant="tonal" @click="appStore.initSlides()">
        {{ t("repeatWelcome") }}
      </VBtn>
    </VCardItem>
  </VCard>
</template>

<style lang="scss">
.a-settings {
  .v-card-item__content {
    overflow: visible;
  }

  .v-card-item {
  }
}
</style>

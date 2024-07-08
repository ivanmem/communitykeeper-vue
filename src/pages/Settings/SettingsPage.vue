<script lang="ts" setup>
import { useAppCaption } from "@/shared/composables/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import { useVk } from "@/store/vk/vk";
import {
  actionSwipesDefaults,
  actionSwipesOptions,
  actionSwipesSelectLabels,
  icons,
  styledIcons,
} from "@/shared/constants/consts";
import { useDialog } from "@/store/dialog/dialog";
import SettingsDisabledCookies from "@/pages/Settings/SettingsDisabledCookies.vue";
import FixedTeleport from "@/components/FixedTeleport.vue";
import { useApp } from "@/store/app/app";
import PhotoCounter from "@/pages/Album/PhotoCounter.vue";
import { h } from "vue";

useAppCaption("Настройки");
const appStore = useApp();
const groupsStore = useGroups();
const vkStore = useVk();
const dialogStore = useDialog();
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn
      :color="
        groupsStore.spaceUsed >= 80 ? 'deep-orange-darken-4' : 'green-darken-3'
      "
      :icon="icons.Icon24CloudOutline"
      variant="text"
      @click="
        dialogStore.alert(
          `У Вас занято ${groupsStore.spaceUsed}% из доступного для групп места. Если занять более 100%, то данные не смогут сохраниться.`,
        )
      "
    />
  </FixedTeleport>
  <VCard class="overflow-block a-settings">
    <VCardSubtitle style="padding-block: 12px">🔧 Основные</VCardSubtitle>
    <VDivider />
    <div class="d-flex flex-wrap">
      <SettingsDisabledCookies />
    </div>
    <VCardItem :append-icon="icons.Icon24MemoryCard">
      <VSwitch
        v-model="groupsStore.config.autoSave"
        hide-details
        label="Автосохранение групп"
      />
      <span class="a-mini-text">
        Запросы ограничены до тысячи в час; За этот сеанс Вы уже сделали:
        {{ vkStore.vkWebAppStorageSetCount }}. Если Вы попытаетесь сохраниться
        при лимите - все группы будут утеряны!
        <br />
        Этот параметр не влияет на сохранение настроек. Они будут сохраняться
        автоматически в любом случае.
      </span>
      <VBtn
        v-if="!groupsStore.config.autoSave"
        style="margin-top: 10px"
        variant="tonal"
        @click="groupsStore.saveCurrentLocalGroups()"
      >
        Сохранить группы
      </VBtn>
    </VCardItem>
    <VDivider />
    <VCardItem :append-icon="icons.Icon240CircleOutline">
      <VSwitch
        v-model="groupsStore.config.showCounters"
        hide-details
        label="Отображать счётчики количества фото\видео и так далее"
      />
      <span class="a-mini-text">
        Если опция выключена, то Вы можете вручную загрузить счётчики по клику
        на аватарку группы.
      </span>
    </VCardItem>
    <VDivider />
    <VCardSubtitle style="padding-block: 12px"> 🌅 Галерея</VCardSubtitle>
    <VDivider />
    <VCardItem :append-icon="icons.Icon24Attachments">
      <VSwitch
        v-model="groupsStore.config.gallery"
        hide-details
        label="Встроенная галерея"
      />
      <span class="a-mini-text">
        По возможности будет использоваться встроенная галерея. Например, при
        клике по счётчикам фото/альбомов.
      </span>
    </VCardItem>
    <VDivider />
    <VCardItem :append-icon="icons.Icon24SunOutline" style="margin-top: 10px">
      <div style="margin-bottom: 10px">
        Непрозрачность счётчика при просмотре фото
      </div>
      <VSlider
        :append-icon="icons.Icon12View"
        :max="100"
        :min="0"
        :model-value="groupsStore.config.opacityGalleryCounter ?? 100"
        :prepend-icon="h(icons.Icon12View, { style: { opacity: 0.1 } }) as any"
        hide-details
        thumb-label
        @update:model-value="groupsStore.config.opacityGalleryCounter = $event"
      />
      <span class="a-mini-text">
        Вы можете установить минимальное значение, чтобы скрыть счётчик.
      </span>
      <PhotoCounter
        :count="100"
        :photo-index="0"
        date-time="01.01.2024, 00:00"
        show-info
        style="margin-top: 5px"
      />
    </VCardItem>
    <VDivider />
    <VCardItem
      :append-icon="icons.Icon24RectrangleHandPointUp"
      style="margin-top: 10px"
    >
      <div style="margin-bottom: 10px">
        Действия жестов для сенсорного экрана при просмотре фото
      </div>
      <VSelect
        v-for="swipeKey of Object.keys(actionSwipesDefaults)"
        :items="actionSwipesOptions"
        :label="actionSwipesSelectLabels[swipeKey as never]"
        :model-value="groupsStore.swipesConfig[swipeKey as never]"
        item-title="title"
        item-value="value"
        style="max-width: 450px"
        @update:model-value="groupsStore.setSwipeKey(swipeKey as never, $event)"
      >
      </VSelect>
    </VCardItem>
    <VDivider />
    <VCardItem :append-icon="icons.Icon24ShadowsOutline">
      <VSwitch
        v-model="groupsStore.config.previewSizeShadow"
        hide-details
        label="Подсвечивать миниатюры с учётом разрешения фото"
      />
      <span class="a-mini-text">
        Фото с низким разрешением будет подсвечено красным цветом, а с высоким -
        зелёным.
      </span>
    </VCardItem>
    <VDivider />
    <VCardSubtitle style="padding-block: 12px"> 🐞 Тестирование</VCardSubtitle>
    <VDivider />
    <VCardItem :append-icon="icons.Icon24Bug">
      <VSwitch
        v-model="appStore.config.eruda"
        hide-details
        label="Отладка (eruda)"
      />
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardItem :append-icon="styledIcons.Icon24ClearDataOutline">
      <VBtn variant="tonal" @click="groupsStore.clearCachedGroups()">
        Очистить кэш счётчиков
      </VBtn>
    </VCardItem>
    <VCardItem :append-icon="icons.Icon24QuestionOutline">
      <VBtn variant="tonal" @click="appStore.initSlides()">
        Повторить приветствие
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

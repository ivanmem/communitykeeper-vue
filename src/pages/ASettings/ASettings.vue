<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import { useVk } from "@/store/vk/vk";
import { icons } from "@/common/consts";
import { useDialog } from "@/store/dialog/dialog";
import ASettingsDisabledCookies from "@/pages/ASettings/ASettingsDisabledCookies.vue";
import FixedTeleport from "@/components/FixedTeleport.vue";
import { useApp } from "@/store/app/app";

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
          `У вас занято ${groupsStore.spaceUsed}% из доступного для групп места. Если занять более 100%, то данные не смогут сохраниться.`,
        )
      "
    />
  </FixedTeleport>
  <VCard class="overflow-block a-settings">
    <div class="d-flex flex-wrap">
      <ASettingsDisabledCookies />
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
    <VCardItem :append-icon="icons.Icon24Bug">
      <VSwitch
        v-model="appStore.config.eruda"
        hide-details
        label="Отладка (eruda)"
      />
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
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
}
</style>

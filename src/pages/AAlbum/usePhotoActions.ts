import { computed, h, MaybeRefOrGetter, Ref, toRef, toValue } from "vue";
import { IPhoto } from "@/store/groups/types";
import { useDialog } from "@/store/dialog/dialog";
import { openUrl } from "@/helpers/openUrl";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useGroups } from "@/store/groups/groups";
import { IPhotoEmit } from "@/pages/AAlbum/APhoto.vue";
import { MenuItem } from "@imengyu/vue3-context-menu";
import { icons, styledIcons } from "@/common/consts";
import { showContextMenu } from "@/helpers/showContextMenu";
import APhotoShareDialog, { APhotoShareDialogProps } from "@/pages/AAlbum/APhotoShareDialog.vue";
import { useOpenPhoto } from "@/pages/AAlbum/useOpenPhoto";

export function usePhotoActions(
  photoGetter: MaybeRefOrGetter<IPhoto>,
  showMoreInfo: Ref<boolean>,
  emit: IPhotoEmit,
  photoDivGetter: MaybeRefOrGetter<HTMLDivElement | undefined>,
) {
  const groupsStore = useGroups();
  const dialogStore = useDialog();
  const photo = toRef(photoGetter);
  const originalSize = computed(() =>
    PhotoHelper.getOriginalSize(photo.value.sizes),
  );

  const onSearchOriginal = async () => {
    const isUseYandex = await useDialog().confirm({
      title: "Поиск оригинала",
      subtitle: `Выберите поисковую систему:`,
      confirmTitle: "Yandex",
      cancelTitle: "SauceNAO",
      persistent: true,
    });
    const url = encodeURIComponent(originalSize.value!.url);
    if (isUseYandex) {
      openUrl(`https://yandex.com/images/search?rpt=imageview&url=${url}`);
    } else {
      openUrl(`https://saucenao.com/search.php?url=${url}`);
    }
  };

  const onSwitchOriginalSize = () => {
    groupsStore.config.originalSizePhoto =
      !groupsStore.config.originalSizePhoto;
  };

  const onShowMoreInfo = () => {
    showMoreInfo.value = true;
  };

  const onOpenPhoto = useOpenPhoto(photo);

  const onOpenOriginalSizePhoto = () => {
    if (originalSize.value) {
      openUrl(originalSize.value.url);
    }
  };

  const onShare = () => {
    dialogStore.open<APhotoShareDialogProps>({
      component: APhotoShareDialog,
      props: { photo: photo.value },
    });
  };

  const onDownload = () => {
    return PhotoHelper.downloadPhoto(photo.value);
  };

  const onSwitchSkipLowResolutionPhotos = () => {
    groupsStore.config.skipLowResolutionPhotos =
      !groupsStore.config.skipLowResolutionPhotos;
  };

  const onPhotoExit = () => {
    emit("photo:exit");
  };

  const onPhotoPrev = () => {
    emit("photo:prev");
  };

  const onPhotoNext = () => {
    emit("photo:next");
  };

  const onShowContextMenu = (e: MouseEvent | TouchEvent) => {
    const items: MenuItem[] = [];
    items.push({
      label: "Перейти к фото",
      icon: h(icons.Icon16LogoVk),
      onClick: onOpenPhoto,
    });
    items.push({
      label: `Открыть оригинал (${originalSize.value?.width}x${originalSize.value?.height})`,
      icon: h(icons.Icon16Link),
      onClick: onOpenOriginalSizePhoto,
    });
    items.push({
      label: "Поделиться",
      icon: h(icons.Icon16Share),
      onClick: onShare,
    });
    items.push({
      label: "Скачать",
      icon: h(icons.Icon16DownloadOutline),
      onClick: onDownload,
    });
    items.push({
      label: "Поиск оригинала",
      icon: h(icons.Icon16SearchStarsOutline),
      onClick: onSearchOriginal,
    });
    items.push({
      label: groupsStore.config.originalSizePhoto
        ? `Расширить на весь экран`
        : "Отображать в оригинальном размере",
      icon: groupsStore.config.originalSizePhoto
        ? styledIcons.Icon16Fullscreen
        : styledIcons.Icon16FullscreenExit,
      onClick: onSwitchOriginalSize,
    });
    items.push({
      label: "Информация",
      icon: h(icons.Icon16ArticleOutline),
      onClick: onShowMoreInfo,
    });
    items.push({
      label: `${
        groupsStore.config.skipLowResolutionPhotos
          ? "Не пропускать"
          : "Пропускать"
      } фото с маленьким размером`,
      icon: styledIcons.Icon16SkipToAction,
      onClick: onSwitchSkipLowResolutionPhotos,
    });
    items.push({
      label: "Выйти из просмотра фото",
      icon: h(icons.Icon16DoorEnterArrowRightOutline),
      onClick: onPhotoExit,
    });
    showContextMenu(e, items, () => toValue(photoDivGetter)?.focus());
  };

  return {
    onSearchOriginal,
    onSwitchOriginalSize,
    onShowMoreInfo,
    onOpenPhoto,
    onOpenOriginalSizePhoto,
    onShare,
    onDownload,
    onSwitchSkipLowResolutionPhotos,
    onPhotoExit,
    onPhotoPrev,
    onPhotoNext,
    onShowContextMenu,
    onPassive: () => void 0,
  };
}

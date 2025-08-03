import { h, ref } from "vue";
import { createStyledIcon } from "@/shared/helpers/createStyledIcon";
import { usePhotoActions } from "@/pages/Album/usePhotoActions";
import { GallerySwipesConfig } from "@/store/groups/groups";
import Icon24GitHub from "@/assets/svg/24/github_24.svg?component";
import {
  Icon16CopyOutline,
  Icon16FolderOutline,
  Icon16Link,
  Icon20FolderMoveOutline,
  Icon24ChevronLeftSquareOutline,
  Icon24Fullscreen,
  Icon24FullscreenExit,
  Icon24SkipToAction,
  Icon24SortOutline,
  Icon28ClearDataOutline,
} from "vue-vkontakte-icons";

export const styledIcons = {
  Icon16Link: createStyledIcon(Icon16Link, 16),
  Icon16FolderMoveOutline: createStyledIcon(Icon20FolderMoveOutline, 16),
  Icon16FolderOutline: createStyledIcon(Icon16FolderOutline, 16),
  Icon16Fullscreen: createStyledIcon(Icon24Fullscreen, 16),
  Icon16FullscreenExit: createStyledIcon(Icon24FullscreenExit, 16),
  Icon16SkipToAction: createStyledIcon(Icon24SkipToAction, 16),
  Icon16GitHub: createStyledIcon(Icon24GitHub, 16),
  Icon24CopyOutline: createStyledIcon(Icon16CopyOutline, 24),
  Icon24SortOutlineOpacity50: h(Icon24SortOutline, {
    style: `opacity: 0.5;`,
  }) as any,
  Icon24ClearDataOutline: createStyledIcon(Icon28ClearDataOutline, 24),
  Icon24ChevronLeftSquareOutline: h(Icon24ChevronLeftSquareOutline, {
    style: `transform: rotate(180deg);`,
  }) as any,
  Icon24ChevronRightSquareOutline: Icon24ChevronLeftSquareOutline,
  Icon24ChevronUpSquareOutline: h(Icon24ChevronLeftSquareOutline, {
    style: `transform: rotate(-90deg);`,
  }) as any,
  Icon24ChevronDownSquareOutline: h(Icon24ChevronLeftSquareOutline, {
    style: `transform: rotate(90deg);`,
  }) as any,
};

export const darkColorScheme = ref(false);

export const isDev = process.env.NODE_ENV === "development";

export const VK_MAX_PHOTO_SIZE = {
  width: 2560,
  height: 2160,
} as const;

export const VK_STORAGE = {
  // Можно получить не более десяти чанков за 1 запрос
  chunksMaxCount: 20,
  chunksSplitter: "__",
  chunkMaxSize: 2236,
} as const;

export const VK_SHORT_LINK = {
  max: 2000,
  exportPrefix: "http://s.vk/",
  shortPrefix: "https://vk.cc/",
};

export const VK_ERROR_CODE = {
  accessDenied: 15,
};

export const dateTimeFormatter = new Intl.DateTimeFormat("ru", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

type IActionDictValue = {
  label: string;
  name: keyof ReturnType<typeof usePhotoActions>;
};

// ключи короткие, чтобы меньше места занимать в VK Storage
export const actionSwipesDict = new Map<string, IActionDictValue>([
  ["op", { label: "Перейти к фото", name: "onOpenPhoto" }],
  ["oosp", { label: "Открыть оригинал", name: "onOpenOriginalSizePhoto" }],
  ["cl", { label: "Копировать ссылку", name: "onCopyLink" }],
  ["cdl", { label: "Копировать прямую ссылку", name: "onCopyDirectLink" }],
  ["d", { label: "Скачать", name: "onDownload" }],
  ["so", { label: "Поиск оригинала", name: "onSearchOriginal" }],
  [
    "sos",
    {
      label: "Отображать фото в оригинальном размере",
      name: "onSwitchOriginalSize",
    },
  ],
  ["smi", { label: "Информация", name: "onShowMoreInfo" }],
  [
    "oss",
    {
      label: "Настройки пропуска фото",
      name: "onOpenSkipSettings",
    },
  ],
  ["pe", { label: "Выйти из просмотра фото", name: "onPhotoExit" }],
  ["pp", { label: "Предыдущее фото", name: "onPhotoPrev" }],
  ["pn", { label: "Следующее фото", name: "onPhotoNext" }],
  ["passive", { label: "Ничего не делать", name: "onPassive" }],
]);

export const actionSwipesOptions = Array.from(actionSwipesDict.keys()).map(
  (value) => {
    return {
      title: actionSwipesDict.get(value)!.label,
      value,
    };
  },
);

export const actionSwipesDefaults: Required<GallerySwipesConfig> = {
  onUp: "pe",
  onDown: "smi",
  onLeft: "pp",
  onRight: "pn",
};

export const actionSwipesSelectLabels = {
  onUp: "Свайп вверх",
  onDown: "Свайп вниз",
  onLeft: "Свайп влево",
  onRight: "Свайп вправо",
};

export const actionSwipesSelectAppendIcon = {
  onUp: styledIcons.Icon24ChevronUpSquareOutline,
  onDown: styledIcons.Icon24ChevronDownSquareOutline,
  onLeft: styledIcons.Icon24ChevronLeftSquareOutline,
  onRight: styledIcons.Icon24ChevronRightSquareOutline,
};

export const buildDateLocaleString = new Date(BUILD_DATE).toLocaleString();

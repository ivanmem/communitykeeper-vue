import { h, ref } from "vue";
import Icon28PictureOutline from "@vkontakte/icons/src/svg/28/picture_outline_28.svg?component";
import Icon28Attachments from "@vkontakte/icons/src/svg/28/attachments_28.svg?component";
import Icon28Video from "@vkontakte/icons/src/svg/28/video_28.svg?component";
import Icon28ArticleOutline from "@vkontakte/icons/src/svg/28/articles_outline_28.svg?component";
import Icon28DownloadOutline from "@vkontakte/icons/src/svg/28/download_outline_28.svg?component";
import Icon28UploadOutline from "@vkontakte/icons/src/svg/28/upload_outline_28.svg?component";
import Icon28DeleteOutline from "@vkontakte/icons/src/svg/28/delete_outline_28.svg?component";

import Icon24GitHub from "@/assets/svg/24/github_24.svg?component";
import Icon24Back from "@vkontakte/icons/src/svg/24/back_24.svg?component";
import Icon24MenuOutline from "@vkontakte/icons/src/svg/24/menu_outline_24.svg?component";
import Icon24Linked from "@vkontakte/icons/src/svg/24/linked_24.svg?component";
import Icon24Home from "@vkontakte/icons/src/svg/24/home_24.svg?component";
import Icon24InfoCircleOutline from "@vkontakte/icons/src/svg/24/info_circle_outline_24.svg?component";
import Icon24DollarCircleOutline from "@vkontakte/icons/src/svg/24/dollar_circle_outline_24.svg";
import Icon24CrownOutline from "@vkontakte/icons/src/svg/24/crown_outline_24.svg?component";
import Icon24ArticleBoxOutline from "@vkontakte/icons/src/svg/24/article_box_outline_24.svg?component";
import Icon24LightbulbStarOutline from "@vkontakte/icons/src/svg/24/lightbulb_star_outline_24.svg?component";
import Icon24Filter from "@vkontakte/icons/src/svg/24/filter_24.svg?component";
import Icon24DownloadOutline from "@vkontakte/icons/src/svg/24/download_outline_24.svg?component";
import Icon24UploadOutline from "@vkontakte/icons/src/svg/24/upload_outline_24.svg?component";
import Icon24DeleteOutline from "@vkontakte/icons/src/svg/24/delete_outline_24.svg?component";
import Icon24TrashSmileOutline from "@vkontakte/icons/src/svg/24/trash_smile_outline_24.svg?component";
import Icon24AddSquareOutline from "@vkontakte/icons/src/svg/24/add_square_outline_24.svg?component";
import Icon24GearOutline from "@vkontakte/icons/src/svg/24/gear_outline_24.svg?component";
import Icon24MemoryCard from "@vkontakte/icons/src/svg/24/memory_card_24.svg?component";
import Icon24CloudOutline from "@vkontakte/icons/src/svg/24/cloud_outline_24.svg?component";
import Icon24Fullscreen from "@vkontakte/icons/src/svg/24/fullscreen_24.svg?component";
import Icon24FullscreenExit from "@vkontakte/icons/src/svg/24/fullscreen_exit_24.svg?component";
import Icon24SortOutline from "@vkontakte/icons/src/svg/24/sort_outline_24.svg?component";
import Icon24SkipToAction from "@vkontakte/icons/src/svg/24/skip_to_action_24.svg?component";
import Icon24HistoryBackwardOutline from "@vkontakte/icons/src/svg/24/history_backward_outline_24.svg?component";
import Icon24Share from "@vkontakte/icons/src/svg/24/share_24.svg?component";
import Icon24QuestionOutline from "@vkontakte/icons/src/svg/24/question_outline_24.svg?component";
import Icon24KeyOutline from "@vkontakte/icons/src/svg/24/key_outline_24.svg?component";
import Icon24ErrorCircle from "@vkontakte/icons/src/svg/24/error_circle_24.svg?component";
import Icon24ErrorCircleOutline from "@vkontakte/icons/src/svg/24/error_circle_outline_24.svg?component";
import Icon24Attachments from "@vkontakte/icons/src/svg/24/attachments_24.svg?component";
import Icon240CircleOutline from "@vkontakte/icons/src/svg/24/0_circle_outline_24.svg?component";
import Icon24Bug from "@vkontakte/icons/src/svg/24/bug_24.svg?component";
import Icon24SunOutline from "@vkontakte/icons/src/svg/24/sun_outline_24.svg?component";
import Icon24CopyOutline from "@vkontakte/icons/src/svg/24/copy_outline_24.svg?component";
import Icon24RectrangleHandPointUp from "@vkontakte/icons/src/svg/24/rectrangle_hand_point_up_24.svg?component";

import Icon20FolderMoveOutline from "@vkontakte/icons/src/svg/20/folder_move_outline_20.svg?component";

import Icon16AddSquareOutline from "@vkontakte/icons/src/svg/16/add_square_outline_16.svg?component";
import Icon16Link from "@vkontakte/icons/src/svg/16/link_16.svg?component";
import Icon16LogoVk from "@vkontakte/icons/src/svg/16/logo_vk_16.svg?component";
import Icon16SearchStarsOutline from "@vkontakte/icons/src/svg/16/search_stars_outline_16.svg?component";
import Icon16Attach from "@vkontakte/icons/src/svg/16/attach_16.svg?component";
import Icon16Pen from "@vkontakte/icons/src/svg/16/pen_16.svg?component";
import Icon16WarningTriangle from "@vkontakte/icons/src/svg/16/warning_triangle_16.svg?component";
import Icon16WrenchOutline from "@vkontakte/icons/src/svg/16/wrench_outline_16.svg?component";
import Icon16KeyOutline from "@vkontakte/icons/src/svg/16/key_outline_16.svg?component";
import Icon16DeleteOutline from "@vkontakte/icons/src/svg/16/delete_outline_16.svg?component";
import Icon16MoreVertical from "@vkontakte/icons/src/svg/16/more_vertical_16.svg?component";
import Icon16FolderOutline from "@vkontakte/icons/src/svg/16/folder_outline_16.svg?component";
import Icon16DoorEnterArrowRightOutline from "@vkontakte/icons/src/svg/16/door_enter_arrow_right_outline_16.svg?component";
import Icon16ChainOutline from "@vkontakte/icons/src/svg/16/chain_outline_16.svg?component";
import Icon16CrossCircleSmall from "@vkontakte/icons/src/svg/16/cross_circle_small_16.svg?component";
import Icon16DownloadOutline from "@vkontakte/icons/src/svg/16/download_outline_16.svg?component";
import Icon16Share from "@vkontakte/icons/src/svg/16/share_16.svg?component";
import Icon16ArticleOutline from "@vkontakte/icons/src/svg/16/articles_outline_16.svg?component";
import Icon16Delete from "@vkontakte/icons/src/svg/16/delete_16.svg?component";
import Icon16CopyOutline from "@vkontakte/icons/src/svg/16/copy_outline_16.svg?component";
import Icon16PictureOutline from "@vkontakte/icons/src/svg/16/picture_outline_16.svg?component";
import Icon16Users2Outline from "@vkontakte/icons/src/svg/16/users_2_outline_16.svg?component";
import Icon16MessageOutline from "@vkontakte/icons/src/svg/16/message_outline_16.svg?component";
import Icon16InfoCircle from "@vkontakte/icons/src/svg/16/info_circle_16.svg?component";

import Icon12ErrorCircle from "@vkontakte/icons/src/svg/12/error_circle_12.svg?component";
import Icon12Tag from "@vkontakte/icons/src/svg/12/tag_12.svg?component";
import Icon12Articles from "@vkontakte/icons/src/svg/12/articles_12.svg?component";
import Icon12Flash from "@vkontakte/icons/src/svg/12/flash_12.svg?component";
import Icon12Question from "@vkontakte/icons/src/svg/12/question_12.svg?component";
import Icon12View from "@vkontakte/icons/src/svg/12/view_12.svg?component";
import Icon12Cards from "@vkontakte/icons/src/svg/12/cards_2_12.svg?component";

import { createStyledIcon } from "@/helpers/createStyledIcon";
import { usePhotoActions } from "@/pages/AAlbum/usePhotoActions";
import { GallerySwipesConfig } from "@/store/groups/groups";

export const icons = {
  Icon28PictureOutline,
  Icon28Attachments,
  Icon28Video,
  Icon28ArticleOutline,
  Icon28DownloadOutline,
  Icon28UploadOutline,
  Icon28DeleteOutline,

  Icon24GitHub,
  Icon24Back,
  Icon24MenuOutline,
  Icon24Linked,
  Icon24Home,
  Icon24InfoCircleOutline,
  Icon24DollarCircleOutline,
  Icon24CrownOutline,
  Icon24ArticleBoxOutline,
  Icon24LightbulbStarOutline,
  Icon24Filter,
  Icon24DownloadOutline,
  Icon24UploadOutline,
  Icon24DeleteOutline,
  Icon24TrashSmileOutline,
  Icon24AddSquareOutline,
  Icon24GearOutline,
  Icon24MemoryCard,
  Icon24CloudOutline,
  Icon24Fullscreen,
  Icon24FullscreenExit,
  Icon24SortOutline,
  Icon24SkipToAction,
  Icon24HistoryBackwardOutline,
  Icon24Share,
  Icon24QuestionOutline,
  Icon24KeyOutline,
  Icon24ErrorCircle,
  Icon24ErrorCircleOutline,
  Icon24Attachments,
  Icon240CircleOutline,
  Icon24Bug,
  Icon24SunOutline,
  Icon24CopyOutline,
  Icon24RectrangleHandPointUp,

  Icon20FolderMoveOutline,

  Icon16AddSquareOutline,
  Icon16Link,
  Icon16LogoVk,
  Icon16SearchStarsOutline,
  Icon16Attach,
  Icon16Pen,
  Icon16WarningTriangle,
  Icon16WrenchOutline,
  Icon16KeyOutline,
  Icon16DeleteOutline,
  Icon16MoreVertical,
  Icon16FolderOutline,
  Icon16DoorEnterArrowRightOutline,
  Icon16ChainOutline,
  Icon16CrossCircleSmall,
  Icon16DownloadOutline,
  Icon16Share,
  Icon16ArticleOutline,
  Icon16Delete,
  Icon16CopyOutline,
  Icon16PictureOutline,
  Icon16Users2Outline,
  Icon16MessageOutline,
  Icon16InfoCircle,

  Icon12ErrorCircle,
  Icon12Tag,
  Icon12Articles,
  Icon12Flash,
  Icon12Question,
  Icon12View,
  Icon12Cards,
};

export const styledIcons = {
  Icon16FolderMoveOutline: createStyledIcon(icons.Icon20FolderMoveOutline, 16),
  Icon16Fullscreen: createStyledIcon(icons.Icon24Fullscreen, 16),
  Icon16FullscreenExit: createStyledIcon(icons.Icon24FullscreenExit, 16),
  Icon16SkipToAction: createStyledIcon(icons.Icon24SkipToAction, 16),
  Icon16GitHub: createStyledIcon(icons.Icon24GitHub, 16),
  Icon24CopyOutline: createStyledIcon(icons.Icon16CopyOutline, 24),
  Icon24SortOutlineOpacity50: h(icons.Icon24SortOutline, {
    style: `opacity: 0.5;`,
  }) as any,
};

export const darkColorScheme = ref(false);

export const isDev = process.env.NODE_ENV === "development";

export const VK_MAX_PHOTO_SIZE = {
  width: 2560,
  height: 2160,
} as const;

export const MAX_SIZE_ONE_VK_VALUE = 2236;

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
  ["s", { label: "Поделиться", name: "onShare" }],
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
    "sslrp",
    {
      label: "Пропускать фото с маленьким размером",
      name: "onSwitchSkipLowResolutionPhotos",
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
  onLeft: "pp",
  onRight: "pn",
  onUp: "smi",
  onDown: "pe",
};

export const actionSwipesSelectLabels = {
  onLeft: "Свайп влево",
  onRight: "Свайп вправо",
  onUp: "Свайп вниз",
  onDown: "Свайп вверх",
};

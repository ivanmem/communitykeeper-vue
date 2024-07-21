import { StyleValue, VueElement } from "vue";
import { icons } from "@/shared/constants/consts";
import { RouteLocationRaw } from "vue-router";

export interface BaseButtonProps {
  icon?: VueElement | keyof typeof icons;
  iconStyle?: StyleValue;
  to?: RouteLocationRaw;
  target?: string | undefined;
  exactActiveDataType?: "accent";
  dataType?: "accent";
  hideContent?: boolean;
}

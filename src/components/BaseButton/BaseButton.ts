import { StyleValue, VueElement } from "vue";
import { RouteLocationRaw } from "vue-router";

export interface BaseButtonProps {
  icon?: VueElement;
  iconStyle?: StyleValue;
  to?: RouteLocationRaw;
  target?: string | undefined;
  exactActiveDataType?: "accent";
  dataType?: "accent";
  hideContent?: boolean;
}

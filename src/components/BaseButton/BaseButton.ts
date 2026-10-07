import { Component, StyleValue, VNode } from "vue";
import { RouteLocationRaw } from "vue-router";

export interface BaseButtonProps {
  // Значение уходит в <component :is>, который принимает и компонент, и готовый VNode.
  icon?: Component | VNode;
  iconStyle?: StyleValue;
  to?: RouteLocationRaw;
  target?: string | undefined;
  exactActiveDataType?: "accent";
  dataType?: "accent";
  hideContent?: boolean;
}

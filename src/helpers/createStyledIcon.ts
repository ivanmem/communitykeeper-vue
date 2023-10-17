import { h } from "vue";

export function createStyledIcon(icon: any, size: number) {
  return h(icon, { width: `${size}px`, height: `${size}px` }) as any;
}

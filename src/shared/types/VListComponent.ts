import type { ComponentPublicInstance } from "vue";
import type { VList } from "virtua/vue";

/**
 * Экземпляр VList из virtua. Типы библиотеки описывают только методы списка,
 * а это обычный компонент Vue: у него есть и $el — контейнер прокрутки.
 */
export type VListComponent = InstanceType<typeof VList> &
  ComponentPublicInstance;

export interface ImagePreloaderProps {
  photos: string[] | Set<string>;
  /** Приоритет загрузки относительно остальных ресурсов страницы */
  fetchPriority?: HTMLLinkElement["fetchPriority"];
}

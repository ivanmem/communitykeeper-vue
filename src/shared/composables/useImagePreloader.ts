import { ref } from "vue";

export function useImagePreloader() {
  const photos = ref(new Set<string>());

  const preloadPhoto = (photo: string) => {
    photos.value.add(photo);
    if (photos.value.size <= 10) return;
    photos.value.delete(photos.value.values().next().value!);
  };

  return {
    photos,
    preloadPhoto,
  };
}

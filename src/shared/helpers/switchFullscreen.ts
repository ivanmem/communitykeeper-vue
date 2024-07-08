export const switchFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      return await document.exitFullscreen();
    } else {
      const elem = document.documentElement;
      return await elem.requestFullscreen({ navigationUI: "show" });
    }
  } finally {
    document.querySelector<HTMLDivElement>(".root")?.focus();
  }
};

export async function setEruda(value: boolean) {
  try {
    const eruda = (await import("eruda")).default;
    if (value) {
      eruda.init();
    } else {
      eruda.destroy();
    }
    console.info("init eruda");
  } catch (ex) {
    console.error("init eruda", ex);
  }
}

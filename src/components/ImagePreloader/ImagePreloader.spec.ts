import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import ImagePreloader, {
  ImagePreloaderProps,
} from "@/components/ImagePreloader";

function render(props: ImagePreloaderProps) {
  return renderToString(createSSRApp({ render: () => h(ImagePreloader, props) }));
}

describe("ImagePreloader", () => {
  it("создаёт ссылку предзагрузки для каждой картинки из массива", async () => {
    const html = await render({ photos: ["a.jpg", "b.jpg"] });

    expect(html).toContain('<link href="a.jpg" as="image" rel="preload">');
    expect(html).toContain('<link href="b.jpg" as="image" rel="preload">');
  });

  it("принимает картинки в виде Set", async () => {
    const html = await render({ photos: new Set(["a.jpg"]) });

    expect(html).toContain('<link href="a.jpg" as="image" rel="preload">');
  });

  it("ничего не выводит без картинок", async () => {
    const html = await render({ photos: [] });

    expect(html).not.toContain("<link");
  });
});

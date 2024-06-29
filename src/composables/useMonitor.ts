import { onMounted, onUnmounted, ref, toValue, watch } from "vue";
import { Pane } from "tweakpane";

function prettyValue(obj: any): string {
  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .map((key) => {
        const result = () => {
          const v = obj[key];
          if (typeof v == "number") {
            return Number(v.toFixed(2));
          }

          if (!v || typeof v === "string") {
            return v;
          }

          if (typeof v === "object") {
            return prettyValue(v);
          }

          return v;
        };

        return `${key}: ${result()}`;
      })
      .join("; ");
  }

  if (typeof obj === "number") {
    return obj.toFixed(2);
  }

  return `${obj}`;
}

export function useMonitor(PARAMS: Record<any, any>) {
  const containerRef = ref();
  let pane: any = new Pane({ title: "pane" });
  const paramsWrapped = new Proxy(
    {},
    {
      get: function(target, prop, value) {
        return prettyValue(PARAMS[prop as string]);
      },
    },
  );
  watch(containerRef, () => {
    pane?.dispose();
    const cont = toValue(containerRef);
    if (!cont) {
      return;
    }

    pane = new Pane({ container: cont });
    Object.keys(PARAMS).forEach((key) => {
      pane.addBinding(paramsWrapped, key, {
        readonly: true,
      });
    });
  });

  onMounted(() => {
    const app = document.getElementById("app");
    const el = document.createElement("div");
    Object.assign(el.style, {
      "position": "fixed",
      "left": "0",
      "top": "0",
      "bottom": "0",
      "z-index": "99999",
      "pointer-events": "none",
    });
    app!.appendChild(el);
    const style = document.createElement("style");
    style.textContent = ".tp-rotv {background-color: #00000087; box-shadow: none;} .tp-sglv_i {background-color: transparent; box-shadow: none;}";
    el.appendChild(style);
    containerRef.value = el;
  });

  onUnmounted(() => {
    pane.dispose();
  });
}

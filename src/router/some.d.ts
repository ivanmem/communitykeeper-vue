import type { RoutesMap } from "@/router";

declare module "vue-router" {
  interface TypesConfig {
    RouteNamedMap: RoutesMap;
  }
}

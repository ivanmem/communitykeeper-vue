import { createApp } from "vue";
import "./style.scss";
import "./styles/icons.scss";
import "./styles/variables.scss";
import "./styles/inputs.scss";
import "./styles/buttons.scss";
import "./styles/helpers.scss";
import App from "./App.vue";
import { createPinia } from "pinia";
import { router } from "./router";
import "@vkontakte/vkui/dist/vkui.css";
import { useGroups } from "./store/groups/groups";
document.documentElement.style.setProperty("background", "black");

createApp(App).use(createPinia()).use(router).mount("#app");
useGroups().init().then();

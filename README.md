## Хранитель групп (vk mini app)

## Зависимости

```shell
npm install @vkontakte/vk-tunnel concurrently -g
npm install
```

## Запуск
Предварительно поменяйте `app_id` в [vk-tunnel-config.json](./vk-tunnel-config.json) на своё приложение.

```shell
npm run dev-tunnel
```

### Отладка

Так как приложение запускается в iframe - расширение его не видит. Поэтому расширение требуется запускать через этот
костыль:

```shell
vue-devtools
```

Это настроено только для режима разработки. Но для использования Вам потребуется раскомментировать `devtools.connect` в
`main.ts`.

## Публикация

Укажите `app_id` в файле [vk-hosting-config.json](./vk-hosting-config.json).
После чего выполните команду:

```shell
npm run deploy
```

## Ссылки

[Хранитель Групп](https://vk.com/app51658481)

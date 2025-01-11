## Хранитель групп (vk mini app)

## Зависимости

```shell
npm install @vkontakte/vk-tunnel concurrently -g
npm install
```

## Запуск

Предварительно поменяйте `app_id` в [vk-tunnel-config.json](./vk-tunnel-config.json) на своё приложение.

```shell
npm run vk-tunnel
npm run dev
```

## Публикация

Укажите `app_id` в файле [vk-hosting-config.json](./vk-hosting-config.json).
После чего выполните команду:

```shell
npm run deploy
```

## Ссылки

[Хранитель Групп](https://vk.com/app51658481)

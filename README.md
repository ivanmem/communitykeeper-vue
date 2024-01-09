## Ваш Каталог Групп (vk mini app)

## Зависимости

```shell
npm install
npm install @vkontakte/vk-tunnel concurrently -g
```

## Запуск

```shell
npm run dev
```

### Отладка

Так как приложение запускается в iframe - расширение его не видит. Поэтому расширение требуется запускать через этот
костыль:

```shell
vue-devtools
```

Это настроено только для режима разработки. Но для использования вам потребуется раскомментировать devtools.connect в
main.ts.

## Сборка

```shell
npm run build
```

## Публикация

Укажите `app_id` в файле [vk-hosting-config.json](./vk-hosting-config.json).
После чего выполните команду:

```shell
npm run deploy
```

## Ссылки

[Хранитель Групп](https://vk.com/app51658481)

## Ваш Каталог Групп (vk mini app)

## Зависимости

```shell
npm install --force
```

## Запуск

```shell
npm run dev
```

### Отладка

Так как приложение запускается в iframe - расширение его не видит. Поэтому расширение требуется запускать через этот костыль:

```shell
vue-devtools
```

Это настроено только для режима разработки.

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

[Ваш Каталог Групп](https://vk.com/app51658481)

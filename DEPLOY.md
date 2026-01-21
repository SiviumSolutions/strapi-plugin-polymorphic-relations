# Автоматичний деплой на npm через GitHub Actions

## Крок 1: Створити npm Automation Token

1. Перейдіть на https://www.npmjs.com/settings/maxnomad/tokens
2. Натисніть **"Generate New Token"**
3. Виберіть **"Automation"** (це важливо! Він bypasses 2FA)
4. Скопіюйте токен (він показується тільки один раз!)

## Крок 2: Додати токен до GitHub Secrets

1. Створіть репозиторій на GitHub: `https://github.com/sivium/strapi-plugin-polymorphic-relations`
2. Перейдіть: **Settings** → **Secrets and variables** → **Actions**
3. Натисніть **"New repository secret"**
4. Name: `NPM_TOKEN`
5. Value: ваш automation token з кроку 1
6. Натисніть **"Add secret"**

## Крок 3: Запушити код на GitHub

```bash
cd strapi-plugin-polymorphic-relation-v2

# Ініціалізувати git (якщо ще не зробили)
git init
git add .
git commit -m "Initial release v1.0.0"

# Додати remote
git remote add origin https://github.com/sivium/strapi-plugin-polymorphic-relations.git

# Запушити
git branch -M main
git push -u origin main
```

## Крок 4: Створити release tag

```bash
# Створити та запушити тег
git tag v1.0.0
git push origin v1.0.0
```

**Це автоматично запустить GitHub Actions workflow який:**

1. ✅ Встановить залежності
2. ✅ Зробить build
3. ✅ Запустить verify
4. ✅ Опублікує на npm (використовуючи NPM_TOKEN)
5. ✅ Створить GitHub Release

## Крок 5: Перевірити деплой

1. Перейдіть на вкладку **Actions** в GitHub репозиторії
2. Подивіться на статус workflow "Release"
3. Якщо все зелене ✅ - пакет опубліковано!
4. Перевірте: https://www.npmjs.com/package/@sivium/strapi-plugin-polymorphic-relations

## Для наступних релізів:

```bash
# Оновити версію
npm version patch  # 1.0.0 → 1.0.1
# або
npm version minor  # 1.0.0 → 1.1.0
# або
npm version major  # 1.0.0 → 2.0.0

# Запушити зміни та тег
git push --follow-tags
```

GitHub Actions автоматично опублікує нову версію! 🚀

## Troubleshooting

### Якщо workflow падає з помилкою 401:

- Перевірте що NPM_TOKEN правильно доданий до GitHub Secrets
- Перевірте що токен типу "Automation" (не "Publish")
- Токен має бути від користувача який є членом організації @sivium

### Якщо workflow падає з помилкою 403:

- Перевірте що ваш npm користувач має права публікувати під @sivium
- Перевірте на https://www.npmjs.com/settings/sivium/members

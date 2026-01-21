# Quick Start: GitHub Deploy

## 1️⃣ Створити npm Automation Token

https://www.npmjs.com/settings/maxnomad/tokens
→ "Generate New Token" → **"Automation"** → Copy token

## 2️⃣ Створити GitHub репозиторій

https://github.com/new

- Owner: **sivium**
- Name: **strapi-plugin-polymorphic-relations**
- Public

## 3️⃣ Додати NPM_TOKEN до GitHub Secrets

https://github.com/sivium/strapi-plugin-polymorphic-relations/settings/secrets/actions
→ "New repository secret"

- Name: `NPM_TOKEN`
- Value: [ваш automation token]

## 4️⃣ Запушити код

```bash
git init
git add .
git commit -m "Initial release v1.0.0"
git remote add origin https://github.com/sivium/strapi-plugin-polymorphic-relations.git
git branch -M main
git push -u origin main
```

## 5️⃣ Створити release

```bash
git tag v1.0.0
git push origin v1.0.0
```

✅ GitHub Actions автоматично опублікує на npm!

Перевірте: https://github.com/sivium/strapi-plugin-polymorphic-relations/actions

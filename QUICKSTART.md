# 🚀 Quick Deploy Guide

## Проблема: "Access token expired" (401)

### Рішення за 3 кроки:

#### 1️⃣ Створити новий NPM Token

```
https://www.npmjs.com/settings/maxnomad/tokens
→ Видалити старий токен
→ "Generate New Token" → "Automation" ⚠️
→ Скопіювати токен
```

#### 2️⃣ Оновити GitHub Secret

```
https://github.com/SiviumSolutions/strapi-plugin-polymorphic-relations/settings/secrets/actions
→ NPM_TOKEN → "Update"
→ Вставити новий токен
```

#### 3️⃣ Повторити публікацію

```bash
# Видалити старий тег
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1

# Створити новий тег
git tag v1.0.1
git push origin v1.0.1
```

**GitHub Actions автоматично опублікує пакет!** ✅

---

## Наступні релізи (коли токен валідний):

```bash
# Оновити версію
npm version patch  # 1.0.1 → 1.0.2

# Запушити з тегом
git push --follow-tags
```

**Все автоматично!** 🎉

---

## Перевірити публікацію:

- **GitHub Actions**: https://github.com/SiviumSolutions/strapi-plugin-polymorphic-relations/actions
- **npm Package**: https://www.npmjs.com/package/@sivium/strapi-plugin-polymorphic-relations
- **GitHub Releases**: https://github.com/SiviumSolutions/strapi-plugin-polymorphic-relations/releases

---

📖 **Детальна документація**: [`DEPLOY.md`](./DEPLOY.md)

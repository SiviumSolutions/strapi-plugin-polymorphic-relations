# Strapi Plugin Polymorphic Relations

A powerful Strapi 5 plugin that adds true polymorphic relations to your content types, allowing you to reference any content type from a single field.

[![npm version](https://img.shields.io/npm/v/strapi-plugin-polymorphic-relations.svg)](https://www.npmjs.com/package/strapi-plugin-polymorphic-relations)
[![npm downloads](https://img.shields.io/npm/dm/strapi-plugin-polymorphic-relations.svg)](https://www.npmjs.com/package/strapi-plugin-polymorphic-relations)

## ✨ Features

- **Polymorphic Relations**: Select any content type and entity from a single field
- **Inverse Relations**: Automatically show reverse relationships (e.g., "which posts reference this category?")
- **Standard Populate Support**: Works seamlessly with Strapi's `populate` query parameter
- **Flexible Relation Types**: Choose between "Has One" or "Has Many" for both regular and inverse relations
- **Auto-Population**: Automatically resolves relations in API responses
- **TypeScript Support**: Full TypeScript definitions included
- **Strapi 5 Compatible**: Built specifically for Strapi 5 with modern architecture

## 📦 Installation

```bash
npm install strapi-plugin-polymorphic-relations
# or
yarn add strapi-plugin-polymorphic-relations
# or
pnpm add strapi-plugin-polymorphic-relations
```

## 🚀 Quick Start

### 1. Enable the Plugin

Add the plugin to your `config/plugins.ts`:

```typescript
export default {
  'polymorphic-relation': {
    enabled: true,
  },
};
```

### 2. Add a Polymorphic Field

1. Open **Content-Type Builder**
2. Select a content type
3. Click **Add another field**
4. Choose **Custom** → **Polymorphic Relation**
5. Configure your field options

### 3. Use in Your Content

The field will appear as two dropdowns:

1. Select the content type (e.g., "Article", "Product", "Page")
2. Select the specific entry

## 📖 Field Types

### Regular Polymorphic Relation

Allows you to reference any content type from a single field.

**Configuration Options:**

- **Allowed Content Types**: Comma-separated UIDs (e.g., `api::post.post, api::product.product`)
- **Relation Type**:
  - `Has One (Single)` - Single reference
  - `Has Many (Multiple)` - Array of references
- **Display Field**: Field to show in the selector (default: `title`)

**API Response (without populate):**

```json
{
  "myField": {
    "contentType": "api::post.post",
    "id": "abc123"
  }
}
```

**API Response (with populate):**

```json
{
  "myField": {
    "__contentType": "api::post.post",
    "id": 1,
    "documentId": "abc123",
    "title": "My Post",
    ...
  }
}
```

### Inverse Polymorphic Relation

Shows which entries reference the current entry (read-only, computed field).

**Configuration Options:**

- **Target Model UID**: The model to search (e.g., `api::post.post`)
- **Target Field Name**: The polymorphic field name in the target model
- **Relation Type**:
  - `Has One (Single)` - Returns single object
  - `Has Many (Multiple)` - Returns array
- **Target Display Field**: Field to display from target entries
- **Label**: Custom label for the field

**Example Use Case:**
If you have a `Category` content type and `Posts` that reference categories via a polymorphic field called `category`, you can add an inverse relation to `Category` to show all posts that reference it.

**API Response (without populate):**

```json
{
  "relatedPosts": [{ "id": "post1" }, { "id": "post2" }]
}
```

**API Response (with populate):**

```json
{
  "relatedPosts": [
    {
      "id": 1,
      "documentId": "post1",
      "title": "First Post",
      "category": { ... }
    }
  ]
}
```

## 🔧 Populate Behavior

The plugin respects Strapi's standard `populate` query parameter:

### Without Populate

```bash
GET /api/posts
```

```json
{
  "myPolymorphicField": {
    "contentType": "api::category.category",
    "id": "abc123"
  },
  "inverseField": [{ "id": "xyz789" }]
}
```

### With Wildcard Populate

```bash
GET /api/posts?populate=*
```

```json
{
  "myPolymorphicField": {
    "__contentType": "api::category.category",
    "id": 1,
    "documentId": "abc123",
    "name": "Technology",
    ...
  },
  "inverseField": [
    {
      "id": 1,
      "documentId": "xyz789",
      "title": "Related Item",
      ...
    }
  ]
}
```

### Specific Field Populate

```bash
GET /api/posts?populate[myPolymorphicField]=*
```

### Nested Populate

```bash
GET /api/posts?populate[myPolymorphicField][populate]=author
```

## ⚙️ Configuration

### Global Configuration

Configure the plugin in `config/plugins.ts`:

```typescript
export default {
  'polymorphic-relation': {
    enabled: true,
    config: {
      // Whitelist of allowed content types (empty = all allowed)
      allowedTypes: ['api::post.post', 'api::product.product', 'api::page.page'],

      // Blacklist of ignored content types
      ignoredTypes: ['plugin::users-permissions.user', 'admin::user'],
    },
  },
};
```

### Field-Level Configuration

Each field can override global settings:

**Regular Polymorphic Relation:**

- `allowedTypes`: Comma-separated UIDs to restrict choices
- `relationType`: `one` or `many`
- `displayField`: Field to display in selector

**Inverse Polymorphic Relation:**

- `targetModel`: UID of the model to search
- `targetField`: Name of the polymorphic field in target model
- `relationType`: `one` or `many`
- `targetDisplayField`: Field to display from results
- `label`: Custom label for the field

## 🎯 Use Cases

### 1. Flexible Content References

```typescript
// A "Hero Section" that can reference any content type
{
  "heroContent": {
    "contentType": "api::product.product",
    "id": "featured-product-123"
  }
}
```

### 2. Related Content

```typescript
// "You might also like" section with mixed content types
{
  "relatedItems": [
    { "contentType": "api::post.post", "id": "post-1" },
    { "contentType": "api::video.video", "id": "video-1" },
    { "contentType": "api::product.product", "id": "product-1" }
  ]
}
```

### 3. Reverse Lookups

```typescript
// Show all content that references this category
{
  "usedIn": [
    { "id": 1, "title": "Blog Post", "__contentType": "api::post.post" },
    { "id": 5, "title": "Product", "__contentType": "api::product.product" }
  ]
}
```

## 🔌 API Endpoints

The plugin provides REST endpoints for the admin panel:

- `GET /api/polymorphic-relation/content-types` - List available content types
- `GET /api/polymorphic-relation/content-types/:type/entities` - List entities for a type
- `GET /api/polymorphic-relation/content-types/:type/entities/:id` - Get specific entity
- `GET /api/polymorphic-relation/reverse-relations` - Find reverse relations

## 🛠️ Development

### Build the Plugin

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Verify Package

```bash
npm run verify
```

## 📝 TypeScript Support

The plugin includes full TypeScript definitions:

```typescript
import type {
  PolymorphicValue,
  ResolvedPolymorphicValue,
} from 'strapi-plugin-polymorphic-relations/server';

// Polymorphic value stored in database
interface PolymorphicValue {
  contentType: string;
  id: string;
}

// Resolved value with full entity data
interface ResolvedPolymorphicValue {
  __contentType: string;
  id: number;
  documentId: string;
  [key: string]: any;
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

Developed by [Sivium Solutions](https://github.com/SiviumSolutions)

## 📮 Support

- 🐛 [Report a Bug](https://github.com/SiviumSolutions/strapi-plugin-polymorphic-relations/issues)
- 💡 [Request a Feature](https://github.com/SiviumSolutions/strapi-plugin-polymorphic-relations/issues)
- 📖 [Documentation](https://github.com/SiviumSolutions/strapi-plugin-polymorphic-relations#readme)

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/strapi-plugin-polymorphic-relations)
- [GitHub Repository](https://github.com/SiviumSolutions/strapi-plugin-polymorphic-relations)
- [Strapi Documentation](https://docs.strapi.io)

---

Made with ❤️ for the Strapi community

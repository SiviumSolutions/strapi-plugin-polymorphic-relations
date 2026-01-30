# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-01-30

### Added

- ✨ **Deep Filtering**: Support for filtering by fields within polymorphic relations without `populate`
- 🚀 **Pre-processing Middleware**: Intercepts requests to handle polymorphic filters efficiently at the database level
- ⚡ **Optimized Queries**: Only resolves necessary relationships for filtering purposes

## [1.0.0] - 2026-01-21

### Added

- ✨ **Polymorphic Relations**: Select any content type and entity from a single field
- ✨ **Inverse Relations**: Show reverse relationships (which entries reference this one)
- ✨ **Standard Populate Support**: Full integration with Strapi's `populate` query parameter
- ✨ **Relation Type Options**: Choose between "Has One" or "Has Many" for both regular and inverse relations
- ✨ **Auto-Population**: Automatic resolution of polymorphic relations in API responses
- ✨ **Configurable Display Fields**: Customize which field to display in selectors
- ✨ **TypeScript Support**: Full TypeScript definitions included
- ✨ **Deduplication**: Automatic deduplication of Draft/Published versions in inverse relations
- 🎨 **Admin UI**: Intuitive dual-selector interface for content type and entity selection
- 🎨 **Inverse Relation UI**: Read-only display of reverse relationships in admin panel
- 📖 **REST API Endpoints**: Content type and entity listing endpoints for admin panel
- 🔧 **Global Configuration**: Whitelist/blacklist content types globally
- 🔧 **Field-Level Configuration**: Override global settings per field

### Technical Details

- Built for Strapi 5 with modern architecture
- Uses Strapi Documents API for data fetching
- Implements middleware for automatic population
- Supports nested populate options
- Handles comma-separated populate strings
- Respects Strapi's standard query parameter format

### Documentation

- Comprehensive README with usage examples
- API reference documentation
- Configuration guide
- TypeScript type definitions
- Use case examples

[1.0.0]: https://github.com/SiviumSolutions/strapi-plugin-polymorphic-relations/releases/tag/v1.0.0

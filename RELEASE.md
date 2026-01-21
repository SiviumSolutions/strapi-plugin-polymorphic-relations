# Release Checklist

## Pre-Release

- [ ] All tests passing
- [ ] Build successful (`pnpm build`)
- [ ] Verify package (`pnpm verify`)
- [ ] README.md complete and accurate
- [ ] CHANGELOG.md updated
- [ ] LICENSE file present
- [ ] package.json metadata correct
  - [ ] Name: `strapi-plugin-polymorphic-relations`
  - [ ] Version: `1.0.0`
  - [ ] Description accurate
  - [ ] Keywords relevant
  - [ ] Repository URL correct
  - [ ] Author information correct

## GitHub Setup

- [ ] Create repository: `https://github.com/SiviumSolutions/strapi-plugin-polymorphic-relations`
- [ ] Push code to GitHub
- [ ] Add repository description
- [ ] Add topics/tags: `strapi`, `strapi-plugin`, `strapi5`, `polymorphic`, `relations`
- [ ] Set up branch protection (optional)
- [ ] Add NPM_TOKEN to GitHub Secrets (for automated publishing)

## NPM Setup

- [ ] Create npm account (if not exists)
- [ ] Login to npm: `npm login`
- [ ] **Enable 2FA** (required for publishing):
  ```bash
  npm profile enable-2fa auth-and-writes
  ```
- [ ] **OR** Create automation token (bypasses 2FA):
  - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
  - Click "Generate New Token" → "Automation"
  - Save token securely
- [ ] Verify package name available: `npm view strapi-plugin-polymorphic-relations`
- [ ] Generate npm token (for GitHub Actions)
- [ ] Add token to GitHub Secrets as `NPM_TOKEN`

## Publishing

### Manual Publish (First Time)

```bash
# 1. Build the plugin
pnpm build

# 2. Verify the package
pnpm verify

# 3. Test the package locally (optional)
npm pack
# This creates a .tgz file you can test with: npm install ./strapi-plugin-polymorphic-relations-1.0.0.tgz

# 4. Publish to npm (with 2FA)
npm publish --access public --otp=123456  # Replace with your 2FA code

# OR if using automation token:
npm publish --access public
```

### Automated Publish (Subsequent Releases)

```bash
# 1. Update version in package.json
npm version patch  # or minor, or major

# 2. Push tag to GitHub
git push --tags

# GitHub Actions will automatically:
# - Build the plugin
# - Run verification
# - Publish to npm
# - Create GitHub release
```

## Post-Release

- [ ] Verify package on npm: `https://www.npmjs.com/package/strapi-plugin-polymorphic-relations`
- [ ] Test installation: `npm install strapi-plugin-polymorphic-relations`
- [ ] Update GitHub release notes
- [ ] Share on Strapi Discord/Forum
- [ ] Tweet about the release (optional)
- [ ] Update any documentation sites

## Version Bumping

For future releases:

```bash
# Patch (1.0.0 -> 1.0.1) - Bug fixes
npm version patch

# Minor (1.0.0 -> 1.1.0) - New features (backwards compatible)
npm version minor

# Major (1.0.0 -> 2.0.0) - Breaking changes
npm version major

# Then push the tag
git push --tags
```

## Troubleshooting

### Package name already taken

- Choose a different name in package.json
- Update all references in README and documentation

### Publish fails

- Verify npm login: `npm whoami`
- Check package.json has `"publishConfig": { "access": "public" }`
- Ensure version hasn't been published before

### GitHub Actions fails

- Check NPM_TOKEN is set in GitHub Secrets
- Verify workflow file syntax
- Check build logs for errors

export default {
  default: {
    allowedTypes: [], // Empty means all types are allowed (unless ignored)
    ignoredTypes: [
      'admin::permission',
      'admin::user',
      'admin::role',
      'admin::api-token',
      'admin::api-token-permission',
      'admin::transfer-token',
      'admin::transfer-token-permission',
      'plugin::upload.file',
      'plugin::upload.folder',
      'plugin::i18n.locale',
      'plugin::users-permissions.permission',
      'plugin::users-permissions.role',
      'plugin::content-releases.release',
      'plugin::content-releases.release-action',
    ],
  },
  validator() {},
};

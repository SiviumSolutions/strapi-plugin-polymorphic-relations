export const prefixPluginTranslations = (
  translations: Record<string, string>,
  pluginId: string
): Record<string, string> => {
  return Object.keys(translations).reduce(
    (acc, key) => {
      acc[`${pluginId}.${key}`] = translations[key];
      return acc;
    },
    {} as Record<string, string>
  );
};

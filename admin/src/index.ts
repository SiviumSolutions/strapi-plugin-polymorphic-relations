import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { PluginIcon } from './components/PluginIcon';
import { prefixPluginTranslations } from './utils/prefixPluginTranslations';

export default {
  register(app: any) {
    app.customFields.register({
      name: 'polymorphic-relation',
      pluginId: PLUGIN_ID,
      type: 'json',
      intlLabel: {
        id: getTranslation('form.label'),
        defaultMessage: 'Polymorphic Relation',
      },
      intlDescription: {
        id: getTranslation('form.description'),
        defaultMessage: 'Select any content type and entity',
      },
      icon: PluginIcon,
      components: {
        Input: async () => import('./components/Input'),
      },
      options: {
        base: [
          {
            name: 'options.allowedTypes',
            type: 'textarea', // Textarea is better for long lists
            intlLabel: {
              id: getTranslation('settings.allowedTypes.label'),
              defaultMessage: 'Allowed Content Types',
            },
            description: {
              id: getTranslation('settings.allowedTypes.description'),
              defaultMessage:
                'Enter UIDs separated by comma (e.g. api::post.post, api::product.product). Leave empty to allow all (configured in server).',
            },
          },
          {
            name: 'options.relationType',
            type: 'select',
            intlLabel: {
              id: getTranslation('settings.relationType.label'),
              defaultMessage: 'Relation Type',
            },
            description: {
              id: getTranslation('settings.relationType.description'),
              defaultMessage: 'Choose between single or multiple selection',
            },
            options: [
              {
                key: 'one',
                value: 'one',
                metadatas: {
                  intlLabel: {
                    id: getTranslation('settings.relationType.one'),
                    defaultMessage: 'Has One (Single)',
                  },
                },
              },
              {
                key: 'many',
                value: 'many',
                metadatas: {
                  intlLabel: {
                    id: getTranslation('settings.relationType.many'),
                    defaultMessage: 'Has Many (Multiple)',
                  },
                },
              },
            ],
            defaultValue: 'one',
          },
          {
            name: 'options.displayField',
            type: 'text',
            intlLabel: {
              id: getTranslation('settings.displayField.label'),
              defaultMessage: 'Display Field',
            },
            description: {
              id: getTranslation('settings.displayField.description'),
              defaultMessage: 'Field to display (default: title)',
            },
          },
        ],
      },
    });

    app.customFields.register({
      name: 'inverse-polymorphic-relation',
      pluginId: PLUGIN_ID,
      type: 'json',
      intlLabel: {
        id: getTranslation('form.inverse.label'),
        defaultMessage: 'Inverse Polymorphic Relation',
      },
      intlDescription: {
        id: getTranslation('form.inverse.description'),
        defaultMessage: 'Display entities that reference this entry',
      },
      icon: PluginIcon,
      components: {
        Input: async () => import('./components/InverseInput'),
      },
      options: {
        base: [
          {
            name: 'options.targetModel',
            type: 'text',
            intlLabel: {
              id: getTranslation('settings.targetModel.label'),
              defaultMessage: 'Target Model UID',
            },
            description: {
              id: getTranslation('settings.targetModel.description'),
              defaultMessage:
                'The UID of the model referencing this one (e.g. api::datasheet.datasheet)',
            },
          },
          {
            name: 'options.targetField',
            type: 'text',
            intlLabel: {
              id: getTranslation('settings.targetField.label'),
              defaultMessage: 'Target Field Name',
            },
            description: {
              id: getTranslation('settings.targetField.description'),
              defaultMessage: 'The name of the polymorphic field in the target model',
            },
          },
          {
            name: 'options.relationType',
            type: 'select',
            intlLabel: {
              id: getTranslation('settings.inverseRelationType.label'),
              defaultMessage: 'Relation Type',
            },
            description: {
              id: getTranslation('settings.inverseRelationType.description'),
              defaultMessage: 'Choose between single or multiple results',
            },
            options: [
              {
                key: 'one',
                value: 'one',
                metadatas: {
                  intlLabel: {
                    id: getTranslation('settings.relationType.one'),
                    defaultMessage: 'Has One (Single)',
                  },
                },
              },
              {
                key: 'many',
                value: 'many',
                metadatas: {
                  intlLabel: {
                    id: getTranslation('settings.relationType.many'),
                    defaultMessage: 'Has Many (Multiple)',
                  },
                },
              },
            ],
            defaultValue: 'many',
          },
          {
            name: 'options.targetDisplayField',
            type: 'text',
            intlLabel: {
              id: getTranslation('settings.targetDisplayField.label'),
              defaultMessage: 'Target Display Field',
            },
            description: {
              id: getTranslation('settings.targetDisplayField.description'),
              defaultMessage:
                'Field to display independently (e.g. title, name). Leave empty for ID',
            },
          },
          {
            name: 'options.label',
            type: 'text',
            intlLabel: {
              id: getTranslation('settings.label.label'),
              defaultMessage: 'Label',
            },
            description: {
              id: getTranslation('settings.label.description'),
              defaultMessage:
                'Custom label to specificy the relation title (default: Incoming Relations)',
            },
          },
        ],
      },
    });

    const plugin = {
      id: PLUGIN_ID,
      initializer: () => null,
      isReady: true,
      name: PLUGIN_ID,
    };

    app.registerPlugin(plugin);
  },

  async registerTrads({ locales }: { locales: string[] }) {
    const importedTranslations = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, PLUGIN_ID),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return importedTranslations;
  },
};

import type { Core } from '@strapi/strapi';

/**
 * Register phase - register custom field on server
 */
const register = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.customFields.register({
    name: 'polymorphic-relation',
    plugin: 'polymorphic-relation',
    type: 'json',
  });

  strapi.customFields.register({
    name: 'content-type-select',
    plugin: 'polymorphic-relation',
    type: 'json',
  });

  strapi.customFields.register({
    name: 'inverse-polymorphic-relation',
    plugin: 'polymorphic-relation',
    type: 'json',
  });

  strapi.log.info('Polymorphic Relations custom field registered on server');
};

export default register;

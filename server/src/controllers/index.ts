import type { Core } from '@strapi/strapi';
import polymorphic from './polymorphic';

const controllers: Record<string, (context: { strapi: Core.Strapi }) => any> = {
  polymorphic,
};

export default controllers;

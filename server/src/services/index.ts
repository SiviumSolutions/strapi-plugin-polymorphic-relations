import type { Core } from '@strapi/strapi';
import polymorphic from './polymorphic';

const services: Record<string, (context: { strapi: Core.Strapi }) => any> = {
  polymorphic,
};

export default services;

import type { Core } from '@strapi/strapi';
import register from './register';
import bootstrap from './bootstrap';
import services from './services';
import controllers from './controllers';
import routes from './routes';
import config from './config';

interface PluginServerExport {
  register: (context: { strapi: Core.Strapi }) => void;
  bootstrap: (context: { strapi: Core.Strapi }) => void;
  services: Record<string, any>;
  controllers: Record<string, any>;
  routes: any[];
  config: Record<string, any>;
}

const serverExport: PluginServerExport = {
  register,
  bootstrap,
  services,
  controllers,
  routes,
  config,
};

export default serverExport;

import type { Core } from '@strapi/strapi';

/**
 * Bootstrap phase - add middleware for automatic populate
 */
const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  /**
   * Add global middleware to automatically populate polymorphic fields in API responses
   */
  strapi.server.use(async (ctx: any, next: () => Promise<void>) => {
    // Execute the request first
    await next();

    /**
     * Only process API requests with successful responses
     */
    if (
      ctx.url.startsWith('/api/') &&
      ctx.body &&
      ctx.body.data &&
      ctx.response.status >= 200 &&
      ctx.response.status < 300
    ) {
      try {
        /**
         * Get the polymorphic service
         */
        const polymorphicService = strapi.plugin('polymorphic-relation').service('polymorphic');

        /**
         * Try to determine model UID from URL
         * URL format: /api/:pluralName
         */
        let modelUID: string | undefined;
        try {
          const pathParts = ctx.url.split('?')[0].split('/');
          // /api/pluralName or /api/pluralName/:id
          if (pathParts.length >= 3 && pathParts[1] === 'api') {
            const pluralName = pathParts[2];
            // Find content type by pluralName
            // This is a naive search, might need optimization
            for (const [uid, type] of Object.entries(strapi.contentTypes)) {
              if ((type as any).info?.pluralName === pluralName) {
                modelUID = uid;
                break;
              }
            }
          }
        } catch (e) {
          // Ignore error resolving UID
        }

        if (modelUID) {
          strapi.log.debug(`[Polymorphic] Detected model ${modelUID} for auto-populate.`);
        } else {
          strapi.log.warn(`[Polymorphic] Could not resolve model UID from URL: ${ctx.url}`);
        }

        /**
         * Automatically populate all polymorphic fields in the response
         */
        const populateParams = ctx.query.populate;
        await polymorphicService.populatePolymorphicFields(ctx.body.data, modelUID, populateParams);
      } catch (error: any) {
        /**
         * Log error but don't fail the request
         */
        strapi.log.error('❌ Error auto-populating polymorphic fields:', error.message);
      }
    }
  });

  strapi.log.info('✅ Polymorphic Relations plugin bootstrapped');
};

export default bootstrap;

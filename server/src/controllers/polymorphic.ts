import type { Core } from '@strapi/strapi';

/**
 * Polymorphic controller - REST API endpoints
 */
const polymorphicController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * GET /api/polymorphic-relation/content-types
   * Get list of available content types
   */
  async getContentTypes(ctx: any) {
    try {
      const polymorphicService = strapi.plugin('polymorphic-relation').service('polymorphic');

      const contentTypes = polymorphicService.getAvailableContentTypes();

      ctx.body = {
        data: contentTypes,
      };
    } catch (error: any) {
      ctx.throw(500, `Failed to fetch content types: ${error.message}`);
    }
  },

  /**
   * GET /api/polymorphic-relation/content-types/:contentType/entities
   * Get entities for a specific content type
   */
  async getEntities(ctx: any) {
    try {
      const { contentType } = ctx.params;
      const { search, page = 1, pageSize = 10 } = ctx.query;

      /**
       * Validate content type exists
       */
      if (!strapi.contentTypes[contentType]) {
        return ctx.throw(404, `Content type "${contentType}" not found`);
      }

      /**
       * Build query options
       */
      const queryOptions: any = {
        pagination: {
          page: parseInt(page as string, 10),
          pageSize: parseInt(pageSize as string, 10),
        },
      };

      /**
       * Add search filter if provided
       * This is a simple search - can be improved based on content type fields
       */
      if (search) {
        queryOptions.filters = {
          $or: [
            { title: { $containsi: search } },
            { name: { $containsi: search } },
            { displayName: { $containsi: search } },
          ],
        };
      }

      /**
       * Fetch entities using Documents API
       */
      const result = await strapi.documents(contentType).findMany(queryOptions);

      ctx.body = {
        data: result,
        meta: {
          pagination: queryOptions.pagination,
        },
      };
    } catch (error: any) {
      ctx.throw(500, `Failed to fetch entities: ${error.message}`);
    }
  },

  /**
   * GET /api/polymorphic-relation/content-types/:contentType/entities/:id
   * Get a specific entity
   */
  async getEntity(ctx: any) {
    try {
      const { contentType, id } = ctx.params;

      /**
       * Validate content type exists
       */
      if (!strapi.contentTypes[contentType]) {
        return ctx.throw(404, `Content type "${contentType}" not found`);
      }

      /**
       * Fetch entity using Documents API
       */
      const entity = await strapi.documents(contentType).findOne({
        documentId: id,
      });

      if (!entity) {
        return ctx.throw(404, `Entity with id "${id}" not found`);
      }

      ctx.body = {
        data: entity,
      };
    } catch (error: any) {
      ctx.throw(500, `Failed to fetch entity: ${error.message}`);
    }
  },

  /**
   * GET /api/polymorphic-relation/reverse-relations
   * Find identifying reverse relations
   */
  async findReverseRelations(ctx: any) {
    try {
      const { targetModel, targetField, lookupType, lookupId } = ctx.query;

      if (!targetModel || !targetField || !lookupType || !lookupId) {
        return ctx.throw(
          400,
          'Missing required query parameters: targetModel, targetField, lookupType, lookupId'
        );
      }

      const polymorphicService = strapi.plugin('polymorphic-relation').service('polymorphic');
      const results = await polymorphicService.findReverseRelations(
        targetModel,
        targetField,
        lookupType,
        lookupId
      );

      ctx.body = {
        data: results,
      };
    } catch (error: any) {
      ctx.throw(500, `Failed to find reverse relations: ${error.message}`);
    }
  },
});

export default polymorphicController;

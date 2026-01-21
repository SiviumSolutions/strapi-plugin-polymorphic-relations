/**
 * Routes for polymorphic relation plugin
 */
export default [
  {
    method: 'GET',
    path: '/content-types',
    handler: 'polymorphic.getContentTypes',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/content-types/:contentType/entities',
    handler: 'polymorphic.getEntities',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/content-types/:contentType/entities/:id',
    handler: 'polymorphic.getEntity',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/reverse-relations',
    handler: 'polymorphic.findReverseRelations',
    config: {
      policies: [],
    },
  },
];

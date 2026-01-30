import type { Core } from '@strapi/strapi';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.server.use(async (ctx: any, next: () => Promise<void>) => {
    // PRE-PROCESSING: Перехоплюємо запити ДО виконання
    if (ctx.url.startsWith('/api/')) {
      try {
        const filters = ctx.query.filters;

        if (filters) {
          // Знаходимо model UID
          let modelUID: string | undefined;
          const pathParts = ctx.url.split('?')[0].split('/');

          if (pathParts.length >= 3 && pathParts[1] === 'api') {
            const pluralName = pathParts[2];

            for (const [uid, type] of Object.entries(strapi.contentTypes)) {
              if ((type as any).info?.pluralName === pluralName) {
                modelUID = uid;
                break;
              }
            }
          }

          if (modelUID) {
            const model = strapi.contentTypes[modelUID];
            const attributes = model?.attributes || {};

            // Шукаємо поліморфні фільтри
            const polymorphicFilters = await extractPolymorphicFilters(filters, attributes, strapi);

            if (Object.keys(polymorphicFilters).length > 0) {
              strapi.log.debug(`[Polymorphic] Found filters:`, polymorphicFilters);

              // Виконуємо pre-filtering на рівні БД
              const validDocumentIds = await filterByPolymorphicFields(
                modelUID,
                polymorphicFilters,
                strapi
              );

              if (validDocumentIds.length === 0) {
                // Немає результатів - повертаємо пустий response
                ctx.body = {
                  data: [],
                  meta: {
                    pagination: {
                      page: 1,
                      pageSize: 25,
                      pageCount: 0,
                      total: 0,
                    },
                  },
                };
                return; // Не викликаємо next()
              }

              // Додаємо фільтр по documentId до існуючих фільтрів
              if (!ctx.query.filters.documentId) {
                ctx.query.filters.documentId = {};
              }

              ctx.query.filters.documentId.$in = validDocumentIds;

              // Видаляємо поліморфні фільтри з query
              removePolymorphicFilters(ctx.query.filters, Object.keys(polymorphicFilters));
            }
          }
        }
      } catch (e: any) {
        strapi.log.error('Error processing polymorphic filters:', e.message);
      }
    }

    await next();

    // POST-PROCESSING: Автоматичне populate
    if (
      ctx.url.startsWith('/api/') &&
      ctx.body &&
      ctx.body.data &&
      ctx.response.status >= 200 &&
      ctx.response.status < 300
    ) {
      try {
        const polymorphicService = strapi.plugin('polymorphic-relation').service('polymorphic');

        let modelUID: string | undefined;
        const pathParts = ctx.url.split('?')[0].split('/');

        if (pathParts.length >= 3 && pathParts[1] === 'api') {
          const pluralName = pathParts[2];

          for (const [uid, type] of Object.entries(strapi.contentTypes)) {
            if ((type as any).info?.pluralName === pluralName) {
              modelUID = uid;
              break;
            }
          }
        }

        const populateParams = ctx.query.populate;
        await polymorphicService.populatePolymorphicFields(ctx.body.data, modelUID, populateParams);
      } catch (error: any) {
        strapi.log.error('❌ Error auto-populating:', error.message);
      }
    }
  });

  strapi.log.info('Polymorphic Relations plugin bootstrapped');
};

/**
 * Витягує поліморфні фільтри з query filters
 */
async function extractPolymorphicFilters(
  filters: any,
  attributes: any,
  strapi: Core.Strapi
): Promise<Record<string, any>> {
  const polymorphicFilters: Record<string, any> = {};

  for (const [fieldName, filterValue] of Object.entries(filters)) {
    const attribute = attributes[fieldName];

    // Перевіряємо чи це поліморфне поле
    if (
      attribute?.customField === 'plugin::polymorphic-relation.polymorphic-relation' ||
      attribute?.customField === 'plugin::polymorphic-relation.inverse-polymorphic-relation'
    ) {
      polymorphicFilters[fieldName] = filterValue;
    }
  }

  return polymorphicFilters;
}

/**
 * Видаляє поліморфні фільтри з об'єкта filters
 */
function removePolymorphicFilters(filters: any, keys: string[]): void {
  for (const key of keys) {
    delete filters[key];
  }
}

/**
 * Фільтрує записи по поліморфним полям на рівні БД
 * Повертає масив documentId які відповідають фільтрам
 */
async function filterByPolymorphicFields(
  modelUID: string,
  polymorphicFilters: Record<string, any>,
  strapi: Core.Strapi
): Promise<string[]> {
  try {
    // Отримуємо всі записи з поліморфними полями
    const fieldNames = Object.keys(polymorphicFilters);

    const entries = await strapi.db.query(modelUID).findMany({
      select: ['id', 'documentId', ...fieldNames],
      limit: 10000, // Adjust based on your needs
    });

    if (!entries || entries.length === 0) {
      return [];
    }

    // Фільтруємо записи
    const validEntries = [];

    for (const entry of entries) {
      let matches = true;

      for (const [fieldName, filterValue] of Object.entries(polymorphicFilters)) {
        const polymorphicValue = entry[fieldName];

        if (!polymorphicValue) {
          matches = false;
          break;
        }

        // Завантажуємо target entity
        const targetContentType = polymorphicValue.contentType;
        const targetId = polymorphicValue.id;

        if (!targetContentType || !targetId) {
          matches = false;
          break;
        }

        try {
          const targetEntity = await strapi.documents(targetContentType).findOne({
            documentId: targetId,
          });

          if (!targetEntity) {
            matches = false;
            break;
          }

          // Перевіряємо фільтри на target entity
          if (!matchesFilter(targetEntity, filterValue)) {
            matches = false;
            break;
          }
        } catch (e) {
          strapi.log.warn(`Failed to load target entity: ${targetContentType}#${targetId}`);
          matches = false;
          break;
        }
      }

      if (matches) {
        validEntries.push(entry.documentId);
      }
    }

    return validEntries;
  } catch (error: any) {
    strapi.log.error('Error filtering by polymorphic fields:', error.message);
    return [];
  }
}

/**
 * Перевіряє чи об'єкт відповідає фільтру
 */
function matchesFilter(obj: any, filter: any): boolean {
  for (const [key, value] of Object.entries(filter)) {
    const objValue = obj[key];

    if (typeof value === 'object' && value !== null) {
      // Обробка Strapi операторів
      for (const [operator, operatorValue] of Object.entries(value)) {
        switch (operator) {
          case '$eq':
            if (objValue !== operatorValue) return false;
            break;

          case '$ne':
            if (objValue === operatorValue) return false;
            break;

          case '$contains':
            if (!String(objValue || '').includes(String(operatorValue))) return false;
            break;

          case '$containsi':
            const str = String(objValue || '').toLowerCase();
            const search = String(operatorValue).toLowerCase();
            if (!str.includes(search)) return false;
            break;

          case '$notContains':
            if (String(objValue || '').includes(String(operatorValue))) return false;
            break;

          case '$notContainsi':
            const strNot = String(objValue || '').toLowerCase();
            const searchNot = String(operatorValue).toLowerCase();
            if (strNot.includes(searchNot)) return false;
            break;

          case '$startsWith':
            if (!String(objValue || '').startsWith(String(operatorValue))) return false;
            break;

          case '$endsWith':
            if (!String(objValue || '').endsWith(String(operatorValue))) return false;
            break;

          case '$in':
            if (!Array.isArray(operatorValue) || !operatorValue.includes(objValue)) {
              return false;
            }
            break;

          case '$notIn':
            if (Array.isArray(operatorValue) && operatorValue.includes(objValue)) {
              return false;
            }
            break;

          case '$lt':
            if (!(objValue < operatorValue)) return false;
            break;

          case '$lte':
            if (!(objValue <= operatorValue)) return false;
            break;

          case '$gt':
            if (!(objValue > operatorValue)) return false;
            break;

          case '$gte':
            if (!(objValue >= operatorValue)) return false;
            break;

          case '$null':
            if (operatorValue === true && objValue !== null) return false;
            if (operatorValue === false && objValue === null) return false;
            break;

          case '$notNull':
            if (operatorValue === true && objValue === null) return false;
            if (operatorValue === false && objValue !== null) return false;
            break;
        }
      }
    } else {
      // Пряме порівняння
      if (objValue !== value) return false;
    }
  }

  return true;
}

export default bootstrap;

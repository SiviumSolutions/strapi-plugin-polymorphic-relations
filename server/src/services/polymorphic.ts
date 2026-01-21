import type { Core } from '@strapi/strapi';
import type {
  PolymorphicValue,
  ResolvedPolymorphicValue,
  ContentTypeInfo,
  ResolveOptions,
  PolymorphicService as IPolymorphicService,
} from '../types';

/**
 * Polymorphic service - business logic for polymorphic relations
 */
const polymorphicService = ({ strapi }: { strapi: Core.Strapi }): IPolymorphicService => ({
  /**
   * Resolve polymorphic relation and return full entity data
   */
  async resolvePolymorphicRelation(
    fieldValue: PolymorphicValue | null,
    options: ResolveOptions = {}
  ): Promise<ResolvedPolymorphicValue | null> {
    if (!fieldValue || !fieldValue.contentType || !fieldValue.id) {
      return null;
    }

    const { contentType, id } = fieldValue;

    try {
      /**
       * Use Strapi Documents API to fetch the entity
       */
      const entity = await (strapi.documents as any)(contentType).findOne({
        documentId: id,
        ...options,
      });

      if (!entity) {
        strapi.log.debug(`⚠️ Entity not found: ${contentType} with id ${id}`);
        return null;
      }

      /**
       * Return entity with __contentType field for frontend identification
       */
      return {
        __contentType: contentType,
        ...entity,
      } as ResolvedPolymorphicValue;
    } catch (error: any) {
      strapi.log.error(`❌ Error resolving polymorphic relation: ${error.message}`);
      return null;
    }
  },

  /**
   * Recursively populate all polymorphic fields in data
   */
  /**
   * Recursively populate all polymorphic fields in data
   */
  async populatePolymorphicFields(
    data: any,
    modelUID?: string,
    populateParams?: any
  ): Promise<void> {
    if (!data) return;

    /**
     * Helper to determine if a field should be populated
     */
    const shouldPopulate = (field: string): boolean => {
      // Default: Do NOT populate if not requested (Standard Strapi behavior)
      if (!populateParams) return false;

      if (populateParams === '*' || populateParams === true) return true; // Wildcard or populate=true

      // Handle comma-separated string (e.g. ?populate=foo,bar)
      if (typeof populateParams === 'string') {
        return populateParams
          .split(',')
          .map((s) => s.trim())
          .includes(field);
      }

      if (Array.isArray(populateParams)) return populateParams.includes(field);

      if (typeof populateParams === 'object') {
        return field in populateParams || populateParams['*']; // Check key or nested wildcard
      }

      return false;
    };

    /**
     * Helper to get nested populate options
     */
    const getNestedPopulate = (field: string): any => {
      if (typeof populateParams === 'object' && populateParams !== null && populateParams[field]) {
        return populateParams[field];
      }
      return undefined;
    };

    // 0. If modelUID is provided, check for Inverse Relations to populate
    if (modelUID) {
      const model = strapi.contentTypes[modelUID];
      if (model) {
        const attributes = model.attributes || {};
        const inverseFields = Object.entries(attributes).filter(
          ([_, attr]: [string, any]) =>
            attr.customField === 'plugin::polymorphic-relation.inverse-polymorphic-relation'
        );

        for (const [fieldName, attr] of inverseFields) {
          // For inverse relations, we ALWAYS fetch them (to show IDs at minimum)
          // But we only expand them fully if populate is requested
          const shouldExpand = shouldPopulate(fieldName);

          const options = (attr as any).options || {};
          const { targetModel, targetField, targetDisplayField, relationType } = options;

          const processSingle = async (item: any) => {
            if (item && typeof item === 'object') {
              if (targetModel && targetField) {
                try {
                  const relations = await this.findReverseRelations(
                    targetModel,
                    targetField,
                    modelUID,
                    item.documentId || item.id,
                    targetDisplayField
                  );

                  // Determine if we should return single object or array based on relationType
                  const isSingle = relationType === 'one';

                  if (shouldExpand) {
                    // Full populate: recursively expand polymorphic fields
                    const nestedPopulate = getNestedPopulate(fieldName);
                    await this.populatePolymorphicFields(
                      relations,
                      targetModel,
                      nestedPopulate || populateParams
                    );

                    // Return single object or array based on relationType
                    item[fieldName] = isSingle ? relations[0] || null : relations;
                  } else {
                    // Shallow: return only IDs (like standard Strapi relations)
                    const ids = relations.map((rel) => ({
                      id: rel.documentId || rel.id,
                    }));

                    // Return single ID object or array based on relationType
                    item[fieldName] = isSingle ? ids[0] || null : ids;
                  }

                  strapi.log.debug(
                    `[Polymorphic] Populated ${fieldName} with ${relations.length} items (expanded: ${shouldExpand}, type: ${relationType || 'many'})`
                  );
                } catch (e) {
                  strapi.log.warn(`Failed to populate inverse relation ${fieldName}: ${e}`);
                }
              }
            }
          };

          if (Array.isArray(data)) {
            await Promise.all(data.map((item) => processSingle(item)));
          } else {
            await processSingle(data);
          }
        }
      } else {
        strapi.log.debug(`[Polymorphic] Model ${modelUID} not found in contentTypes`);
      }
    }

    /**
     * Helper to check if value is a polymorphic pointer
     */
    const isPolymorphic = (value: any): boolean => {
      return value && typeof value === 'object' && 'contentType' in value && 'id' in value;
    };

    const processItem = async (item: any): Promise<void> => {
      if (!item || typeof item !== 'object') return;

      for (const [key, value] of Object.entries(item)) {
        /**
         * Case 1: Single Polymorphic Value
         */
        if (
          isPolymorphic(value) &&
          !Array.isArray(value) &&
          !(value as any).__contentType // Avoid double populating if already populated
        ) {
          // Check if we should populate this field
          if (shouldPopulate(key)) {
            const nestedPopulate = getNestedPopulate(key);
            const resolved = await this.resolvePolymorphicRelation(value as PolymorphicValue, {
              populate: nestedPopulate,
            });
            if (resolved) {
              item[key] = resolved;
            }
          }
          // If not populated, leave as is ( { contentType, id } )
        } else if (Array.isArray(value)) {
          /**
           * Case 2: Array of values
           */
          if (value.length > 0 && isPolymorphic(value[0]) && !(value[0] as any).__contentType) {
            // Polymorphic Array
            if (shouldPopulate(key)) {
              const nestedPopulate = getNestedPopulate(key);
              const resolvedItems = await Promise.all(
                value.map((v) =>
                  this.resolvePolymorphicRelation(v as PolymorphicValue, {
                    populate: nestedPopulate,
                  })
                )
              );
              item[key] = resolvedItems.filter((r) => r !== null);
            }
            // If not populated, leave as array of references
          } else {
            // Regular recursion for other arrays (components, etc)
            // If we are traversing regular fields, we need to pass down populate params
            const nestedPopulate = getNestedPopulate(key);

            // Should we recurse if not explicitly populated?
            // Strapi usually populates 1 level deep for components? Or requires explicit?
            // If 'nestedPopulate' is present, we definitely recurse.
            // If it's undefined, and we are at root level (populateParams is *), we recurse.
            // But if we are deep, populateParams might be undefined.

            // To be safe and standard: only recurse if we have instructions.
            if (nestedPopulate || populateParams === '*' || populateParams === true) {
              await Promise.all(
                value.map((v) => this.populatePolymorphicFields(v, undefined, nestedPopulate))
              );
            }
          }
        } else if (value && typeof value === 'object') {
          /**
           * Case 3: Nested Object (Recursion - e.g. Dynamic Zone or Component)
           */
          const nestedPopulate = getNestedPopulate(key);
          /* Only recurse if we have instructions for this field or wildcard */
          if (nestedPopulate || populateParams === '*' || populateParams === true) {
            await this.populatePolymorphicFields(value, undefined, nestedPopulate);
          }
        }
      }
    };

    if (Array.isArray(data)) {
      await Promise.all(data.map((item) => processItem(item)));
    } else {
      await processItem(data);
    }
  },

  /**
   * Get list of available content types for selector
   */
  getAvailableContentTypes(): ContentTypeInfo[] {
    const contentTypes = strapi.contentTypes;
    const availableTypes: ContentTypeInfo[] = [];

    const config = strapi.plugin('polymorphic-relation').config;
    const allowedTypes = (config('allowedTypes') as string[]) || [];
    const ignoredTypes = (config('ignoredTypes') as string[]) || [];

    for (const [uid, contentType] of Object.entries(contentTypes)) {
      const ct = contentType as any;

      /**
       * Check whitelist (if not empty)
       */
      if (allowedTypes.length > 0 && !allowedTypes.includes(uid)) {
        continue;
      }

      /**
       * Check blacklist
       */
      if (ignoredTypes.includes(uid)) {
        continue;
      }

      availableTypes.push({
        uid,
        apiID: ct.apiID || uid.split('.').pop() || uid,
        displayName: ct.info?.displayName || ct.globalId,
        kind: ct.kind,
        visible: ct.visible !== false,
      });
    }

    /**
     * Sort by display name
     */
    return availableTypes.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },

  /**
   * Validate polymorphic field value
   */
  async validatePolymorphicValue(
    value: PolymorphicValue | null,
    allowedTypes: string[] = []
  ): Promise<boolean> {
    /**
     * null/undefined is valid (optional field)
     */
    if (!value) return true;

    /**
     * Check structure
     */
    if (!value.contentType || !value.id) {
      throw new Error('Polymorphic relation must have contentType and id properties');
    }

    /**
     * Check if type is allowed
     */
    if (allowedTypes.length > 0 && !allowedTypes.includes(value.contentType)) {
      throw new Error(
        `Content type "${value.contentType}" is not in allowed types: ${allowedTypes.join(', ')}`
      );
    }

    /**
     * Check if content type exists
     */
    if (!strapi.contentTypes[value.contentType]) {
      throw new Error(`Content type "${value.contentType}" does not exist`);
    }

    /**
     * Check if entity exists
     */
    try {
      const exists = await (strapi.documents as any)(value.contentType).findOne({
        documentId: value.id,
      });

      if (!exists) {
        throw new Error(
          `Entity with id "${value.id}" not found in content type "${value.contentType}"`
        );
      }
    } catch (error: any) {
      throw new Error(`Invalid content type or entity: ${error.message}`);
    }

    return true;
  },

  /**
   * Find identifying reverse relations
   * Finds entities of 'targetModel' where 'targetField' points to { lookupType, lookupId }
   */
  async findReverseRelations(
    targetModel: string,
    targetField: string,
    lookupType: string,
    lookupId: string,
    displayField?: string
  ): Promise<any[]> {
    try {
      // 1. Fetch entries from the target model
      // Optimization TODO: Use DB specific JSON filters if possible.
      // For now, we fetch generic populated data and filter in memory for compatibility.
      // Ideally we should use: strapi.documents(targetModel).findMany({ filters: ... })

      // Switch to Query Engine implementation to avoid validation errors with Custom Fields
      // Dynamically select common display fields ONLY if they exist in the model schema
      const model = strapi.contentTypes[targetModel];
      const attributes = model?.attributes || {};

      const fieldsToSelect = ['id', 'documentId', targetField];

      // If user configured a specific display field and it exists, use it.
      if (displayField && attributes[displayField]) {
        fieldsToSelect.push(displayField);
      }

      const entries = await strapi.db.query(targetModel).findMany({
        select: fieldsToSelect,
        limit: 1000,
      });

      if (!entries) {
        return [];
      }

      // 2. Filter entries where targetField contains our polymorphic pointer
      const results = entries.filter((entry: any) => {
        const val = entry[targetField];
        if (!val) return false;

        let isMatch = false;

        const checkItem = (item: any) => {
          // Loose comparison for ID (string vs number)
          // And ignore locale part of ID if present? No, assume documentId checks match.
          // But wait, if documentId is used, it should be exact.
          return item?.contentType === lookupType && String(item?.id) === String(lookupId);
        };

        // Check if array (Has Many)
        if (Array.isArray(val)) {
          isMatch = val.some((item: any) => checkItem(item));
        }

        // Check if single object (Has One)
        else if (typeof val === 'object') {
          isMatch = checkItem(val);
        }

        // Check if stored as string (JSON stringified)
        else if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              isMatch = parsed.some((item: any) => checkItem(item));
            } else {
              isMatch = checkItem(parsed);
            }
          } catch (e) {
            // Not JSON
          }
        }

        if (isMatch) {
          // Match found
        }
        return isMatch;
      });

      // 3. Deduplicate by documentId to handle Draft/Publish versions
      const uniqueResults = filterByDocumentId(results);

      return uniqueResults;
    } catch (error) {
      strapi.log.error(`Error finding reverse relations: ${error}`);
      return [];
    }
  },
});

/**
 * Helper to deduplicate entities by documentId
 */
function filterByDocumentId(entities: any[]): any[] {
  const seen = new Set();
  return entities.filter((entity) => {
    if (!entity.documentId) return true; // Keep entities without documentId (fallback)
    if (seen.has(entity.documentId)) return false;
    seen.add(entity.documentId);
    return true;
  });
}

export default polymorphicService;

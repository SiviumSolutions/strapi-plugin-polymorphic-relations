import type { Core } from '@strapi/strapi';

/**
 * Polymorphic field value stored in database
 */
export interface PolymorphicValue {
  contentType: string;
  id: string;
}

/**
 * Resolved polymorphic value with full entity data
 */
export interface ResolvedPolymorphicValue extends Record<string, any> {
  __contentType: string;
  id: number;
  documentId: string;
}

/**
 * Content type information
 */
export interface ContentTypeInfo {
  uid: string;
  apiID: string;
  displayName: string;
  kind: 'singleType' | 'collectionType';
  visible: boolean;
}

/**
 * Options for resolving polymorphic relations
 */
export interface ResolveOptions {
  populate?: any;
  filters?: any;
  [key: string]: any;
}

/**
 * Polymorphic service interface
 */
export interface PolymorphicService {
  resolvePolymorphicRelation(
    fieldValue: PolymorphicValue | null,
    options?: ResolveOptions
  ): Promise<ResolvedPolymorphicValue | null>;

  populatePolymorphicFields(data: any, modelUID?: string, populateParams?: any): Promise<void>;

  getAvailableContentTypes(): ContentTypeInfo[];

  validatePolymorphicValue(
    value: PolymorphicValue | null,
    allowedTypes?: string[]
  ): Promise<boolean>;

  findReverseRelations(
    targetModel: string,
    targetField: string,
    lookupType: string,
    lookupId: string,
    displayField?: string
  ): Promise<any[]>;
}

export type ExtendedStrapi = Core.Strapi;

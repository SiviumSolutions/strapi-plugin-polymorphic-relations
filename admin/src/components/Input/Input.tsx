import React, { forwardRef, useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Combobox, ComboboxOption, Field, Flex, Typography } from '@strapi/design-system';
import { FieldValue, InputProps, useFetchClient } from '@strapi/strapi/admin';
import { getTranslation } from '../../utils/getTranslation';

interface ContentTypeInfo {
  uid: string;
  apiID: string;
  displayName: string;
  kind: 'singleType' | 'collectionType';
  visible: boolean;
}

interface Entity {
  id: number;
  documentId: string;
  [key: string]: any;
}

interface PolymorphicValue {
  contentType: string;
  id: string;
  label?: string;
}

type TProps = InputProps &
  FieldValue & {
    attribute?: {
      type: string;
      options?: {
        allowedTypes?: string | string[];
        displayField?: string;
        relationType?: 'one' | 'many';
      };
    };
  };

const Input = forwardRef<HTMLInputElement, TProps>((props, forwardedRef) => {
  const {
    disabled = false,
    name,
    required = false,
    error,
    hint,
    label,
    labelAction,
    value,
    onChange,
    attribute,
  } = props;

  const { formatMessage } = useIntl();
  const { get } = useFetchClient();

  const [contentTypes, setContentTypes] = useState<ContentTypeInfo[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);

  /* Parsing logic */
  const parseValue = (val: any): PolymorphicValue | PolymorphicValue[] | null => {
    if (!val) return null;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return parsed;
    } catch (e) {
      return null;
    }
  };

  const parsedValue = parseValue(value);
  const relationType = attribute?.options?.relationType || 'one';
  const isMany = relationType === 'many';

  // State for "Add New" (used in Many mode) or "Current Selection" (used in One mode)
  const [activeContentType, setActiveContentType] = useState<string | null>(
    !isMany && parsedValue && !Array.isArray(parsedValue)
      ? (parsedValue as PolymorphicValue).contentType
      : null
  );
  const [activeEntityId, setActiveEntityId] = useState<string | null>(
    !isMany && parsedValue && !Array.isArray(parsedValue)
      ? (parsedValue as PolymorphicValue).id
      : null
  );

  /**
   * Fetch available content types on mount
   */
  useEffect(() => {
    const fetchContentTypes = async () => {
      setLoadingTypes(true);
      try {
        const { data } = await get('/polymorphic-relation/content-types');

        let types = data.data;
        let allowedTypes: string[] = [];
        const rawAllowedTypes = attribute?.options?.allowedTypes;

        if (typeof rawAllowedTypes === 'string') {
          allowedTypes = rawAllowedTypes
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean);
        } else if (Array.isArray(rawAllowedTypes)) {
          allowedTypes = rawAllowedTypes;
        }

        if (allowedTypes.length > 0) {
          types = types.filter((t: ContentTypeInfo) => allowedTypes.includes(t.uid));
        }

        setContentTypes(types);
      } catch (error) {
        console.error('Error fetching content types:', error);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchContentTypes();
  }, [get, attribute?.options?.allowedTypes]);

  /**
   * Fetch entities when content type changes
   */
  useEffect(() => {
    if (!activeContentType) {
      setEntities([]);
      return;
    }

    const fetchEntities = async () => {
      setLoadingEntities(true);
      try {
        const { data } = await get(
          `/polymorphic-relation/content-types/${activeContentType}/entities`,
          {
            params: {
              pageSize: 100,
            },
          }
        );

        setEntities(data.data || []);
      } catch (error) {
        console.error('Error fetching entities:', error);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [activeContentType, get]);

  /**
   * Emmit change
   */
  const emitChange = (newValue: any) => {
    if (!newValue) {
      onChange({ target: { name, value: null } } as any);
      return;
    }
    onChange({
      target: {
        name,
        value: JSON.stringify(newValue),
      },
    } as any);
  };

  /**
   * Get entity label (helper)
   */
  const getEntityLabel = (entity: Entity) => {
    const displayField = attribute?.options?.displayField || 'id'; // default to id if displayField not set
    // Check if displayField exists in entity, otherwise fallback to known fields
    const label =
      entity[displayField] ||
      entity.title ||
      entity.name ||
      entity.label ||
      entity.documentId ||
      entity.id;
    return String(label);
  };

  /**
   * Handle adding an item (Many mode) or selecting (Single mode)
   */
  const handleEntitySelect = (entityId: string | null | undefined) => {
    if (!activeContentType || !entityId) return;

    // Find the entity object to get its label
    const selectedEntity = entities.find((e) => String(e.documentId || e.id) === entityId);
    const label = selectedEntity ? getEntityLabel(selectedEntity) : undefined;

    const newItem: PolymorphicValue = {
      contentType: activeContentType,
      id: entityId,
      label,
    };

    if (isMany) {
      const currentList: PolymorphicValue[] = Array.isArray(parsedValue) ? parsedValue : [];
      // Prevent duplicates
      const exists = currentList.find(
        (item) => item.contentType === newItem.contentType && item.id === newItem.id
      );
      if (!exists) {
        emitChange([...currentList, newItem]);
      }
      // Reset selection
      setActiveEntityId(null);
      // Optional: reset content type or keep it? Let's keep it for faster inputs
    } else {
      setActiveEntityId(entityId);
      emitChange(newItem);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (!isMany || !Array.isArray(parsedValue)) return;
    const newList = [...parsedValue];
    newList.splice(index, 1);
    emitChange(newList);
  };

  /**
   * Handle content type change
   */
  const handleContentTypeChange = (newType: string) => {
    setActiveContentType(newType);
    setActiveEntityId(null);
    if (!isMany) {
      // In single mode, clearing the type also clears the value
      if (!newType) emitChange(null);
    }
  };

  // Calculate available entities for filtering
  const availableEntities = entities.filter((entity) => {
    if (!isMany) return true;
    const currentList: PolymorphicValue[] = Array.isArray(parsedValue) ? parsedValue : [];
    // Filter out if already selected with same content type
    return !currentList.some(
      (item) =>
        item.contentType === activeContentType && item.id === String(entity.documentId || entity.id)
    );
  });

  const hasEntities = entities.length > 0;
  const allSelected = hasEntities && availableEntities.length === 0;

  return (
    <Field.Root name={name} id={name} error={error} hint={hint} required={required}>
      <Flex direction="column" alignItems="stretch" gap={4}>
        <Field.Label action={labelAction}>
          <Typography variant="pi" fontWeight="bold">
            {label}
          </Typography>
        </Field.Label>

        {/* Selection Area */}
        <Flex gap={2} direction="column" alignItems="stretch">
          {isMany && (
            <Typography variant="pi" fontWeight="bold" textColor="neutral600">
              Add new relation:
            </Typography>
          )}

          <Flex gap={2} alignItems="stretch">
            {/* Content Type Selector */}
            <div style={{ flex: 1 }}>
              <Combobox
                aria-label={formatMessage({
                  id: getTranslation('field.contentType.placeholder'),
                  defaultMessage: 'Select a content type',
                })}
                disabled={disabled || loadingTypes}
                value={activeContentType || undefined}
                placeholder={formatMessage({
                  id: getTranslation('field.contentType.placeholder'),
                  defaultMessage: 'Select Type',
                })}
                onChange={handleContentTypeChange}
                autocomplete={{ type: 'list', filter: 'contains' }}
              >
                {contentTypes.map((type) => (
                  <ComboboxOption key={type.uid} value={type.uid} textValue={type.displayName}>
                    <Typography>{type.displayName}</Typography>
                  </ComboboxOption>
                ))}
              </Combobox>
            </div>

            {/* Entity Selector */}
            <div style={{ flex: 1 }}>
              <Combobox
                aria-label={formatMessage({
                  id: getTranslation('field.entity.placeholder'),
                  defaultMessage: 'Select an entity',
                })}
                disabled={
                  disabled || loadingEntities || allSelected || !hasEntities || !activeContentType
                }
                value={activeEntityId || ''}
                placeholder={
                  !activeContentType
                    ? formatMessage({
                        id: getTranslation('field.entity.placeholder'),
                        defaultMessage: 'Select Entity',
                      })
                    : loadingEntities
                      ? 'Loading...'
                      : !hasEntities
                        ? 'No entities found'
                        : allSelected
                          ? 'All entities selected'
                          : formatMessage({
                              id: getTranslation('field.entity.placeholder'),
                              defaultMessage: 'Select Entity',
                            })
                }
                onChange={handleEntitySelect}
                autocomplete={{ type: 'list', filter: 'contains' }}
              >
                {availableEntities.map((entity) => (
                  <ComboboxOption
                    key={entity.documentId || entity.id}
                    value={String(entity.documentId || entity.id)}
                    textValue={getEntityLabel(entity)}
                  >
                    <Typography>{getEntityLabel(entity)}</Typography>
                  </ComboboxOption>
                ))}
              </Combobox>
            </div>
          </Flex>
        </Flex>

        {/* List of items (Only for Many mode) - Placed BELOW selection area */}
        {isMany && Array.isArray(parsedValue) && parsedValue.length > 0 && (
          <Flex direction="column" gap={2} alignItems="stretch" style={{ marginTop: '8px' }}>
            <Typography variant="pi" fontWeight="bold" textColor="neutral600">
              Selected Relations:
            </Typography>
            {parsedValue.map((item, idx) => {
              const typeInfo = contentTypes.find((t) => t.uid === item.contentType);
              const displayName = typeInfo?.displayName || item.contentType;
              // Use cached label OR try to find in current list OR fallback to ID
              const entityLabel =
                item.label ||
                (entities.find(
                  (e) =>
                    String(e.documentId || e.id) === item.id &&
                    activeContentType === item.contentType
                )
                  ? getEntityLabel(entities.find((e) => String(e.documentId || e.id) === item.id)!)
                  : `ID: ${item.id}`);

              return (
                <Flex
                  key={idx}
                  justifyContent="space-between"
                  alignItems="center"
                  background="neutral0"
                  borderColor="neutral200"
                  borderWidth="1px"
                  borderStyle="solid"
                  hasRadius
                  padding={3}
                  shadow="tableShadow"
                >
                  <Flex gap={3} alignItems="center">
                    <Flex
                      background="primary100"
                      paddingLeft={2}
                      paddingRight={2}
                      paddingTop={1}
                      paddingBottom={1}
                      hasRadius
                    >
                      <Typography
                        variant="sigma"
                        textColor="primary600"
                        fontWeight="bold"
                        textTransform="uppercase"
                      >
                        {displayName}
                      </Typography>
                    </Flex>
                    <Typography variant="omega" fontWeight="semiBold">
                      {entityLabel}
                    </Typography>
                  </Flex>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    style={{
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                      padding: '4px',
                    }}
                    aria-label="Remove"
                  >
                    <Typography variant="pi" textColor="danger600" fontWeight="bold">
                      Remove
                    </Typography>
                  </button>
                </Flex>
              );
            })}
          </Flex>
        )}

        {/* Single Mode Selected Display */}
        {!isMany && activeContentType && activeEntityId && (
          <Typography variant="pi" textColor="neutral600">
            {/* Combobox handles display, this is just extra info if needed */}
          </Typography>
        )}

        <Field.Hint />
        <Field.Error />
      </Flex>
    </Field.Root>
  );
});

Input.displayName = 'PolymorphicRelationInput';

export default Input;

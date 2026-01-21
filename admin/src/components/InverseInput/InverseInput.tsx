import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Field, Flex, Typography, Loader, Box } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';

interface InverseInputProps {
  name: string;
  attribute: {
    options?: {
      targetModel?: string;
      targetField?: string;
      targetDisplayField?: string;
      label?: string;
    };
  };
}

const InverseInput = ({ name, attribute }: InverseInputProps) => {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const { pathname } = useLocation(); // Use location to parse ID and UID

  // Parse context from URL
  // Format: /content-manager/collection-types/:uid/:documentId
  // or /content-manager/single-types/:uid
  const parts = pathname.split('/');
  const isSingleType = parts.includes('single-types');
  const collectionTypeIndex = parts.indexOf('collection-types');
  const singleTypeIndex = parts.indexOf('single-types');

  const uidIndex = isSingleType ? singleTypeIndex + 1 : collectionTypeIndex + 1;
  const currentUid = parts[uidIndex];
  // For collection types, ID is usually after UID. For single types, ID is not needed (it's the type itself).
  // But wait, Single Types essentially have 1 ID.
  const currentId = isSingleType ? undefined : parts[uidIndex + 1];

  const isCreatingEntry = currentId === 'create' || !currentId;

  const [relations, setRelations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetModel = attribute?.options?.targetModel;
  const targetField = attribute?.options?.targetField;

  useEffect(() => {
    // If creating, we don't have an ID yet
    if (isCreatingEntry) return;
    if (!targetModel || !targetField || !currentUid) return;

    const fetchRelations = async () => {
      setLoading(true);
      try {
        const { data } = await get('/polymorphic-relation/reverse-relations', {
          params: {
            targetModel,
            targetField,
            displayField: attribute?.options?.targetDisplayField, // Pass configured display field
            lookupType: currentUid,
            lookupId: currentId,
          },
        });
        setRelations(data.data || []);
      } catch (err: any) {
        console.error('Failed to fetch reverse relations', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRelations();
  }, [get, targetModel, targetField, currentUid, currentId, isCreatingEntry]);

  if (!targetModel || !targetField) {
    return (
      <Box padding={4} background="neutral100" hasRadius>
        <Typography variant="pi" textColor="neutral600">
          Inverse Polymorphic Relation: Missing configuration (Target Model or Field).
        </Typography>
      </Box>
    );
  }

  return (
    <Field.Root name={name}>
      <Flex direction="column" alignItems="stretch" gap={2}>
        <Field.Label>
          <Typography variant="pi" fontWeight="bold">
            {attribute?.options?.label ||
              formatMessage({ id: 'inverse.label', defaultMessage: 'Incoming Relations' })}
          </Typography>
        </Field.Label>

        {isCreatingEntry ? (
          <Typography variant="pi" textColor="neutral600">
            {formatMessage({
              id: 'inverse.create',
              defaultMessage: 'Save this entry to view related items.',
            })}
          </Typography>
        ) : loading ? (
          <Flex justifyContent="center" padding={4}>
            <Loader small>Loading relations...</Loader>
          </Flex>
        ) : error ? (
          <Typography variant="pi" textColor="danger600">
            Error loading relations.
          </Typography>
        ) : relations.length === 0 ? (
          <Typography variant="pi" textColor="neutral600">
            {formatMessage({
              id: 'inverse.noRelations',
              defaultMessage: 'No related items found.',
            })}
          </Typography>
        ) : (
          <Flex direction="column" gap={2} alignItems="stretch">
            {relations.map((item, idx) => {
              // Extract a readable name from targetModel or item
              // item doesn't have contentType info usually in this query, but we know it's targetModel
              const typeName = targetModel
                ? targetModel.split('.').pop() || targetModel
                : 'Relation';
              const displayName = typeName.charAt(0).toUpperCase() + typeName.slice(1);

              const label =
                item.title ||
                item.name ||
                item.label ||
                item.subject ||
                item.heading ||
                item.code ||
                item.slug ||
                `ID: ${item.documentId || item.id}`;

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
                      {label}
                    </Typography>
                  </Flex>
                  {/* Link button could be added here if we can construct the URL */}
                </Flex>
              );
            })}
          </Flex>
        )}
      </Flex>
    </Field.Root>
  );
};

InverseInput.displayName = 'PolymorphicRelationInverseInput';
export default InverseInput;

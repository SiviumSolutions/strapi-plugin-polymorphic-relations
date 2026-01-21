import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { MultiSelect, MultiSelectOption, Field, Typography, Loader } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';

interface ContentTypeInfo {
  uid: string;
  displayName: string;
}

interface ContentTypeSelectProps {
  value: string[]; // It might come as array if we configured it right, or we handle string/array conversion
  onChange: any; // Strapi handler expects event
  name: string;
  intlLabel: any;
  disabled?: boolean;
  required?: boolean;
}

const ContentTypeSelect = ({
  value,
  onChange,
  name,
  intlLabel,
  disabled,
  required,
}: ContentTypeSelectProps) => {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const [contentTypes, setContentTypes] = useState<ContentTypeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchContentTypes = async () => {
      setIsLoading(true);
      try {
        const { data } = await get('/polymorphic-relation/content-types');
        setContentTypes(data.data || []);
      } catch (error) {
        console.error('Error fetching content types:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentTypes();
  }, [get]);

  // Ensure value is always an array
  const formattedValue = Array.isArray(value)
    ? value
    : value
      ? String(value).split(',').filter(Boolean)
      : [];

  const handleChange = (newValue: string[]) => {
    // Return event object strictly required for Strapi forms
    onChange({
      target: {
        name,
        value: newValue,
      },
    });
  };

  return (
    <Field.Root name={name} id={name} required={required}>
      <Field.Label>{formatMessage(intlLabel)}</Field.Label>
      {isLoading ? (
        <Loader small>Loading content types...</Loader>
      ) : (
        <MultiSelect
          name={name}
          onChange={handleChange}
          value={formattedValue}
          placeholder={formatMessage({
            id: 'polymorphic-relation.settings.select-types',
            defaultMessage: 'Select content types',
          })}
          disabled={disabled}
          withTags
        >
          {contentTypes.map((ct) => (
            <MultiSelectOption key={ct.uid} value={ct.uid}>
              {ct.displayName} ({ct.uid})
            </MultiSelectOption>
          ))}
        </MultiSelect>
      )}
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
};

export default ContentTypeSelect;

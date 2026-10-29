import { useEffect, useState } from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  FormGroup,
  MenuToggle,
  Skeleton,
} from '@patternfly/react-core';

import { useCustomerIdsQuery } from 'services/Lightwell/CustomerQueries';

type CustomerIdSelectProps = {
  selectedCustomerId: string | undefined;
  onCustomerIdChange: (customerId: string) => void;
};

export function CustomerIdSelect({
  selectedCustomerId,
  onCustomerIdChange,
}: CustomerIdSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: customerIds, isLoading } = useCustomerIdsQuery();

  useEffect(() => {
    if (!selectedCustomerId && customerIds?.length === 1) {
      onCustomerIdChange(customerIds[0]);
    }
  }, [selectedCustomerId, customerIds, onCustomerIdChange]);

  if (isLoading) {
    return (
      <FormGroup label='Customer ID' fieldId='customer-id-select'>
        <Skeleton height='36px' />
      </FormGroup>
    );
  }

  const items = customerIds ?? [];

  return (
    <FormGroup label='Customer ID' fieldId='customer-id-select'>
      <Dropdown
        id='customer-id-select'
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onSelect={(_, value) => {
          onCustomerIdChange(value as string);
          setIsOpen(false);
        }}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            id='customer-id-select-toggle'
            ouiaId='customer-id-select-toggle'
            onClick={() => setIsOpen((prev) => !prev)}
            isExpanded={isOpen}
            isFullWidth
            isDisabled={items.length === 0}
          >
            {selectedCustomerId ?? 'Select customer ID'}
          </MenuToggle>
        )}
      >
        <DropdownList>
          {items.map((customerId) => (
            <DropdownItem key={customerId} value={customerId}>
              {customerId}
            </DropdownItem>
          ))}
        </DropdownList>
      </Dropdown>
    </FormGroup>
  );
}

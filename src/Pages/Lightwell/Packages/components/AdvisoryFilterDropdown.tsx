import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { useState } from 'react';

type FilterOption = { value: string; label: string };

type AdvisoryFilterDropdownProps = {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  isDisabled?: boolean;
};

const AdvisoryFilterDropdown = ({
  label,
  value,
  options,
  onChange,
  isDisabled = false,
}: AdvisoryFilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? 'All';

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(_event, selectedValue) => {
        onChange(String(selectedValue));
        setIsOpen(false);
      }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          isDisabled={isDisabled}
          aria-label={`${label} filter`}
          isExpanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {label}: {selectedLabel}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {options.map((option) => (
          <DropdownItem key={option.value} value={option.value} isSelected={option.value === value}>
            {option.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};

export default AdvisoryFilterDropdown;

import { Label, Tooltip } from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';
import { useState, type ReactNode } from 'react';

type CopyLabelProps = {
  children: ReactNode;
  copyText: string;
};

const CopyLabel = ({ children, copyText }: CopyLabelProps) => {
  const [copied, setCopied] = useState(false);

  return (
    <Tooltip
      content={copied ? 'Copied' : 'Copy'}
      trigger='mouseenter focus'
      isVisible={copied || undefined}
    >
      <Label
        isCompact
        isClickable
        icon={<CopyIcon />}
        onClick={() => {
          navigator.clipboard.writeText(copyText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {children}
      </Label>
    </Tooltip>
  );
};

export default CopyLabel;

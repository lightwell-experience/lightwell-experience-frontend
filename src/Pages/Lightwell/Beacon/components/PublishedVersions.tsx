import { Label, LabelGroup, Popover } from '@patternfly/react-core';

type PublishedVersionsProps = {
  versions: string[];
};

export function PublishedVersions({ versions }: PublishedVersionsProps) {
  const [firstVersion, ...remainingVersions] = versions;

  if (!firstVersion) return null;

  const overflowLabel =
    remainingVersions.length > 0 ? (
      <Popover
        headerContent='Other published versions'
        elementToFocus='[aria-label="Additional published versions"]'
        bodyContent={
          <LabelGroup
            aria-label='Additional published versions'
            isCompact
            numLabels={remainingVersions.length}
            tabIndex={-1}
          >
            {remainingVersions.map((version) => (
              <Label key={version} isCompact>
                {version}
              </Label>
            ))}
          </LabelGroup>
        }
      >
        <Label
          variant='overflow'
          isCompact
          aria-label={`Show ${remainingVersions.length} more published versions`}
        >
          +{remainingVersions.length} more
        </Label>
      </Popover>
    ) : undefined;

  return (
    <LabelGroup
      aria-label='Published versions'
      isCompact
      numLabels={1}
      addLabelControl={overflowLabel}
    >
      <Label isCompact textMaxWidth='220px'>
        {firstVersion}
      </Label>
    </LabelGroup>
  );
}

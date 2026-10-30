import { Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { cloneElement, ReactElement, useState } from 'react';

import { ContentItem } from 'services/Content/ContentApi';

import { formatRepositoryName } from '../../helpers';
import ConnectRepositoryContent from './ConnectRepositoryContent';

type ConnectRepositoryModalProps = {
  repository: Pick<
    ContentItem,
    'name' | 'published_distribution_url' | 'content_type' | 'uuid' | 'security_level'
  >;
  children: ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
};

const ConnectRepositoryModal = ({ repository, children }: ConnectRepositoryModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const trigger = cloneElement(children, {
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event);
      if (!event.defaultPrevented) {
        openModal();
      }
    },
  });

  return (
    <>
      {trigger}
      <Modal
        variant={ModalVariant.large}
        position='top'
        isOpen={isOpen}
        onClose={closeModal}
        aria-labelledby='lightwell-connect-repository-modal-title'
        ouiaId='lightwell-connect-repository-modal'
      >
        <ModalHeader
          title={`Connect to ${formatRepositoryName(repository.content_type, repository.security_level, repository.name)}`}
          labelId='lightwell-connect-repository-modal-title'
        />
        <ModalBody>
          <ConnectRepositoryContent repository={repository} />
        </ModalBody>
      </Modal>
    </>
  );
};

export default ConnectRepositoryModal;

import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Spinner,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { isEqual } from 'lodash';
import React, { cloneElement, ReactElement, useEffect, useState } from 'react';

import { useSetUserPreferencesMutation } from 'services/Lightwell/UserPreferencesQueries';

import { DEFAULT_LIGHTWELL_NOTIFICATION_PREFS, LightwellNotificationPrefs } from '../../constants';
import { useLightwellNotificationPrefs } from '../hooks/useLightwellNotificationPrefs';
import {
  mapSeveritiesToApi,
  useLightwellRepoNotifications,
} from '../hooks/useLightwellRepoNotifications';
import NotificationPreferencesContent from './NotificationPreferencesContent';
import { useLightwellDemo } from '../../LightwellDemoContext';

type NotificationPreferencesModalProps = {
  children: ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
};

const NotificationPreferencesModal = ({ children }: NotificationPreferencesModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<LightwellNotificationPrefs>(
    DEFAULT_LIGHTWELL_NOTIFICATION_PREFS,
  );

  const isDemo = useLightwellDemo();

  const { prefs, isLoading, isError } = useLightwellNotificationPrefs(isOpen);

  const { mutateAsync, isPending } = useSetUserPreferencesMutation();
  const { syncAllSubscribedSeverities } = useLightwellRepoNotifications(isOpen);

  const storedPreferences = prefs ?? DEFAULT_LIGHTWELL_NOTIFICATION_PREFS;
  const { enabled: storedEnabled, minimumSeverity: storedMinimumSeverity } = storedPreferences;
  const hasNotChanged = isEqual(preferences, storedPreferences);

  const showLoading = isOpen && isLoading;
  const arePreferencesReady = isOpen && !isLoading && !isError;
  const canSave = !hasNotChanged && !isPending && arePreferencesReady;

  useEffect(() => {
    if (!arePreferencesReady) return;
    setPreferences({ enabled: storedEnabled, minimumSeverity: storedMinimumSeverity });
  }, [arePreferencesReady, storedEnabled, storedMinimumSeverity]);

  useEffect(() => {
    if (isOpen && isError) {
      setIsOpen(false);
    }
  }, [isOpen, isError]);

  const openModal = () => {
    setPreferences(storedPreferences);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const trigger = cloneElement(children, {
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event);
      if (!event.defaultPrevented) {
        openModal();
      }
    },
  });

  const handleSave = async () => {
    try {
      await mutateAsync(preferences);
      if (!preferences.enabled && storedEnabled) {
        syncAllSubscribedSeverities([]);
      } else if (preferences.enabled && preferences.minimumSeverity !== storedMinimumSeverity) {
        syncAllSubscribedSeverities(mapSeveritiesToApi(preferences.minimumSeverity));
      }
      closeModal();
    } catch {
      // Error toast is handled by the mutation
    }
  };

  return (
    <>
      {trigger}
      <Modal
        variant={ModalVariant.medium}
        position='top'
        isOpen={isOpen}
        onClose={closeModal}
        aria-labelledby='lightwell-notification-preferences-modal-title'
        ouiaId='lightwell-notification-preferences-modal'
      >
        <ModalHeader
          title='Notification preferences'
          description='Receive email alerts when vulnerability fixes are available for packages across all connected repositories.'
          labelId='lightwell-notification-preferences-modal-title'
        />

        <ModalBody>
          {showLoading ? (
            <Flex justifyContent={{ default: 'justifyContentCenter' }} className={spacing.pXl}>
              <Spinner aria-label='Loading notification preferences' />
            </Flex>
          ) : arePreferencesReady ? (
            <NotificationPreferencesContent
              preferences={preferences}
              onPreferencesChange={setPreferences}
              isReadOnly={isPending || isDemo}
            />
          ) : null}
        </ModalBody>

        <ModalFooter>
          <Button
            key='save'
            variant='primary'
            aria-label='Save'
            ouiaId='lightwell-notification-preferences-save-button'
            onClick={handleSave}
            isDisabled={!canSave}
            isLoading={isPending}
          >
            Save
          </Button>
          <Button
            key='cancel'
            variant='link'
            aria-label='Cancel'
            ouiaId='lightwell-notification-preferences-cancel-button'
            onClick={closeModal}
            isDisabled={isPending}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default NotificationPreferencesModal;

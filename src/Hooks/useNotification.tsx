import { AlertVariant } from '@patternfly/react-core';
import type { PortalNotificationConfig } from '@redhat-cloud-services/frontend-components-notifications/Portal';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications';

export interface NotificationPayload {
  title: React.ReactNode | string;
  variant: AlertVariant;
  description?: React.ReactNode | string;
  id?: string | number;
  dismissable?: boolean;
}

export default function useNotification() {
  const addNotification = useAddNotification();

  const notify = (payload: NotificationPayload) => {
    const v6Payload: PortalNotificationConfig = {
      ...payload,
      id: crypto.randomUUID(),
    };

    return addNotification(v6Payload);
  };

  return { notify };
}

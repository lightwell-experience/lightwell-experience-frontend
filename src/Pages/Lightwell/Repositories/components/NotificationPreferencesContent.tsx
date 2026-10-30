import {
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Radio,
  Switch,
} from '@patternfly/react-core';
import { Severity, SeverityType } from '@patternfly/react-component-groups';
import React, { Dispatch, SetStateAction } from 'react';

import {
  LIGHTWELL_VULNERABILITY_SEVERITY_OPTIONS,
  LightwellNotificationPrefs,
  LightwellNotificationSeverity,
} from '../../constants';

const LIGHTWELL_TO_PF_SEVERITY: Record<LightwellNotificationSeverity, SeverityType> = {
  critical: SeverityType.critical,
  high: SeverityType.important,
  medium: SeverityType.moderate,
  low: SeverityType.minor,
};

type NotificationPreferencesContentProps = {
  preferences: LightwellNotificationPrefs;
  onPreferencesChange: Dispatch<SetStateAction<LightwellNotificationPrefs>>;
  isReadOnly?: boolean;
};

const NotificationPreferencesContent = ({
  preferences,
  onPreferencesChange,
  isReadOnly = false,
}: NotificationPreferencesContentProps) => {
  const { enabled, minimumSeverity } = preferences;

  const handleNotificationToggle = (_event: React.FormEvent, checked: boolean) =>
    onPreferencesChange((prev) => ({ ...prev, enabled: checked }));

  const handleSeverityChange = (value: LightwellNotificationSeverity) =>
    onPreferencesChange((prev) => ({ ...prev, minimumSeverity: value }));

  return (
    <Form>
      <FormGroup fieldId='lightwell-notification-enabled-switch' label='Email notifications'>
        <Switch
          id='lightwell-notification-enabled-switch'
          name='lightwell-notification-enabled-switch'
          aria-label='Email notifications'
          ouiaId={`lightwell-notification-enabled-switch-${enabled ? 'on' : 'off'}`}
          isChecked={enabled}
          isDisabled={isReadOnly}
          onChange={handleNotificationToggle}
        />
      </FormGroup>

      {enabled ? (
        <FormGroup
          fieldId='lightwell-notification-severity'
          label='Severity threshold'
          role='radiogroup'
        >
          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                Which severity levels do you want to receive notifications for?
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
          {LIGHTWELL_VULNERABILITY_SEVERITY_OPTIONS.map((option) => (
            <Radio
              key={option.value}
              id={`lightwell-notification-severity-${option.value}`}
              name='lightwell-notification-severity'
              ouiaId={`lightwell-notification-severity-${option.value}`}
              isChecked={minimumSeverity === option.value}
              isDisabled={isReadOnly}
              onChange={() => handleSeverityChange(option.value)}
              label={
                <Severity
                  severity={LIGHTWELL_TO_PF_SEVERITY[option.value]}
                  label={option.label}
                  ouiaId={`lightwell-notification-severity-icon-${option.value}`}
                />
              }
            />
          ))}
        </FormGroup>
      ) : null}
    </Form>
  );
};

export default NotificationPreferencesContent;

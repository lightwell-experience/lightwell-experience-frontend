import { Content, Title } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

import { getLwMetricsCountDefaults, mergeClassNames } from 'kit/components/components.config';
import { LwSkeleton, LwTooltip } from 'kit/components/primitives';
import { lightwellConfig, type LwStepIconColorKey } from 'kit/lightwell.config';
import './metrics-count.css';

type LwMetricsCountContentProps =
  | {
      /** Renders matched-size skeletons instead of `value`/`label`. */
      isLoading: true;
      value?: ReactNode;
      label?: ReactNode;
      /** Screen-reader text for the loading skeleton. */
      loadingScreenReaderText?: string;
    }
  | {
      isLoading?: false;
      /** Prominent metric value. */
      value: ReactNode;
      /** Caption (under value in column; beside in row). */
      label: ReactNode;
      loadingScreenReaderText?: string;
    };

type LwMetricsCountOwnedProps = LwMetricsCountContentProps & {
  /**
   * Status bar fill from `lightwellConfig.colors.stepIcon`
   * (includes match-status keys + stubs).
   */
  color?: LwStepIconColorKey;
  /** Tooltip on the label help icon. */
  tooltip?: ReactNode;
  /** Stack orientation. Default `column`. */
  direction?: 'column' | 'row';
};

/** Owned slots + div host passthrough. */
export type LwMetricsCountProps = LwMetricsCountOwnedProps &
  Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/**
 * Kit **assembly** — one metric count cell.
 * Layout host = plain `div`; flex direction / alignment in CSS.
 * Value = PF `Title`. Status signal = chromatic bar (`color`), not value paint.
 */
export function LwMetricsCount({
  value,
  label,
  color,
  tooltip,
  direction: directionProp,
  isLoading,
  loadingScreenReaderText,
  className,
  style,
  ...rest
}: LwMetricsCountProps) {
  const defaults = getLwMetricsCountDefaults();
  const direction = directionProp ?? defaults.direction ?? 'column';
  const isColumn = direction === 'column';
  const colorKey = color ?? defaults.color;
  const colorToken = colorKey != null ? lightwellConfig.colors.stepIcon[colorKey] : undefined;

  return (
    <div
      {...rest}
      className={mergeClassNames(
        'lw-c-metrics-count',
        isColumn ? 'lw-m-column' : 'lw-m-row',
        colorToken != null && !isLoading ? 'lw-m-has-bar' : undefined,
        className,
      )}
      style={
        colorToken != null
          ? ({ '--lw-metrics-count-bar-color': colorToken, ...style } as CSSProperties)
          : style
      }
    >
      {isLoading ? (
        <LwSkeleton fontSize='3xl' width='4ch' screenreaderText={loadingScreenReaderText} />
      ) : (
        <Title headingLevel='h4' size='3xl' className='lw-c-metrics-count__value'>
          {value}
        </Title>
      )}
      {colorToken != null && !isLoading && (
        <span className='lw-c-metrics-count__bar' aria-hidden='true' />
      )}
      {isLoading ? (
        <LwSkeleton fontSize='sm' width='5ch' />
      ) : (
        <Content component='small' className='lw-c-metrics-count__label'>
          {label}
          {tooltip != null && (
            <LwTooltip content={tooltip} position='bottom'>
              <span className='lw-c-metrics-count__help' tabIndex={0}>
                <OutlinedQuestionCircleIcon />
              </span>
            </LwTooltip>
          )}
        </Content>
      )}
    </div>
  );
}

export default LwMetricsCount;

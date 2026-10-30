import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import {
  LwButtonGroup,
  LwMetricsCard,
  LwMetricsCount,
  LwMetricsCountSlots,
  LwMetricsDonutChart,
  LwMetricsStackChart,
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlots,
  PageTitleStack,
  type LwMetricsStackSeries,
} from 'kit/components/assemblies';
import {
  Alert,
  CardBody,
  Content,
  Flex,
  PageSection,
  Title,
  Truncate,
} from '@patternfly/react-core';
import { PlusIcon } from '@patternfly/react-icons';
import text from '@patternfly/react-styles/css/utilities/Text/text';
import PackageCoverageTable from './components/PackageCoverageTable';
import CveFixesBlock from './components/CveFixesBlock';
import ManifestFormatPopover from './components/ManifestFormatPopover';
import { fetchAllCoveragePackages } from './components/ExportMenu';
import { buildCoveragePdfPayload } from './pdf/coveragePdf';
import { useCoverageReport } from './hooks/useCoverageReport';
import { usePackageCoverageTable } from './hooks/usePackageCoverageTable';
import Loader from 'components/Loader';
import LightwellNotFound from '../components/LightwellNotFound';
import type { EcosystemInfo } from './utils/ecosystem';
import { getTotalCveCount } from './utils/cveSeverity';
import { useLightwellRootPath } from '../../../Hooks/Lightwell/navigation/useLightwellRootPath';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import type { PDFRequestPayload } from '@redhat-cloud-services/types';
import useNotification from 'Hooks/useNotification';
import useErrorNotification from 'Hooks/useErrorNotification';
import {
  PDF_GENERATING_NOTIFICATION,
  PDF_READY_NOTIFICATION,
  exportToCsv,
  exportToJson,
  type ExportFormat,
} from '../utils/exportUtils';
import { LwButton, LwCard, LwMenu, LwTitle } from 'kit/components/primitives';
import { useContainerWidth } from '../hooks/useContainerWidth';
import {
  COVERAGE_DONUT_WIDTH,
  getDonutData,
  getDonutLabel,
  getMatchedPackagePercentage,
  getMatchDonutChartHeight,
} from './charts/matchDonutModel';
import { ECOSYSTEM_CHART_MIN_WIDTH } from './charts/chartTheme';
import {
  getEcosystemBarChartHeight,
  getEcosystemChartA11yTable,
  getEcosystemChartModel,
} from './charts/ecosystemBarModel';

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

const CoverageReport = () => {
  const { reportUUID } = useParams();
  const { filename, report, isLoading, isError, error, startOver } = useCoverageReport(reportUUID);
  const rootPath = useLightwellRootPath();
  const appBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const breadcrumbs = useMemo(
    () => [{ pathname: `${rootPath}/lens`, title: 'Lightwell Lens' }],
    [rootPath],
  );

  useRemoteHook({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: appBreadcrumbsEnabled ? [breadcrumbs, DROP_LAST_CHROME_SEGMENT_OPTIONS] : [[]],
  });

  const { containerRef: donutContainerRef, width: donutWidth } =
    useContainerWidth(COVERAGE_DONUT_WIDTH);
  const { containerRef: stackContainerRef, width: stackWidth } =
    useContainerWidth(ECOSYSTEM_CHART_MIN_WIDTH);

  const ecosystems: EcosystemInfo[] = useMemo(
    () =>
      report?.ecosystem_coverage_summary.map(({ ecosystem, supported }) => ({
        name: ecosystem,
        supported,
      })) ?? [],
    [report],
  );

  // Lifted so the export reuses whatever filters the table currently has applied.
  const table = usePackageCoverageTable(ecosystems);

  const [isExporting, setIsExporting] = useState(false);
  const { notify } = useNotification();
  const errorNotifier = useErrorNotification();
  const { requestPdf } = useChrome();

  const percentage = report ? getMatchedPackagePercentage(report) : 0;
  const donutData = useMemo(() => (report ? getDonutData(report) : []), [report]);
  const stackModel = useMemo(() => (report ? getEcosystemChartModel(report) : null), [report]);

  const matchCountItems = useMemo(() => {
    if (!report) return [];
    return [
      <LwMetricsCount
        key='exact'
        value={report.exact_matches}
        label='Exact match'
        tooltip='Package name and version found in the catalog.'
        color='exact'
      />,
      <LwMetricsCount
        key='partial'
        value={report.partial_matches}
        label='Partial match'
        tooltip="Package name found in the catalog, but not the specific version you're running."
        color='partial'
      />,
      <LwMetricsCount
        key='none'
        value={report.unmatched}
        label='No match'
        tooltip='Package not found in the catalog or belongs to an unsupported ecosystem. No match packages are automatically logged for future consideration.'
        color='none'
      />,
    ];
  }, [report]);

  const stackSeries: LwMetricsStackSeries[] = useMemo(() => {
    if (!stackModel) return [];
    return [
      { id: 'exact', label: 'Exact match', data: stackModel.exactPackages },
      { id: 'partial', label: 'Partial match', data: stackModel.partialPackages },
      { id: 'none', label: 'No match', data: stackModel.unmatchedPackages },
    ];
  }, [stackModel]);

  const stackA11yTable = useMemo(() => {
    if (!stackModel) return undefined;
    const a11y = getEcosystemChartA11yTable(stackModel);
    return {
      caption: 'Package matches by ecosystem',
      columns: a11y.columns,
      rows: a11y.rows.map(({ ecosystem, values }) => ({
        rowHeader: ecosystem,
        values,
      })),
    };
  }, [stackModel]);

  if (isLoading) return <Loader />;
  if (isError) throw error;
  if (!report) return <LightwellNotFound />;

  // Drives every CVE surface (summary card, table columns, exports): when the
  // net-delta totals are all zero no package has CVE data worth showing.
  const hasCveData = getTotalCveCount(report.cve_summary) > 0;
  const inCatalog = report.exact_matches + report.partial_matches;
  const skippedEntries = report.skipped_entries ?? 0;

  const handleExport = async (format: ExportFormat) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        notify(PDF_GENERATING_NOTIFICATION);
        const payload = buildCoveragePdfPayload({
          uuid: report.uuid,
          filename,
          filters: table.debouncedFilters,
          includeCveData: hasCveData,
        }) as unknown as PDFRequestPayload;
        await requestPdf({ filename: `lightwell-match-analysis-${report.uuid}.pdf`, payload });
        notify(PDF_READY_NOTIFICATION);
        return;
      }
      const packages = await fetchAllCoveragePackages(report.uuid, table.debouncedFilters);
      const rows = hasCveData
        ? packages
        : packages.map(({ cve_count, cve_range, ...rest }) => {
            void cve_count;
            void cve_range;
            return rest;
          });
      if (format === 'csv') {
        exportToCsv(rows, `lightwell-match-analysis-${report.uuid}.csv`);
      } else {
        exportToJson(rows, `lightwell-match-analysis-${report.uuid}.json`);
      }
    } catch (err) {
      errorNotifier(
        'Error exporting report',
        'Unable to export the match analysis report',
        err,
        'coverage-export-error',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const matchAnalysisTitle = filename ? (
    <Title headingLevel='h1' ouiaId='lightwell-coverage-header'>
      Match analysis for{' '}
      <strong>
        <span
          style={{
            display: 'inline-block',
            maxWidth: '24rem',
            verticalAlign: 'bottom',
          }}
        >
          <Truncate content={filename} position='middle' />
        </span>
      </strong>
    </Title>
  ) : (
    'Match analysis'
  );

  return (
    <>
      <LwPageHeader hero bodyWidth='100%' bodyMaxWidth='100%'>
        <PageChromeSlots>
          <PageChromeSlot>
            <Flex
              gap={{ default: 'gapXl' }}
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignSelf={{ default: 'alignSelfStretch' }}
              style={{ width: '100%' }}
            >
              <PageTitleStack title={matchAnalysisTitle} ouiaId='lightwell-coverage-header' />
              <LwButtonGroup>
                <LwButton
                  variant='secondary'
                  icon={<PlusIcon />}
                  ouiaId='lightwell-new-analysis-button'
                  onClick={startOver}
                >
                  New analysis
                </LwButton>
                <LwMenu
                  label='Export as'
                  busyLabel='Exporting'
                  isBusy={isExporting}
                  isDisabled={!report.uuid}
                  toggleProps={{ variant: 'primary', ouiaId: 'lightwell-coverage-export-toggle' }}
                  popperProps={{ position: 'right' }}
                  items={[
                    {
                      id: 'csv',
                      children: 'CSV',
                      onSelect: () => void handleExport('csv'),
                    },
                    {
                      id: 'json',
                      children: 'JSON',
                      onSelect: () => void handleExport('json'),
                    },
                    {
                      id: 'pdf',
                      children: 'PDF',
                      onSelect: () => void handleExport('pdf'),
                    },
                  ]}
                />
              </LwButtonGroup>
            </Flex>
          </PageChromeSlot>
        </PageChromeSlots>

        <PageChromeSlots>
          <PageChromeSlot style={{ flex: 'none' }}>
            <LwMetricsDonutChart
              data={donutData}
              width={donutWidth}
              height={getMatchDonutChartHeight(donutWidth)}
              title={`${percentage}%`}
              subTitle='packages matched'
              ariaDesc='Match summary donut chart'
              getLabel={getDonutLabel}
              containerRef={donutContainerRef}
            />
          </PageChromeSlot>
          <PageChromeSlot style={{ flex: 1, alignItems: 'start' }}>
            <LwTitle headingLevel='h3' size='2xl'>
              <strong>{percentage}%</strong> of packages match the Lightwell Network catalog
            </LwTitle>
            <Content component='p' className={text.textColorSubtle}>
              Includes packages from every detected ecosystem, even those the catalog does not
              support.
            </Content>
            <Flex
              gap={{ default: 'gapXl' }}
              alignItems={{ default: 'alignItemsFlexStart' }}
              flexWrap={{ default: 'wrap' }}
              style={{ width: '100%' }}
            >
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                <LwTitle headingLevel='h4'>Summary</LwTitle>
                <LwMetricsCard>
                  <LwMetricsCountSlots>{matchCountItems}</LwMetricsCountSlots>
                </LwMetricsCard>
              </Flex>
              {hasCveData ? (
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                  <LwTitle headingLevel='h4'>Fixed CVEs</LwTitle>
                  <CveFixesBlock report={report} />
                </Flex>
              ) : null}
            </Flex>
          </PageChromeSlot>
        </PageChromeSlots>

        <PageChromeSlots>
          <PageChromeSlot>
            <LwTitle headingLevel='h3' size='xl'>
              Packages by ecosystem
            </LwTitle>
            <Content component='p'>
              <strong>{inCatalog}</strong> of <strong>{report.total}</strong> packages found in the
              Lightwell Network catalog.
            </Content>
          </PageChromeSlot>
        </PageChromeSlots>

        <PageChromeSlots>
          <PageChromeSlot style={{ width: '100%' }}>
            <LwMetricsStackChart
              series={stackSeries}
              width={stackWidth}
              height={getEcosystemBarChartHeight(report.ecosystem_coverage_summary.length)}
              containerRef={stackContainerRef}
              a11yTable={stackA11yTable}
            />
          </PageChromeSlot>
        </PageChromeSlots>

        {skippedEntries > 0 && (
          <PageChromeSlots>
            <PageChromeSlot>
              <Alert
                variant='warning'
                isInline
                title={`${skippedEntries} ${skippedEntries === 1 ? 'package' : 'packages'} skipped`}
              >
                <div>
                  {skippedEntries === 1
                    ? "Its entry doesn't match a supported format."
                    : "Their entries don't match a supported format."}{' '}
                  <ManifestFormatPopover label='View supported formats' />
                </div>
              </Alert>
            </PageChromeSlot>
          </PageChromeSlots>
        )}
      </LwPageHeader>

      <PageSection aria-label='Match analysis packages' hasBodyWrapper={false}>
        <LwCard>
          <CardBody>
            <PackageCoverageTable
              uuid={report.uuid}
              ecosystems={ecosystems}
              table={table}
              showCveColumns={hasCveData}
            />
          </CardBody>
        </LwCard>
      </PageSection>
    </>
  );
};

export default CoverageReport;

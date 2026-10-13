import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cognite/aura/components/card';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemDescription,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconRefresh } from '@tabler/icons-react';

import { refKey } from '../domain/cdm';
import { RANGE_LABELS } from '../domain/timeRange';
import { RELATED_LIMIT } from '../services/relatedNodes';
import { isTimeRangeKey, TIME_RANGE_KEYS } from '../state/workspaceState';
import { useTimeSeriesViewModel } from '../viewmodels/useTimeSeriesViewModel';

import { PanelStatus } from './PanelStatus';
import { SeriesChartCard } from './SeriesChartCard';

export function TimeSeriesPanel() {
  const vm = useTimeSeriesViewModel();

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2">
          Time series
          {vm.listStatus === 'success' && (
            <Badge variant="gray">{vm.hasMore ? `${RELATED_LIMIT}+` : vm.series.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Charts end at each series' latest datapoint, not at the current time.</CardDescription>
      </CardHeader>
      <CardContent>
        <PanelStatus status={vm.listStatus} errorMessage={vm.listErrorMessage} onRetry={vm.retryList} />

        {vm.listStatus === 'success' && vm.series.length === 0 && (
          <EmptyState type="no-results">
            <EmptyStateTitle>No time series linked to this asset</EmptyStateTitle>
            <EmptyStateDescription>No sensor data in CDF references this asset.</EmptyStateDescription>
          </EmptyState>
        )}

        {vm.listStatus === 'success' && vm.series.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(220px,1fr)_2fr]">
            <CheckboxGroup aria-label="Time series to plot" className="max-h-96 self-start overflow-y-auto">
              {vm.series.map((series) => (
                <CheckboxItem key={refKey(series.ref)}>
                  <CheckboxItemControl
                    checked={vm.isSelected(series)}
                    disabled={!series.isNumeric}
                    onCheckedChange={() => vm.toggleSeries(series)}
                  />
                  <CheckboxItemLabel>{series.name}</CheckboxItemLabel>
                  <CheckboxItemDescription>
                    {series.isNumeric ? (series.unit ?? 'No unit') : 'Not numeric — cannot be plotted'}
                  </CheckboxItemDescription>
                </CheckboxItem>
              ))}
            </CheckboxGroup>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SegmentedControl
                  value={vm.range}
                  onValueChange={(value) => isTimeRangeKey(value) && vm.setRange(value)}
                >
                  <SegmentedControlList aria-label="Time range" size="small">
                    {TIME_RANGE_KEYS.map((key) => (
                      <SegmentedControlButton key={key} value={key}>
                        {RANGE_LABELS[key]}
                      </SegmentedControlButton>
                    ))}
                  </SegmentedControlList>
                </SegmentedControl>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={vm.refresh}
                  disabled={vm.chartStatus === 'idle' || vm.isRefreshing}
                >
                  <IconRefresh aria-hidden className="size-4" />
                  Refresh
                </Button>
              </div>

              <ChartArea vm={vm} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartArea({ vm }: { vm: ReturnType<typeof useTimeSeriesViewModel> }) {
  if (vm.chartStatus === 'idle') {
    return (
      <EmptyState>
        <EmptyStateTitle>Select a series to plot it</EmptyStateTitle>
        <EmptyStateDescription>Pick one or more numeric series from the list.</EmptyStateDescription>
      </EmptyState>
    );
  }

  if (vm.chartStatus === 'no-data') {
    return (
      <EmptyState type="no-results">
        <EmptyStateTitle>No datapoints</EmptyStateTitle>
        <EmptyStateDescription>The selected series have no datapoints in CDF.</EmptyStateDescription>
      </EmptyState>
    );
  }

  if (vm.chartStatus !== 'success' || !vm.window) {
    return <PanelStatus status={vm.chartStatus} errorMessage={vm.chartErrorMessage} onRetry={vm.refresh} />;
  }

  const window = vm.window;
  return (
    <div className="flex flex-col gap-4">
      {vm.charts.map((chart) => (
        <SeriesChartCard key={refKey(chart.series.ref)} chart={chart} range={vm.range} window={window} />
      ))}
    </div>
  );
}

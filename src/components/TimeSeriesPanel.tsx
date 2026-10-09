import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@cognite/aura/chart';
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
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { refKey } from '../domain/cdm';
import { formatAxisTick, formatValue, seriesSummary } from '../domain/seriesFormat';
import { RANGE_LABELS, type TimeWindow } from '../domain/timeRange';
import { formatDateTime } from '../domain/workOrders';
import { RELATED_LIMIT } from '../services/relatedNodes';
import { isTimeRangeKey, TIME_RANGE_KEYS, type TimeRangeKey } from '../state/workspaceState';
import { useTimeSeriesViewModel, type SeriesChart } from '../viewmodels/useTimeSeriesViewModel';

import { PanelStatus } from './PanelStatus';

// One series per chart (small multiples), so a single color and no legend; the title names the series.
const CHART_CONFIG: ChartConfig = { value: { label: 'Average', color: 'var(--chart-fjord-color-1)' } };

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
            <CheckboxGroup aria-label="Time series to plot" className="max-h-96 overflow-y-auto">
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

type SeriesChartCardProps = { chart: SeriesChart; range: TimeRangeKey; window: TimeWindow };

function SeriesChartCard({ chart, range, window }: SeriesChartCardProps) {
  const { series, points, latest } = chart;
  const title = series.unit ? `${series.name} (${series.unit})` : series.name;

  return (
    <section aria-label={title} className="flex flex-col gap-1">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-xs text-muted-foreground">{seriesSummary(points, latest, series.unit)}</p>
      {points.length > 0 && (
        <ChartContainer aria-label={`${series.name} chart`} config={CHART_CONFIG} className="aspect-auto h-48 w-full">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={[window.start, window.end]}
              tickFormatter={(value: number) => formatAxisTick(range, value)}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatValue(value)}
              domain={['auto', 'auto']}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const timestamp = payload[0]?.payload?.timestamp;
                    return typeof timestamp === 'number' ? formatDateTime(new Date(timestamp).toISOString()) : '';
                  }}
                  valueFormatter={(value) => (typeof value === 'number' ? formatValue(value, series.unit) : value)}
                />
              }
            />
            <Line
              dataKey="value"
              type="linear"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      )}
    </section>
  );
}

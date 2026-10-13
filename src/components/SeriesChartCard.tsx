import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@cognite/aura/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { formatAxisTick, formatValue, seriesSummary } from '../domain/seriesFormat';
import type { TimeWindow } from '../domain/timeRange';
import { formatDateTime } from '../domain/workOrders';
import type { TimeRangeKey } from '../state/workspaceState';
import type { SeriesChart } from '../viewmodels/useTimeSeriesViewModel';

// One series per chart (small multiples), so a single color and no legend; the title names the series.
const CHART_CONFIG: ChartConfig = { value: { label: 'Average', color: 'var(--chart-fjord-color-1)' } };

type SeriesChartCardProps = { chart: SeriesChart; range: TimeRangeKey; window: TimeWindow };

export function SeriesChartCard({ chart, range, window }: SeriesChartCardProps) {
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

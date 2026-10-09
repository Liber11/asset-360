import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubLayoutSize } from '../__mocks__/layout';
import { makeProviders, makeServices, makeTimeSeriesService } from '../__mocks__/testProviders';
import type { SeriesInfo, TimeSeriesService } from '../services/TimeSeriesService';

import { TimeSeriesPanel } from './TimeSeriesPanel';

const PRESSURE: SeriesInfo = { ref: { space: 'sp', externalId: 'ts-p' }, name: 'Pressure', unit: 'bar', isNumeric: true };
const STATE: SeriesInfo = { ref: { space: 'sp', externalId: 'ts-s' }, name: 'Run state', isNumeric: false };
const LATEST = Date.UTC(2019, 0, 18, 10);

describe('TimeSeriesPanel', () => {
  beforeEach(() => {
    stubLayoutSize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists series and asks the user to pick one; nothing is plotted by default', async () => {
    renderPanel(service());

    expect(await screen.findByRole('checkbox', { name: /Pressure/ })).not.toBeChecked();
    expect(screen.getByText('bar')).toBeInTheDocument();
    expect(screen.getByText('Select a series to plot it')).toBeInTheDocument();
  });

  it('disables series that cannot be plotted', async () => {
    renderPanel(service());

    expect(await screen.findByRole('checkbox', { name: /Run state/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Not numeric — cannot be plotted')).toBeInTheDocument();
  });

  it('plots a selected series with a text summary', async () => {
    renderPanel(service());

    await userEvent.click(await screen.findByRole('checkbox', { name: /Pressure/ }));

    expect(await screen.findByRole('region', { name: 'Pressure (bar)' })).toBeInTheDocument();
    expect(
      screen.getByText('Latest 4.5 bar on 2019-01-18 10:00 UTC. In this window: min 2 bar, max 4.5 bar.')
    ).toBeInTheDocument();
  });

  it('changes the time range', async () => {
    const ts = service();
    renderPanel(ts, [PRESSURE.ref]);
    await screen.findByRole('region', { name: 'Pressure (bar)' });

    await userEvent.click(screen.getByRole('tab', { name: '1Y' }));

    await waitFor(() => expect(ts.getDatapoints).toHaveBeenLastCalledWith([PRESSURE.ref], expect.anything(), '1d'));
  });

  it('refreshes on demand', async () => {
    const ts = service();
    renderPanel(ts, [PRESSURE.ref]);
    await screen.findByRole('region', { name: 'Pressure (bar)' });

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => expect(ts.getLatest).toHaveBeenCalledTimes(2));
  });

  it('explains when the selected series have no datapoints', async () => {
    renderPanel(service({ getLatest: vi.fn(() => Promise.resolve(new Map())) }), [PRESSURE.ref]);

    expect(await screen.findByText('No datapoints')).toBeInTheDocument();
  });

  it('shows the empty state when the asset has no series', async () => {
    renderPanel(service({ listForAsset: vi.fn(() => Promise.resolve({ items: [], hasMore: false })) }));

    expect(await screen.findByText('No time series linked to this asset')).toBeInTheDocument();
  });

  it('shows the list error state', async () => {
    renderPanel(service({ listForAsset: vi.fn(() => Promise.reject(new Error('boom'))) }));

    expect(await screen.findByText('boom')).toBeInTheDocument();
  });
});

function service(overrides: Partial<TimeSeriesService> = {}): TimeSeriesService {
  return makeTimeSeriesService({
    listForAsset: vi.fn(() => Promise.resolve({ items: [PRESSURE, STATE], hasMore: false })),
    getLatest: vi.fn(() => Promise.resolve(new Map([['sp:ts-p', { timestamp: LATEST, value: 4.5 }]]))),
    getDatapoints: vi.fn(() =>
      Promise.resolve(
        new Map([
          [
            'sp:ts-p',
            [
              { timestamp: LATEST - 3_600_000, value: 2 },
              { timestamp: LATEST, value: 4.5 },
            ],
          ],
        ])
      )
    ),
    ...overrides,
  });
}

function renderPanel(timeSeriesService: TimeSeriesService, selectedSeries: unknown[] = []) {
  const services = makeServices({ timeSeriesService });
  const initialState = JSON.stringify({ selectedAsset: { space: 'sp', externalId: 'pump-101' }, selectedSeries });
  return render(<TimeSeriesPanel />, { wrapper: makeProviders({ services, initialState }) });
}

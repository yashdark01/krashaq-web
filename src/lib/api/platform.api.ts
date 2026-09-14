import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Farm {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
export interface FarmerProfile {
  active_farm_id: string | null;
  locale: string;
  timezone: string;
}
export type RunApprovalStatus =
  'pending' | 'approved' | 'executing' | 'denied' | 'expired' | 'consumed';
export interface RunApproval {
  id: string;
  tool_name: string;
  status: RunApprovalStatus;
  expires_at: string;
  approved_at?: string | null;
  consumed_at?: string | null;
}
export interface RunResumeResponse {
  runId: string;
  threadId: string;
  eventsUrl: string;
}
export interface MarketQuote {
  id: string;
  marketId: string;
  name: string;
  commodity: string;
  variety?: string | null;
  unit: string;
  price: number;
  observedAt: string;
  source: string;
  sourceUrl?: string | null;
  validUntil: string;
  stale: boolean;
  district?: string | null;
  state?: string | null;
}
export interface ReferenceRecord {
  id: string;
  external_id: string;
  title: string;
  summary: string;
  content: {
    dataset?: string;
    states?: string[];
    districts?: string[];
    crops?: string[];
    benefit?: string;
    [key: string]: unknown;
  };
  source_url?: string | null;
  published_at?: string | null;
}
export interface MarketsQuery {
  commodity?: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
}
export interface MarketHistoryQuery {
  marketId: string;
  commodity?: string;
  limit?: number;
}
export interface ReferenceRecordsQuery {
  type?: 'scheme' | 'crop-guidance' | 'reference';
  locale?: 'en' | 'hi';
  limit?: number;
}
export interface AlertRecord {
  id: string;
  message: string;
  created_at: string;
  farm_id?: string;
  hazard?: { hazard?: string; severity?: string; date?: string };
  notification_id?: string | null;
}
export interface AlertPreferences {
  enabled: boolean;
  farmIds: string[];
  crops: string[];
  hazards: string[];
  channels: Array<'push' | 'email' | 'sms'>;
  quietHours: { start: string; end: string; timezone: string } | null;
}
export interface NotificationStatus {
  id: string;
  channel: string;
  status: string;
  attempts: number;
  provider_id?: string | null;
  delivered_at?: string | null;
}

/** Read-only browser cache. Writes use the CSRF-protected mutate() client. */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/',
    credentials: 'same-origin',
    prepareHeaders: (headers) => {
      const token =
        typeof document === 'undefined'
          ? undefined
          : document.cookie
              .split(';')
              .map((value) => value.trim())
              .find((value) => value.startsWith('csrf_token='))
              ?.slice('csrf_token='.length);
      if (token) headers.set('x-csrf-token', decodeURIComponent(token));
      return headers;
    },
  }),
  tagTypes: [
    'Farms',
    'Profile',
    'Session',
    'RunApproval',
    'Markets',
    'ReferenceRecords',
    'Alerts',
    'AlertPreferences',
    'Notifications',
  ],
  endpoints: (build) => ({
    farms: build.query<{ farms: Farm[] }, void>({
      query: () => 'farms',
      providesTags: ['Farms'],
    }),
    profile: build.query<FarmerProfile, void>({
      query: () => 'profile',
      providesTags: ['Profile'],
    }),
    threads: build.query<{ threads: { id: string; domain: string }[] }, void>({
      query: () => 'threads',
    }),
    alerts: build.query<{ alerts: AlertRecord[] }, void>({
      query: () => 'alerts',
      providesTags: ['Alerts'],
    }),
    alertPreferences: build.query<{ preferences: AlertPreferences }, void>({
      query: () => 'alerts/preferences',
      providesTags: ['AlertPreferences'],
    }),
    notification: build.query<NotificationStatus, string>({
      query: (id) => `notifications/${id}`,
      providesTags: (result, error, id) => [{ type: 'Notifications', id }],
    }),
    markets: build.query<{ markets: MarketQuote[] }, MarketsQuery | void>({
      query: (params) => ({ url: 'markets', params: params ?? undefined }),
      providesTags: ['Markets'],
    }),
    marketHistory: build.query<{ history: MarketQuote[] }, MarketHistoryQuery>({
      query: ({ marketId, ...params }) => ({
        url: `markets/${marketId}/history`,
        params,
      }),
    }),
    referenceRecords: build.query<
      { records: ReferenceRecord[] },
      ReferenceRecordsQuery | void
    >({
      query: (params) => ({
        url: 'reference-records',
        params: params ?? undefined,
      }),
      providesTags: ['ReferenceRecords'],
    }),
    runApproval: build.query<RunApproval, string>({
      query: (runId) => `runs/${runId}/approval`,
      providesTags: (result, error, runId) => [
        { type: 'RunApproval', id: runId },
      ],
    }),
    approveRun: build.mutation<
      { approved: boolean; expiresAt: string },
      { runId: string; approvalId: string }
    >({
      query: ({ runId, approvalId }) => ({
        url: `runs/${runId}/approvals/${approvalId}/approve`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (result, error, { runId }) => [
        { type: 'RunApproval', id: runId },
      ],
    }),
    denyRun: build.mutation<
      { denied: boolean },
      { runId: string; approvalId: string }
    >({
      query: ({ runId, approvalId }) => ({
        url: `runs/${runId}/approvals/${approvalId}/deny`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (result, error, { runId }) => [
        { type: 'RunApproval', id: runId },
      ],
    }),
    resumeRun: build.mutation<RunResumeResponse, string>({
      query: (runId) => ({
        url: `runs/${runId}/resume`,
        method: 'POST',
        body: {},
      }),
    }),
  }),
});

export const {
  useFarmsQuery,
  useProfileQuery,
  useThreadsQuery,
  useAlertsQuery,
  useAlertPreferencesQuery,
  useNotificationQuery,
  useMarketsQuery,
  useMarketHistoryQuery,
  useReferenceRecordsQuery,
  useRunApprovalQuery,
  useApproveRunMutation,
  useDenyRunMutation,
  useResumeRunMutation,
} = api;

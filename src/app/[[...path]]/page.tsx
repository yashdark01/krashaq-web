'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Sprout,
  MapPin,
  CloudSun,
  Bell,
  ArrowUpRight,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FarmMap } from '@/components/farm-map';
import {
  api,
  useFarmsQuery,
  useProfileQuery,
  useAlertsQuery,
  useAlertPreferencesQuery,
  useNotificationQuery,
  useMarketsQuery,
  useMarketHistoryQuery,
  useReferenceRecordsQuery,
  type AlertPreferences,
} from '@/lib/api/platform.api';
import { getJson, mutate } from '@/lib/api/http-client';
import {
  clearSelectedFarm,
  selectFarm,
  setLocale,
} from '@/features/ui/ui.slice';
import type { AppDispatch, RootState } from '@/store';
import { KnowledgeWorkspace } from '@/components/knowledge-workspace';
import { AppShell } from '@/components/layout/app-shell';
import { ProfileCard } from '@/features/auth/profile-card';
import { SessionGate } from '@/features/auth/session-gate';
import { AdminUsers } from '@/features/admin/admin-users';
import { ChatWorkspace } from '@/features/chat/chat-workspace';
function Dashboard() {
  const { data } = useFarmsQuery();
  const { data: profile } = useProfileQuery();
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.identity?.role);
  useEffect(() => {
    if (role === 'user' && data?.farms.length === 0)
      router.replace('/onboarding');
  }, [data?.farms.length, role, router]);
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <div className="dashboard-kicker"><span className="eyebrow">A NEW PERSPECTIVE ON YOUR LAND</span><Badge variant="secondary"><span className="status-dot" /> Today</Badge></div>
          <h1>
            Good things grow
            <br />
            from better decisions.
          </h1>
          <p className="muted">
            Your farm, your weather, and a little help with what comes next.
          </p>
        </div>
        <div className="season-mark" aria-hidden="true">
          <Sprout size={72} />
          <span>GROW WITH CONFIDENCE</span>
        </div>
      </div>
      <Card className="hero-card dashboard-hero">
        <CardContent>
          <div>
            <span className="eyebrow">YOUR FARM COMPANION</span>
            <h2>
              Every season brings questions.
              <br />
              Let&apos;s find your answers.
            </h2>
            <p>
              Ask about your farm&apos;s forecast or explore trusted agricultural
              knowledge.
            </p>
            <Button asChild><Link href="/krashaq-ai">Ask Krashaq <ArrowUpRight data-icon="inline-end" /></Link></Button>
          </div>
          <div className="field-art" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <Sprout size={90} />
          </div>
        </CardContent>
      </Card>
      <div className="dashboard-section-heading"><div><span className="eyebrow">YOUR FARM AT A GLANCE</span><h2>Everything important, in one place.</h2></div><Link href="/farms" className="text-link">Manage your farms <ArrowUpRight /></Link></div>
      <div className="cards dashboard-cards">
        <Card className="dashboard-card"><CardHeader><div className="dashboard-card-icon"><MapPin /></div><CardTitle><span>YOUR LAND</span>{data?.farms.length ?? '—'} farms</CardTitle></CardHeader><CardContent><p>Keep your location and crops up to date.</p><Link href="/farms" className="text-link">View farms <ArrowUpRight /></Link></CardContent></Card>
        <Card className="dashboard-card"><CardHeader><div className="dashboard-card-icon"><CloudSun /></div><CardTitle><span>THE DAYS AHEAD</span>Local weather</CardTitle></CardHeader><CardContent><p>{profile?.active_farm_id ? 'Explore the forecast for your selected farm.' : 'Select a farm to see local forecasts.'}</p><Link href="/weather" className="text-link">Open forecast <ArrowUpRight /></Link></CardContent></Card>
        <Card className="dashboard-card"><CardHeader><div className="dashboard-card-icon"><Bell /></div><CardTitle><span>STAY A STEP AHEAD</span>Farm alerts</CardTitle></CardHeader><CardContent><p>Updates relevant to your land and crops.</p><Link href="/alerts" className="text-link">Review alerts <ArrowUpRight /></Link></CardContent></Card>
      </div>
    </>
  );
}
function Onboarding() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const role = useSelector((state: RootState) => state.auth.identity?.role);
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [crop, setCrop] = useState('');
  const [stage, setStage] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (role === 'admin') router.replace('/admin/users');
  }, [role, router]);
  async function complete(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      const farm = await mutate<{ id: string }>('farms', {
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      });
      await mutate(`farms/${farm.id}/select`);
      if (crop && stage)
        await mutate(`farms/${farm.id}/crops`, { crop, stage });
      dispatch(selectFarm(farm.id));
      dispatch(api.util.invalidateTags(['Farms', 'Profile']));
      router.replace('/dashboard');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to save your farm.',
      );
    }
  }
  return (
    <section className="panel form-grid">
      <span className="eyebrow">LET’S SET UP YOUR FARM</span>
      <h1>Start with the land you care for.</h1>
      <p className="muted">
        Add your first farm and we’ll tailor weather, alerts, and guidance to
        it. Crop details are optional.
      </p>
      <form className="form-grid" onSubmit={complete}>
        <label>
          Farm name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Green Valley Farm"
          />
        </label>
        <label>
          Latitude
          <input
            required
            type="number"
            min="-90"
            max="90"
            step="any"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            placeholder="20.5937"
          />
        </label>
        <label>
          Longitude
          <input
            required
            type="number"
            min="-180"
            max="180"
            step="any"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            placeholder="78.9629"
          />
        </label>
        <label>
          First crop <span className="muted">(optional)</span>
          <input
            value={crop}
            onChange={(event) => setCrop(event.target.value)}
            placeholder="e.g. Cotton"
          />
        </label>
        <label>
          Growth stage <span className="muted">(optional)</span>
          <input
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            placeholder="e.g. Vegetative"
          />
        </label>
        {message && (
          <p className="error" role="alert">
            {message}
          </p>
        )}
        <Button>Finish setup</Button>
      </form>
    </section>
  );
}
function AdminKnowledge() {
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.identity?.role);
  useEffect(() => {
    if (role === 'user') router.replace('/dashboard');
  }, [role, router]);
  if (role !== 'admin') return null;
  return <KnowledgeWorkspace platform />;
}
function Farms({ id, newFarm }: { id?: string; newFarm?: boolean }) {
  const { data, refetch, error } = useFarmsQuery();
  const dispatch = useDispatch<AppDispatch>();
  const [message, setMessage] = useState('');
  const farm = data?.farms.find((f) => f.id === id);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [crop, setCrop] = useState('');
  const [stage, setStage] = useState('');
  const [details, setDetails] = useState<{
    crops: Array<{
      id: string;
      crop: string;
      stage: string;
      planted_at?: string | null;
    }>;
  }>();
  useEffect(() => {
    if (!farm) return void setDetails(undefined);
    void getJson<typeof details>(`farms/${farm.id}`)
      .then(setDetails)
      .catch(() => setDetails(undefined));
  }, [farm?.id]);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await mutate<{ id: string }>('farms', {
        name,
        latitude: Number(lat),
        longitude: Number(lon),
        timezone: 'Asia/Kolkata',
      });
      await mutate(`farms/${created.id}/select`);
      dispatch(selectFarm(created.id));
      await refetch();
      setMessage('Farm created and selected.');
    } catch (e) {
      setMessage(String(e));
    }
  }
  return (
    <>
      <header className="section-title farms-heading">
        <div>
          <div className="farms-kicker"><span className="eyebrow">ROOTED IN YOUR LAND</span><Badge variant="secondary"><span className="status-dot" /> Farm workspace</Badge></div>
          <h1>{newFarm ? 'Add your farm' : farm ? farm.name : 'My farms'}</h1>
          <p className="muted">Keep your land, crops, and local guidance connected.</p>
        </div>
        <Link href="/farms/new" className="button button-primary">
          <Plus size={16} /> Add farm
        </Link>
      </header>
      {message && <p role="status">{message}</p>}
      {error && <p className="error">Sign in to view your farms.</p>}
      {newFarm ? (
        <form className="panel form-grid" onSubmit={create}>
          <label>
            Farm name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Latitude
            <input
              required
              type="number"
              min="-90"
              max="90"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </label>
          <label>
            Longitude
            <input
              required
              type="number"
              min="-180"
              max="180"
              step="any"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
            />
          </label>
          <Button>Create farm</Button>
        </form>
      ) : farm ? (
        <>
          <FarmMap latitude={farm.latitude} longitude={farm.longitude} />
          <form
            className="panel form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              try {
                await mutate(
                  `farms/${farm.id}`,
                  {
                    name: String(form.get('name')),
                    latitude: Number(form.get('latitude')),
                    longitude: Number(form.get('longitude')),
                    timezone: farm.timezone,
                  },
                  'PATCH',
                );
                await refetch();
                setMessage('Farm details saved.');
              } catch (error) {
                setMessage(String(error));
              }
            }}
          >
            <h2>Farm details</h2>
            <label>
              Farm name
              <input name="name" required defaultValue={farm.name} />
            </label>
            <label>
              Latitude
              <input
                name="latitude"
                required
                type="number"
                min="-90"
                max="90"
                step="any"
                defaultValue={farm.latitude}
              />
            </label>
            <label>
              Longitude
              <input
                name="longitude"
                required
                type="number"
                min="-180"
                max="180"
                step="any"
                defaultValue={farm.longitude}
              />
            </label>
            <Button>Save changes</Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (
                  !window.confirm(
                    `Delete ${farm.name}? This also removes its crops.`,
                  )
                )
                  return;
                try {
                  await mutate(`farms/${farm.id}`, undefined, 'DELETE');
                  dispatch(clearSelectedFarm());
                  dispatch(api.util.invalidateTags(['Profile']));
                  await refetch();
                  setMessage('Farm deleted.');
                } catch (error) {
                  setMessage(String(error));
                }
              }}
            >
              Delete farm
            </Button>
          </form>
          <form
            className="panel form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await mutate(`farms/${farm.id}/crops`, { crop, stage });
                setCrop('');
                setStage('');
                setDetails(await getJson(`farms/${farm.id}`));
                setMessage('Crop assigned.');
              } catch (e) {
                setMessage(String(e));
              }
            }}
          >
            <h2>What are you growing?</h2>
            <label>
              Crop
              <input
                required
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
              />
            </label>
            <label>
              Growth stage
              <input
                required
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              />
            </label>
            <Button>Assign crop</Button>
          </form>
          <section className="panel">
            <h2>Crop cycles</h2>
            {details?.crops.length ? (
              details.crops.map((item) => (
                <form
                  className="form-grid"
                  key={item.id}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    try {
                      await mutate(
                        `farms/${farm.id}/crops/${item.id}`,
                        {
                          crop: String(form.get('crop')),
                          stage: String(form.get('stage')),
                        },
                        'PATCH',
                      );
                      setDetails(await getJson(`farms/${farm.id}`));
                      setMessage('Crop updated.');
                    } catch (error) {
                      setMessage(String(error));
                    }
                  }}
                >
                  <label>
                    Crop
                    <input name="crop" required defaultValue={item.crop} />
                  </label>
                  <label>
                    Growth stage
                    <input name="stage" required defaultValue={item.stage} />
                  </label>
                  <Button>Save crop</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!window.confirm(`Remove ${item.crop}?`)) return;
                      try {
                        await mutate(
                          `farms/${farm.id}/crops/${item.id}`,
                          undefined,
                          'DELETE',
                        );
                        setDetails(await getJson(`farms/${farm.id}`));
                        setMessage('Crop removed.');
                      } catch (error) {
                        setMessage(String(error));
                      }
                    }}
                  >
                    Remove crop
                  </Button>
                </form>
              ))
            ) : (
              <p className="muted">No crops added yet.</p>
            )}
          </section>
        </>
      ) : (
        <div className="cards farms-grid">
          {data?.farms.map((f) => (
            <Card className="farm-card" key={f.id}>
              <CardHeader>
                <div className="farm-card-icon"><MapPin /></div>
                <CardTitle><span>ACTIVE LAND</span><Link href={`/farms/${f.id}`}>{f.name}</Link></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="farm-coordinates">{f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}</p>
                <Button
                  variant="outline"
                  onClick={async () => {
                  try {
                    await mutate(`farms/${f.id}/select`);
                    dispatch(selectFarm(f.id));
                    dispatch(api.util.invalidateTags(['Profile']));
                    setMessage(`${f.name} selected`);
                  } catch (e) {
                    setMessage(String(e));
                  }
                }}
                >
                  Use this farm
                </Button>
              </CardContent>
            </Card>
          ))}
          {data?.farms.length === 0 && (
            <div className="panel">
              <h2>Your next chapter starts here.</h2>
              <p>Add a farm with its location to get relevant answers.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
function NotificationStatusBadge({
  notificationId,
}: {
  notificationId: string;
}) {
  const { data, error } = useNotificationQuery(notificationId);
  if (error)
    return <span className="badge badge-stale">Delivery unavailable</span>;
  if (!data) return <span className="muted">Checking delivery…</span>;
  const label =
    data.status === 'delivered' || data.status === 'delivered_development'
      ? 'Delivered'
      : data.status === 'dead_letter'
        ? 'Failed'
        : 'Pending';
  return (
    <span
      className={`badge ${label === 'Delivered' ? 'badge-fresh' : label === 'Failed' ? 'badge-stale' : 'badge-source'}`}
    >
      {label}
      {data.attempts
        ? ` · ${data.attempts} attempt${data.attempts === 1 ? '' : 's'}`
        : ''}
    </span>
  );
}
function Alerts() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, error } = useAlertsQuery();
  const { data: farms } = useFarmsQuery();
  const { data: preferencesData, error: preferencesError } =
    useAlertPreferencesQuery();
  const [draft, setDraft] = useState<AlertPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const preferences = draft ?? preferencesData?.preferences;
  async function savePreferences() {
    if (!preferences) return;
    setSaving(true);
    setSaveMessage('');
    try {
      await mutate('alerts/preferences', preferences, 'PATCH');
      dispatch(api.util.invalidateTags(['AlertPreferences', 'Alerts']));
      setDraft(null);
      setSaveMessage('Preferences saved.');
    } catch {
      setSaveMessage('Could not save preferences.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <h1>Farm alerts</h1>
      <section className="panel">
        <span className="eyebrow">ALERT PREFERENCES</span>
        {preferencesError || !preferences ? (
          <p className="muted">Preferences are currently unavailable.</p>
        ) : (
          <>
            <label>
              <span>Alerts enabled</span>
              <input
                type="checkbox"
                checked={preferences.enabled}
                onChange={(e) =>
                  setDraft({ ...preferences, enabled: e.target.checked })
                }
              />
            </label>
            <label>
              Delivery channel
              <select
                value={preferences.channels[0] ?? 'push'}
                onChange={(e) =>
                  setDraft({
                    ...preferences,
                    channels: [
                      e.target.value as AlertPreferences['channels'][number],
                    ],
                  })
                }
              >
                <option value="push">Push</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </label>
            <label>
              Quiet hours start
              <input
                type="time"
                value={preferences.quietHours?.start ?? ''}
                onChange={(e) =>
                  setDraft({
                    ...preferences,
                    quietHours: {
                      start: e.target.value,
                      end: preferences.quietHours?.end ?? '06:00',
                      timezone:
                        preferences.quietHours?.timezone ?? 'Asia/Kolkata',
                    },
                  })
                }
              />
            </label>
            <label>
              Quiet hours end
              <input
                type="time"
                value={preferences.quietHours?.end ?? ''}
                onChange={(e) =>
                  setDraft({
                    ...preferences,
                    quietHours: {
                      start: preferences.quietHours?.start ?? '22:00',
                      end: e.target.value,
                      timezone:
                        preferences.quietHours?.timezone ?? 'Asia/Kolkata',
                    },
                  })
                }
              />
            </label>
            <label>
              Limit to farm
              <select
                value={preferences.farmIds[0] ?? ''}
                onChange={(e) =>
                  setDraft({
                    ...preferences,
                    farmIds: e.target.value ? [e.target.value] : [],
                  })
                }
              >
                <option value="">All farms</option>
                {farms?.farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </label>
            <Button
              disabled={saving || !draft}
              onClick={() => void savePreferences()}
            >
              {saving ? 'Saving…' : 'Save preferences'}
            </Button>
            {saveMessage ? <p className="muted">{saveMessage}</p> : null}
          </>
        )}
      </section>
      {error ? (
        <p className="panel">Alerts are currently unavailable.</p>
      ) : data?.alerts.length ? (
        data.alerts.map((a) => (
          <article className="panel" key={a.id}>
            <div className="badge-row">
              {a.hazard?.severity ? (
                <span className="badge badge-source">{a.hazard.severity}</span>
              ) : null}
              {a.notification_id ? (
                <NotificationStatusBadge notificationId={a.notification_id} />
              ) : (
                <span className="muted">No notification queued</span>
              )}
            </div>
            <p>{a.message}</p>
            <small>{a.created_at}</small>
          </article>
        ))
      ) : (
        <div className="panel">
          <Bell />
          <h2>You’re all caught up.</h2>
          <p>Relevant updates will appear here.</p>
        </div>
      )}
    </>
  );
}
function PriceHistoryChart({
  history,
}: {
  history: { price: number; observedAt: string }[];
}) {
  const points = [...history].reverse();
  if (points.length < 2) {
    return <p className="muted">Not enough history to chart yet.</p>;
  }
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 100;
  const height = 42;
  const coords = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.price - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <div className="price-chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="price-chart"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke="#297852"
          strokeWidth="2"
          points={coords}
        />
      </svg>
      <div className="price-chart-labels">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}
function Markets() {
  const { data: profile } = useProfileQuery();
  const { data: farms } = useFarmsQuery();
  const selectedFarmId =
    useSelector((s: RootState) => s.ui.selectedFarmId) ||
    profile?.active_farm_id ||
    '';
  const selectedFarm = farms?.farms.find((farm) => farm.id === selectedFarmId);
  const [commodity, setCommodity] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const { data, error } = useMarketsQuery({
    ...(commodity ? { commodity } : {}),
    ...(selectedFarm
      ? { latitude: selectedFarm.latitude, longitude: selectedFarm.longitude }
      : {}),
  });
  const selectedMarket = data?.markets.find(
    (market) => market.marketId === selectedMarketId,
  );
  const { data: historyData } = useMarketHistoryQuery(
    {
      marketId: selectedMarketId,
      ...(commodity ? { commodity } : {}),
      limit: 30,
    },
    { skip: !selectedMarketId },
  );
  return (
    <>
      <header className="section-title markets-heading">
        <div>
          <div className="markets-kicker"><span className="eyebrow">LOCAL MANDI OBSERVATIONS</span><Badge variant="secondary"><span className="status-dot" /> Live sources</Badge></div>
          <h1>Markets</h1>
          <p className="muted">Compare nearby mandi prices and follow the movement that matters.</p>
        </div>
      </header>
      <div className="filter-row markets-filters">
        <div className="filter-intro"><span className="eyebrow">FILTER OBSERVATIONS</span><p className="muted">Choose a crop to narrow the local view.</p></div>
        <label>
          Commodity
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
          >
            <option value="">All commodities</option>
            <option value="Wheat">Wheat</option>
            <option value="Rice">Rice</option>
          </select>
        </label>
        <p className="muted">
          {selectedFarm
            ? `Sorted near ${selectedFarm.name}.`
            : 'Select a farm for location-aware ordering.'}
        </p>
      </div>
      {error ? (
        <p className="panel">Market data is currently unavailable.</p>
      ) : (
        <div className="cards">
          {data?.markets.map((market) => (
              <Card className={`market-card${selectedMarketId === market.marketId ? ' selected' : ''}`} key={market.id}>
                <CardHeader>
                  <div className="badge-row"><Badge variant="outline">{market.source}</Badge><span className={`badge ${market.stale ? 'badge-stale' : 'badge-fresh'}`}>{market.stale ? 'Stale' : 'Fresh'}</span></div>
                  <CardTitle><span>{market.commodity}{market.variety ? ` · ${market.variety}` : ''}</span>{market.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <strong className="market-price">{market.price.toLocaleString()} <small>{market.unit}</small></strong>
                  <p className="muted">Observed {new Date(market.observedAt).toLocaleString()}{market.state ? ` · ${market.state}` : ''}</p>
                  <div className="market-card-actions">{market.sourceUrl && <a href={market.sourceUrl} target="_blank" rel="noreferrer">View source <ExternalLink size={14} /></a>}<Button variant="outline" onClick={() => setSelectedMarketId(market.marketId)}>View history</Button></div>
                </CardContent>
              </Card>
          ))}
          {!data?.markets.length && (
            <div className="panel">
              <h2>No market observations yet.</h2>
              <p>Try another commodity filter or check back later.</p>
            </div>
          )}
        </div>
      )}
      {selectedMarket && (
        <section className="panel market-history">
          <span className="eyebrow">PRICE HISTORY</span>
          <h2>
            {selectedMarket.name} · {selectedMarket.commodity}
          </h2>
          <PriceHistoryChart history={historyData?.history ?? []} />
          <div className="history-list">
            {historyData?.history.map((point) => (
              <div className="history-row" key={point.id}>
                <span>{new Date(point.observedAt).toLocaleDateString()}</span>
                <strong>
                  {point.price.toLocaleString()} {point.unit}
                </strong>
                <span
                  className={`badge ${point.stale ? 'badge-stale' : 'badge-fresh'}`}
                >
                  {point.stale ? 'Stale' : 'Fresh'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
function ReferenceRecords() {
  const locale = useSelector((s: RootState) => s.ui.locale);
  const [state, setState] = useState('');
  const [crop, setCrop] = useState('');
  const { data, error } = useReferenceRecordsQuery({ type: 'scheme', locale });
  const records =
    data?.records.filter((record) => {
      const states = record.content.states ?? [];
      const crops = record.content.crops ?? [];
      if (state && !states.includes(state)) return false;
      if (
        crop &&
        !crops.some((value) => value.toLowerCase() === crop.toLowerCase())
      ) {
        return false;
      }
      return true;
    }) ?? [];
  return (
    <>
      <header className="section-title">
        <div>
          <span className="eyebrow">AGRICULTURE REFERENCE DATA</span>
          <h1>Schemes & guidance</h1>
        </div>
      </header>
      <div className="filter-row">
        <label>
          State
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">All states</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
          </select>
        </label>
        <label>
          Crop
          <select value={crop} onChange={(e) => setCrop(e.target.value)}>
            <option value="">All crops</option>
            <option value="wheat">Wheat</option>
            <option value="rice">Rice</option>
          </select>
        </label>
      </div>
      {error ? (
        <p className="panel">Reference records are currently unavailable.</p>
      ) : records.length ? (
        records.map((record) => (
          <article className="panel reference-card" key={record.id}>
            <div className="badge-row">
              <span className="badge badge-source">
                {record.content.dataset ?? 'reference'}
              </span>
              {record.content.states?.length ? (
                <span className="badge badge-geo">
                  {record.content.states.join(', ')}
                </span>
              ) : null}
              {record.content.crops?.length ? (
                <span className="badge badge-crop">
                  {record.content.crops.join(', ')}
                </span>
              ) : null}
            </div>
            <h2>{record.title}</h2>
            <p>{record.summary}</p>
            {record.content.benefit && (
              <p>
                <strong>Benefit:</strong> {String(record.content.benefit)}
              </p>
            )}
            {record.source_url && (
              <a href={record.source_url} target="_blank" rel="noreferrer">
                View source <ExternalLink size={14} />
              </a>
            )}
            {record.published_at && (
              <small className="muted">
                Published {new Date(record.published_at).toLocaleDateString()}
              </small>
            )}
          </article>
        ))
      ) : (
        <div className="panel">
          <h2>No matching records.</h2>
          <p>Try clearing the state or crop filters.</p>
        </div>
      )}
    </>
  );
}
export default function Page() {
  const path = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useSelector((s: RootState) => s.ui.locale);
  return (
    <SessionGate>
      <AppShell>
        {path === '/chat' ||
        path === '/farming-intelligence' ||
        path === '/weather' ? (
          <ChatWorkspace mode="farming" weather={path === '/weather'} />
        ) : path === '/krashaq-ai' ? (
          <ChatWorkspace mode="global" />
        ) : path === '/knowledge' ? (
          <KnowledgeWorkspace />
        ) : path === '/onboarding' ? (
          <Onboarding />
        ) : path.startsWith('/farms') ? (
          <Farms newFarm={path === '/farms/new'} id={path.split('/')[2]} />
        ) : path === '/alerts' ? (
          <Alerts />
        ) : path === '/markets' ? (
          <Markets />
        ) : path === '/reference-records' ? (
          <ReferenceRecords />
        ) : path === '/profile' ? (
          <ProfileCard />
        ) : path === '/admin/users' ? (
          <AdminUsers />
        ) : path === '/admin/knowledge' ? (
          <AdminKnowledge />
        ) : path === '/settings' ? (
          <section className="panel">
            <span className="eyebrow">PREFERENCES</span>
            <h1>Settings</h1>
            <p>Language: {locale === 'en' ? 'English' : 'हिन्दी'}</p>
            <Button
              onClick={() => dispatch(setLocale(locale === 'en' ? 'hi' : 'en'))}
            >
              Change language
            </Button>
          </section>
        ) : (
          <Dashboard />
        )}
      </AppShell>
    </SessionGate>
  );
}

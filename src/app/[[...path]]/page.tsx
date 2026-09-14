'use client';
import Link from 'next/link';
import { consumeRunEvents, type RunEvent } from '@/lib/stream';
import {
  ApprovalPanel,
  type PendingApproval,
} from '@/features/chat/approval-panel';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Sprout,
  MapPin,
  CloudSun,
  Bell,
  ArrowUpRight,
  ArrowUp,
  Square,
  Plus,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FarmMap } from '@/components/farm-map';
import {
  api,
  useFarmsQuery,
  useProfileQuery,
  useThreadsQuery,
  useAlertsQuery,
  useAlertPreferencesQuery,
  useNotificationQuery,
  useMarketsQuery,
  useMarketHistoryQuery,
  useReferenceRecordsQuery,
  type AlertPreferences,
} from '@/lib/api/platform.api';
import { mutate } from '@/lib/api/http-client';
import { selectFarm, setLocale } from '@/features/ui/ui.slice';
import type { AppDispatch, RootState } from '@/store';
import { KnowledgeWorkspace } from '@/components/knowledge-workspace';
import { AppShell } from '@/components/layout/app-shell';
import { ProfileCard } from '@/features/auth/profile-card';
import { SessionGate } from '@/features/auth/session-gate';
function Dashboard() {
  const { data } = useFarmsQuery();
  const { data: profile } = useProfileQuery();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A NEW PERSPECTIVE ON YOUR LAND</span>
          <h1>
            Good things grow
            <br />
            from better decisions.
          </h1>
          <p className="muted">
            Your farm, your weather, and a little help with what comes next.
          </p>
        </div>
        <div className="season-mark">
          <Sprout size={72} />
          <span>GROW WITH CONFIDENCE</span>
        </div>
      </div>
      <div className="hero-card">
        <div>
          <span className="eyebrow">YOUR FARM COMPANION</span>
          <h2>
            Every season brings questions.
            <br />
            Let’s find your answers.
          </h2>
          <p>
            Ask about your farm’s forecast or explore trusted agricultural
            knowledge.
          </p>
          <Link className="button button-primary" href="/chat">
            Ask Krashaq <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="field-art">
          <i />
          <i />
          <i />
          <i />
          <Sprout size={90} />
        </div>
      </div>
      <div className="cards">
        <Link className="card" href="/farms">
          <MapPin />
          <span>YOUR LAND</span>
          <h2>{data?.farms.length ?? '—'} farms</h2>
          <p>Keep your location and crops up to date.</p>
        </Link>
        <Link className="card" href="/weather">
          <CloudSun />
          <span>THE DAYS AHEAD</span>
          <h2>Local weather</h2>
          <p>
            {profile?.active_farm_id
              ? 'Explore the forecast for your selected farm.'
              : 'Select a farm to see local forecasts.'}
          </p>
        </Link>
        <Link className="card" href="/alerts">
          <Bell />
          <span>STAY A STEP AHEAD</span>
          <h2>Farm alerts</h2>
          <p>Updates relevant to your land and crops.</p>
        </Link>
      </div>
    </>
  );
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
      <header className="section-title">
        <div>
          <span className="eyebrow">ROOTED IN YOUR LAND</span>
          <h1>{newFarm ? 'Add your farm' : farm ? farm.name : 'My farms'}</h1>
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
              try {
                await mutate(`farms/${farm.id}/crops`, { crop, stage });
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
        </>
      ) : (
        <div className="cards">
          {data?.farms.map((f) => (
            <div className="card" key={f.id}>
              <MapPin />
              <h2>
                <Link href={`/farms/${f.id}`}>{f.name}</Link>
              </h2>
              <p>
                {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
              </p>
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
            </div>
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
interface Evidence {
  id: string;
  sourceName: string;
  content: string;
  retrievedAt: string;
  metadata?: { url?: string; documentId?: string; page?: number | string };
}
function Chat({ weather = false }: { weather?: boolean }) {
  const { data: farms } = useFarmsQuery();
  const { data: profile } = useProfileQuery();
  const { data: threads, refetch } = useThreadsQuery();
  const selected =
    useSelector((s: RootState) => s.ui.selectedFarmId) ||
    profile?.active_farm_id ||
    '';
  const search = useSearchParams();
  const documentId = search.get('document');
  const [text, setText] = useState(
    weather
      ? 'Will it rain on my farm tomorrow?'
      : documentId
        ? 'What does my uploaded document say?'
        : '',
  );
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [threadId, setThread] = useState<string>();
  const [running, setRunning] = useState(false);
  const [pendingApproval, setPendingApproval] =
    useState<PendingApproval | null>(null);
  const run = useRef<string>('');
  function handleStreamEvent({ type: event, data }: RunEvent) {
    if (event === 'status') setStatus(String(data.status).replaceAll('_', ' '));
    if (event === 'delta') setAnswer((a) => a + String(data.text));
    if (event === 'evidence') setEvidence(data.evidence as Evidence[]);
    if (event === 'approval_required') {
      setPendingApproval({
        approvalId: String(data.approvalId),
        tool: String(data.tool),
        expiresAt: String(data.expiresAt),
      });
      setStatus('approval required');
    }
    if (event === 'error' || event === 'context_required')
      setError(String(data.message));
  }
  async function consumeEvents(eventsUrl: string) {
    await consumeRunEvents(eventsUrl, handleStreamEvent);
  }
  async function send() {
    if (!text.trim() || running) return;
    setRunning(true);
    setError('');
    setAnswer('');
    setEvidence([]);
    setPendingApproval(null);
    setQuestion(text);
    try {
      const created = await mutate<{
        runId: string;
        threadId: string;
        eventsUrl: string;
      }>('ai/chat', {
        domain: 'krashaq-agriculture',
        message: text,
        ...(threadId ? { threadId } : {}),
        ...(selected ? { resourceId: selected } : {}),
        ...(documentId ? { documentId } : {}),
      });
      run.current = created.runId;
      setThread(created.threadId);
      await consumeEvents(created.eventsUrl);
      await refetch();
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
      setStatus('');
    }
  }
  async function resumeAfterApproval(response: {
    runId: string;
    threadId: string;
    eventsUrl: string;
  }) {
    setRunning(true);
    setError('');
    setPendingApproval(null);
    run.current = response.runId;
    setThread(response.threadId);
    try {
      await consumeEvents(response.eventsUrl);
      await refetch();
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
      setStatus('');
    }
  }
  return (
    <>
      <header className="section-title">
        <div>
          <span className="eyebrow">
            A CONVERSATION THAT KNOWS YOUR CONTEXT
          </span>
          <h1>{weather ? 'Your local forecast' : 'Ask Krashaq'}</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setThread(undefined);
            setAnswer('');
            setQuestion('');
            setPendingApproval(null);
          }}
          disabled={running}
        >
          <Plus size={16} /> New conversation
        </Button>
      </header>
      {documentId && (
        <div className="document-context">
          <BookOpen size={15} />
          Grounding this conversation in your uploaded knowledge.{' '}
          <Link href="/knowledge">Manage documents</Link>
        </div>
      )}
      <div className="context-pill">
        <MapPin size={14} />
        {farms?.farms.find((f) => f.id === selected)?.name
          ? `Using ${farms.farms.find((f) => f.id === selected)?.name} location`
          : 'No farm selected'}{' '}
        <Link href="/farms">Change</Link>
      </div>
      <div className="chat-layout">
        <div className="chat-panel">
          {!question ? (
            <div className="chat-empty">
              <Sprout size={42} />
              <h2>What’s on your mind?</h2>
              <p>
                Start with your weather, your crops, or something you’d like to
                understand.
              </p>
              <button
                className="suggestion"
                onClick={() => setText('Will it rain on my farm tomorrow?')}
              >
                Will it rain on my farm tomorrow? <ArrowUpRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="question">{question}</div>
              <div className="answer" aria-live="polite">
                {answer || status || 'Connecting…'}
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {pendingApproval && run.current && (
            <ApprovalPanel
              runId={run.current}
              approval={pendingApproval}
              busy={running}
              onResume={resumeAfterApproval}
              onDenied={() => {
                setPendingApproval(null);
                setAnswer('This action was denied.');
              }}
              onError={(message) => setError(message)}
            />
          )}
          {evidence.length > 0 && (
            <div className="evidence">
              <span className="eyebrow">SOURCES</span>
              {evidence.map((e) => (
                <details key={e.id}>
                  <summary>
                    {e.sourceName}
                    {e.metadata?.page
                      ? ` · page ${e.metadata.page}`
                      : ''} · {new Date(e.retrievedAt).toLocaleString()}
                  </summary>
                  <div className="evidence-links">
                    {e.metadata?.documentId && (
                      <a
                        href={`/v1/documents/${encodeURIComponent(e.metadata.documentId)}/content${e.metadata.page ? `#page=${encodeURIComponent(String(e.metadata.page))}` : ''}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open cited PDF <ExternalLink size={14} />
                      </a>
                    )}
                    {e.metadata?.url && (
                      <a href={e.metadata.url} target="_blank" rel="noreferrer">
                        Open source <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <pre>{e.content}</pre>
                </details>
              ))}
            </div>
          )}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              aria-label="Your question"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask a question about your farm…"
              rows={2}
              disabled={Boolean(pendingApproval)}
            />
            {running ? (
              <Button
                type="button"
                aria-label="Stop generation"
                onClick={() => void mutate(`runs/${run.current}/cancel`)}
              >
                <Square size={18} />
              </Button>
            ) : (
              <Button aria-label="Send question">
                <ArrowUp size={20} />
              </Button>
            )}
          </form>
          <p className="chat-note">
            Forecasts can change. Important decisions deserve a second look.
          </p>
        </div>
        <aside className="history">
          <span className="eyebrow">RECENT CONVERSATIONS</span>
          {threads?.threads.map((t) => (
            <button
              key={t.id}
              onClick={async () => {
                const data = await fetch(`/v1/threads/${t.id}`).then((r) =>
                  r.json(),
                );
                const last = data.runs?.at(-1);
                setThread(t.id);
                setQuestion(last?.input ?? '');
                setAnswer(last?.answer ?? '');
                setEvidence(last?.evidence ?? []);
              }}
            >
              Conversation {t.id.slice(0, 6)}
            </button>
          ))}
        </aside>
      </div>
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
      <header className="section-title">
        <div>
          <span className="eyebrow">LOCAL MANDI OBSERVATIONS</span>
          <h1>Markets</h1>
        </div>
      </header>
      <div className="filter-row">
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
            <article
              className={`card market-card${selectedMarketId === market.marketId ? ' selected' : ''}`}
              key={market.id}
            >
              <div className="badge-row">
                <span className="badge badge-source">{market.source}</span>
                <span
                  className={`badge ${market.stale ? 'badge-stale' : 'badge-fresh'}`}
                >
                  {market.stale ? 'Stale' : 'Fresh'}
                </span>
              </div>
              <h2>{market.name}</h2>
              <p>
                {market.commodity}
                {market.variety ? ` · ${market.variety}` : ''}
              </p>
              <strong>
                {market.price.toLocaleString()} {market.unit}
              </strong>
              <p className="muted">
                Observed {new Date(market.observedAt).toLocaleString()}
                {market.state ? ` · ${market.state}` : ''}
              </p>
              {market.sourceUrl && (
                <a href={market.sourceUrl} target="_blank" rel="noreferrer">
                  View source <ExternalLink size={14} />
                </a>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedMarketId(market.marketId)}
              >
                View history
              </Button>
            </article>
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
        {path === '/chat' || path === '/weather' ? (
          <Chat weather={path === '/weather'} />
        ) : path === '/knowledge' ? (
          <KnowledgeWorkspace />
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

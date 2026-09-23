'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  ImagePlus,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Library,
  Sparkles,
  Sprout,
  Square,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { consumeRunEvents, type RunEvent } from '@/lib/stream';
import { mutate, uploadMultipart } from '@/lib/api/http-client';
import {
  api,
  type AssistantMode,
  type ChatEvidence,
  type ChatRun,
  type ThreadSummary,
  useFarmsQuery,
  useLazyThreadQuery,
  useProfileQuery,
  useSubmitFeedbackMutation,
  useThreadsQuery,
  useUpdateThreadMutation,
} from '@/lib/api/platform.api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectFarm } from '@/features/ui/ui.slice';
import { ApprovalPanel, type PendingApproval } from './approval-panel';
import { RichMessage } from './rich-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Attachment, AttachmentPreview } from '@/components/ui/attachment';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerJumpToLatest,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';

type LocalImage = { id: string; preview: string; expiresAt: string };
type SelectedSource = { evidence: ChatEvidence; index: number } | null;

const copy = {
  global: {
    title: 'Krashaq AI',
    eyebrow: 'YOUR GLOBAL KNOWLEDGE ASSISTANT',
    placeholder: 'Ask Krashaq AI…',
    empty: 'What would you like to understand?',
    description:
      'Explore your documents and trusted knowledge in one conversation.',
    starters: [
      'Explain crop rotation simply',
      'Summarize my uploaded document',
      'Research a current agriculture scheme',
    ],
  },
  farming: {
    title: 'Farming Intelligence',
    eyebrow: 'A CONVERSATION THAT KNOWS YOUR FARM',
    placeholder: 'Ask about your farm…',
    empty: 'What is happening on your farm?',
    description:
      'Ask about crops, weather, markets, soil, or attach a crop photo.',
    starters: [
      'Will it rain on my farm tomorrow?',
      'What is the nearest mandi price?',
      'My wheat leaves are turning yellow',
    ],
  },
} as const;

function sourceLabel(evidence: ChatEvidence) {
  if (evidence.sourceType === 'web') return 'Web research';
  if (evidence.sourceType === 'tool') return 'Live farm data';
  if (evidence.metadata?.visibility === 'platform') return 'Platform knowledge';
  return 'Private knowledge';
}

function ThreadSidebar({
  mode,
  activeId,
  collapsed,
  mobileOpen,
  onToggle,
  onSelect,
  onNew,
}: {
  mode: AssistantMode;
  activeId?: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const t = useT();
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<string>();
  const [title, setTitle] = useState('');
  const { data, isFetching } = useThreadsQuery({
    assistantMode: mode,
    q: search.trim() || undefined,
    archived,
    limit: 50,
  });
  const [updateThread] = useUpdateThreadMutation();

  async function update(
    thread: ThreadSummary,
    values: { title?: string; pinned?: boolean; archived?: boolean },
  ) {
    try {
      await updateThread({ id: thread.id, ...values }).unwrap();
      if (values.archived !== undefined)
        toast.success(
          values.archived ? 'Conversation archived' : 'Conversation restored',
        );
    } catch {
      toast.error('Unable to update this conversation');
    }
  }

  return (
    <aside
      className={`chat-thread-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}
      aria-label="Conversation history"
    >
      <div className="chat-thread-head">
        {!collapsed && <strong>{t('Conversations')}</strong>}
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            collapsed
              ? 'Open conversation sidebar'
              : 'Close conversation sidebar'
          }
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>
      <button type="button" className="chat-new-thread" onClick={onNew}>
        <Plus size={17} />
        {!collapsed && t('New conversation')}
      </button>
      {!collapsed && (
        <>
          <label className="chat-thread-search">
            <Search size={15} />
            <input
              aria-label="Search conversations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search conversations')}
            />
          </label>
          <div className="chat-thread-filter">
            <button
              type="button"
              className={!archived ? 'active' : ''}
              onClick={() => setArchived(false)}
            >
              {t('Recent')}
            </button>
            <button
              type="button"
              className={archived ? 'active' : ''}
              onClick={() => setArchived(true)}
            >
              {t('Archived')}
            </button>
          </div>
          <div className="chat-thread-list">
            {isFetching && !data && (
              <div className="chat-thread-loading">
                <Spinner size={16} /> {t('Loading')}
              </div>
            )}
            {data?.threads.map((thread) => (
              <div
                className={`chat-thread-row ${activeId === thread.id ? 'active' : ''}`}
                key={thread.id}
              >
                {editing === thread.id ? (
                  <input
                    autoFocus
                    value={title}
                    maxLength={100}
                    onChange={(event) => setTitle(event.target.value)}
                    onBlur={() => {
                      if (title.trim())
                        void update(thread, { title: title.trim() });
                      setEditing(undefined);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                      if (event.key === 'Escape') setEditing(undefined);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="chat-thread-select"
                    onClick={() => onSelect(thread.id)}
                    title={thread.title}
                  >
                    {thread.pinned && <Pin size={12} />}
                    {thread.title}
                  </button>
                )}
                <details className="chat-thread-menu">
                  <summary aria-label={`Manage ${thread.title}`}>
                    <MoreHorizontal size={16} />
                  </summary>
                  <div>
                    {!archived && (
                      <button
                        type="button"
                        onClick={() =>
                          void update(thread, { pinned: !thread.pinned })
                        }
                      >
                        <Pin size={14} />
                        {thread.pinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                    {!archived && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(thread.id);
                          setTitle(thread.title);
                        }}
                      >
                        <FileText size={14} />
                        Rename
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        void update(thread, { archived: !archived })
                      }
                    >
                      {archived ? (
                        <RotateCcw size={14} />
                      ) : (
                        <Archive size={14} />
                      )}
                      {archived ? 'Restore' : 'Archive'}
                    </button>
                  </div>
                </details>
              </div>
            ))}
            {data?.threads.length === 0 && (
              <p className="chat-thread-empty">
                {archived
                  ? 'No archived conversations.'
                  : 'No conversations yet.'}
              </p>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function SourcePanel({
  selected,
  onClose,
}: {
  selected: SelectedSource;
  onClose: () => void;
}) {
  if (!selected) return null;
  const { evidence, index } = selected;
  return (
    <aside className="chat-source-panel" aria-label={`Source ${index}`}>
      <header>
        <div>
          <span>Source {index}</span>
          <strong>{evidence.sourceName}</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Close source">
          <X size={18} />
        </button>
      </header>
      <div className="chat-source-meta">
        <span>{sourceLabel(evidence)}</span>
        {evidence.metadata?.page && <span>Page {evidence.metadata.page}</span>}
        {evidence.metadata?.grade && <span>{evidence.metadata.grade}</span>}
        {evidence.score !== undefined && (
          <span>{Math.round(evidence.score * 100)}% match</span>
        )}
      </div>
      {evidence.content && <p>{evidence.content}</p>}
      <div className="chat-source-links">
        {evidence.metadata?.documentId && (
          <a
            href={`/v1/documents/${encodeURIComponent(evidence.metadata.documentId)}/content${evidence.metadata.page ? `#page=${encodeURIComponent(String(evidence.metadata.page))}` : ''}`}
            target="_blank"
            rel="noreferrer"
          >
            Open cited PDF <ExternalLink size={14} />
          </a>
        )}
        {evidence.metadata?.url && (
          <a href={evidence.metadata.url} target="_blank" rel="noreferrer">
            Open source <ExternalLink size={14} />
          </a>
        )}
      </div>
    </aside>
  );
}

function ConversationMessage({
  run,
  active,
  status,
  onCitation,
  onRetry,
  onFeedback,
}: {
  run: ChatRun;
  active: boolean;
  status: string;
  onCitation: (evidence: ChatEvidence, index: number) => void;
  onRetry: (run: ChatRun) => void;
  onFeedback: (run: ChatRun, rating: -1 | 1) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <MessageScrollerItem messageId={`${run.id}-user`} scrollAnchor>
        <Message align="end" aria-label="Your message">
          <MessageContent>
            {run.imageIds.length > 0 && (
              <div className="chat-message-attachments">
                {run.imageIds.map((id) => (
                  <Attachment key={id}>
                    <AttachmentPreview>
                      <img
                        src={`/v1/diagnostic-images/${id}?thumbnail=1`}
                        alt="Attached crop"
                      />
                    </AttachmentPreview>
                  </Attachment>
                ))}
              </div>
            )}
            <Bubble variant="user">
              <BubbleContent className="whitespace-pre-wrap">
                {run.input}
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageScrollerItem>
      <MessageScrollerItem messageId={`${run.id}-assistant`}>
        <Message aria-label="Assistant response">
          <MessageAvatar>
            <Sprout size={17} />
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>
                {run.answer ? (
                  <RichMessage
                    content={run.answer}
                    evidence={run.evidence}
                    onCitation={onCitation}
                  />
                ) : active ? null : (
                  <p className="muted">No answer was saved for this run.</p>
                )}
                {active && status && (
                  <Marker role="status">
                    <MarkerIcon>
                      <Spinner size={14} />
                    </MarkerIcon>
                    <MarkerContent shimmer>{status}</MarkerContent>
                  </Marker>
                )}
              </BubbleContent>
            </Bubble>
            {run.answer && (
              <MessageFooter>
                <button
                  type="button"
                  aria-label="Copy answer"
                  title="Copy"
                  onClick={async () => {
                    await navigator.clipboard.writeText(run.answer ?? '');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
                <button
                  type="button"
                  aria-label="Retry answer"
                  title="Retry"
                  disabled={active}
                  onClick={() => onRetry(run)}
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  type="button"
                  className={run.feedback === 1 ? 'selected' : ''}
                  aria-label="Helpful answer"
                  title="Helpful"
                  onClick={() => onFeedback(run, 1)}
                >
                  <ThumbsUp size={15} />
                </button>
                <button
                  type="button"
                  className={run.feedback === -1 ? 'selected' : ''}
                  aria-label="Not helpful answer"
                  title="Not helpful"
                  onClick={() => onFeedback(run, -1)}
                >
                  <ThumbsDown size={15} />
                </button>
                {run.evidence.length > 0 && (
                  <button
                    type="button"
                    className="chat-source-count"
                    onClick={() => onCitation(run.evidence[0]!, 1)}
                  >
                    <Library size={15} />
                    {run.evidence.length}{' '}
                    {run.evidence.length === 1 ? 'source' : 'sources'}
                  </button>
                )}
              </MessageFooter>
            )}
          </MessageContent>
        </Message>
      </MessageScrollerItem>
    </>
  );
}

export function ChatWorkspace({
  mode,
  weather = false,
}: {
  mode: AssistantMode;
  weather?: boolean;
}) {
  const config = copy[mode];
  const t = useT();
  const localizedConfig = {
    ...config,
    title: t(config.title),
    eyebrow: t(config.eyebrow),
    placeholder: t(config.placeholder),
    empty: t(config.empty),
    description: t(config.description),
    starters: config.starters.map(t),
  };
  const dispatch = useAppDispatch();
  const locale = useAppSelector((state) => state.ui.locale);
  const selectedFarmId = useAppSelector((state) => state.ui.selectedFarmId);
  const { data: farms } = useFarmsQuery();
  const { data: profile } = useProfileQuery();
  const farmId = selectedFarmId || profile?.active_farm_id || '';
  const params = useSearchParams();
  const documentId = params.get('document');
  const [loadThread] = useLazyThreadQuery();
  const [submitFeedback] = useSubmitFeedbackMutation();
  const [threadId, setThreadId] = useState<string>();
  const [turns, setTurns] = useState<ChatRun[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [text, setText] = useState(
    weather
      ? 'Will it rain on my farm tomorrow?'
      : documentId
        ? 'What does my uploaded document say?'
        : '',
  );
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingApproval, setPendingApproval] =
    useState<PendingApproval | null>(null);
  const [selectedSource, setSelectedSource] = useState<SelectedSource>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileThreads, setMobileThreads] = useState(false);
  const activeRun = useRef('');
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textarea.current) return;
    textarea.current.style.height = 'auto';
    textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 180)}px`;
  }, [text]);

  async function openThread(id: string) {
    setLoadingThread(true);
    setError('');
    try {
      const data = await loadThread({ id, limit: 40 }, true).unwrap();
      setThreadId(id);
      setTurns(data.runs);
      setOlderCursor(data.nextCursor);
      setSelectedSource(null);
      setMobileThreads(false);
    } catch {
      setError('Unable to open this conversation.');
    } finally {
      setLoadingThread(false);
    }
  }

  async function loadOlder() {
    if (!threadId || !olderCursor || loadingThread) return;
    setLoadingThread(true);
    try {
      const data = await loadThread({
        id: threadId,
        before: olderCursor,
        limit: 40,
      }).unwrap();
      setTurns((current) => [...data.runs, ...current]);
      setOlderCursor(data.nextCursor);
    } finally {
      setLoadingThread(false);
    }
  }

  function resetConversation() {
    setThreadId(undefined);
    setTurns([]);
    setOlderCursor(null);
    setPendingApproval(null);
    setSelectedSource(null);
    setImages([]);
    setError('');
    setMobileThreads(false);
    requestAnimationFrame(() => textarea.current?.focus());
  }

  function streamStatus(event: RunEvent, runId: string) {
    const data = event.data as Record<string, unknown>;
    if (event.type === 'status')
      setStatus(String(data.status ?? '').replaceAll('_', ' '));
    if (event.type === 'route_selected')
      setStatus(
        String(
          data.route === 'live_tool'
            ? 'Checking live farm data'
            : data.route === 'calculation'
              ? 'Calculating'
              : data.route === 'direct'
                ? 'Preparing an answer'
                : 'Finding trusted evidence',
        ),
      );
    if (event.type === 'vision_started') setStatus('Reviewing crop photos');
    if (event.type === 'vision_failed')
      setStatus('Crop-photo analysis is temporarily unavailable');
    if (event.type === 'retrieval_started')
      setStatus('Searching trusted knowledge');
    if (event.type === 'retrieval_graded')
      setStatus(
        Boolean(data.sufficient)
          ? 'Reviewing the evidence'
          : 'Checking current official sources',
      );
    if (event.type === 'research_started')
      setStatus('Checking current official sources');
    if (event.type === 'critique_completed')
      setStatus('Checking safety and citations');
    if (event.type === 'delta')
      setTurns((current) =>
        current.map((run) =>
          run.id === runId
            ? {
                ...run,
                answer: `${run.answer ?? ''}${String(data.text ?? '')}`,
              }
            : run,
        ),
      );
    if (event.type === 'evidence')
      setTurns((current) =>
        current.map((run) =>
          run.id === runId
            ? { ...run, evidence: (data.evidence as ChatEvidence[]) ?? [] }
            : run,
        ),
      );
    if (event.type === 'approval_required') {
      setPendingApproval({
        approvalId: String(data.approvalId),
        tool: String(data.tool),
        expiresAt: String(data.expiresAt),
      });
      setStatus('Approval required');
    }
    if (event.type === 'error' || event.type === 'context_required')
      setError(String(data.message ?? 'Unable to complete this request.'));
    if (event.type === 'done')
      setTurns((current) =>
        current.map((run) =>
          run.id === runId
            ? { ...run, status: String(data.status ?? 'completed') }
            : run,
        ),
      );
  }

  async function send(messageOverride?: string) {
    const submitted =
      (messageOverride ?? text).trim() ||
      (images.length ? 'Diagnose these crop photos.' : '');
    if (!submitted || running) return;
    const pendingId = `pending-${Date.now()}`;
    const sentImages = [...images];
    setRunning(true);
    setError('');
    setStatus('Connecting…');
    setPendingApproval(null);
    setText('');
    setImages([]);
    setTurns((current) => [
      ...current,
      {
        id: pendingId,
        input: submitted,
        answer: '',
        evidence: [],
        imageIds: sentImages.map((image) => image.id),
        status: 'running',
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      const created = await mutate<{
        runId: string;
        threadId: string;
        eventsUrl: string;
      }>('ai/chat', {
        assistantMode: mode,
        domain: mode === 'global' ? 'krashaq-global' : 'krashaq-agriculture',
        message: submitted,
        locale: locale === 'hi' ? 'hi-IN' : 'en-IN',
        ...(sentImages.length
          ? { imageIds: sentImages.map((image) => image.id) }
          : {}),
        ...(threadId ? { threadId } : {}),
        ...(mode === 'farming' && farmId ? { resourceId: farmId } : {}),
        ...(documentId ? { documentId } : {}),
      });
      activeRun.current = created.runId;
      setThreadId(created.threadId);
      setTurns((current) =>
        current.map((run) =>
          run.id === pendingId ? { ...run, id: created.runId } : run,
        ),
      );
      await consumeRunEvents(created.eventsUrl, (event) =>
        streamStatus(event, created.runId),
      );
      dispatch(api.util.invalidateTags(['Threads']));
    } catch (cause) {
      setTurns((current) =>
        current.map((run) =>
          run.id === pendingId ? { ...run, status: 'failed' } : run,
        ),
      );
      setError(
        cause instanceof Error ? cause.message : 'Unable to send this message.',
      );
    } finally {
      setRunning(false);
      setStatus('');
      requestAnimationFrame(() => textarea.current?.focus());
    }
  }

  async function uploadImage(file: File) {
    if (images.length >= 3)
      return setError('You can attach up to three crop photos.');
    setUploadingImage(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const uploaded = await uploadMultipart<{ id: string; expiresAt: string }>(
        'diagnostic-images',
        form,
      );
      setImages((current) => [
        ...current,
        {
          id: uploaded.id,
          expiresAt: uploaded.expiresAt,
          preview: `/v1/diagnostic-images/${uploaded.id}?thumbnail=1`,
        },
      ]);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to upload this image.',
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeImage(id: string) {
    try {
      await mutate(`diagnostic-images/${id}`, undefined, 'DELETE');
    } catch {
      /* Expired images are safe to remove locally. */
    }
    setImages((current) => current.filter((image) => image.id !== id));
  }

  async function feedback(run: ChatRun, rating: -1 | 1) {
    try {
      await submitFeedback({ runId: run.id, rating }).unwrap();
      setTurns((current) =>
        current.map((item) =>
          item.id === run.id ? { ...item, feedback: rating } : item,
        ),
      );
      toast.success('Thanks for the feedback');
    } catch {
      toast.error('Unable to save feedback');
    }
  }

  const activeFarm = useMemo(
    () => farms?.farms.find((farm) => farm.id === farmId),
    [farms?.farms, farmId],
  );
  const currentRun = turns.at(-1);

  return (
    <section className="chat-workspace">
      <ThreadSidebar
        mode={mode}
        activeId={threadId}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileThreads}
        onToggle={() => {
          setSidebarCollapsed((value) => !value);
          setMobileThreads(false);
        }}
        onSelect={(id) => void openThread(id)}
        onNew={resetConversation}
      />
      {mobileThreads && (
        <button
          className="chat-mobile-backdrop"
          aria-label="Close conversations"
          onClick={() => setMobileThreads(false)}
        />
      )}
      <div className="chat-conversation">
        <header className="chat-header">
          <div className="chat-header-title">
            <button
              type="button"
              className="chat-mobile-menu"
              onClick={() => setMobileThreads(true)}
              aria-label={t('Open conversations')}
            >
              <Menu size={20} />
            </button>
              <div>
                <span>{t(localizedConfig.eyebrow)}</span>
                <div className="chat-title-row">
                  <h1>{t(weather ? 'Your local forecast' : localizedConfig.title)}</h1>
                  <Badge variant="secondary"><span className="status-dot" /> {t('Ready')}</Badge>
                </div>
              </div>
          </div>
          <div className="chat-header-actions">
            {mode === 'farming' && (
              <label className="chat-farm-select">
                <Sprout size={15} />
                <select
                  aria-label="Active farm"
                  value={farmId}
                  onChange={async (event) => {
                    const id = event.target.value;
                    dispatch(selectFarm(id));
                    if (id) await mutate(`farms/${id}/select`);
                  }}
                >
                  <option value="">{t('No farm selected')}</option>
                  {farms?.farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </label>
            )}
            <Button
              variant="outline"
              onClick={resetConversation}
              disabled={running}
            >
              <Plus size={16} /> {t('New chat')}
            </Button>
          </div>
        </header>
        {documentId && (
          <div className="chat-document-context">
            <BookOpen size={15} /> Using your selected document{' '}
            <Link href="/knowledge">Manage</Link>
          </div>
        )}
        {mode === 'farming' && !activeFarm && (
          <div className="chat-context-warning">
            {t('Select a farm to use weather, mandi, and location-aware guidance.')}
          </div>
        )}

        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller>
            <MessageScrollerViewport
              aria-label={`${localizedConfig.title} conversation`}
              preserveScrollOnPrepend
            >
              <MessageScrollerContent>

                {loadingThread && turns.length === 0 && (
                  <div className="chat-loading">
                    <Spinner /> Opening conversation…
                  </div>
                )}
                {!loadingThread && turns.length === 0 && (
                  <Card className="chat-empty-state">
                    <CardContent>
                      <div className="chat-empty-icon"><Sparkles size={25} /></div>
                      <p className="chat-empty-eyebrow">{t('A BETTER WAY TO ASK')}</p>
                      <h2>{localizedConfig.empty}</h2>
                      <p>{localizedConfig.description}</p>
                      <div className="chat-capabilities" aria-label="Assistant capabilities">
                        <Badge variant="outline">{t('Trusted sources')}</Badge>
                        <Badge variant="outline">{t('Farm-aware guidance')}</Badge>
                        <Badge variant="outline">{t('Hindi + English')}</Badge>
                      </div>
                      <div className="chat-starters">
                        {localizedConfig.starters.map((starter) => (
                          <Button type="button" variant="outline" onClick={() => setText(starter)} key={starter}>
                            {t(starter)}
                            <ArrowUp data-icon="inline-end" />
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {turns.map((run) => (
                  <ConversationMessage
                    key={run.id}
                    run={run}
                    active={running && run.id === activeRun.current}
                    status={status}
                    onCitation={(evidence, index) =>
                      setSelectedSource({ evidence, index })
                    }
                    onRetry={(item) => void send(item.input)}
                    onFeedback={(item, rating) => void feedback(item, rating)}
                  />
                ))}
                {error && (
                  <div role="alert" className="chat-error">
                    <strong>Something went wrong</strong>
                    <span>{error}</span>
                    {currentRun?.status === 'failed' && (
                      <button
                        type="button"
                        onClick={() => void send(currentRun.input)}
                      >
                        Try again
                      </button>
                    )}
                  </div>
                )}
                {pendingApproval && activeRun.current && (
                  <ApprovalPanel
                    runId={activeRun.current}
                    approval={pendingApproval}
                    busy={running}
                    onResume={async (response) => {
                      setPendingApproval(null);
                      setRunning(true);
                      activeRun.current = response.runId;
                      await consumeRunEvents(response.eventsUrl, (event) =>
                        streamStatus(event, response.runId),
                      );
                      setRunning(false);
                    }}
                    onDenied={() => {
                      setPendingApproval(null);
                      setTurns((current) =>
                        current.map((run) =>
                          run.id === activeRun.current
                            ? { ...run, answer: 'This action was denied.' }
                            : run,
                        ),
                      );
                    }}
                    onError={setError}
                  />
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerJumpToLatest />
          </MessageScroller>
        </MessageScrollerProvider>

        <div className="chat-composer-wrap">
          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            {images.length > 0 && (
              <div className="chat-composer-attachments">
                {images.map((image) => (
                  <Attachment key={image.id}>
                    <AttachmentPreview>
                      <img src={image.preview} alt="Attached crop" />
                    </AttachmentPreview>
                    <button
                      type="button"
                      aria-label="Remove crop photo"
                      onClick={() => void removeImage(image.id)}
                    >
                      <X size={14} />
                    </button>
                  </Attachment>
                ))}
              </div>
            )}
            <Textarea
              ref={textarea}
              aria-label="Your question"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder={t(localizedConfig.placeholder)}
              disabled={Boolean(pendingApproval)}
              rows={1}
            />
            <div className="chat-composer-actions" aria-label="Message actions">
              <div>
                {mode === 'farming' && (
                  <label
                    className="chat-attach-button"
                    aria-label="Attach crop photo"
                  >
                    <ImagePlus size={18} />
                    {uploadingImage && <Spinner size={12} />}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={running || uploadingImage || images.length >= 3}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadImage(file);
                        event.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              {running ? (
                <Button
                  type="button"
                  aria-label="Stop generation"
                  onClick={() =>
                    void mutate(`runs/${activeRun.current}/cancel`)
                  }
                >
                  <Square size={16} />
                </Button>
              ) : (
                <Button
                  aria-label="Send message"
                  disabled={
                    (!text.trim() && !images.length) || Boolean(pendingApproval)
                  }
                >
                  <ArrowUp size={18} />
                </Button>
              )}
            </div>
          </form>
          <p>{t('Krashaq can make mistakes. Verify important farm and safety decisions.')}</p>
        </div>
      </div>
      <SourcePanel
        selected={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </section>
  );
}

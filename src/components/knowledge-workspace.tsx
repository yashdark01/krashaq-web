'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  LoaderCircle,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getJson, mutate } from '@/lib/api/http-client';

const MAX_PDF_BYTES = 650_000;
type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'deleting';
type UploadResult = { id: string; status: JobStatus };
type IngestionJob = UploadResult & { error_code: string | null };
type Document = {
  id: string;
  title: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};
type DocumentsResponse = { documents: Document[] };

function readPdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The PDF could not be read.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string')
        return reject(new Error('The PDF could not be read.'));
      const encoded = result.split(',', 2)[1];
      if (!encoded) return reject(new Error('The PDF could not be read.'));
      resolve(encoded);
    };
    reader.readAsDataURL(file);
  });
}
function jobDescription(job: IngestionJob) {
  if (job.status === 'queued') return 'Queued for indexing';
  if (job.status === 'processing') return 'Extracting and indexing text';
  if (job.status === 'completed') return 'Indexed and ready to use in chat';
  if (job.status === 'deleting') return 'Removing document and search index';
  if (job.error_code === 'OCR_REQUIRED')
    return 'This scanned PDF needs OCR before it can be indexed.';
  if (job.error_code === 'PROCESSING_FAILED')
    return 'The document could not be indexed.';
  return 'The document could not be indexed. You can upload it again.';
}
function jobProgressStep(
  status: JobStatus,
  step: 'queued' | 'processing' | 'done',
) {
  if (step === 'queued')
    return status === 'queued'
      ? 'current'
      : ['processing', 'completed', 'failed'].includes(status)
        ? 'complete'
        : 'pending';
  if (step === 'processing')
    return status === 'processing'
      ? 'current'
      : ['completed', 'failed'].includes(status)
        ? 'complete'
        : status === 'queued'
          ? 'pending'
          : 'current';
  return status === 'completed'
    ? 'complete'
    : status === 'failed'
      ? 'failed'
      : 'pending';
}

/** Browser-side upload and document catalog. API calls stay behind the Gateway's /v1 routes. */
export function KnowledgeWorkspace({
  platform = false,
}: {
  platform?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File>();
  const [job, setJob] = useState<IngestionJob>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();
  const [targets, setTargets] = useState<Array<'global' | 'farming'>>([
    'farming',
  ]);
  async function loadDocuments() {
    try {
      setDocuments(
        (
          await getJson<DocumentsResponse>(
            platform ? 'admin/documents' : 'documents',
          )
        ).documents,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to load documents.',
      );
    }
  }
  useEffect(() => {
    void loadDocuments();
  }, []);
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const next = await getJson<IngestionJob>(`jobs/${job.id}`);
        if (!active) return;
        setJob(next);
        if (next.status === 'completed') void loadDocuments();
        if (next.status === 'queued' || next.status === 'processing')
          timer = setTimeout(() => void poll(), 1000);
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'Unable to check indexing progress.',
          );
          timer = setTimeout(() => void poll(), 1000);
        }
      }
    };
    timer = setTimeout(() => void poll(), 750);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [job?.id, job?.status]);
  async function upload(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    if (!file) return setMessage('Choose a PDF to upload.');
    if (file.size > MAX_PDF_BYTES)
      return setMessage('Choose a PDF smaller than 650 KB.');
    if (
      file.type &&
      file.type !== 'application/pdf' &&
      !file.name.toLocaleLowerCase().endsWith('.pdf')
    )
      return setMessage('Choose a PDF document.');
    setUploading(true);
    try {
      const created = await mutate<UploadResult>('documents', {
        title: title.trim() || file.name.replace(/\.pdf$/i, ''),
        domain: 'krashaq-agriculture',
        namespace: 'krashaq-agriculture',
        contentType: 'application/pdf',
        pdfBase64: await readPdf(file),
        idempotencyKey: crypto.randomUUID(),
        metadata: { source: 'user_upload' },
        assistantTargets: targets,
        visibility: platform ? 'platform' : 'private',
      });
      setJob({ ...created, error_code: null });
      setFile(undefined);
      setTitle('');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The PDF could not be uploaded.',
      );
    } finally {
      setUploading(false);
    }
  }
  async function removeDocument(id: string) {
    setMessage('');
    setDeletingId(id);
    try {
      await mutate(`documents/${id}`, undefined, 'DELETE');
      setDocuments((current) =>
        current.filter((document) => document.id !== id),
      );
      if (job?.id === id) setJob(undefined);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The document could not be deleted.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }
  const failed = job?.status === 'failed';
  return (
    <>
      <header className="section-title knowledge-heading">
        <div>
          <div className="knowledge-kicker"><span className="eyebrow">TRUSTED KNOWLEDGE FOR YOUR FARM</span><Badge variant="secondary">Private by default</Badge></div>
          <h1>Your documents</h1>
          <p className="muted">
            {platform
              ? 'Publish trusted documents for all signed-in users.'
              : 'Upload a text-based PDF, then choose where it can be used. Your documents stay private.'}
          </p>
        </div>
        <div className="knowledge-summary" aria-label="Document workflow"><span>1</span><span>Upload</span><i /> <span>2</span><span>Index</span><i /> <span>3</span><span>Ask</span></div>
      </header>
      <div className="knowledge-layout">
        <form className="panel upload-panel" onSubmit={upload}>
          <Upload size={28} />
          <h2>{platform ? 'Publish a PDF' : 'Add a PDF'}</h2>
          <p>
            PDFs up to 650 KB are indexed with page-level citations. Scanned
            documents needing OCR show a clear failure.
          </p>
          <label>
            Document title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="For example, wheat irrigation guide"
            />
          </label>
          <label>
            PDF file
            <input
              aria-label="PDF file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const next = event.target.files?.[0];
                setFile(next);
                if (next && !title) setTitle(next.name.replace(/\.pdf$/i, ''));
              }}
            />
          </label>
          <fieldset>
            <legend>Use this document in</legend>
            <label>
              <input
                type="checkbox"
                checked={targets.includes('global')}
                onChange={(event) =>
                  setTargets((current) =>
                    event.target.checked
                      ? current.includes('global')
                        ? current
                        : [...current, 'global']
                      : current.filter((target) => target !== 'global'),
                  )
                }
              />{' '}
              Krashaq AI
            </label>
            <label>
              <input
                type="checkbox"
                checked={targets.includes('farming')}
                onChange={(event) =>
                  setTargets((current) =>
                    event.target.checked
                      ? current.includes('farming')
                        ? current
                        : [...current, 'farming']
                      : current.filter((target) => target !== 'farming'),
                  )
                }
              />{' '}
              Farming Intelligence
            </label>
          </fieldset>
          {file && (
            <p className="selected-file">
              <FileText size={16} />
              {file.name} · {Math.ceil(file.size / 1024)} KB
            </p>
          )}
          <Button disabled={uploading || targets.length === 0}>
            {uploading ? (
              <>
                <LoaderCircle className="spin" size={16} /> Uploading…
              </>
            ) : (
              <>
                <Upload size={16} /> Upload and index
              </>
            )}
          </Button>
          {message && (
            <p role="alert" className="error">
              {message}
            </p>
          )}
        </form>
        <section className="panel indexing-panel" aria-live="polite">
          <span className="eyebrow">INDEXING STATUS</span>
          {job ? (
            <>
              <div
                className={`job-status${failed ? ' job-status-failed' : ''}`}
              >
                <span
                  className={
                    job.status === 'completed'
                      ? 'status-complete'
                      : failed
                        ? 'status-failed'
                        : 'status-running'
                  }
                >
                  {job.status === 'completed' ? (
                    <CheckCircle2 size={20} />
                  ) : failed ? (
                    <AlertCircle size={20} />
                  ) : (
                    <LoaderCircle className={failed ? '' : 'spin'} size={20} />
                  )}
                </span>
                <div>
                  <h2>{jobDescription(job)}</h2>
                  <p className="muted">Document ID: {job.id}</p>
                  {failed && job.error_code && (
                    <p className="job-error-code">
                      Error code: {job.error_code}
                    </p>
                  )}
                </div>
              </div>
              <ol className="job-progress">
                <li className={jobProgressStep(job.status, 'queued')}>
                  <span>Queued</span>
                </li>
                <li className={jobProgressStep(job.status, 'processing')}>
                  <span>Processing</span>
                </li>
                <li className={jobProgressStep(job.status, 'done')}>
                  <span>{failed ? 'Failed' : 'Indexed'}</span>
                </li>
              </ol>
              {job.status === 'completed' && (
                <Link
                  className="button button-outline"
                  href={`/chat?document=${encodeURIComponent(job.id)}`}
                >
                  Ask about this document <ExternalLink size={16} />
                </Link>
              )}
              {failed && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setJob(undefined)}
                >
                  Dismiss
                </Button>
              )}
            </>
          ) : (
            <div className="empty-status">
              <FileText size={24} />
              <p>Upload a PDF to see its progress here.</p>
            </div>
          )}
        </section>
      </div>
      <section className="panel document-catalog">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">YOUR INDEXED DOCUMENTS</span>
            <h2>Ready for grounded answers</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadDocuments()}
          >
            Refresh
          </Button>
        </div>
        {documents.length ? (
          <div className="document-list">
            {documents.map((document) => (
              <article key={document.id}>
                <FileText size={20} />
                <div>
                  <h3>{document.title}</h3>
                  <p>
                    Indexed {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  className="button button-outline"
                  href={`/v1/documents/${encodeURIComponent(document.id)}/content`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View PDF <ExternalLink size={15} />
                </a>
                <Link
                  className="button button-ghost"
                  href={`/chat?document=${encodeURIComponent(document.id)}`}
                >
                  Ask
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deletingId === document.id}
                  onClick={() => void removeDocument(document.id)}
                >
                  {deletingId === document.id ? (
                    <>
                      <LoaderCircle className="spin" size={14} /> Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} /> Delete
                    </>
                  )}
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No indexed documents yet.</p>
        )}
      </section>
    </>
  );
}

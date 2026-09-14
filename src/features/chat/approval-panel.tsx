'use client';

import { LoaderCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useApproveRunMutation,
  useDenyRunMutation,
  useResumeRunMutation,
  useRunApprovalQuery,
  type RunResumeResponse,
} from '@/lib/api/platform.api';

export interface PendingApproval {
  approvalId: string;
  tool: string;
  expiresAt: string;
}

export function ApprovalPanel({
  runId,
  approval,
  busy = false,
  onResume,
  onDenied,
  onError,
}: {
  runId: string;
  approval: PendingApproval;
  busy?: boolean;
  onResume: (response: RunResumeResponse) => Promise<void>;
  onDenied: () => void;
  onError: (message: string) => void;
}) {
  const [approveRun, { isLoading: approving }] = useApproveRunMutation();
  const [denyRun, { isLoading: denying }] = useDenyRunMutation();
  const [resumeRun, { isLoading: resuming }] = useResumeRunMutation();
  const { data: status } = useRunApprovalQuery(runId, {
    pollingInterval: 2000,
  });
  const acting = busy || approving || denying || resuming;
  const expired =
    status?.status === 'expired' ||
    new Date(approval.expiresAt).getTime() <= Date.now();
  async function handleApprove() {
    try {
      await approveRun({ runId, approvalId: approval.approvalId }).unwrap();
      await onResume(await resumeRun(runId).unwrap());
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Unable to approve this action.',
      );
    }
  }
  async function handleDeny() {
    try {
      await denyRun({ runId, approvalId: approval.approvalId }).unwrap();
      onDenied();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : 'Unable to deny this action.',
      );
    }
  }
  return (
    <section className="approval-panel" aria-label="Action approval required">
      <div className="approval-panel-heading">
        <ShieldAlert size={20} />
        <div>
          <span className="eyebrow">APPROVAL REQUIRED</span>
          <h2>Approve protected action</h2>
          <p className="muted">
            Krashaq wants to run <strong>{approval.tool}</strong> after you
            confirm.
          </p>
        </div>
      </div>
      <p className="approval-expiry muted">
        Expires {new Date(approval.expiresAt).toLocaleString()}
      </p>
      {expired ? (
        <p role="alert" className="error">
          This approval request has expired.
        </p>
      ) : (
        <div className="approval-actions">
          <Button
            type="button"
            disabled={acting}
            onClick={() => void handleApprove()}
          >
            {acting ? (
              <>
                <LoaderCircle className="spin" size={16} /> Resuming…
              </>
            ) : (
              'Approve'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={acting}
            onClick={() => void handleDeny()}
          >
            Deny
          </Button>
        </div>
      )}
    </section>
  );
}

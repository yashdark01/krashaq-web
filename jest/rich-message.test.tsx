import { fireEvent, render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { RichMessage } from '@/features/chat/rich-message';

describe('assistant Markdown', () => {
  it('renders GFM safely and turns valid evidence references into citation buttons', () => {
    const onCitation = jest.fn();
    render(
      <RichMessage
        content={
          '## Answer\n\nUse this guidance [1].\n\n| Crop | Season |\n|---|---|\n| Wheat | Rabi |\n\n<script>alert(1)</script>'
        }
        evidence={[
          {
            id: 'one',
            sourceName: 'ICAR guide',
            sourceType: 'web',
            retrievedAt: '2026-09-20T00:00:00Z',
          },
        ]}
        onCitation={onCitation}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Answer' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /open source 1/i }));
    expect(onCitation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'one' }),
      1,
    );
  });

  it('does not make an out-of-range citation interactive', () => {
    render(
      <RichMessage
        content="Unsupported [4]"
        evidence={[]}
        onCitation={jest.fn()}
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/Unsupported \[4\]/)).toBeInTheDocument();
  });
});

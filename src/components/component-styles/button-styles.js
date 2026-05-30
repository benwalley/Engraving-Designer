import { css } from 'lit';

export const buttonStyles = css`
  button {
    font-size: var(--font-size-sm);
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
  }

  button:hover {
    border-color: var(--color-border-hover);
    background: var(--color-surface);
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

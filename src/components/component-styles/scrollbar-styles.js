import { css } from 'lit';

export const scrollbarStyles = css`
  .scrollbar {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .scrollbar::-webkit-scrollbar {
    width: 4px;
  }

  .scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 999px;
  }

  .scrollbar::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-hover);
  }
`;

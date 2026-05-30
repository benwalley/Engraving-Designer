import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';

const TYPE_LABELS = {
  rect: 'Rectangle',
  ellipse: 'Ellipse',
  textbox: 'Text',
  path: 'Path',
  line: 'Line',
  image: 'Image',
};

function labelFor(type) {
  return TYPE_LABELS[type] ?? (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Object');
}

class LayersPanel extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .panel-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      padding: 0 0 8px 0;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 4px;
      flex-shrink: 0;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      flex: 1;
    }

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text);
      user-select: none;
      border: 1px solid transparent;
    }

    li:hover {
      background: var(--color-hover);
    }

    li.active {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent);
    }

    li.drag-over {
      border-color: var(--color-accent);
      background: var(--color-hover);
    }

    .drag-handle {
      cursor: grab;
      color: var(--color-text-muted);
      font-size: 12px;
      flex-shrink: 0;
    }

    .layer-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .layer-name input {
      width: 100%;
      font-size: 13px;
      font-family: inherit;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-accent);
      border-radius: 3px;
      padding: 1px 4px;
      outline: none;
      box-sizing: border-box;
    }

    .type-chip {
      font-size: 11px;
      color: var(--color-text-muted);
      font-family: monospace;
      flex-shrink: 0;
    }

    .delete-btn {
      flex-shrink: 0;
      background: none;
      border: none;
      padding: 0 2px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      color: var(--color-text-muted);
      opacity: 0;
      transition: opacity var(--duration-fast) var(--easing-default), color var(--duration-fast) var(--easing-default);
    }

    li:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      color: var(--color-danger);
    }

    .empty {
      font-size: 12px;
      color: var(--color-text-muted);
      text-align: center;
      margin-top: 16px;
    }
  `;

  constructor() {
    super();
    this._items = [];
    this._selectedId = null;
    this._draggedId = null;
    this._dropTargetId = null;
    this._editingId = null;
    this._editingValue = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this._onObjectsUpdated = (items) => {
      this._items = items ?? [];
      this.requestUpdate();
    };
    this._onSelectionChanged = (data) => {
      this._selectedId = data?.id ?? null;
      this.requestUpdate();
    };
    on(EVENTS.CANVAS_OBJECTS_UPDATED, this._onObjectsUpdated);
    on(EVENTS.SELECTION_CHANGED, this._onSelectionChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.CANVAS_OBJECTS_UPDATED, this._onObjectsUpdated);
    off(EVENTS.SELECTION_CHANGED, this._onSelectionChanged);
  }

  updated() {
    if (this._editingId) {
      const input = this.shadowRoot.querySelector('input.rename-input');
      if (input) {
        input.focus();
        input.select();
      }
    }
  }

  _handleClick(id) {
    if (this._editingId) return;
    emit(EVENTS.LAYER_SELECT, { id });
  }

  _handleDblClick(e, item) {
    e.stopPropagation();
    this._editingId = item.id;
    this._editingValue = item.name ?? labelFor(item.type);
    this.requestUpdate();
  }

  _commitRename() {
    if (!this._editingId) return;
    emit(EVENTS.LAYER_RENAME, { id: this._editingId, name: this._editingValue });
    this._editingId = null;
    this._editingValue = '';
    this.requestUpdate();
  }

  _handleRenameKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._commitRename();
    } else if (e.key === 'Escape') {
      this._editingId = null;
      this._editingValue = '';
      this.requestUpdate();
    }
  }

  _handleDelete(e, id) {
    e.stopPropagation();
    emit(EVENTS.LAYER_DELETED, { id });
  }

  _handleDragStart(e, id) {
    this._draggedId = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  _handleDragOver(e, id) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (this._dropTargetId !== id) {
      this._dropTargetId = id;
      this.requestUpdate();
    }
  }

  _handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      this._dropTargetId = null;
      this.requestUpdate();
    }
  }

  _handleDrop(e, targetId) {
    e.preventDefault();
    const draggedId = this._draggedId;
    this._draggedId = null;
    this._dropTargetId = null;
    if (draggedId && draggedId !== targetId) {
      emit(EVENTS.LAYER_REORDER, { draggedId, targetId });
    }
    this.requestUpdate();
  }

  _handleDragEnd() {
    this._draggedId = null;
    this._dropTargetId = null;
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="panel-title">Layers</div>
      ${this._items.length === 0
        ? html`<p class="empty">No objects</p>`
        : html`
          <ul>
            ${this._items.map(item => html`
              <li
                class="${[
                  item.id === this._selectedId ? 'active' : '',
                  item.id === this._dropTargetId ? 'drag-over' : '',
                ].join(' ').trim()}"
                draggable="${this._editingId ? 'false' : 'true'}"
                @click=${() => this._handleClick(item.id)}
                @dragstart=${(e) => this._handleDragStart(e, item.id)}
                @dragover=${(e) => this._handleDragOver(e, item.id)}
                @dragleave=${(e) => this._handleDragLeave(e)}
                @drop=${(e) => this._handleDrop(e, item.id)}
                @dragend=${() => this._handleDragEnd()}
              >
                <span class="drag-handle">⠿</span>
                <span class="layer-name" @dblclick=${(e) => this._handleDblClick(e, item)}>
                  ${item.id === this._editingId
                    ? html`<input
                        class="rename-input"
                        .value=${this._editingValue}
                        @input=${(e) => { this._editingValue = e.target.value; }}
                        @blur=${() => this._commitRename()}
                        @keydown=${(e) => this._handleRenameKeydown(e)}
                        @click=${(e) => e.stopPropagation()}
                      />`
                    : html`${item.name ?? labelFor(item.type)}`
                  }
                </span>
                <span class="type-chip">${item.type}</span>
                <button class="delete-btn" @click=${(e) => this._handleDelete(e, item.id)} title="Delete layer">×</button>
              </li>
            `)}
          </ul>
        `}
    `;
  }
}

customElements.define('layers-panel', LayersPanel);

import { html } from 'lit';
import { SelectTool } from './select-tool.js';
import { RectangleTool } from './rectangle-tool.js';
import { EllipseTool } from './ellipse-tool.js';
import { LineTool } from './line-tool.js';
import { TextTool } from './text-tool.js';

// Side-effect imports so icon elements are registered
import '../components/icons/icon-tool-select.js';
import '../components/icons/icon-tool-move.js';
import '../components/icons/icon-tool-rectangle.js';
import '../components/icons/icon-tool-ellipse.js';
import '../components/icons/icon-tool-text.js';
import '../components/icons/icon-tool-line.js';

export const DEFAULT_TOOL_ID = 'select';

// Each entry is the single source of truth for a tool.
// Tool: null means the button exists but has no canvas behaviour yet.
export const TOOLS = [
  { id: 'select',    label: 'Select',    icon: html`<icon-tool-select></icon-tool-select>`,       Tool: SelectTool },
  { id: 'move',      label: 'Move',      icon: html`<icon-tool-move></icon-tool-move>`,           Tool: null },
  { id: 'rectangle', label: 'Rectangle', icon: html`<icon-tool-rectangle></icon-tool-rectangle>`, Tool: RectangleTool },
  { id: 'ellipse',   label: 'Ellipse',   icon: html`<icon-tool-ellipse></icon-tool-ellipse>`,     Tool: EllipseTool },
  { id: 'text',      label: 'Text',      icon: html`<icon-tool-text></icon-tool-text>`,           Tool: TextTool },
  { id: 'line',      label: 'Line',      icon: html`<icon-tool-line></icon-tool-line>`,           Tool: LineTool },
];

export const TOOL_MAP = Object.fromEntries(
  TOOLS.filter(t => t.Tool).map(t => [t.id, t.Tool])
);

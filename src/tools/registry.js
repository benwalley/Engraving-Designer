import { html } from 'lit';
import { SelectTool } from './select-tool.js';
import { ShapeTool } from './shape-tool.js';
import { LineTool } from './line-tool.js';
import { TextTool } from './text-tool.js';
import { ImageTool } from './image-tool.js';
import { GrabTool } from './grab-tool.js';
import { DecorationTool } from './decoration-tool.js';

// Side-effect imports so icon elements are registered
import '../components/icons/icon-tool-select.js';
import '../components/icons/icon-tool-shape.js';
import '../components/icons/icon-tool-text.js';
import '../components/icons/icon-tool-line.js';
import '../components/icons/icon-tool-image.js';
import '../components/icons/icon-tool-grab.js';
import '../components/icons/icon-tool-decoration.js';

export const DEFAULT_TOOL_ID = 'select';

// Each entry is the single source of truth for a tool.
// Tool: null means the button exists but has no canvas behaviour yet.
export const TOOLS = [
  { id: 'select',     label: 'Select',     icon: html`<icon-tool-select></icon-tool-select>`,         Tool: SelectTool },
  { id: 'grab',       label: 'Grab',       icon: html`<icon-tool-grab></icon-tool-grab>`,             Tool: GrabTool },
  { id: 'shape',      label: 'Shape',      icon: html`<icon-tool-shape></icon-tool-shape>`,           Tool: ShapeTool },
  { id: 'decoration', label: 'Decoration', icon: html`<icon-tool-decoration></icon-tool-decoration>`, Tool: DecorationTool },
  { id: 'text',       label: 'Text',       icon: html`<icon-tool-text></icon-tool-text>`,             Tool: TextTool },
  { id: 'line',       label: 'Line',       icon: html`<icon-tool-line></icon-tool-line>`,             Tool: LineTool },
  { id: 'image',      label: 'Image',      icon: html`<icon-tool-image></icon-tool-image>`,           Tool: ImageTool },
];

export const TOOL_MAP = Object.fromEntries(
  TOOLS.filter(t => t.Tool).map(t => [t.id, t.Tool])
);

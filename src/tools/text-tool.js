import { IText } from 'fabric';
import { on, off, emit, EVENTS } from '../helpers/events.js';

const defaults = {
  fontFamily: 'Arial',
  fontSize:   24,
  fill:       '#000000',
  fontWeight: 'normal',
  fontStyle:  'normal',
  underline:  false,
};

export class TextTool {
  activate(canvas) {
    this._canvas = canvas;

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'text';
    canvas.discardActiveObject();
    canvas.getObjects().forEach(obj => {
      obj.selectable = false;
      obj.evented = false;
    });
    canvas.renderAll();

    this._onDown = this._down.bind(this);
    canvas.on('mouse:down', this._onDown);

    this._onOptionsChanged = (data) => Object.assign(defaults, data);
    on(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);

    emit(EVENTS.SELECTION_CHANGED, { type: 'i-text', ...defaults });
  }

  deactivate(canvas) {
    canvas.off('mouse:down', this._onDown);
    off(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);

    canvas.defaultCursor = 'default';
    canvas.selection = true;
    canvas.getObjects().forEach(obj => {
      obj.selectable = true;
      obj.evented = true;
    });
    canvas.renderAll();
  }

  _down(opt) {
    if (opt.e.button !== 0) return;
    const { x, y } = opt.scenePoint;

    const text = new IText('Text', {
      left:       x,
      top:        y,
      originX:    'left',
      originY:    'top',
      fontFamily: defaults.fontFamily,
      fontSize:   defaults.fontSize,
      fill:       defaults.fill,
      fontWeight: defaults.fontWeight,
      fontStyle:  defaults.fontStyle,
      underline:  defaults.underline,
      selectable: true,
      evented:    true,
    });

    this._canvas.add(text);
    text.setCoords();

    emit(EVENTS.TOOL_CHANGED, { id: 'select' });
    this._canvas.setActiveObject(text);
    this._canvas.fire('selection:created', { selected: [text] });
    this._canvas.renderAll();
    text.enterEditing();
    text.selectAll();
  }
}

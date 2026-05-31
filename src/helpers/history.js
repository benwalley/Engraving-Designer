export class History {
    constructor(maxSize = 50) {
        this._past = [];
        this._future = [];
        this._maxSize = maxSize;
    }

    push(snapshot) {
        if (snapshot === null) return;
        this._past.push(snapshot);
        if (this._past.length > this._maxSize) this._past.shift();
        this._future = [];
    }

    undo(currentSnapshot) {
        if (!this.canUndo) return null;
        this._future.push(currentSnapshot);
        return this._past.pop();
    }

    redo(currentSnapshot) {
        if (!this.canRedo) return null;
        this._past.push(currentSnapshot);
        return this._future.pop();
    }

    clear() { this._past = []; this._future = []; }
    get canUndo() { return this._past.length > 0; }
    get canRedo() { return this._future.length > 0; }
}

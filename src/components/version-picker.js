import { LitElement, html } from 'lit';

class VersionPicker extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    // check if there is any versions saved. 
    // If so, generate those options
    // If not, create default option.
    // add listeners for data being updated. CRUD versions
    // when a version is slected, trigger an event.
  }

  render() {
    return html`<select>
      // render a list of all the version options.
    </select>`;
  }
}

customElements.define('version-picker', VersionPicker);

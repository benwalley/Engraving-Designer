import './helpers/url-router.js';
import './components/header/app-logo.js';
import './components/header/version-picker.js';
import './components/header/create-copy-button.js'
import './components/header/delete-version-button.js'
import './components/header/saving-indicator.js'
import './components/header/dark-light-toggle.js'
import './components/header/save-snapshot-button.js'
import './components/header/zoom-control.js'
import './components/top-bar/top-bar-container.js'
import './components/shared/popup-menu.js'
import './components/top-bar/shape-options.js'
import './components/top-bar/undo-redo-controls.js'
import './components/left-bar/left-bar-container.js'
import './components/mobile-tools-bar/mobile-tools-bar.js'
import './components/editor-body/editor-body-container.js'
import './components/bottom-bar/bottom-bar-container.js'
import './components/shared/clip-toggle-button.js'
import './components/model-picker/model-picker-modal.js'
import './components/shared/iconify-picker-modal.js'
import { ENABLE_3D } from './helpers/feature-flags.js';
if (ENABLE_3D) import('./components/viewer-3d/viewer-3d-modal.js');

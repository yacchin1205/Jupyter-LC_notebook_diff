import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import diff from 'diff-match-patch';

import { FilesInitializer } from './widgets/files-initializer';
import { buildWidget } from './widgets/main';
import { DiffView } from './lc_notebook_diff_components';

Object.keys(diff).forEach(key => {
  (window as any)[key] = (diff as any)[key];
});

function initWidgets(app: JupyterFrontEnd, documents: IDocumentManager) {
  const initializer = new FilesInitializer((withLabel: boolean) =>
    buildWidget(documents, withLabel)
  );
  initializer.start(app);
}

/**
 * Initialization data for the lc_notebook_diff extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'lc_notebook_diff:plugin',
  description: 'diff extension',
  autoStart: true,
  requires: [IDocumentManager],
  activate: (app: JupyterFrontEnd, documents: IDocumentManager) => {
    console.log('JupyterLab extension lc_notebook_diff is activated!');
    console.log('DiffView', DiffView);
    initWidgets(app, documents);
  }
};

export default plugin;

import React, { useCallback, useState } from 'react';
import { Box, Button, ThemeProvider } from '@mui/material';

import { ReactWidget } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { INotebookModel } from '@jupyterlab/notebook';
import { Notification } from '@jupyterlab/apputils';

import { theme } from '../theme';
import { NotebookPath, SelectFiles } from '../components/select-files';
import { NotebooksView } from '../components/view';
import { diffIcon } from './icons';

type MainWidgetProps = {
  documents: IDocumentManager;
};

type NotebookModelCache = {
  path: NotebookPath;
  content: INotebookModel;
};

async function loadNotebooks(
  documents: IDocumentManager,
  notebooks: NotebookPath[]
): Promise<INotebookModel[]> {
  const manager = documents.services.contents;
  const promises = notebooks.map(notebook => manager.get(notebook));
  const results = await Promise.all(promises);
  return results.map(result => {
    return result.content as INotebookModel;
  });
}

function MainWidget({ documents }: MainWidgetProps) {
  const [files, setFiles] = useState<NotebookPath[]>([]);
  const [notebooks, setNotebooks] = useState<NotebookModelCache[]>([]);

  const filesChanged = useCallback(
    (files: NotebookPath[]) => {
      setFiles(files);
    },
    [documents]
  );
  const showError = useCallback((error: any) => {
    const errorMessage = error.message || error;
    console.error(errorMessage, error);
    Notification.error(`Error on notebook diff: ${errorMessage}`, {
      autoClose: false
    });
  }, []);
  const showDiff = useCallback(() => {
    loadNotebooks(documents, files)
      .then(models => {
        console.log('Notebooks loaded', models);
        setNotebooks(
          models.map((model, index) => ({ path: files[index], content: model }))
        );
      })
      .catch(reason => {
        showError(reason);
      });
  }, [documents, files]);

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <SelectFiles numberOfFiles={3} onFilesSelected={filesChanged} />
        <Button fullWidth variant="contained" onClick={showDiff}>
          Show Diff
        </Button>
        {notebooks && notebooks.length > 0 && (
          <NotebooksView notebooks={notebooks} />
        )}
      </Box>
    </ThemeProvider>
  );
}

export function buildWidget(
  documents: IDocumentManager,
  forNotebook7: boolean
): ReactWidget {
  const widget = ReactWidget.create(<MainWidget documents={documents} />);
  widget.id = 'lc_notebook_diff::main';
  widget.title.icon = diffIcon;
  widget.title.caption = 'Diff';
  if (forNotebook7) {
    widget.title.label = 'Diff';
  }
  widget.addClass('jupyter-notebook-diff-main');
  return widget;
}

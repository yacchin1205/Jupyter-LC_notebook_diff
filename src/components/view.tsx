import React, { useEffect, useMemo } from 'react';
import { INotebookModel } from '@jupyterlab/notebook';
import jquery from 'jquery';
import { MergeView } from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/merge/merge';
import 'codemirror/addon/merge/merge.css';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/scroll/annotatescrollbar';

import {
  DiffView,
  MergeViewOptions,
  MergeViewProvider,
  MergeViewResult
} from 'lc_notebook_diff_components';
import { NotebookPath } from './select-files';

export type Notebook = {
  path: NotebookPath;
  content: INotebookModel;
};

export type Props = {
  notebooks: Notebook[];
};

class MergeViewManager implements MergeViewProvider {
  MergeView(element: HTMLElement, options: MergeViewOptions): MergeViewResult {
    const mv = new MergeView(element, options);
    return {
      edit: mv.editor()
    };
  }
}

export function NotebooksView({ notebooks }: Props) {
  const viewId = useMemo(() => {
    const notebookIds = notebooks.map(notebook =>
      encodeURIComponent(notebook.path).replace(/[%.]/g, '-')
    );
    return `diff-view-${notebookIds.join('-')}`;
  }, [notebooks]);

  useEffect(() => {
    setTimeout(() => {
      new DiffView(
        jquery,
        `#${viewId}`,
        new MergeViewManager(),
        notebooks.map(notebook => notebook.path),
        notebooks.map(notebook => notebook.content)
      );
    }, 100);
  }, [notebooks, viewId]);

  return <div id={viewId} className="jupyter-notebook-diff"></div>;
}

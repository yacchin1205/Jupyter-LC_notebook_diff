declare var define:any;
define(JupyterNotebook);

import { DiffView as DiffViewBase, RelationMatchType } from 'lc_notebook_diff_components';

namespace JupyterNotebook {
    export class DiffView extends DiffViewBase {
        constructor(
            rootSelector: string, codeMirror: any, filenames: string[],
            filecontents: string[],
            errorCallback?: (url: string, jqXHR: any, textStatus: string, errorThrown: any) => void,
            {matchType = RelationMatchType.Fuzzy}: { matchType?: RelationMatchType } = {}
        ) {
            super($, rootSelector, codeMirror, filenames, filecontents, errorCallback, { matchType: matchType });
        }
    }
}
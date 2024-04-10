import { Notebook } from './Notebook';
import { Cell } from './Cell';
import { Relation, RelationMatchType } from './Relation';

export type MergeViewResult = {
  edit: {
    focus: () => void;
  };
};

export type MergeViewOptions = {
  value: string | undefined;
  origLeft: string | undefined;
  origRight: string | undefined;
  lineNumbers: boolean;
  mode: string;
  highlightDifferences: boolean;
  collapseIdentical: boolean;
  readOnly: boolean;
  extraKeys: {
    Esc: () => void;
  };
};

export type MergeViewProvider = {
  MergeView: (
    element: HTMLElement,
    options: MergeViewOptions
  ) => MergeViewResult;
};

export class DiffView {
  $: JQueryStatic;

  /** セレクタ */
  rootSelector: string;

  codeMirror: MergeViewProvider;

  /** コンテナ */
  $container: JQuery;

  /** マージするためのビュー */
  $mergeView: JQuery;

  /** ファイル名の配列 */
  loadingFilenames: string[];

  /** ファイルデータの配列 */
  loadingFilecontents: any[];

  /** ロードされたノートブック */
  notebooks: Notebook[];

  /** リレーション */
  relations: Relation[];

  /** マッチタイプ */
  matchType: RelationMatchType;

  /** 初期化 */
  constructor(
    $: JQueryStatic,
    rootSelector: string,
    codeMirror: MergeViewProvider,
    filenames: string[],
    filecontents: any[],
    errorCallback?: (
      url: string,
      jqXHR: any,
      textStatus: string,
      errorThrown: any
    ) => void,
    {
      matchType = RelationMatchType.Fuzzy
    }: { matchType?: RelationMatchType } = {}
  ) {
    this.$ = $;
    this.rootSelector = rootSelector;
    this.codeMirror = codeMirror;
    this.$container = $(this.rootSelector);
    this.$mergeView = $('<div class="merge-view"></div>');
    this.loadingFilenames = filenames;
    this.loadingFilecontents = filecontents;
    this.notebooks = [];
    this.relations = [];
    this.matchType = matchType;
    this.loadNext(
      errorCallback !== undefined
        ? errorCallback
        : url => {
            console.error('Failed to load content', url);
          }
    );
  }

  /** 次のNotebookをロードする */
  private loadNext(
    errorCallback: (
      url: string,
      jqXHR: any,
      textStatus: string,
      errorThrown: any
    ) => void
  ): void {
    console.log('loadNext', this.loadingFilenames);
    if (this.loadingFilenames.length === 0) {
      // 描画
      this.render();
    } else {
      // ロード
      const rawFilename = this.loadingFilenames.shift() as string;
      if (this.loadingFilecontents.length === 0) {
        const filename = encodeURI(rawFilename);
        this.$.getJSON(filename, data => {
          this.notebooks.push(new Notebook(this.$, rawFilename, data));
          if (this.notebooks.length >= 2) {
            const i = this.notebooks.length - 2;
            this.relations.push(
              new Relation(this.$, this.notebooks[i], this.notebooks[i + 1], {
                matchType: this.matchType
              })
            );
          }
          this.loadNext(errorCallback);
        }).fail((jqXHR, textStatus, errorThrown) => {
          errorCallback(filename, jqXHR, textStatus, errorThrown);
        });
      } else {
        const data = this.loadingFilecontents.shift();
        this.notebooks.push(new Notebook(this.$, rawFilename, data));
        if (this.notebooks.length >= 2) {
          const i = this.notebooks.length - 2;
          this.relations.push(
            new Relation(this.$, this.notebooks[i], this.notebooks[i + 1], {
              matchType: this.matchType
            })
          );
        }
        this.loadNext(errorCallback);
      }
    }
  }

  /** セルをハイライトする */
  private highlightCell(cellId: string | null): void {
    this.$container.find('.cell').removeClass('highlight');
    if (cellId !== null) {
      this.$container.find(`.cell[data-id="${cellId}"]`).addClass('highlight');
      for (const cell of this.getRelatedCellsById(cellId)) {
        this.$container
          .find(`.cell[data-id="${cell.id}"]`)
          .addClass('highlight');
      }
    }
  }

  /** リレーションを更新する */
  private updateRelationsView(): void {
    for (const relation of this.relations) {
      relation.updateView();
    }
  }

  /** リレーションを計算する */
  private updateRelations(): void {
    for (const relation of this.relations) {
      relation.updateRelation();
    }
  }

  /** マージビューを表示する */
  private showMergeView(cellId: string | undefined): void {
    if (cellId === undefined) {
      throw new Error('cellId is undefined');
    }
    const mergeViewElem = this.$mergeView[0];
    let notebooks: Array<Notebook | null> = [];
    if (this.notebooks.length === 2) {
      notebooks = [null, this.notebooks[0], this.notebooks[1]];
    } else {
      notebooks = this.notebooks;
    }

    const relatedCells = this.getRelatedCellsById(cellId);
    const targetCell = this.cellById(cellId) as Cell;
    const sources: Array<string | undefined> = [
      undefined,
      undefined,
      undefined
    ];
    for (let i = 0; i < 3; i++) {
      if (!notebooks[i]) {
        continue;
      }
      const notebook = notebooks[i] as Notebook;
      if (notebook === targetCell.notebook) {
        sources[i] = targetCell.sourceAll;
      } else {
        const cell = relatedCells
          .filter(cell => notebook.cellList.indexOf(cell) !== -1)
          .shift();
        if (!cell) {
          continue;
        }
        sources[i] = cell.sourceAll;
      }
    }

    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    const self = this;
    const options = {
      value: sources[1],
      origLeft: sources[0],
      origRight: sources[2],
      lineNumbers: true,
      mode: 'text/html',
      highlightDifferences: true,
      collapseIdentical: false,
      readOnly: true,
      extraKeys: {
        Esc: function () {
          self.hideMergeView();
        }
      }
    };
    this.$mergeView.show();
    this.$container.find('.dark').show();
    const mv = this.codeMirror.MergeView(mergeViewElem, options);
    mv.edit.focus();
  }

  /** マージビューを閉じる */
  private hideMergeView(): void {
    this.$mergeView.empty();
    this.$mergeView.hide();
    this.$container.find('.dark').hide();
  }

  /** 選択中の揃えるべきY座標を求める */
  private maxCellY(): number {
    let y: number = 0;
    for (const notebook of this.notebooks) {
      const cell = notebook.selectedCell();
      if (cell !== null) {
        y = Math.max(y, cell.y);
      }
    }
    return y;
  }

  /** セルの揃えをリセットする */
  private resetCellY() {
    this.$container.find('.cell').css('margin-top', 5);
  }

  /** 指定したセルを揃える */
  private alignCellY(y: number) {
    for (const notebook of this.notebooks) {
      const cell = notebook.selectedCell();
      if (cell !== null) {
        cell.y = y;
      }
    }
  }

  /** セルを揃える */
  private alignSelected(): void {
    this.resetCellY();
    this.alignCellY(this.maxCellY());
  }

  /** idからセルを検索する */
  private cellById(id: string | undefined): Cell | null {
    if (id === undefined) {
      return null;
    }
    for (const notebook of this.notebooks) {
      for (const cell of notebook.cellList) {
        if (cell.id === id) {
          return cell;
        }
      }
    }
    return null;
  }

  /** セルを選択する */
  private select(cell: Cell): void {
    for (const notebook of this.notebooks) {
      notebook.unselectAll();
      notebook.unmarkAll();
    }

    cell.select(true);
    cell.mark(true);
    for (const relatedCell of this.getRelatedCellsById(cell.id)) {
      relatedCell.select(true);
      relatedCell.mark(true);
    }
  }

  /** 描画を行う */
  private render(): void {
    this.updateRelations();

    // HTMLを生成する
    const $wrapper = this.$('<div class="wrapper"></div>');
    this.$container.empty();
    this.$container.append($wrapper);
    for (let i = 0; i < this.notebooks.length; i++) {
      $wrapper.append(this.notebooks[i].$view);
      if (i !== this.notebooks.length - 1) {
        $wrapper.append(this.relations[i].$view);
      }
    }
    this.$container.append('<div class="dark"></div>');
    this.$container.append(this.$mergeView);

    // イベントを設定する
    this.$container.on('click', '.open-button', e => {
      this.$(e.target).parent().parent().removeClass('closed');
      this.resetCellY();
      this.updateRelationsView();
      return false;
    });
    this.$container.on('click', '.close-button', e => {
      this.$(e.target).parent().parent().addClass('closed');
      this.resetCellY();
      this.updateRelationsView();
      return false;
    });
    this.$container.on('click', '.select-button', e => {
      const $cell = this.$(e.target).parent().parent();
      const cell = this.cellById($cell.attr('data-id'));
      if (cell !== null) {
        this.select(cell);
        this.alignSelected();
      }
      return false;
    });
    this.$container.on('click', '.cell', e => {
      this.showMergeView(this.$(e.currentTarget).attr('data-id'));
    });
    this.$container.on('mouseenter', '.cell', e => {
      this.highlightCell(this.$(e.currentTarget).attr('data-id') || null);
    });
    this.$container.on('mouseleave', '.cell', e => {
      this.highlightCell(null);
    });
    this.$container.on('click', '.dark', e => {
      this.hideMergeView();
    });

    if (this.notebooks.length === 2) {
      this.updateCellsStyle(this.notebooks[1], this.relations.slice(0, 1));
    } else {
      this.updateCellsStyle(this.notebooks[1], this.relations.slice(0, 1));
      this.updateCellsStyle(this.notebooks[2], this.relations.slice(0, 2));
    }

    setInterval(() => {
      this.updateRelationsView();
    });
  }

  /** 指定したNotebook内のすべてのCellのスタイルを更新する */
  private updateCellsStyle(notebook: Notebook, relations: Relation[]): void {
    relations.reverse();
    for (const cell of notebook.cellList) {
      const leftCellsList: Cell[][] = [];
      let rightCells: Cell[] = [cell];
      for (const relation of relations) {
        const leftCells: Cell[] = [];
        for (const rightCell of rightCells) {
          for (const leftCell of relation.relatedLeftCells[rightCell.id] ||
            []) {
            leftCells.push(leftCell);
          }
        }
        leftCellsList.push(leftCells);
        rightCells = leftCells;
      }
      cell.updateStyle(leftCellsList.reverse());
    }
  }

  /** 指定したCellに関連するCellを関連度順にすべて取得する */
  private getRelatedCellsById(cellId: string): Cell[] {
    const queue: string[] = [cellId];
    const related: Cell[] = [];
    const used: { [key: string]: boolean } = {};
    used[cellId] = true;
    while (queue.length) {
      const current = queue.shift() as string;
      for (const relation of this.relations) {
        for (const cell of relation.getRelatedCells(current)) {
          if (!used[cell.id]) {
            used[cell.id] = true;
            related.push(cell);
            queue.push(cell.id);
          }
        }
      }
    }
    return related;
  }
}

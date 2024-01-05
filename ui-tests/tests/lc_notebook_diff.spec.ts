import { IJupyterLabPage, expect, test } from '@jupyterlab/galata';
import { Page, test as treeTest } from '@playwright/test';

// https://github.com/jupyterlab/jupyterlab/blob/9844a6fdb680aeae28a4d6238433f751ce5a6204/galata/src/fixtures.ts#L319-L336
async function waitForLabApplication({ baseURL }, use) {
  const waitIsReady = async (
    page: Page,
    helpers: IJupyterLabPage
  ): Promise<void> => {
    await page.waitForSelector('#jupyterlab-splash', {
      state: 'detached'
    });
    //! not wait for launcher tab.
  };
  await use(waitIsReady);
}

async function waitForTreeApplication(page: Page) {
  await page.waitForSelector('.jp-FileBrowser-Panel', {
    state: 'visible'
  });
}

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({
  autoGoto: false,
  waitForApplication: waitForLabApplication
});
test('should emit an activation console message on JupyterLab', async ({
  page
}) => {
  const logs: string[] = [];

  page.on('console', message => {
    logs.push(message.text());
  });

  await page.goto();

  expect(
    logs.filter(
      s => s === 'JupyterLab extension lc_notebook_diff is activated!'
    )
  ).toHaveLength(1);
});

treeTest(
  'should emit an activation console message on Jupyter Notebook 7',
  async ({ page }) => {
    const logs: string[] = [];

    page.on('console', message => {
      logs.push(message.text());
    });

    await page.goto('http://localhost:8888/tree');
    await waitForTreeApplication(page);

    expect(
      logs.filter(
        s => s === 'JupyterLab extension lc_notebook_diff is activated!'
      )
    ).toHaveLength(1);
  }
);

test.use({
  autoGoto: true,
  waitForApplication: waitForLabApplication
});
test('should show the diff button on JupyterLab', async ({ page }) => {
  await page.waitForSelector('[data-id="lc_notebook_diff::main"]');
  const button = await page.$('[data-id="lc_notebook_diff::main"]');
  expect(button).toBeTruthy();
  await button?.click();

  const showDiffButton = await page.waitForSelector(
    'button.jupyter-notebook-diff-show-diff'
  );
  await showDiffButton?.waitForElementState('visible');
  expect(showDiffButton).toBeTruthy();
});

treeTest(
  'should show the diff button on Jupyter Notebook 7',
  async ({ page }) => {
    await page.goto('http://localhost:8888/tree');
    await waitForTreeApplication(page);

    await page.waitForSelector('[data-icon="notebook_diff::notebookdiff"]');
    const button = await page.$('[data-icon="notebook_diff::notebookdiff"]');
    expect(button).toBeTruthy();
    await button?.click();

    const showDiffButton = await page.waitForSelector(
      'button.jupyter-notebook-diff-show-diff'
    );
    await showDiffButton?.waitForElementState('visible');
    expect(showDiffButton).toBeTruthy();
  }
);

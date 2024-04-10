import React, { useState, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';

export type NotebookPath = string;

export type Props = {
  numberOfFiles: number;
  onFilesSelected?: (files: NotebookPath[]) => void;
};

export function SelectFiles({ numberOfFiles, onFilesSelected }: Props) {
  const [filenames, setFilenames] = useState<string[]>([]);

  const notifyFilesSelected = useCallback(
    (changedFilenames: string[]) => {
      if (!onFilesSelected) {
        return;
      }
      onFilesSelected(changedFilenames);
    },
    [onFilesSelected]
  );

  return (
    <Box className="jupyter-notebook-diff-files">
      {Array.from({ length: numberOfFiles }).map((_, index) => (
        <Grid
          container
          spacing={2}
          key={index}
          className="jupyter-notebook-diff-file"
        >
          <Grid item xs={2}>
            File #{index + 1}
          </Grid>
          <Grid item xs={9}>
            <input
              value={filenames[index] || ''}
              onChange={event => {
                const newFilenames = [...filenames];
                newFilenames[index] = event.target.value;
                setFilenames(newFilenames);
                notifyFilesSelected(newFilenames);
              }}
            />
          </Grid>
          <Grid item xs={1}>
            {index > 0 && (
              <button
                className="jp-mod-minimal jp-Button"
                onClick={() => {
                  const newFilenames = [...filenames];
                  const temp = newFilenames[index - 1];
                  newFilenames[index - 1] = newFilenames[index];
                  newFilenames[index] = temp;
                  setFilenames(newFilenames);
                  notifyFilesSelected(newFilenames);
                }}
              >
                <ArrowUpward />
              </button>
            )}
            {index < numberOfFiles - 1 && (
              <button
                className="jp-mod-minimal jp-Button"
                onClick={() => {
                  const newFilenames = [...filenames];
                  const temp = newFilenames[index + 1];
                  newFilenames[index + 1] = newFilenames[index];
                  newFilenames[index] = temp;
                  setFilenames(newFilenames);
                  notifyFilesSelected(newFilenames);
                }}
              >
                <ArrowDownward />
              </button>
            )}
          </Grid>
        </Grid>
      ))}
    </Box>
  );
}

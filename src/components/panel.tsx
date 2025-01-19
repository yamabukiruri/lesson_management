import { PropsWithChildren } from 'react';
import { Card, SxProps } from '@mui/material';

interface PanelProps {
  sx?: SxProps;
}

export default function Panel({ children, sx }: PropsWithChildren<PanelProps>) {
  const defaultSx = {
    marginBottom: '32px',
    padding: '16px',
    alignSelf: 'start',
  };

  return <Card sx={{ ...defaultSx, ...sx }}>{children}</Card>;
}
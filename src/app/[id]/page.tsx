'use client';

import Panel from '@/components/panel';
import { Box, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import db from '../../firebase'
import { useEffect, useState } from 'react';
import { doc, getDoc, DocumentData } from 'firebase/firestore'; 
import { CardTitle } from '@/components/title';
import { useParams } from 'next/navigation';

export default function Home() {
  const params = useParams();
  const id = params['id'] as string;
  const [student, setStudent] = useState<DocumentData>();

  useEffect(() => {
    const docRef = doc(db, 'students', id);
    getDoc(docRef).then((docSnap) => {
      setStudent(docSnap.data());
    });
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <Panel>
        <CardTitle label='生徒情報' />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            rowGap: 2,
            columnGap: 3,
          }}
        >
          <Typography>名前：　{student?.name}</Typography>
          <Typography>年齢：　{student?.age}</Typography>
        </Box>
      </Panel>
    </Box>
  );
}

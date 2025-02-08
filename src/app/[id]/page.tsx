'use client';

import Panel from '@/components/panel';
import { Box, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import db from '../../firebase'
import { ChangeEvent, useEffect, useState } from 'react';
import { doc, getDoc, DocumentData } from 'firebase/firestore'; 
import { CardTitle } from '@/components/title';
import { useParams } from 'next/navigation';

export default function Home() {
  const params = useParams();
  const id = params['id'] as string;
  const [student, setStudent] = useState<DocumentData>({
    lastName: '',
    firstName: '',
    age: '',
    startDate: '',
    maxCount: 0,
    attendedDate: [],
    schedule: [],
  });

  useEffect(() => {
    if (Number(id) > 0 && Number.isInteger(Number(id))) { //idが0以上かつ整数かチェック
      const fetchStudent = async () => {
        const docRef = doc(db, 'students', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStudent(docSnap.data());
        } else {
          console.warn('データがありません');
        }
      };
      fetchStudent();
    }
  }, []);

  const handleTextField = (e: ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    switch (name) {
      case 'lastName':
        setStudent(prevState => ({
          ...prevState,
          lastName: value,
        }));
        break;
      case 'firstName':
        setStudent(prevState => ({
          ...prevState,
          firstName: value,
        }));
        break;
      case 'age':
        setStudent(prevState => ({
          ...prevState,
          age: value,
        }));
        break;
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Panel>
        <CardTitle label='生徒情報' />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            rowGap: 2,
            columnGap: 3,
          }}
        >
          <TextField label="姓" variant="filled" name="lastName" value={student.lastName} onChange={handleTextField} />
          <TextField label="名" variant="filled" name="firstName" value={student.firstName} onChange={handleTextField} />
          <TextField label="年齢" variant="filled" name="age" value={student.age} onChange={handleTextField} />
        </Box>
      </Panel>
    </Box>
  );
}

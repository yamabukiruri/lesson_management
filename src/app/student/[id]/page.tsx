'use client';

import Panel from '@/components/panel';
import { Badge, Box, Divider, TextField, Typography } from '@mui/material';
import db from '../../../firebase'
import { ChangeEvent, useEffect, useState } from 'react';
import { doc, getDoc, DocumentData } from 'firebase/firestore'; 
import { CardTitle } from '@/components/title';
import { useParams } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import { DateCalendar, LocalizationProvider, PickersDay } from '@mui/x-date-pickers';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

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
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null); // 選択した日

  useEffect(() => {
    if (Number(id) > 0 && Number.isInteger(Number(id))) { //idが0以上かつ整数かチェック
      const fetchStudent = async () => {
        const docRef = doc(db, 'students', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudent({
            ...data,
            startDate: data.startDate.toDate().toISOString().split("T")[0],
            attendedDate: data.attendedDate.map((date: string) => dayjs(date.split(" ")[0])),
            schedule: data.schedule.map((date: string) => dayjs(date.split(" ")[0])),
          });
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
      case 'startDate':
        setStudent(prevState => ({
          ...prevState,
          startDate: value,
        }));
        break;
      case 'maxCount':
        setStudent(prevState => ({
          ...prevState,
          maxCount: value,
        }));
        break;
    }
  }

  const handleCalendar = (day: Dayjs) => {
    const today = dayjs().startOf("day");
    if (day.isBefore(today, "day")) {
      return; // 昨日以前は選択できない
    }
    setStudent((prevState) => {
      const exists = prevState.schedule.some((date: dayjs.Dayjs) => date.isSame(day, "day"));
      const newSchedule = exists
        ? prevState.schedule.filter((date: dayjs.Dayjs) => !date.isSame(day, "day")) // クリックで削除
        : [...prevState.schedule, day]; // クリックで追加

      return { ...prevState, schedule: newSchedule };
    });

    setSelectedDate(day); // カレンダーの選択状態を更新
  };

  //スケジュールをハイライト
  const CustomDay = (props: { day: Dayjs }) => {
    const { day, ...other } = props;
    const formattedDay = day.format("YYYY-MM-DD");

    const isScheduled = student.schedule.some((date: { format: (arg0: string) => string; }) => date.format("YYYY-MM-DD") === formattedDay);
    const isAttended = student.attendedDate.some((date: { format: (arg0: string) => string; }) => date.format("YYYY-MM-DD") === formattedDay);

    return (
      <PickersDay
        onDaySelect={() => {}} 
        outsideCurrentMonth={false} 
        isFirstVisibleCell={false} 
        isLastVisibleCell={false} {...other}
        day={day}
        selected={selectedDate?.isSame(day, "day")}
        sx={{
          backgroundColor: isAttended ? '#C7BFCA !important' : (selectedDate?.isSame(day, "day") && isScheduled) || isScheduled ? "#F4B9B9 !important" : "transparent !important",
          color: 'black !important',
          borderRadius: "50%",
        }}
        onClick={() => handleCalendar(day)}
      />
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Panel>
        <CardTitle label='生徒情報' />
        <Typography sx={{ marginBottom: 1 }}>基本情報</Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            rowGap: 2,
            columnGap: 3,
            marginBottom: 3,
          }}
        >
          <TextField label="姓" variant="filled" name="lastName" value={student.lastName} onChange={handleTextField} />
          <TextField label="名" variant="filled" name="firstName" value={student.firstName} onChange={handleTextField} />
          <TextField label="年齢" variant="filled" name="age" value={student.age} type="number" onChange={handleTextField} />
        </Box>
        <Divider />
        <Typography sx={{ marginTop: 2, marginBottom: 1 }}>レッスン情報</Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            rowGap: 2,
            columnGap: 3,
            marginBottom: 3,
          }}
        >
          <TextField label="レッスン開始日" variant="filled" name="startDate" value={student.startDate} type="date" onChange={handleTextField} />
          <TextField label="年間レッスン回数上限" variant="filled" name="maxCount" value={student.maxCount} type="number" onChange={handleTextField} />
        </Box>
        <Divider />
        <Typography sx={{ marginTop: 2, marginBottom: 1 }}>スケジュール</Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            slots={{ day: (dayProps) => <CustomDay {...dayProps} /> }}
            sx={{ margin: 0 }}
          />
        </LocalizationProvider>
      </Panel>
    </Box>
  );
}



'use client';

import Panel from '@/components/panel';
import { Box, Divider, TextField, Typography } from '@mui/material';
import db from '../../../firebase'
import { ChangeEvent, useEffect, useState } from 'react';
import { doc, getDoc, DocumentData, setDoc, updateDoc, Timestamp, collection, addDoc } from 'firebase/firestore'; 
import { CardTitle } from '@/components/title';
import { useParams, useRouter } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import { DateCalendar, LocalizationProvider, PickersDay } from '@mui/x-date-pickers';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MainBtn } from '@/components/button';

export default function Home() {
  const params = useParams();
  const id = params['id'] as string;
  const router = useRouter();
  const [student, setStudent] = useState<DocumentData>({
    lastName: '',
    firstName: '',
    age: '',
    startDate: '',
    maxCount: 0,
    attendedDate: [],
    absentDate: [],
    schedule: [],
    hour: 0,
    minute: 0,
  });
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null); //カレンダーで選択した値
  const [attendedDateList, setAttendedDateList] = useState<Dayjs[]>([]); //今までの出席日
  const [absentDateList, setAbsentDateList] = useState<Dayjs[]>([]); //今までの欠席日

  useEffect(() => {
    if (id !== '0') {
      const fetchStudent = async () => {
        const docRef = doc(db, 'students', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudent({
            ...data,
            startDate: data.startDate.toDate().toISOString().split("T")[0],
            schedule: data.schedule.map((date: string) => dayjs(date.split(" ")[0])),
          });
          setAttendedDateList(data.attendedDate.map((date: string) => dayjs(date.split(" ")[0])));
          setAbsentDateList(data.absentDate.map((date: string) => dayjs(date.split(" ")[0])));
        } else {
          console.warn('データがありません');
          router.push('/not-found');
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
      case 'hour':
        setStudent(prevState => ({
          ...prevState,
          hour: value,
        }));
        break;
      case 'minute':
        setStudent(prevState => ({
          ...prevState,
          minute: value,
        }));
        break;
    }
  }

  const handleCalendar = (day: Dayjs) => {
    const lastAttendedDate = attendedDateList.length > 0 ? attendedDateList[attendedDateList.length - 1].startOf("day") : null;
    const lastAbsentDate = absentDateList.length > 0 ? absentDateList[absentDateList.length - 1].startOf("day") : null;
    const today = dayjs().startOf("day");
    if (day.isBefore(today, "day") || lastAttendedDate?.isSame(day, "day") || lastAbsentDate?.isSame(day, "day")) {
      return; // 昨日以前は選択できない。また、本日出血登録が完了しているなら、本日も選択できない。
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
    const isAttended = attendedDateList.some((date: { format: (arg0: string) => string; }) => date.format("YYYY-MM-DD") === formattedDay);
    const isAbsent = absentDateList.some((date: { format: (arg0: string) => string; }) => date.format("YYYY-MM-DD") === formattedDay);

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
          border: isAbsent ? '1px dotted #C7BFCA !important' : undefined,
        }}
        onClick={() => handleCalendar(day)}
      />
    );
  };

  const registData = async () => {
    //新規作成
    if(id === '0'){
      const docRef = collection(db, "students");
      await addDoc(docRef, {
        ...student,
        startDate: Timestamp.fromDate(dayjs(student.startDate).startOf('day').toDate()),
        schedule: student.schedule.map((date: Dayjs) => date.startOf('day').set('hour', student.hour).set('minute', student.minute).set('second', 0).format("YYYY-MM-DD HH:mm:ss")).sort((a: string, b: string) => dayjs(a, "YYYY-MM-DD HH:mm:ss").valueOf() - dayjs(b, "YYYY-MM-DD HH:mm:ss").valueOf()), //形を整えた後、古い順にソート
      })
    //更新
    }else{
      const docRef = doc(db, "students", id);
      await updateDoc(docRef, {
        ...student,
        startDate: Timestamp.fromDate(dayjs(student.startDate).startOf('day').toDate()),
        schedule: student.schedule.map((date: Dayjs) => date.startOf('day').set('hour', student.hour).set('minute', student.minute).set('second', 0).format("YYYY-MM-DD HH:mm:ss")).sort((a: string, b: string) => dayjs(a, "YYYY-MM-DD HH:mm:ss").valueOf() - dayjs(b, "YYYY-MM-DD HH:mm:ss").valueOf()), //形を整えた後、古い順にソート
      })
    }
    router.push('/');
  }

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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              columnGap: 1,
            }}
          >
            <TextField label="レッスン時間（時）" variant="filled" name="hour" value={student.hour} type="number" onChange={handleTextField} />
            <Typography>：</Typography>
            <TextField label="レッスン時間（分）" variant="filled" name="minute" value={student.minute} type="number" onChange={handleTextField} />
            <Typography>〜</Typography>
          </Box>
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
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <MainBtn label="保存" onClick={registData} />
      </Box>
    </Box>
  );
}



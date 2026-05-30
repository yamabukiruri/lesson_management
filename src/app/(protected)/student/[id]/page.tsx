"use client";

import Panel from "@/components/panel";
import { Box, Divider, Typography } from "@mui/material";
import { db } from "@/firebase";
import { ChangeEvent, useEffect, useState } from "react";
import {
  doc,
  getDoc,
  DocumentData,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { CardTitle, SectionTitle } from "@/components/title";
import { notFound, useParams, useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import {
  DateCalendar,
  LocalizationProvider,
  PickersDay,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MainBtn } from "@/components/button";
import { theme } from "@/library/theme";
import {
  CustomCheckbox,
  CustomPulldown,
  CustomTextField,
} from "@/components/input";
import { Notice } from "@/components/notice";
import { prefList } from "@/library/fixed-data";
import { useAuth } from "@/app/context/auth-context";
import {
  COUNTED_STATUSES,
  countConsumed,
  getContractYearRange,
  toLesson,
  type Lesson,
} from "@/utils/lesson";

export default function StudentId() {
  const { user } = useAuth();
  const params = useParams();
  const id = params["id"] as string;
  const router = useRouter();
  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0];
  const [student, setStudent] = useState<DocumentData>({
    lastName: "",
    firstName: "",
    lastNameKana: "",
    firstNameKana: "",
    age: "",
    startDate: defaultDate,
    maxCount: 0,
    hour: 0,
    minute: 0,
    gender: 0,
    pref: 0,
    city: "",
    street: "",
    building: "",
    isWithdrawn: false,
  });
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null); //カレンダーで選択した値
  const [lessons, setLessons] = useState<Lesson[]>([]); //この生徒の既存レッスン
  const [scheduledDraft, setScheduledDraft] = useState<Dayjs[]>([]); //編集中の予定日
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (id === "0") return;

    const fetchStudent = async () => {
      const docRef = doc(db, "users", user.uid, "students", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setIsNotFound(true);
        return;
      }
      const data = docSnap.data();
      setStudent({
        lastName: data.lastName ?? "",
        firstName: data.firstName ?? "",
        lastNameKana: data.lastNameKana ?? "",
        firstNameKana: data.firstNameKana ?? "",
        age: data.age ?? "",
        startDate: data.startDate
          ? data.startDate.toDate().toISOString().split("T")[0]
          : defaultDate,
        maxCount: data.maxCount ?? 0,
        hour: data.hour ?? 0,
        minute: data.minute ?? 0,
        gender: data.gender ?? 0,
        pref: data.pref ?? 0,
        city: data.city ?? "",
        street: data.street ?? "",
        building: data.building ?? "",
        isWithdrawn: data.isWithdrawn ?? false,
      });

      const q = query(
        collection(db, "users", user.uid, "lessons"),
        where("studentId", "==", id)
      );
      const lessonSnap = await getDocs(q);
      const fetched = lessonSnap.docs.map((d) => toLesson(d.id, d.data()));
      setLessons(fetched);
      setScheduledDraft(
        fetched.filter((l) => l.status === "scheduled").map((l) => l.date)
      );
    };
    fetchStudent();
    // defaultDate は描画毎の値なので依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const handleTextField = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudent((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // ひらがな(長音符を含む)のみ許可
  const KANA_REGEX = /^[぀-ゟー]+$/;

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};

    if (!String(student.lastName).trim()) e.lastName = "姓を入力してください";
    if (!String(student.firstName).trim()) e.firstName = "名を入力してください";

    if (!String(student.lastNameKana ?? "").trim()) {
      e.lastNameKana = "ふりがな(姓)を入力してください";
    } else if (!KANA_REGEX.test(student.lastNameKana)) {
      e.lastNameKana = "ひらがなで入力してください";
    }
    if (!String(student.firstNameKana ?? "").trim()) {
      e.firstNameKana = "ふりがな(名)を入力してください";
    } else if (!KANA_REGEX.test(student.firstNameKana)) {
      e.firstNameKana = "ひらがなで入力してください";
    }

    const ageNum = Number(student.age);
    if (student.age === "" || student.age === null || student.age === undefined) {
      e.age = "年齢を入力してください";
    } else if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) {
      e.age = "0〜120の整数で入力してください";
    }

    const maxCountNum = Number(student.maxCount);
    if (
      student.maxCount === "" ||
      student.maxCount === null ||
      student.maxCount === undefined
    ) {
      e.maxCount = "レッスン回数上限を入力してください";
    } else if (!Number.isInteger(maxCountNum) || maxCountNum < 1) {
      e.maxCount = "1以上の整数で入力してください";
    }

    const hourNum = Number(student.hour);
    if (student.hour === "" || student.hour === null || student.hour === undefined) {
      e.hour = "時を入力してください";
    } else if (!Number.isInteger(hourNum) || hourNum < 0 || hourNum > 23) {
      e.hour = "0〜23で入力してください";
    }

    const minuteNum = Number(student.minute);
    if (
      student.minute === "" ||
      student.minute === null ||
      student.minute === undefined
    ) {
      e.minute = "分を入力してください";
    } else if (!Number.isInteger(minuteNum) || minuteNum < 0 || minuteNum > 59) {
      e.minute = "0〜59で入力してください";
    }

    if (!student.startDate || !dayjs(student.startDate).isValid()) {
      e.startDate = "レッスン開始日を入力してください";
    }

    return e;
  };

  const handleCalendar = (day: Dayjs) => {
    const startOfToday = dayjs().startOf("day");
    // 過去日は予定にできない
    if (day.isBefore(startOfToday, "day")) return;
    // 既に出席/欠席が登録済みの日は変更できない
    const consumedOnDay = lessons.some(
      (l) => COUNTED_STATUSES.includes(l.status) && l.date.isSame(day, "day")
    );
    if (consumedOnDay) return;

    setScheduledDraft((prev) => {
      const exists = prev.some((d) => d.isSame(day, "day"));
      return exists
        ? prev.filter((d) => !d.isSame(day, "day")) // クリックで削除
        : [...prev, day]; // クリックで追加
    });
    setSelectedDate(day);
  };

  //スケジュール・出欠をハイライト
  const CustomDay = (props: { day: Dayjs }) => {
    const { day, ...other } = props;

    const isScheduled = scheduledDraft.some((d) => d.isSame(day, "day"));
    const isAttended = lessons.some(
      (l) => l.status === "attended" && l.date.isSame(day, "day")
    );
    const isAbsent = lessons.some(
      (l) => l.status === "absent" && l.date.isSame(day, "day")
    );

    return (
      <PickersDay
        onDaySelect={() => {}}
        outsideCurrentMonth={false}
        isFirstVisibleCell={false}
        isLastVisibleCell={false}
        {...other}
        day={day}
        selected={selectedDate?.isSame(day, "day")}
        sx={{
          fontFamily: theme.typography.fontFamily,
          fontWeight: "700 !important",
          backgroundColor: isAttended
            ? `${theme.palette.secondary.main} !important`
            : isScheduled
            ? `${theme.palette.primary.main} !important`
            : "transparent !important",
          color: "black !important",
          borderRadius: "50%",
          border: isAbsent
            ? `1px dotted ${theme.palette.primary.main} !important`
            : undefined,
        }}
        onClick={() => handleCalendar(day)}
      />
    );
  };

  const registData = async () => {
    if (!user) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const studentData = {
      lastName: student.lastName,
      firstName: student.firstName,
      lastNameKana: student.lastNameKana,
      firstNameKana: student.firstNameKana,
      age: student.age,
      gender: student.gender,
      pref: student.pref,
      city: student.city,
      street: student.street,
      building: student.building,
      hour: student.hour,
      minute: student.minute,
      maxCount: student.maxCount,
      isWithdrawn: student.isWithdrawn,
      startDate: Timestamp.fromDate(
        dayjs(student.startDate).startOf("day").toDate()
      ),
    };

    const studentsRef = collection(db, "users", user.uid, "students");
    const studentRef = id === "0" ? doc(studentsRef) : doc(studentsRef, id);
    const studentId = studentRef.id;

    const batch = writeBatch(db);
    if (id === "0") {
      batch.set(studentRef, studentData);
    } else {
      batch.update(studentRef, studentData);
    }

    // 予定レッスンの差分反映（出席/欠席済みは触らない）
    const hourNum = Number(student.hour);
    const minuteNum = Number(student.minute);
    const existingScheduled = lessons.filter((l) => l.status === "scheduled");

    const toCreate = scheduledDraft.filter(
      (d) => !existingScheduled.some((l) => l.date.isSame(d, "day"))
    );
    const toDelete = existingScheduled.filter(
      (l) => !scheduledDraft.some((d) => d.isSame(l.date, "day"))
    );

    const lessonsRef = collection(db, "users", user.uid, "lessons");
    toCreate.forEach((d) => {
      const dt = d
        .startOf("day")
        .hour(hourNum)
        .minute(minuteNum)
        .second(0);
      batch.set(doc(lessonsRef), {
        studentId,
        date: Timestamp.fromDate(dt.toDate()),
        status: "scheduled",
      });
    });
    toDelete.forEach((l) => {
      batch.delete(doc(lessonsRef, l.id));
    });

    await batch.commit();

    setSnackbarOpen(true);
    setTimeout(() => router.back(), 1500);
  };

  if (isNotFound) {
    notFound();
  }

  const contractRange =
    student.startDate && dayjs(student.startDate).isValid()
      ? getContractYearRange(dayjs(student.startDate))
      : null;
  const consumed = contractRange ? countConsumed(lessons, contractRange) : 0;

  return (
    <Box sx={{ width: "100%" }}>
      <Panel>
        <CardTitle label="生徒情報" />
        <SectionTitle label="基本情報" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            rowGap: 2,
            columnGap: 3,
            marginBottom: 3,
          }}
        >
          <CustomTextField
            label="姓"
            name="lastName"
            value={student.lastName}
            required
            error={!!errors.lastName}
            helperText={errors.lastName}
            onChange={handleTextField}
          />
          <CustomTextField
            label="名"
            name="firstName"
            value={student.firstName}
            required
            error={!!errors.firstName}
            helperText={errors.firstName}
            onChange={handleTextField}
          />
          <CustomTextField
            label="ふりがな(姓)"
            name="lastNameKana"
            value={student.lastNameKana ?? ""}
            required
            error={!!errors.lastNameKana}
            helperText={errors.lastNameKana}
            onChange={handleTextField}
          />
          <CustomTextField
            label="ふりがな(名)"
            name="firstNameKana"
            value={student.firstNameKana ?? ""}
            required
            error={!!errors.firstNameKana}
            helperText={errors.firstNameKana}
            onChange={handleTextField}
          />
          <CustomTextField
            label="年齢"
            name="age"
            value={student.age}
            type="number"
            required
            error={!!errors.age}
            helperText={errors.age}
            onChange={handleTextField}
          />
          <CustomPulldown
            label="性別"
            name="gender"
            value={student.gender}
            options={[
              { id: 0, name: "未選択" },
              { id: 1, name: "男" },
              { id: 2, name: "女" },
            ]}
            onChange={(newValue: number) => {
              setStudent((prevState) => ({
                ...prevState,
                gender: newValue,
              }));
            }}
          />
        </Box>
        <Divider />
        <SectionTitle label="住所" sx={{ marginTop: 2 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            rowGap: 2,
            columnGap: 3,
            marginBottom: 3,
          }}
        >
          <CustomPulldown
            label="都道府県"
            name="pref"
            value={student.pref}
            options={prefList}
            onChange={(newValue: number) => {
              setStudent((prevState) => ({
                ...prevState,
                pref: newValue,
              }));
            }}
          />
          <Box sx={{ display: { xs: "none", sm: "block" } }} />
          <CustomTextField
            label="市区町村"
            name="city"
            value={student.city}
            onChange={handleTextField}
          />
          <CustomTextField
            label="番地"
            name="street"
            value={student.street}
            onChange={handleTextField}
          />
          <CustomTextField
            label="ビル名・部屋番号"
            name="building"
            value={student.building}
            onChange={handleTextField}
          />
        </Box>
        <Divider />
        <SectionTitle label="レッスン情報" sx={{ marginTop: 2 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            rowGap: 2,
            columnGap: 3,
            marginBottom: 3,
          }}
        >
          <CustomTextField
            label="レッスン開始日"
            name="startDate"
            value={student.startDate}
            type="date"
            required
            error={!!errors.startDate}
            helperText={errors.startDate}
            onChange={handleTextField}
          />
          <CustomTextField
            label="年間レッスン回数上限"
            name="maxCount"
            value={student.maxCount}
            type="number"
            required
            error={!!errors.maxCount}
            helperText={errors.maxCount}
            onChange={handleTextField}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              columnGap: 1,
            }}
          >
            <CustomTextField
              label="レッスン時間(時)"
              name="hour"
              value={student.hour}
              type="number"
              required
              error={!!errors.hour}
              helperText={errors.hour}
              onChange={handleTextField}
            />
            <Typography>：</Typography>
            <CustomTextField
              label="レッスン時間(分)"
              name="minute"
              value={student.minute}
              type="number"
              required
              error={!!errors.minute}
              helperText={errors.minute}
              onChange={handleTextField}
            />
            <Typography>〜</Typography>
          </Box>
        </Box>
        {id !== "0" && contractRange && (
          <Typography
            sx={{
              fontFamily: theme.typography.fontFamily,
              marginBottom: 2,
              color:
                consumed >= Number(student.maxCount)
                  ? theme.palette.primary.dark
                  : "inherit",
              fontWeight: consumed >= Number(student.maxCount) ? 700 : 400,
            }}
          >
            今年度の消化レッスン: {consumed} / {student.maxCount} 回
            <Box
              component="span"
              sx={{ fontSize: "0.8rem", color: "#888", marginLeft: 1 }}
            >
              （{contractRange.start.format("YYYY/MM/DD")}〜
              {contractRange.end.subtract(1, "day").format("YYYY/MM/DD")}）
            </Box>
          </Typography>
        )}
        <Divider />
        <SectionTitle label="今回分スケジュール" sx={{ marginTop: 2 }} />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            slots={{ day: (dayProps) => <CustomDay {...dayProps} /> }}
            sx={{ margin: 0 }}
          />
        </LocalizationProvider>
        <Divider />
        <SectionTitle label="ステータス" sx={{ marginTop: 2 }} />
        <Box sx={{ marginBottom: 1 }}>
          <CustomCheckbox
            label="退会済み"
            name="isWithdrawn"
            checked={!!student.isWithdrawn}
            onChange={(checked) =>
              setStudent((prev) => ({ ...prev, isWithdrawn: checked }))
            }
          />
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#888",
              fontFamily: theme.typography.fontFamily,
              marginLeft: "32px",
            }}
          >
            チェックすると本日の生徒一覧・名簿印刷から除外されます。
          </Typography>
        </Box>
      </Panel>
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <MainBtn label="保存" sx={{ width: 160 }} onClick={registData} />
      </Box>
      <Notice
        open={snackbarOpen}
        message="保存しました"
        onClose={() => setSnackbarOpen(false)}
      />
    </Box>
  );
}

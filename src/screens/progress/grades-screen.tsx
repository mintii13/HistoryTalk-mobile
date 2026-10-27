import { useAuthStore } from '@/features/auth/store';
import StudentGradesScreen from '@/screens/classroom/student-grades-screen';

import ProgressScreen from './progress-screen';

/** /grades: hoc sinh xem bang diem bai tap, khach hang xem tien do hoc tap (giong web). */
export default function GradesScreen() {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'SCHOOL_STUDENT' ? <StudentGradesScreen /> : <ProgressScreen />;
}

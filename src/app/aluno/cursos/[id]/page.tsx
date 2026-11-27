import { StudentCourseView } from 'src/sections/learning-student/view';

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <StudentCourseView id={params.id} />;
}

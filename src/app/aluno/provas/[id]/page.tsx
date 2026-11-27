import { StudentAttemptView } from 'src/sections/learning-student/view';

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <StudentAttemptView id={params.id} />;
}

import { GroupEditView } from 'src/sections/group/view';

type PageProps = {
  params: {
    id: string;
  };
};

export const metadata = {
  title: 'Editar Grupo | Pro-Educ Admin',
};

export default function GroupEditPage({ params }: PageProps) {
  return <GroupEditView id={params.id} />;
}

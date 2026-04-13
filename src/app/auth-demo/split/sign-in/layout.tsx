import { AuthSplitLayout } from 'src/layouts/auth-split';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <AuthSplitLayout section={{ title: 'Bem-vindo ao sistema ProEduc' }}>{children}</AuthSplitLayout>
  );
}

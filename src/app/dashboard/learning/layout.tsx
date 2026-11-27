import { LearningModuleGate } from 'src/sections/learning/learning-module-gate';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <LearningModuleGate>{children}</LearningModuleGate>;
}

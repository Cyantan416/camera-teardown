import LangProvider from '@/components/LangProvider';
import Page from '@/components/Page';

export default function Home() {
  return (
    <LangProvider>
      <Page />
    </LangProvider>
  );
}

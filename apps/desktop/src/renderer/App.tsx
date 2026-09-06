import { useEffect, useState } from 'react';
import type { AppVersion } from '@app/shared';

export function App(): React.JSX.Element {
  const [version, setVersion] = useState<AppVersion | null>(null);

  useEffect(() => {
    void window.desktop.getVersion().then(setVersion);
  }, []);

  return (
    <main>
      <h1>Manufacturing document extraction</h1>
      <p>
        {version
          ? `app ${version.app} · electron ${version.electron}`
          : 'loading…'}
      </p>
    </main>
  );
}

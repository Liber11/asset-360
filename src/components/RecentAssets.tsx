import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@cognite/aura/components/card';
import { IconHistory } from '@tabler/icons-react';

import { refKey } from '../domain/cdm';
import { useRecentAssetsViewModel } from '../viewmodels/useRecentAssetsViewModel';

export function RecentAssets() {
  const { recent, open } = useRecentAssetsViewModel();

  if (recent.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2">
          <IconHistory aria-hidden className="size-4" />
          Recently viewed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {recent.map((asset) => (
            <Button key={refKey(asset.ref)} variant="outline" size="sm" onClick={() => open(asset)}>
              {asset.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

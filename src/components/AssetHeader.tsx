import { Badge } from '@cognite/aura/components/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent } from '@cognite/aura/components/card';
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { IconArrowLeft } from '@tabler/icons-react';
import { Fragment } from 'react';

import { refKey } from '../domain/cdm';
import { useAssetHeaderViewModel } from '../viewmodels/useAssetHeaderViewModel';

import { PanelStatus } from './PanelStatus';

export function AssetHeader() {
  const { status, asset, errorMessage, retry, close } = useAssetHeaderViewModel();

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={close}>
            <IconArrowLeft aria-hidden className="size-4" />
            New search
          </Button>
        </div>

        {status === 'not-found' && (
          <EmptyState type="not-found">
            <EmptyStateTitle>Asset not found</EmptyStateTitle>
            <EmptyStateDescription>It may have been deleted or you may not have access to it.</EmptyStateDescription>
          </EmptyState>
        )}

        {status !== 'not-found' && <PanelStatus status={status} errorMessage={errorMessage} onRetry={retry} />}

        {status === 'success' && asset && (
          <>
            {asset.ancestors.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {asset.ancestors.map((ancestor) => (
                    <Fragment key={refKey(ancestor.ref)}>
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-muted-foreground">{ancestor.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </Fragment>
                  ))}
                  <BreadcrumbItem>
                    <BreadcrumbPage>{asset.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}

            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">{asset.name}</h2>
              <span className="font-mono text-sm text-muted-foreground">{asset.ref.externalId}</span>
              {asset.description && <p className="text-muted-foreground">{asset.description}</p>}
            </div>

            {(asset.typeName || asset.tags.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {asset.typeName && <Badge variant="nordic">{asset.typeName}</Badge>}
                {asset.tags.map((tag) => (
                  <Badge key={tag} variant="gray">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

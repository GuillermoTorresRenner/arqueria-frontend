import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminSections,
  useUpdateBlock,
  useUpdateSection,
} from '@/hooks/use-content';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlockEditor } from './BlockEditor';
import type { Block } from '@/types';

export function ContentAdminPage() {
  const { data: sections, isLoading } = useAdminSections();
  const updateSection = useUpdateSection();
  const updateBlock = useUpdateBlock();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Block | null>(null);

  const toggleSection = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Contenido</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edita los textos e imágenes de la landing. Los cambios se publican al guardar.
        </p>
      </header>

      <div className="space-y-4">
        {sections?.map((section) => {
          const isOpen = expanded[section.key] ?? true;
          return (
            <Card key={section.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex items-center gap-2 text-left"
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle>{section.title}</CardTitle>
                  <Badge variant="outline" className="ml-1">
                    /{section.key}
                  </Badge>
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    updateSection.mutate(
                      { id: section.id!, isActive: !section.isActive },
                      {
                        onSuccess: () =>
                          toast.success(
                            section.isActive ? 'Sección oculta' : 'Sección visible',
                          ),
                        onError: () => toast.error('No se pudo actualizar'),
                      },
                    )
                  }
                >
                  {section.isActive ? (
                    <>
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                      Oculta
                    </>
                  )}
                </Button>
              </CardHeader>

              {isOpen && (
                <CardContent className="space-y-2">
                  {section.blocks.length === 0 && (
                    <p className="py-4 text-sm text-muted-foreground">
                      Esta sección no tiene bloques.
                    </p>
                  )}
                  {section.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between rounded-md border px-4 py-3"
                    >
                      <div className="min-w-0">
                        <Badge variant="secondary">{block.type}</Badge>
                        <span className="ml-3 truncate text-sm text-muted-foreground">
                          {String(
                            (block.data as Record<string, unknown>).title ??
                              (block.data as Record<string, unknown>).question ??
                              '—',
                          )}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateBlock.mutate({
                              id: block.id,
                              isActive: !block.isActive,
                            })
                          }
                          aria-label={block.isActive ? 'Ocultar bloque' : 'Mostrar bloque'}
                        >
                          {block.isActive ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => setEditing(block)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {editing && (
        <BlockEditor block={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

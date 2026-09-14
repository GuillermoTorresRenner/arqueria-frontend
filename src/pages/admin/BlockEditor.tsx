import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateBlock } from '@/hooks/use-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Block, BlockType } from '@/types';

/// Campos editables por tipo de bloque. Mantener esta tabla alineada con los
/// tipos que renderiza BlockRenderer: si se añade uno allí, se añade aquí.
const FIELDS: Record<
  BlockType,
  { name: string; label: string; type: 'text' | 'textarea' | 'html' }[]
> = {
  HERO: [
    { name: 'title', label: 'Título', type: 'text' },
    { name: 'subtitle', label: 'Antetítulo', type: 'text' },
    { name: 'text', label: 'Texto', type: 'textarea' },
    { name: 'ctaLabel', label: 'Texto del botón', type: 'text' },
    { name: 'ctaHref', label: 'Enlace del botón', type: 'text' },
    { name: 'ctaIcon', label: 'Icono del botón (whatsapp)', type: 'text' },
    { name: 'image', label: 'Imagen de fondo (URL)', type: 'text' },
  ],
  RICH_TEXT: [
    { name: 'title', label: 'Título', type: 'text' },
    { name: 'html', label: 'Contenido (HTML)', type: 'html' },
  ],
  CTA: [
    { name: 'title', label: 'Título', type: 'text' },
    { name: 'text', label: 'Texto', type: 'textarea' },
    { name: 'ctaLabel', label: 'Texto del botón', type: 'text' },
    { name: 'ctaHref', label: 'Enlace del botón', type: 'text' },
    { name: 'ctaIcon', label: 'Icono del botón (whatsapp)', type: 'text' },
  ],
  CARDS: [{ name: 'title', label: 'Título', type: 'text' }],
  GALLERY: [{ name: 'title', label: 'Título', type: 'text' }],
  FAQ: [{ name: 'title', label: 'Título', type: 'text' }],
};

/// Los bloques con listas (tarjetas, imágenes, preguntas) se editan como JSON
/// hasta que exista un editor de listas dedicado.
const LIST_FIELD: Partial<Record<BlockType, string>> = {
  CARDS: 'items',
  GALLERY: 'images',
  FAQ: 'items',
};

export function BlockEditor({
  block,
  onClose,
}: {
  block: Block;
  onClose: () => void;
}) {
  const updateBlock = useUpdateBlock();
  const [data, setData] = useState<Record<string, unknown>>(block.data);
  const [listError, setListError] = useState<string | null>(null);

  const fields = FIELDS[block.type] ?? [];
  const listField = LIST_FIELD[block.type];

  const setField = (name: string, value: unknown) =>
    setData((prev) => ({ ...prev, [name]: value }));

  const handleListChange = (raw: string) => {
    try {
      setField(listField!, JSON.parse(raw));
      setListError(null);
    } catch {
      setListError('JSON inválido');
    }
  };

  const handleSave = () => {
    if (listError) {
      toast.error('Corrige el JSON antes de guardar');
      return;
    }
    updateBlock.mutate(
      { id: block.id, data },
      {
        onSuccess: () => {
          toast.success('Bloque actualizado');
          onClose();
        },
        onError: () => toast.error('No se pudo guardar'),
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-editor-title"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="block-editor-title" className="text-lg font-semibold">
            Editar bloque {block.type}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === 'text' ? (
                <Input
                  id={field.name}
                  value={String(data[field.name] ?? '')}
                  onChange={(e) => setField(field.name, e.target.value)}
                />
              ) : (
                <textarea
                  id={field.name}
                  rows={field.type === 'html' ? 8 : 3}
                  value={String(data[field.name] ?? '')}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              )}
            </div>
          ))}

          {listField && (
            <div className="space-y-2">
              <Label htmlFor={listField}>
                {listField === 'images' ? 'Imágenes' : 'Elementos'} (JSON)
              </Label>
              <textarea
                id={listField}
                rows={10}
                defaultValue={JSON.stringify(data[listField] ?? [], null, 2)}
                onChange={(e) => handleListChange(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-invalid={Boolean(listError)}
              />
              {listError && <p className="text-xs text-destructive">{listError}</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateBlock.isPending}>
            {updateBlock.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

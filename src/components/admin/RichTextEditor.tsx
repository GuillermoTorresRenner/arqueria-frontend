import { useRef } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/// Texto pegado que parece markdown: títulos, listas, citas, negritas o
/// enlaces. Si no hay nada de esto se deja el pegado normal de Tiptap.
const LOOKS_LIKE_MARKDOWN = /(^|\n)(#{1,6}\s|[-*+]\s|\d+\.\s|>\s)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)/;

/**
 * Editor WYSIWYG para el HTML de los bloques de texto. Se escribe como en un
 * procesador de textos y además acepta markdown:
 * - al teclear: `## ` título, `**negrita**`, `*cursiva*`, `- ` lista, `1. `
 *   lista numerada, `> ` cita;
 * - al pegar: un texto en markdown se convierte en formato.
 * Guarda HTML, que es lo que ya consume RichTextBlock.
 */
export function RichTextEditor({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
}) {
  // handlePaste se define dentro de la propia configuración del editor, antes
  // de que exista la instancia: se accede a ella a través del ref.
  const editorRef = useRef<Editor | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // El h1 es el nombre del sitio; el título del bloque ya es un h2.
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Markdown,
    ],
    content: value,
    editorProps: {
      attributes: {
        id,
        class: 'rich-text min-h-[12rem] px-3 py-2 focus:outline-none',
      },
      handlePaste: (_view, event) => {
        const data = event.clipboardData;
        // Con HTML en el portapapeles (copiado de una web o de Word) manda
        // ese HTML; solo se interpreta el texto plano que parece markdown.
        if (!data || data.types.includes('text/html')) return false;
        const text = data.getData('text/plain');
        if (!LOOKS_LIKE_MARKDOWN.test(text)) return false;
        editorRef.current?.commands.insertContent(text, { contentType: 'markdown' });
        return true;
      },
    },
    // Los Enter finales dejan párrafos vacíos que en la web serían un hueco.
    onUpdate: ({ editor }) =>
      onChange(editor.isEmpty ? '' : editor.getHTML().replace(/(<p><\/p>)+$/, '')),
  });

  editorRef.current = editor;
  if (!editor) return null;

  return (
    <div className="rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">
        Atajos: <code>## </code> título · <code>**negrita**</code> ·{' '}
        <code>*cursiva*</code> · <code>- </code> lista · <code>&gt; </code> cita.
        También puedes pegar texto en markdown.
      </p>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  // Re-renderiza la barra solo cuando cambia el estado de los botones, no en
  // cada pulsación.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      bullet: editor.isActive('bulletList'),
      ordered: editor.isActive('orderedList'),
      quote: editor.isActive('blockquote'),
      link: editor.isActive('link'),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace (vacío para quitarlo)', previous ?? 'https://');
    if (url === null) return;
    const chain = editor.chain().focus().extendMarkRange('link');
    if (url.trim() === '' || url === 'https://') chain.unsetLink().run();
    else chain.setLink({ href: url.trim() }).run();
  };

  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Formato de texto"
      className="flex flex-wrap items-center gap-0.5 border-b p-1"
    >
      <ToolButton icon={Bold} label="Negrita" active={state.bold} onClick={() => chain().toggleBold().run()} />
      <ToolButton icon={Italic} label="Cursiva" active={state.italic} onClick={() => chain().toggleItalic().run()} />
      <Separator />
      <ToolButton icon={Heading2} label="Título" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <ToolButton icon={Heading3} label="Subtítulo" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      <Separator />
      <ToolButton icon={List} label="Lista" active={state.bullet} onClick={() => chain().toggleBulletList().run()} />
      <ToolButton icon={ListOrdered} label="Lista numerada" active={state.ordered} onClick={() => chain().toggleOrderedList().run()} />
      <ToolButton icon={Quote} label="Cita" active={state.quote} onClick={() => chain().toggleBlockquote().run()} />
      <ToolButton icon={LinkIcon} label="Enlace" active={state.link} onClick={setLink} />
      <Separator />
      <ToolButton icon={Undo2} label="Deshacer" disabled={!state.canUndo} onClick={() => chain().undo().run()} />
      <ToolButton icon={Redo2} label="Rehacer" disabled={!state.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-accent text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Separator() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />;
}

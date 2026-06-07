import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { useCallback, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { Block } from "@blocknote/core";

/** Debounce delay for auto-save in milliseconds */
const AUTO_SAVE_DELAY_MS = 1500;

interface ArticleEditorProps {
  initialContent?: Block[];
  onChange?: (content: Block[]) => void;
  editable?: boolean;
}

export function ArticleEditor({
  initialContent,
  onChange,
  editable = true,
}: ArticleEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : undefined,
  });

  const handleChange = useCallback(() => {
    if (!onChange) return;

    // Debounce to avoid excessive API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const blocks = editor.document;
      onChange(blocks as Block[]);
    }, AUTO_SAVE_DELAY_MS);
  }, [editor, onChange]);

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      onChange={handleChange}
      theme="dark"
    />
  );
}

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Code, Strikethrough } from "lucide-react";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange?: (val: string) => void;
  onBlur?: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  onBlur,
  placeholder = "Write description or details...",
  className = "",
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onBlur: ({ editor }) => {
      onBlur?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[90px] p-3 text-sm text-gray-800",
      },
    },
  });

  // Sync value if props update from outside
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-1 focus-within:ring-gray-300 transition ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-x-1 p-1.5 border-b border-gray-100 bg-gray-50/80 text-gray-600">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200/70 transition ${editor.isActive("bold") ? "bg-gray-200 text-black font-bold" : ""}`}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200/70 transition ${editor.isActive("italic") ? "bg-gray-200 text-black font-bold" : ""}`}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-gray-200/70 transition ${editor.isActive("strike") ? "bg-gray-200 text-black font-bold" : ""}`}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200/70 transition ${editor.isActive("bulletList") ? "bg-gray-200 text-black font-bold" : ""}`}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-gray-200/70 transition ${editor.isActive("orderedList") ? "bg-gray-200 text-black font-bold" : ""}`}
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded hover:bg-gray-200/70 transition ${editor.isActive("code") ? "bg-gray-200 text-black font-bold" : ""}`}
          title="Inline Code"
        >
          <Code className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="max-h-[160px] overflow-y-auto custom-sidebar-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

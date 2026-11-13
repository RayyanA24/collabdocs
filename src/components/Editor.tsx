"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import SharePanel from "./SharePanel";
import { btn, btnPrimary, input } from "./ui";
import { canEdit, canManage, type Role } from "@/lib/permissions";

type SaveState = "saved" | "dirty" | "saving" | "error";

const STATUS: Record<SaveState, string> = {
  saved: "All changes saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  error: "Could not save",
};

function ToolbarButton({
  label, active, onClick, children,
}: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={`min-w-9 rounded px-2 py-1 text-sm hover:bg-desk ${active ? "bg-accent-soft text-accent" : ""}`}>
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const chain = () => editor.chain().focus();
  return (
    <div role="toolbar" aria-label="Formatting"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-md border border-line bg-paper p-1">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}>
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}>
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => chain().toggleUnderline().run()}>
        <span className="underline">U</span>
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-line" aria-hidden />
      {([1, 2, 3] as const).map((level) => (
        <ToolbarButton key={level} label={`Heading ${level}`} active={editor.isActive("heading", { level })}
          onClick={() => chain().toggleHeading({ level }).run()}>
          H{level}
        </ToolbarButton>
      ))}
      <span className="mx-1 h-5 w-px bg-line" aria-hidden />
      <ToolbarButton label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}>
        • List
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()}>
        1. List
      </ToolbarButton>
    </div>
  );
}

export default function Editor(props: {
  id: string;
  initialTitle: string;
  initialContent: string;
  role: Role;
  ownerEmail?: string;
}) {
  const { id, role } = props;
  const editable = canEdit(role);
  const [title, setTitle] = useState(props.initialTitle);
  const [status, setStatus] = useState<SaveState>("saved");
  const [message, setMessage] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const titleRef = useRef(title);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<TiptapEditor | null>(null);
  const version = useRef(0); // bumps on every edit so an older save can't mark newer edits as saved

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const editor = editorRef.current;
    if (!editor) return;
    const trimmed = titleRef.current.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Title is required");
      return;
    }
    const started = version.current;
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, content: editor.getHTML() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save");
      setStatus(version.current === started ? "saved" : "dirty");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Could not save");
    }
  }, [id]);

  const markDirty = useCallback(() => {
    version.current += 1;
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 1000);
  }, [save]);

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false, heading: { levels: [1, 2, 3] } })],
    content: props.initialContent,
    editable,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: "doc-prose", "aria-label": "Document body" } },
    onUpdate: () => markDirty(),
  });
  useEffect(() => { editorRef.current = editor; }, [editor]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (status === "dirty" || status === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm text-muted underline">← All documents</Link>
        <div className="flex items-center gap-3">
          {editable ? (
            <span role="status" className={`text-sm ${status === "error" ? "text-danger" : "text-muted"}`}>
              {message ?? STATUS[status]}
            </span>
          ) : (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              View only{props.ownerEmail ? ` · shared by ${props.ownerEmail}` : ""}
            </span>
          )}
          {editable && (
            <button className={btnPrimary} onClick={save} disabled={status === "saving"}>Save</button>
          )}
          {canManage(role) && (
            <button className={btn} aria-expanded={shareOpen} onClick={() => setShareOpen((v) => !v)}>Share</button>
          )}
        </div>
      </div>

      {canManage(role) && shareOpen && <SharePanel documentId={id} />}

      <label htmlFor="doc-title" className="sr-only">Document title</label>
      <input id="doc-title" value={title} readOnly={!editable} maxLength={200}
        className={`${input} mb-4 font-serif text-2xl font-bold`}
        onChange={(e) => { setTitle(e.target.value); titleRef.current = e.target.value; markDirty(); }} />

      {editable && editor && <div className="mb-3"><Toolbar editor={editor} /></div>}

      <div className="rounded-md border border-line bg-paper px-8 py-8 shadow-sm sm:px-14">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

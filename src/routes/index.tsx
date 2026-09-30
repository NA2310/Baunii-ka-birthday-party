import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LockKeyhole, Settings2, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import stickerCheerAsset from "@/assets/sticker-cheer.jpg.asset.json";
import stickerHappyAsset from "@/assets/sticker-happy.jpg.asset.json";
import stickerWaveAsset from "@/assets/sticker-wave.jpg.asset.json";
import belowNoteAsset from "@/assets/below-note.jpeg.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminStatus, lockAdmin, unlockAdmin } from "@/lib/admin.functions";

type Memory = { id: string; url: string; label: string };
type Keepsake = { heading: string; message: string; memories: Memory[] };

const defaultKeepsake: Keepsake = {
  heading: "Happy Birthday Radha jii",
  message: "Happy Birthday Radha jii ❤️ You’re the best thing that happened to me. Thank you for existing.",
  memories: [
    { id: "one", url: "", label: "A little moment" },
    { id: "two", url: "", label: "Our favorite kind" },
    { id: "three", url: "", label: "A memory to keep" },
    { id: "four", url: "", label: "Just us" },
    { id: "five", url: "", label: "The sweetest days" },
    { id: "six", url: "", label: "Forever favorite" },
    { id: "seven", url: "", label: "One for the album" },
  ],
};

const stickers = [
  { src: stickerWaveAsset.url, className: "sticker-one", alt: "Happy waving character" },
  { src: stickerCheerAsset.url, className: "sticker-two", alt: "Cheering character" },
  { src: stickerHappyAsset.url, className: "sticker-three", alt: "Smiling character" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Happy Birthday Radha jii | A little keepsake" },
      { name: "description", content: "A soft birthday keepsake filled with memories and a handwritten note for Radha jii." },
      { property: "og:title", content: "Happy Birthday Radha jii" },
      { property: "og:description", content: "A little collection of memories and a birthday note for Radha jii." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BirthdayPage,
});

function BirthdayPage() {
  const unlock = useServerFn(unlockAdmin);
  const getStatus = useServerFn(getAdminStatus);
  const lock = useServerFn(lockAdmin);
  const [keepsake, setKeepsake] = useState<Keepsake>(defaultKeepsake);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [editorDraft, setEditorDraft] = useState(defaultKeepsake);
  const [isSaving, setIsSaving] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("radha-birthday-keepsake");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Keepsake;
        if (parsed.heading && parsed.message && Array.isArray(parsed.memories)) {
          setKeepsake(parsed);
          setEditorDraft(parsed);
        }
      } catch {
        window.localStorage.removeItem("radha-birthday-keepsake");
      }
    }
    void getStatus().then((status) => setIsUnlocked(status.unlocked));
  }, [getStatus]);

  useEffect(() => {
    if (isNoteOpen) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % keepsake.memories.length), 4200);
    return () => window.clearInterval(timer);
  }, [isNoteOpen, keepsake.memories.length]);

  const visibleMemories = useMemo(() => {
    const total = keepsake.memories.length;
    return [-1, 0, 1].map((offset) => keepsake.memories[(activeIndex + offset + total) % total]);
  }, [activeIndex, keepsake.memories]);

  function shiftCarousel(direction: number) {
    setActiveIndex((index) => (index + direction + keepsake.memories.length) % keepsake.memories.length);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) { setDragStart(event.clientX); }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStart === null) return;
    const distance = event.clientX - dragStart;
    if (Math.abs(distance) > 35) shiftCarousel(distance > 0 ? -1 : 1);
    setDragStart(null);
  }

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await unlock({ data: { password } });
    if (!result.ok) { setPasswordError(true); return; }
    setPassword(""); setPasswordError(false); setIsUnlocked(true);
  }

  function updateMemory(id: string, url: string) {
    setEditorDraft((draft) => ({ ...draft, memories: draft.memories.map((memory) => memory.id === id ? { ...memory, url } : memory) }));
  }

  function saveKeepsake() {
    setIsSaving(true);
    window.localStorage.setItem("radha-birthday-keepsake", JSON.stringify(editorDraft));
    setKeepsake(editorDraft); setActiveIndex(0);
    window.setTimeout(() => setIsSaving(false), 450);
  }

  async function closeEditor() {
    await lock(); setIsUnlocked(false); setAdminOpen(false);
  }

  return (
    <div className="birthday-shell min-h-screen overflow-hidden bg-background text-foreground">
      <div className="spotlight" aria-hidden="true" /><div className="grain" aria-hidden="true" />
      <div className="sticker-field" aria-hidden="true">{stickers.map((sticker) => <img key={sticker.className} src={sticker.src} alt={sticker.alt} className={`floating-sticker ${sticker.className}`} />)}</div>
      <header className="birthday-nav"><p className="nav-kicker">A little keepsake · 2026</p><Button variant="ghost" size="sm" className="admin-trigger" onClick={() => setAdminOpen(true)} aria-label="Open admin access"><Settings2 /> Admin</Button></header>
      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
        <section className="birthday-intro text-center"><p className="eyebrow animate-rise">FOR MY FAVORITE PERSON</p><h1 className="birthday-title animate-rise delay-one">{keepsake.heading.split(" ").map((word, index) => <span key={`${word}-${index}`} className={index > 1 ? "title-highlight" : ""}>{word}{" "}</span>)}</h1><p className="birthday-subtitle animate-rise delay-two">To my favorite person in the whole world.</p></section>
        <section className="carousel-section" aria-label="Memory carousel"><div className="section-meta"><span>MEMORIES, ON REPEAT</span><span>{String(activeIndex + 1).padStart(2, "0")} / {String(keepsake.memories.length).padStart(2, "0")}</span></div><div className="carousel-stage" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => setDragStart(null)} role="group" aria-label="Swipe through memories">{visibleMemories.map((memory, index) => <MemoryCard key={`${memory.id}-${index}`} memory={memory} position={index} isCenter={index === 1} />)}<div className="carousel-controls"><Button variant="ghost" size="icon" onClick={() => shiftCarousel(-1)} aria-label="Previous memory"><ChevronLeft /></Button><Button variant="ghost" size="icon" onClick={() => shiftCarousel(1)} aria-label="Next memory"><ChevronRight /></Button></div></div><p className="carousel-hint">drag gently to wander through the album</p></section>
        <section className="note-section" aria-label="Birthday note"><button className={`note-wrap ${isNoteOpen ? "is-open" : ""}`} onClick={() => setIsNoteOpen((open) => !open)} aria-expanded={isNoteOpen}><span className="note-aura" aria-hidden="true" /><span className="birthday-note"><span className="note-fold" aria-hidden="true" /><span className="note-label"><Sparkles /> A handwritten note</span>{!isNoteOpen ? <span className="note-closed-copy"><span className="note-lede">There’s something I wanted to say...</span><span className="note-open-prompt">click to open your letter</span></span> : <span className="note-open-copy"><span className="note-message">{keepsake.message}</span><img src={belowNoteAsset.url} alt="A sleepy little character resting beneath the note" /><span className="note-signoff">with love, always ♡</span></span>}</span></button></section>
      </main>
      <footer className="birthday-footer">made with a little extra love for Radha jii · ♡</footer>
      {adminOpen && <div className="admin-overlay" role="dialog" aria-modal="true" aria-label={isUnlocked ? "Admin editor" : "Admin access"}><div className={`admin-panel ${isUnlocked ? "editor-panel" : "login-panel"}`}><Button variant="ghost" size="icon" className="panel-close" onClick={() => setAdminOpen(false)} aria-label="Close admin panel"><X /></Button>{!isUnlocked ? <form onSubmit={handleUnlock} className="login-form"><span className="login-icon"><LockKeyhole /></span><p className="eyebrow">PRIVATE CORNER</p><h2>Welcome back, keeper.</h2><p>Enter the little secret to edit Radha’s birthday keepsake.</p><Input autoFocus type="password" placeholder="secret key" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={passwordError} />{passwordError && <span className="password-error">That key didn’t work. Try again.</span>}<Button type="submit">Unlock editor</Button></form> : <div className="editor-form"><div className="editor-heading"><div><p className="eyebrow">PRIVATE CORNER</p><h2>Edit the keepsake</h2></div><Button variant="ghost" size="sm" onClick={() => void closeEditor()}>Lock</Button></div><label>Birthday heading<Input value={editorDraft.heading} onChange={(event) => setEditorDraft({ ...editorDraft, heading: event.target.value })} /></label><label>Birthday message<Textarea rows={5} value={editorDraft.message} onChange={(event) => setEditorDraft({ ...editorDraft, message: event.target.value })} /></label><div className="memory-editor"><div className="editor-label-row"><label>Memory links</label><span>image URLs, including Drive links</span></div>{editorDraft.memories.map((memory, index) => <div className="memory-input" key={memory.id}><span>0{index + 1}</span><Input value={memory.url} placeholder="Paste an image URL (optional)" onChange={(event) => updateMemory(memory.id, event.target.value)} /></div>)}</div><Button className="save-button" onClick={saveKeepsake}>{isSaving ? "Saved" : "Save changes"}</Button><p className="editor-note">For now, edits stay on this browser and can be connected to a shared database later.</p></div>}</div></div>}
    </div>
  );
}

function MemoryCard({ memory, position, isCenter }: { memory: Memory; position: number; isCenter: boolean }) {
  const className = position === 0 ? "memory-card memory-left" : position === 2 ? "memory-card memory-right" : "memory-card memory-center";
  return <article className={`${className} ${isCenter ? "is-center" : ""}`}><div className="memory-photo">{memory.url ? <img src={memory.url} alt={memory.label} /> : <div className="memory-placeholder"><span>{memory.label}</span><small>your photo here</small></div>}</div>{isCenter && <span className="memory-caption">{memory.label}</span>}</article>;
}
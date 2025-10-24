import { useState, useEffect } from "react";
import { FileText, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
} from "@/components";
import { Note, saveNote, deleteNote, getAllNotes } from "@/lib/notes-storage";
import { useWindowResize, useWindowFocus } from "@/hooks";



export const NotesPopover = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { resizeWindow } = useWindowResize();

  // Load notes when component mounts or popover opens
  useEffect(() => {
    if (isOpen) {
      const loadedNotes = getAllNotes();
      setNotes(loadedNotes);
    }
  }, [isOpen]);

  useEffect(() => {
    resizeWindow(isOpen);
  }, [isOpen, resizeWindow]);

  useWindowFocus({
    onFocusLost: () => {
      setIsOpen(false);
    },
  });

  const handleCreateNew = () => {
    setIsCreating(true);
    setCurrentNote(null);
    setTitle("");
    setContent("");
    // Don't close dropdown - keep it open for editing
  };

  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    setIsCreating(false);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    const noteData = { title: title.trim(), content: content.trim() };
    
    try {
      if (isCreating) {
        // Creating new note
        const savedNote = saveNote(noteData);
        setNotes(prev => [savedNote, ...prev]);
        setIsCreating(false);
        setCurrentNote(savedNote);
      } else if (currentNote) {
        // Updating existing note
        const updatedNote = { ...currentNote, ...noteData, updatedAt: Date.now() };
        const saved = saveNote(updatedNote);
        setNotes(prev => prev.map(n => n.id === saved.id ? saved : n));
        setCurrentNote(saved);
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleDelete = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          data-tauri-no-drag
          size="icon"
          aria-label="My Notes"
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="select-none w-screen p-0 border overflow-hidden border-input/50 z-50"
        sideOffset={8}
      >
        <div className="border-b border-input/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                My Notes
              </h2>
              <p className="text-xs text-muted-foreground">
                Your personal notes
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleCreateNew}
              className="text-xs"
            >
              New Note
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-8.75rem)]">
          {/* Left Panel - Notes List */}
          <div className="w-1/2 border-r border-input/50">
            <ScrollArea className="h-full">
              <div className="p-2">
                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No notes yet
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Create your first note
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className={`group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                          currentNote?.id === note.id
                            ? "bg-muted border-primary/20"
                            : "border-transparent hover:border-input/50"
                        }`}
                        onClick={() => handleSelectNote(note)}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-medium truncate leading-5">
                              {note.title}
                            </h3>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="cursor-pointer h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={(e) => handleDelete(note.id, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-2">
                            {note.content}
                          </p>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Note Editor */}
          <div className="flex-1 flex flex-col">
            {currentNote || isCreating ? (
              <>
                {/* Editor Header */}
                <div className="p-4 border-b border-input/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      {isCreating ? "New Note" : "Edit Note"}
                    </h3>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!title.trim() || !content.trim()}
                      className="text-xs"
                    >
                      Save
                    </Button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 p-4">
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-lg font-medium bg-transparent border-0 outline-none mb-4 placeholder:text-muted-foreground"
                  />
                  <textarea
                    placeholder="Start writing your note..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-[calc(100%-3rem)] bg-transparent border-0 outline-none resize-none text-sm placeholder:text-muted-foreground"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Select a note to edit</p>
                  <p className="text-xs text-muted-foreground/70">or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

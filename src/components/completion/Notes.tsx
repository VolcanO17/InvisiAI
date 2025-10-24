import { useState, useEffect } from "react";
import { FileText, XIcon, Save, Plus, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
  Input as InputComponent,
} from "@/components";
import { Note, saveNote, updateNote, deleteNote, getAllNotes } from "@/lib/notes-storage";
import { UseCompletionReturn } from "@/types";

export const Notes = ({
  isNotesPopoverOpen,
  setIsNotesPopoverOpen,
}: UseCompletionReturn) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Load notes when component mounts
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const allNotes = getAllNotes();
    setNotes(allNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  };

  const handleCreateNew = () => {
    setCurrentNote(null);
    setTitle("");
    setContent("");
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    try {
      if (currentNote) {
        // Update existing note
        const updated = updateNote(currentNote.id, {
          title: title.trim(),
          content: content.trim(),
        });
        if (updated) {
          setCurrentNote(updated);
        }
      } else {
        // Create new note
        const newNote = saveNote({
          title: title.trim(),
          content: content.trim(),
        });
        setCurrentNote(newNote);
        setIsCreating(false);
      }
      loadNotes();
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsCreating(false);
  };

  const handleDeleteNote = (noteId: string) => {
    if (deleteNote(noteId)) {
      loadNotes();
      if (currentNote?.id === noteId) {
        setCurrentNote(null);
        setTitle("");
        setContent("");
        setIsCreating(false);
      }
    }
  };

  const handleClose = () => {
    setIsNotesPopoverOpen(false);
    setCurrentNote(null);
    setTitle("");
    setContent("");
    setIsCreating(false);
  };

  return (
    <div className="relative">
      <Popover open={isNotesPopoverOpen} onOpenChange={setIsNotesPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            onClick={() => setIsNotesPopoverOpen(true)}
            className="cursor-pointer"
            title={`My Notes (${notes.length})`}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        {/* Note count badge */}
        {notes.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-primary-foreground text-primary rounded-full h-5 w-5 flex border border-primary items-center justify-center text-xs font-medium">
            {notes.length}
          </div>
        )}

        <PopoverContent
          align="center"
          side="bottom"
          className="w-screen p-0 border shadow-lg overflow-hidden"
          sideOffset={8}
        >
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <h3 className="font-semibold text-sm select-none">My Notes</h3>
          <div className="flex items-center gap-2 select-none">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCreateNew}
              className="cursor-pointer"
              title="Create new note"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {(currentNote || isCreating) && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSave}
                disabled={!title.trim()}
                className="cursor-pointer"
                title="Save note"
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClose}
              className="cursor-pointer"
              title="Close notes"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-7rem)]">
          {/* Notes List */}
          <div className="w-1/3 border-r">
            <ScrollArea className="h-full">
              <div className="p-2">
                {notes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">No notes yet</p>
                    <p className="text-xs mt-1">Click + to create your first note</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 border rounded cursor-pointer mb-2 hover:bg-muted/50 ${
                        currentNote?.id === note.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleSelectNote(note)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {note.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {note.content || "No content"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="ml-2 h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          title="Delete note"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Note Editor */}
          <div className="flex-1 flex flex-col">
            {currentNote || isCreating ? (
              <>
                <div className="p-4 border-b">
                  <InputComponent
                    placeholder="Note title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-medium"
                  />
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <textarea
                      placeholder="Write your note here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-full min-h-[300px] resize-none border-none outline-none bg-transparent text-sm leading-relaxed"
                    />
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select a note to view</p>
                  <p className="text-xs mt-1">or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
    </div>
  );
};
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { StickyNote, Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Note, saveNote, updateNote, deleteNote, getAllNotes } from "@/lib/notes-storage";

export const NotesManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const allNotes = getAllNotes();
    setNotes(allNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  };

  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      return;
    }

    try {
      saveNote(newNote);
      setNewNote({ title: "", content: "" });
      setIsCreating(false);
      loadNotes();
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    if (!title.trim() || !content.trim()) return;

    try {
      updateNote(id, { title, content });
      setEditingId(null);
      loadNotes();
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const handleDeleteNote = (id: string) => {
    try {
      deleteNote(id);
      loadNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) {
        loadNotes(); // Refresh notes when opening
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="relative bg-black text-white border-gray-600 hover:bg-gray-800"
          title={`My Notes${notes.length > 0 ? `\n\nRecent Notes:\n${notes.slice(0, 3).map(note => `• ${note.title.slice(0, 30)}${note.title.length > 30 ? '...' : ''}`).join('\n')}${notes.length > 3 ? `\n... and ${notes.length - 3} more` : ''}` : '\n\nNo notes yet\nClick to create your first note'}`}
        >
          <StickyNote className="h-4 w-4" />
          {notes.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {notes.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="center"
        side="bottom"
        className="p-0 border shadow-lg overflow-hidden"
        style={{ width: '100vw', maxWidth: 'none' }}
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <h3 className="font-semibold text-sm select-none">My Notes</h3>
          <div className="flex items-center gap-2 select-none">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreating(true)}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Note
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer"
              title="Close notes"
            >
              <X />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-7rem)]">
          <div className="p-4">
          {/* Create new note form */}
          {isCreating && (
            <div className="border rounded-lg p-3 mb-3 bg-muted/20">
              <Input
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="mb-2"
              />
              <Textarea
                placeholder="Write your note..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="mb-2 min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateNote}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewNote({ title: "", content: "" });
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Notes list */}
          {notes.length === 0 && !isCreating ? (
            <div className="text-center text-muted-foreground py-8">
              <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs">Click "New Note" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isEditing={editingId === note.id}
                  onEdit={() => setEditingId(note.id)}
                  onSave={handleUpdateNote}
                  onCancel={() => setEditingId(null)}
                  onDelete={handleDeleteNote}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

// Separate component for individual note cards
const NoteCard = ({
  note,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  formatDate,
}: {
  note: Note;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (id: string, title: string, content: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
}) => {
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  if (isEditing) {
    return (
      <div className="border rounded-lg p-3 bg-blue-50/50">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="mb-2"
        />
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="mb-2 min-h-[80px]"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onSave(note.id, editTitle, editContent)}
          >
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 hover:bg-muted/20 group">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-1">{note.title}</h4>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(note.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
        {note.content}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatDate(note.updatedAt)}
      </p>
    </div>
  );
};
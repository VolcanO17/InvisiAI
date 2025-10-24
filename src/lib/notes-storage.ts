import { safeLocalStorage } from "./storage/helper";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Save a note to localStorage
 */
export const saveNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
  try {
    const savedNotes = getAllNotes();
    const now = new Date().toISOString();
    
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    
    savedNotes.push(newNote);
    safeLocalStorage.setItem('app_notes', JSON.stringify(savedNotes));
    
    console.log("✅ Note saved:", newNote.title);
    return newNote;
  } catch (error) {
    console.error("Failed to save note:", error);
    throw error;
  }
};

/**
 * Update an existing note
 */
export const updateNote = (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>): Note | null => {
  try {
    const savedNotes = getAllNotes();
    const noteIndex = savedNotes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      console.warn("Note not found:", id);
      return null;
    }
    
    savedNotes[noteIndex] = {
      ...savedNotes[noteIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    safeLocalStorage.setItem('app_notes', JSON.stringify(savedNotes));
    console.log("✅ Note updated:", savedNotes[noteIndex].title);
    return savedNotes[noteIndex];
  } catch (error) {
    console.error("Failed to update note:", error);
    throw error;
  }
};

/**
 * Delete a note
 */
export const deleteNote = (id: string): boolean => {
  try {
    const savedNotes = getAllNotes();
    const filteredNotes = savedNotes.filter(n => n.id !== id);
    
    if (filteredNotes.length === savedNotes.length) {
      console.warn("Note not found:", id);
      return false;
    }
    
    safeLocalStorage.setItem('app_notes', JSON.stringify(filteredNotes));
    console.log("✅ Note deleted:", id);
    return true;
  } catch (error) {
    console.error("Failed to delete note:", error);
    return false;
  }
};

/**
 * Get all notes
 */
export const getAllNotes = (): Note[] => {
  try {
    const savedNotes = safeLocalStorage.getItem('app_notes');
    if (!savedNotes) return [];
    
    const parsed = JSON.parse(savedNotes);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load notes:", error);
    return [];
  }
};

/**
 * Get a single note by ID
 */
export const getNoteById = (id: string): Note | null => {
  const notes = getAllNotes();
  return notes.find(n => n.id === id) || null;
};
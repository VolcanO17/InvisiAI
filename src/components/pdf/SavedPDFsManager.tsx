import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { FileText, Trash2, Eye, Database } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { SavedPDF, getAllSavedPDFs, deleteSavedPDF } from "@/lib/pdf-storage";
import { Badge } from "../ui/badge";

export const SavedPDFsManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedPDFs, setSavedPDFs] = useState<SavedPDF[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<SavedPDF | null>(null);

  // Load PDFs on component mount and when popover opens
  useEffect(() => {
    if (isOpen) {
      loadSavedPDFs();
    }
  }, [isOpen]);

  const loadSavedPDFs = () => {
    const pdfs = getAllSavedPDFs();
    setSavedPDFs(pdfs);
    console.log(`📄 Loaded ${pdfs.length} saved PDFs`);
  };

  const handleDeletePDF = (id: string) => {
    try {
      deleteSavedPDF(id);
      loadSavedPDFs(); // Refresh list
      if (selectedPDF?.id === id) {
        setSelectedPDF(null);
      }
    } catch (error) {
      console.error("Failed to delete PDF:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
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
        loadSavedPDFs(); // Refresh PDFs when opening
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="relative bg-black text-white border-gray-600 hover:bg-gray-800"
          title={`Saved PDFs Database${savedPDFs.length > 0 ? `\n\nSaved PDFs:\n${savedPDFs.slice(0, 3).map(pdf => `• ${pdf.fileName.slice(0, 25)}${pdf.fileName.length > 25 ? '...' : ''} (${(pdf.fileSize / 1024).toFixed(1)} KB)`).join('\n')}${savedPDFs.length > 3 ? `\n... and ${savedPDFs.length - 3} more` : ''}` : '\n\nNo PDFs saved yet\nAttach PDFs to save them'}`}
        >
          <Database className="h-4 w-4" />
          {savedPDFs.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
              {savedPDFs.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[500px] p-0" align="end">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Saved PDFs Database
            </h3>
            <Badge variant="secondary">{savedPDFs.length} PDFs</Badge>
          </div>
        </div>

        <div className="flex h-96">
          {/* PDF List */}
          <div className="w-1/2 border-r">
            <ScrollArea className="h-full p-3">
              {savedPDFs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No PDFs saved</p>
                  <p className="text-xs">Attach PDFs to save them</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedPDFs.map((pdf) => (
                    <div
                      key={pdf.id}
                      className={`border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedPDF?.id === pdf.id ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => setSelectedPDF(pdf)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {pdf.fileName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(pdf.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDate(pdf.uploadedAt)}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePDF(pdf.id);
                          }}
                          className="text-red-600 hover:text-red-700 p-1 h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* PDF Preview */}
          <div className="w-1/2 p-3">
            {selectedPDF ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-sm">PDF Preview</span>
                </div>
                
                <div className="bg-muted/20 rounded-lg p-3 mb-3">
                  <h4 className="font-semibold text-sm mb-2">{selectedPDF.fileName}</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Size: {formatFileSize(selectedPDF.fileSize)}</div>
                    <div>Uploaded: {formatDate(selectedPDF.uploadedAt)}</div>
                    <div>Text Length: {selectedPDF.textContent.length} chars</div>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-2">Extracted Text:</div>
                  <ScrollArea className="h-full border rounded-lg p-2">
                    <div className="text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedPDF.textContent || "No text content available"}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a PDF to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
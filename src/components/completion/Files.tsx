import { useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { PaperclipIcon, XIcon, PlusIcon, TrashIcon } from "lucide-react";
import { UseCompletionReturn } from "@/types";
import { MAX_FILES } from "@/config";
import { ScrollArea } from "../ui/scroll-area";
import { isPDF, getFileIcon, getFileTypeDisplay } from "@/lib/pdf-utils";

export const Files = ({
  attachedFiles,
  handleFileSelect,
  removeFile,
  onRemoveAllFiles,
  isLoading,
  isFilesPopoverOpen,
  setIsFilesPopoverOpen,
}: UseCompletionReturn) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddMoreClick = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = attachedFiles.length < MAX_FILES;

  return (
    <div className="relative">
      <Popover open={isFilesPopoverOpen} onOpenChange={setIsFilesPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            data-tauri-no-drag
            size="icon"
            onClick={() => {
              if (attachedFiles.length === 0) {
                // If no files, directly open file picker
                fileInputRef.current?.click();
              } else {
                // If files exist, show popover
                setIsFilesPopoverOpen(true);
              }
            }}
            disabled={isLoading}
            className="cursor-pointer"
          >
            <PaperclipIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        {/* File count badge */}
        {attachedFiles.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-primary-foreground text-primary rounded-full h-5 w-5 flex border border-primary items-center justify-center text-xs font-medium">
            {attachedFiles.length}
          </div>
        )}

        {attachedFiles.length > 0 && (
          <PopoverContent
            align="center"
            side="bottom"
            className="w-screen p-0 border shadow-lg overflow-hidden"
            sideOffset={8}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
              <h3 className="font-semibold text-sm select-none">
                Attached Files ({attachedFiles.length}/{MAX_FILES})
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsFilesPopoverOpen(false)}
                className="cursor-pointer"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="p-4 h-[calc(100vh-11rem)]">
              {/* Grid layout based on number of images */}
              <div
                className={`gap-3 ${
                  attachedFiles.length <= 2
                    ? "flex flex-col"
                    : "grid grid-cols-2"
                }`}
              >
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative group border rounded-lg overflow-hidden bg-muted/20"
                  >
                    {/* File content display */}
                    {file.type.startsWith("image/") ? (
                      <img
                        src={`data:${file.type};base64,${file.base64}`}
                        alt={file.name}
                        className={`w-full object-cover h-full`}
                      />
                    ) : isPDF(file) ? (
                      <div className="flex flex-col items-center justify-center p-6 h-32 bg-gradient-to-br from-red-50 to-red-100">
                        <div className="text-4xl mb-2">{getFileIcon(file)}</div>
                        <div className="text-sm font-medium text-red-700">{getFileTypeDisplay(file)}</div>
                        <div className="text-xs text-red-600 mt-1">
                          {file.textContent ? `${file.textContent.slice(0, 100)}...` : 'Text extracted'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 h-32 bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="text-4xl mb-2">{getFileIcon(file)}</div>
                        <div className="text-sm font-medium text-gray-700">{getFileTypeDisplay(file)}</div>
                      </div>
                    )}

                    {/* File info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs">
                      <div className="truncate font-medium flex items-center gap-1">
                        <span>{getFileIcon(file)}</span>
                        {file.name}
                      </div>
                      <div className="text-gray-300">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {isPDF(file) && file.textContent && (
                          <span className="ml-1">• {file.textContent.split(' ').length} words</span>
                        )}
                        {file.type.startsWith("image/") && file.ocrText && (
                          <span className="ml-1">• OCR: {file.ocrText.split(' ').length} words ({file.ocrConfidence?.toFixed(0)}%)</span>
                        )}
                        {file.type.startsWith("image/") && !file.ocrText && (
                          <span className="ml-1">• OCR: No text detected</span>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <Button
                      size="icon"
                      variant="default"
                      className="absolute top-2 right-2 h-6 w-6 cursor-pointer"
                      onClick={() => removeFile(file.id)}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Sticky footer with Add More button */}
            <div className="sticky bottom-0 border-t bg-background p-3 flex flex-row gap-2">
              <Button
                onClick={handleAddMoreClick}
                disabled={!canAddMore || isLoading}
                className="w-2/4"
                variant="outline"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add More Files {!canAddMore && `(${MAX_FILES} max)`}
              </Button>
              <Button
                className="w-2/4"
                variant="destructive"
                onClick={onRemoveAllFiles}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Remove All Files
              </Button>
            </div>
          </PopoverContent>
        )}
      </Popover>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

import React from "react";
import { useSettings } from "@/hooks";
import { SettingsIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
} from "@/components";
import { Disclaimer } from "./Disclaimer";
import { SystemPrompt } from "./SystemPrompt";
import { ScreenshotConfigs } from "./ScreenshotConfigs";
import { AIProviders } from "./ai-configs";
import { STTProviders } from "./stt-configs";
import { DeleteChats } from "./DeleteChats";

const SettingsContent = () => {
  const settings = useSettings();

  if (!settings) {
    console.error("Settings context is not available");
    return (
      <div className="p-4 text-center text-red-500">
        Error loading settings. Please refresh the page.
      </div>
    );
  }

  return (
    <Popover
      open={settings?.isPopoverOpen}
      onOpenChange={settings?.setIsPopoverOpen}
    >
      <PopoverTrigger asChild>
        <Button
          data-tauri-no-drag
          size="icon"
          aria-label="Open Settings"
          className="cursor-pointer [data-state=open]:bg-[red]"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      {/* Settings Panel */}
      <PopoverContent
        align="end"
        side="bottom"
        className="select-none w-screen p-0 border overflow-hidden border-input/50"
        sideOffset={8}
      >
        <ScrollArea className="h-[calc(100vh-7.2rem)]">
          <div className="p-6 space-y-6">
            {/* System Prompt */}
            <SystemPrompt {...settings} />

            {/* Screenshot Configs */}
            <ScreenshotConfigs {...settings} />

            {/* Provider Selection */}
            <AIProviders {...settings} />

            {/* STT Providers */}
            <STTProviders {...settings} />

            {/* Disclaimer */}
            <DeleteChats {...settings} />
          </div>

          <div className="pt-2 pb-6 flex items-center justify-center">
            <a
              href="https://www.srikanthnani.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground text-center font-medium"
            >
              🚀 Built by Praveen ✨
            </a>
          </div>
        </ScrollArea>

        <div className="border-t border-input/50">
          <Disclaimer />
        </div>
      </PopoverContent>
    </Popover>
  );
};

class SettingsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Settings component crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Button
          data-tauri-no-drag
          size="icon"
          aria-label="Settings (Error)"
          className="cursor-not-allowed bg-red-500/20 hover:bg-red-500/30"
          disabled
        >
          <SettingsIcon className="h-4 w-4 text-red-500" />
        </Button>
      );
    }

    return this.props.children;
  }
}

export const Settings = () => {
  return (
    <SettingsErrorBoundary>
      <SettingsContent />
    </SettingsErrorBoundary>
  );
};
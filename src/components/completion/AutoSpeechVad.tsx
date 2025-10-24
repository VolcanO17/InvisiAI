import { fetchSTT } from "@/lib";
import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon, PauseIcon, PlayIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useApp } from "@/contexts";
import { floatArrayToWav } from "@/lib/utils";

interface AutoSpeechVADProps {
  submit: UseCompletionReturn["submit"];
  setState: UseCompletionReturn["setState"];
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const AutoSpeechVAD = ({
  submit,
  setState,
  setEnableVAD,
}: AutoSpeechVADProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { selectedSttProvider, allSttProviders } = useApp();

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: true,
    onSpeechStart: () => {
      // Speech started
    },
    onSpeechEnd: async (audio) => {
      // Skip transcription if paused
      if (isPaused) {
        return;
      }

      try {
        setIsTranscribing(true);

        // Check if we have a configured speech provider
        if (!selectedSttProvider.provider) {
          console.warn("No speech provider selected");
          setState((prev: any) => ({
            ...prev,
            error:
              "No speech provider selected. Please select one in settings.",
          }));
          return;
        }

        if (!selectedSttProvider.apiKey) {
          console.warn("Selected speech provider not configured");
          setState((prev: any) => ({
            ...prev,
            error:
              "Speech provider not configured. Please configure it in settings.",
          }));
          return;
        }

        const providerConfig = allSttProviders.find(
          (p) => p.id === selectedSttProvider.provider
        );

        if (!providerConfig) {
          console.warn("Selected speech provider configuration not found");
          setState((prev: any) => ({
            ...prev,
            error:
              "Speech provider configuration not found. Please check your settings.",
          }));
          return;
        }

        // Get the API key to use
        let apiKeyToUse = selectedSttProvider.apiKey;

        if (!apiKeyToUse || apiKeyToUse.trim().length === 0) {
          console.warn("No valid API key available for speech provider");
          setState((prev: any) => ({
            ...prev,
            error:
              "No valid API key available for speech provider. Please configure it in settings.",
          }));
          return;
        }

        // convert float32array to blob
        const audioBlob = floatArrayToWav(audio, 16000, "wav");

        let transcription: string;

        // Use the fetchSTT function for all providers
        transcription = await fetchSTT({
          provider: providerConfig,
          apiKey: apiKeyToUse,
          audio: audioBlob,
        });

        if (transcription) {
          console.log(`🎤 Speech → AI: "${transcription}"`);
          
          // ULTRA-FAST: Direct submit without any display or delays
          submit(transcription);
        }
      } catch (error) {
        console.error("Failed to transcribe audio:", error);
        setState((prev: any) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Transcription failed",
        }));
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      // Resume - restart listening if needed
      if (!vad.listening) {
        vad.start();
      }
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Main Voice Toggle Button */}
      <Button
        size="icon"
        onClick={() => {
          if (vad.listening) {
            vad.pause();
            setEnableVAD(false);
            setIsPaused(false);
          } else {
            vad.start();
            setEnableVAD(true);
            setIsPaused(false);
          }
        }}
        className="cursor-pointer"
      >
        {isTranscribing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        ) : vad.userSpeaking && !isPaused ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-blue-500" />
        ) : vad.listening ? (
          <MicOffIcon className={`h-4 w-4 ${isPaused ? 'text-orange-500' : 'text-red-500 animate-pulse'}`} />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>

      {/* Pause/Resume Button - Only shown when listening */}
      {vad.listening && (
        <Button
          size="icon"
          onClick={togglePause}
          className={`cursor-pointer ${isPaused ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {isPaused ? (
            <PlayIcon className="h-4 w-4 text-white" />
          ) : (
            <PauseIcon className="h-4 w-4 text-white" />
          )}
        </Button>
      )}

      {/* Live Transcription Display - REMOVED FOR SPEED */}
      
      {/* Status Indicator */}
      {vad.listening && (
        <div className="ml-2 text-xs text-muted-foreground">
          {isPaused ? (
            <span className="text-orange-600">⏸ Paused</span>
          ) : vad.userSpeaking ? (
            <span className="text-blue-600">🎤 Listening...</span>
          ) : (
            <span className="text-green-600">✓ Ready</span>
          )}
        </div>
      )}
    </div>
  );
};

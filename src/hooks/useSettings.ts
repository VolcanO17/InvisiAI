import { useEffect, useState, useRef } from "react";
import { useWindowResize } from "@/hooks";
import { useApp } from "@/contexts";
import { TYPE_AI_PROVIDER } from "@/types";
import { safeLocalStorage, fetchModels } from "@/lib";
import { SPEECH_TO_TEXT_PROVIDERS, STORAGE_KEYS } from "@/config";

export const useSettings = () => {
  let appContext;
  try {
    appContext = useApp();
  } catch (error) {
    console.error("Failed to access app context in useSettings:", error);
    return null;
  }

  const {
    systemPrompt,
    setSystemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
    allAiProviders,
    allSttProviders,
    selectedAIProvider,
    selectedSttProvider,
    onSetSelectedAIProvider,
    onSetSelectedSttProvider,
  } = appContext;
  
  let resizeWindow;
  try {
    const windowResizeHook = useWindowResize();
    resizeWindow = windowResizeHook.resizeWindow;
  } catch (error) {
    console.error("Failed to access window resize hook:", error);
    resizeWindow = () => {}; // Fallback no-op function
  }

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<{
    [providerId: string]: string[];
  }>({});
  const [modelsFetching, setModelsFetching] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(selectedAIProvider?.apiKey || "");
  const [localSTTApiKey, setLocalSTTApiKey] = useState(
    selectedSttProvider?.apiKey || ""
  );

  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const prevAIProviderRef = useRef(selectedAIProvider?.provider || "");

  // Sync local API key with global state when provider changes
  useEffect(() => {
    try {
      if (selectedAIProvider?.apiKey) {
        setLocalApiKey(selectedAIProvider.apiKey);
      }

      if (selectedSttProvider?.apiKey) {
        setLocalSTTApiKey(selectedSttProvider.apiKey);
      }
    } catch (error) {
      console.error("Error syncing API keys:", error);
    }
  }, [selectedAIProvider?.provider, selectedSttProvider?.provider]);

  useEffect(() => {
    try {
      resizeWindow(isPopoverOpen);
    } catch (error) {
      console.error("Error resizing window:", error);
    }
  }, [isPopoverOpen, resizeWindow]);

  const handleScreenshotModeChange = (value: "auto" | "manual") => {
    const newConfig = { ...screenshotConfiguration, mode: value };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const handleScreenshotPromptChange = (value: string) => {
    const newConfig = { ...screenshotConfiguration, autoPrompt: value };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const handleScreenshotEnabledChange = (enabled: boolean) => {
    const newConfig = { ...screenshotConfiguration, enabled };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const submitApiKey = () => {
    try {
      if (localApiKey.trim()) {
        console.log(`🔑 Submitting API key for provider: ${selectedAIProvider.provider}`);
        onSetSelectedAIProvider({
          ...selectedAIProvider,
          apiKey: localApiKey.trim(),
        });
      }
    } catch (error) {
      console.error("Error submitting API key:", error);
    }
  };

  const submitSTTApiKey = () => {
    if (localSTTApiKey.trim()) {
      onSetSelectedSttProvider({
        ...selectedSttProvider,
        apiKey: localSTTApiKey.trim(),
      });
    }
  };

  const fetchModelsForProvider = async (
    provider: TYPE_AI_PROVIDER,
    apiKey: string
  ) => {
    if (
      !provider ||
      (!apiKey &&
        allAiProviders.find((p) => p.id === selectedAIProvider.provider)
          ?.models)
    ) {
      return;
    }

    try {
      setModelsFetching(true);
      const models = await fetchModels({ provider, apiKey });
      
      // Handle both success and error responses from fetchModels
      if (typeof models === 'string') {
        // fetchModels returned an error message
        console.error("Failed to fetch models:", models);
        setAvailableModels((prev) => ({
          ...prev,
          [provider.id]: [], // Set empty array on error
        }));
      } else if (Array.isArray(models)) {
        // fetchModels returned a successful array of models
        setAvailableModels((prev) => ({
          ...prev,
          [provider.id]: models,
        }));
      } else {
        // Unexpected response format
        console.error("Unexpected models response format:", models);
        setAvailableModels((prev) => ({
          ...prev,
          [provider.id]: [], // Set empty array on unexpected format
        }));
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      // Set empty array on catch to prevent crashes
      setAvailableModels((prev) => ({
        ...prev,
        [provider.id]: [],
      }));
    } finally {
      setModelsFetching(false);
    }
  };

  useEffect(() => {
    try {
      if (
        selectedAIProvider?.apiKey &&
        selectedAIProvider?.provider &&
        isPopoverOpen
      ) {
        const provider = allAiProviders?.find(
          (p) => p.id === selectedAIProvider.provider
        );
        if (provider) {
          fetchModelsForProvider(provider, selectedAIProvider.apiKey);
        }
      }
    } catch (error) {
      console.error("Error in models fetching useEffect:", error);
    }
  }, [selectedAIProvider?.apiKey, isPopoverOpen, allAiProviders?.length]);

  useEffect(() => {
    try {
      // Update the previous provider reference
      const prevProvider = prevAIProviderRef.current;
      prevAIProviderRef.current = selectedAIProvider?.provider || "";

      // Handle case when switching FROM openai to another provider
      if (
        prevProvider === "openai" &&
        selectedAIProvider?.provider !== "openai" &&
        selectedSttProvider?.provider === "openai-whisper"
      ) {
        // Reset STT provider when AI provider is changed from openai
        setLocalSTTApiKey("");
        onSetSelectedSttProvider({
          provider: "",
          apiKey: "",
          model: "",
        });
        return;
      }

      // Handle case when AI provider is openai and STT is openai-whisper
      if (
        selectedAIProvider?.apiKey &&
        selectedAIProvider?.provider === "openai" &&
        selectedSttProvider?.provider === "openai-whisper"
      ) {
        const provider = SPEECH_TO_TEXT_PROVIDERS.find(
          (p) => p.id === "openai-whisper"
        );

        setLocalSTTApiKey(selectedSttProvider?.apiKey || "");
        submitSTTApiKey();
        onSetSelectedSttProvider({
          ...selectedSttProvider,
          apiKey: selectedAIProvider.apiKey,
          model: provider?.request.fields.model || "whisper-1",
        });
      }
    } catch (error) {
      console.error("Error in provider switching useEffect:", error);
    }
  }, [
    selectedAIProvider?.apiKey,
    selectedAIProvider?.provider,
    selectedSttProvider?.provider,
  ]);

  // Auto-close on focus loss disabled to prevent interruptions during form interactions
  // Settings should be closed manually via the toggle button for better UX
  // useWindowFocus({
  //   onFocusLost: () => {
  //     setIsPopoverOpen(false);
  //   },
  // });

  const handleDeleteAllChatsConfirm = () => {
    safeLocalStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    setShowDeleteConfirmDialog(false);
  };

  return {
    isPopoverOpen,
    setIsPopoverOpen,
    systemPrompt,
    setSystemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
    handleScreenshotModeChange,
    handleScreenshotPromptChange,
    handleScreenshotEnabledChange,
    allAiProviders,
    allSttProviders,
    selectedAIProvider,
    selectedSttProvider,
    onSetSelectedAIProvider,
    onSetSelectedSttProvider,
    fetchModelsForProvider,
    availableModels,
    modelsFetching,
    localApiKey,
    setLocalApiKey,
    submitApiKey,
    localSTTApiKey,
    setLocalSTTApiKey,
    submitSTTApiKey,
    handleDeleteAllChatsConfirm,
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
  };
};

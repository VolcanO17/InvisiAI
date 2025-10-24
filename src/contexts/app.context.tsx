import {
  AI_PROVIDERS,
  DEFAULT_SYSTEM_PROMPT,
  SPEECH_TO_TEXT_PROVIDERS,
  STORAGE_KEYS,
} from "@/config";
import { safeLocalStorage } from "@/lib";
import { validateAndFixProviderSettings } from "@/lib/settings-reset";
import {
  IContextType,
  ScreenshotConfig,
  TYPE_AI_PROVIDER,
  TYPE_STT_PROVIDER,
} from "@/types";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// Create the context
const AppContext = createContext<IContextType | undefined>(undefined);

// Create the provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [systemPrompt, setSystemPrompt] = useState<string>(
    safeLocalStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT) ||
      DEFAULT_SYSTEM_PROMPT
  );

  // AI Providers
  const [customAiProviders, setCustomAiProviders] = useState<
    TYPE_AI_PROVIDER[]
  >([]);
  const [selectedAIProvider, setSelectedAIProvider] = useState<{
    provider: string;
    apiKey: string;
    model: string;
  }>({
    provider: "",
    apiKey: "",
    model: "",
  });

  // STT Providers
  const [customSttProviders, setCustomSttProviders] = useState<
    TYPE_STT_PROVIDER[]
  >([]);
  const [selectedSttProvider, setSelectedSttProvider] = useState<{
    provider: string;
    apiKey: string;
    model: string;
  }>({
    provider: "",
    apiKey: "",
    model: "",
  });

  const [screenshotConfiguration, setScreenshotConfiguration] =
    useState<ScreenshotConfig>({
      mode: "manual",
      autoPrompt: "Analyze this screenshot and provide insights",
      enabled: true,
    });

  // Function to load AI, STT, system prompt and screenshot config data from storage
  const loadData = () => {
    // Validate and fix provider settings first
    validateAndFixProviderSettings();
    
    // Load system prompt
    const savedSystemPrompt = safeLocalStorage.getItem(
      STORAGE_KEYS.SYSTEM_PROMPT
    );
    if (savedSystemPrompt) {
      setSystemPrompt(savedSystemPrompt || DEFAULT_SYSTEM_PROMPT);
    }

    // Load screenshot configuration
    const savedScreenshotConfig = safeLocalStorage.getItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG
    );
    if (savedScreenshotConfig) {
      try {
        const parsed = JSON.parse(savedScreenshotConfig);
        if (typeof parsed === "object" && parsed !== null) {
          setScreenshotConfiguration({
            mode: parsed.mode || "manual",
            autoPrompt:
              parsed.autoPrompt ||
              "Analyze this screenshot and provide insights",
            enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          });
        }
      } catch {
        console.warn("Failed to parse screenshot configuration");
      }
    }

    // Load custom AI providers
    const savedAi = safeLocalStorage.getItem(STORAGE_KEYS.CUSTOM_AI_PROVIDERS);
    let aiList: TYPE_AI_PROVIDER[] = [];
    if (savedAi) {
      try {
        const parsed = JSON.parse(savedAi);
        if (Array.isArray(parsed)) {
          aiList = parsed.map((p) => ({ ...p, isCustom: true }));
        }
      } catch {
        console.warn("Failed to parse custom AI providers");
      }
    }
    setCustomAiProviders(aiList);

    // Load selected AI provider with improved error handling
    const savedSelectedAi = safeLocalStorage.getItem(
      STORAGE_KEYS.SELECTED_AI_PROVIDER
    );
    
    // Default to Gemini as it's most stable
    let selectedAiObj = {
      provider: "gemini",
      apiKey: "",
      model: "gemini-1.5-flash",
    };
    
    if (savedSelectedAi) {
      try {
        const parsed = JSON.parse(savedSelectedAi);
        if (typeof parsed === "object" && parsed !== null) {
          // Validate that the provider exists in our providers list
          const allProviders = [...AI_PROVIDERS, ...aiList]; // Use aiList instead of customAiProviders (which might be stale)
          const providerExists = allProviders.some(p => p.id === parsed.provider);
          
          if (providerExists && parsed.provider) {
            const providerConfig = allProviders.find(p => p.id === parsed.provider);
            selectedAiObj = {
              provider: parsed.provider,
              apiKey: parsed.apiKey || "",
              model: parsed.model || providerConfig?.defaultModel || "gemini-1.5-flash",
            };
            console.log(`✅ Loaded AI Provider: ${parsed.provider} with model: ${selectedAiObj.model}`);
          } else {
            console.warn(`Invalid provider configuration: ${parsed.provider}, falling back to Gemini. Available:`, allProviders.map(p => p.id));
          }
        } else if (typeof parsed === "string") {
          // Legacy format - only provider ID
          const allProviders = [...AI_PROVIDERS, ...aiList];
          const providerExists = allProviders.some(p => p.id === parsed);
          if (providerExists) {
            const provider = allProviders.find(p => p.id === parsed);
            selectedAiObj = { 
              provider: parsed, 
              apiKey: "", 
              model: provider?.defaultModel || "gemini-1.5-flash" 
            };
            console.log(`✅ Loaded legacy AI Provider: ${parsed}`);
          } else {
            console.warn(`Legacy provider not found: ${parsed}, falling back to Gemini`);
          }
        }
      } catch (error) {
        console.error("Failed to parse saved AI provider, using Gemini default:", error);
        // Reset corrupted storage
        safeLocalStorage.removeItem(STORAGE_KEYS.SELECTED_AI_PROVIDER);
      }
    }
    
    // Ensure we always have a valid configuration
    try {
      setSelectedAIProvider(selectedAiObj);
    } catch (error) {
      console.error("Error setting AI provider, using fallback:", error);
      setSelectedAIProvider({
        provider: "gemini",
        apiKey: "",
        model: "gemini-1.5-flash",
      });
    }

    // Load custom STT providers
    const savedStt = safeLocalStorage.getItem(
      STORAGE_KEYS.CUSTOM_SPEECH_PROVIDERS
    );
    let sttList: TYPE_STT_PROVIDER[] = [];
    if (savedStt) {
      try {
        const parsed = JSON.parse(savedStt);
        if (Array.isArray(parsed)) {
          sttList = parsed.map((p) => ({ ...p, isCustom: true }));
        }
      } catch {
        console.warn("Failed to parse custom STT providers");
      }
    }
    setCustomSttProviders(sttList);

    // Load selected STT provider
    const savedSelectedStt = safeLocalStorage.getItem(
      STORAGE_KEYS.SELECTED_STT_PROVIDER
    );
    let selectedSttObj = {
      provider: SPEECH_TO_TEXT_PROVIDERS[0]?.id || "",
      apiKey: "",
      model: "",
    };
    if (savedSelectedStt) {
      try {
        const parsed = JSON.parse(savedSelectedStt);
        if (typeof parsed === "object" && parsed !== null) {
          selectedSttObj = {
            provider: parsed.provider || "",
            apiKey: parsed.apiKey || "",
            model: parsed.model || "",
          };
        } else if (typeof parsed === "string") {
          selectedSttObj = { provider: parsed, apiKey: "", model: "" };
        }
      } catch {
        selectedSttObj = { provider: savedSelectedStt, apiKey: "", model: "" };
      }
    }
    setSelectedSttProvider(selectedSttObj);
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Listen to storage events for real-time sync (e.g., multi-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.CUSTOM_AI_PROVIDERS ||
        e.key === STORAGE_KEYS.SELECTED_AI_PROVIDER ||
        e.key === STORAGE_KEYS.CUSTOM_SPEECH_PROVIDERS ||
        e.key === STORAGE_KEYS.SELECTED_STT_PROVIDER ||
        e.key === STORAGE_KEYS.SYSTEM_PROMPT ||
        e.key === STORAGE_KEYS.SCREENSHOT_CONFIG
      ) {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Sync selected AI to localStorage
  useEffect(() => {
    if (selectedAIProvider.provider) {
      safeLocalStorage.setItem(
        STORAGE_KEYS.SELECTED_AI_PROVIDER,
        JSON.stringify(selectedAIProvider)
      );
    }
  }, [selectedAIProvider]);

  // Sync selected STT to localStorage
  useEffect(() => {
    if (selectedSttProvider.provider) {
      safeLocalStorage.setItem(
        STORAGE_KEYS.SELECTED_STT_PROVIDER,
        JSON.stringify(selectedSttProvider)
      );
    }
  }, [selectedSttProvider]);

  // @ts-ignore
  // Computed all AI providers
  const allAiProviders: TYPE_AI_PROVIDER[] = [
    ...AI_PROVIDERS,
    ...customAiProviders,
  ];

  // @ts-ignore
  // Computed all STT providers
  const allSttProviders: TYPE_STT_PROVIDER[] = [
    ...SPEECH_TO_TEXT_PROVIDERS,
    ...customSttProviders,
  ];

  const onSetSelectedAIProvider = ({
    provider,
    apiKey,
    model,
  }: {
    provider: string;
    apiKey: string;
    model: string;
  }) => {
    try {
      // Validate provider exists in our providers list
      if (provider && !allAiProviders.some((p) => p.id === provider)) {
        console.warn(`Invalid AI provider ID: ${provider}. Available providers:`, allAiProviders.map(p => p.id));
        return;
      }

      // If model is empty, use the provider's default model
      let finalModel = model;
      if (!finalModel && provider) {
        const providerConfig = allAiProviders.find(p => p.id === provider);
        finalModel = providerConfig?.defaultModel || "";
      }

      const newProvider = { 
        provider: provider || "", 
        apiKey: apiKey || "", 
        model: finalModel || "" 
      };
      
      // Update state first
      setSelectedAIProvider(newProvider);
      
      // Save to localStorage with error handling
      try {
        safeLocalStorage.setItem(
          STORAGE_KEYS.SELECTED_AI_PROVIDER, 
          JSON.stringify(newProvider)
        );
        console.log(`✅ AI Provider saved: ${provider} with model: ${finalModel}`);
      } catch (error) {
        console.error("Failed to save AI provider settings:", error);
        // Don't fail the entire operation if localStorage fails
      }
    } catch (error) {
      console.error("Error in onSetSelectedAIProvider:", error);
      // Fallback to a safe state to prevent app crash
      const fallbackProvider = { 
        provider: "gemini", 
        apiKey: "", 
        model: "gemini-1.5-flash" 
      };
      setSelectedAIProvider(fallbackProvider);
      safeLocalStorage.setItem(
        STORAGE_KEYS.SELECTED_AI_PROVIDER, 
        JSON.stringify(fallbackProvider)
      );
    }
  };

  // Setter for selected STT with validation
  const onSetSelectedSttProvider = ({
    provider,
    apiKey,
    model,
  }: {
    provider: string;
    apiKey: string;
    model: string;
  }) => {
    if (provider && !allSttProviders.some((p) => p.id === provider)) {
      console.warn(`Invalid STT provider ID: ${provider}`);
      return;
    }

    const newProvider = { provider, apiKey, model };
    setSelectedSttProvider(newProvider);
    
    // Save to localStorage immediately
    try {
      safeLocalStorage.setItem(
        STORAGE_KEYS.SELECTED_STT_PROVIDER, 
        JSON.stringify(newProvider)
      );
      console.log(`✅ STT Provider saved: ${provider} with model: ${model}`);
    } catch (error) {
      console.error("Failed to save STT provider settings:", error);
    }
  };

  // Create the context value (extend IContextType accordingly)
  const value: IContextType = {
    systemPrompt,
    setSystemPrompt,
    allAiProviders,
    customAiProviders,
    selectedAIProvider,
    onSetSelectedAIProvider,
    allSttProviders,
    customSttProviders,
    selectedSttProvider,
    onSetSelectedSttProvider,
    screenshotConfiguration,
    setScreenshotConfiguration,
    loadData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Create a hook to access the context
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within a AppProvider");
  }

  return context;
};

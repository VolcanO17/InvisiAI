import { STORAGE_KEYS } from "@/config";
import { safeLocalStorage } from "./storage/helper";

/**
 * Reset AI provider settings to default (Gemini)
 */
export const resetToGeminiProvider = () => {
  try {
    // Clear potentially corrupted settings
    safeLocalStorage.removeItem(STORAGE_KEYS.SELECTED_AI_PROVIDER);
    safeLocalStorage.removeItem(STORAGE_KEYS.CUSTOM_AI_PROVIDERS);
    
    // Set default Gemini provider
    const defaultGeminiProvider = {
      provider: "gemini",
      apiKey: "", // User will need to set this
      model: "gemini-1.5-flash"
    };
    
    safeLocalStorage.setItem(
      STORAGE_KEYS.SELECTED_AI_PROVIDER,
      JSON.stringify(defaultGeminiProvider)
    );
    
    console.log("Successfully reset to Gemini provider");
    return true;
  } catch (error) {
    console.error("Failed to reset provider settings:", error);
    return false;
  }
};

/**
 * Validate and fix provider settings
 */
export const validateAndFixProviderSettings = () => {
  try {
    const selectedProvider = safeLocalStorage.getItem(STORAGE_KEYS.SELECTED_AI_PROVIDER);
    
    if (selectedProvider) {
      const parsed = JSON.parse(selectedProvider);
      
      // Check if provider data is valid
      if (!parsed || typeof parsed !== 'object' || !parsed.provider) {
        console.warn("Invalid provider data structure found, resetting to Gemini");
        return resetToGeminiProvider();
      }

      // Ensure model exists
      if (!parsed.model) {
        console.warn("Missing model in provider data, adding default");
        const updatedProvider = {
          ...parsed,
          model: parsed.provider === 'grok' ? 'grok-4' : 
                parsed.provider === 'gemini' ? 'gemini-1.5-flash' : 
                parsed.provider === 'openai' ? 'gpt-5' :
                parsed.provider === 'claude' ? 'claude-sonnet-4-20250514' :
                'gemini-1.5-flash' // fallback
        };
        safeLocalStorage.setItem(STORAGE_KEYS.SELECTED_AI_PROVIDER, JSON.stringify(updatedProvider));
      }
    }
    
    return true;
  } catch (error) {
    console.error("Provider settings validation failed, resetting:", error);
    return resetToGeminiProvider();
  }
};

/**
 * Clear all app data (nuclear option for troubleshooting)
 */
export const clearAllAppData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      safeLocalStorage.removeItem(key);
    });
    
    console.log("All app data cleared successfully");
    return true;
  } catch (error) {
    console.error("Failed to clear app data:", error);
    return false;
  }
};

// Make reset functions available globally for troubleshooting
if (typeof window !== 'undefined') {
  (window as any).resetToGemini = resetToGeminiProvider;
  (window as any).clearAppData = clearAllAppData;
  (window as any).validateProviders = validateAndFixProviderSettings;
}
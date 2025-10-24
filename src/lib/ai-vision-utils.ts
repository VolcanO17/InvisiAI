import { TYPE_AI_PROVIDER } from "@/types";

/**
 * Check if a provider and model combination supports vision/image input
 */
export function supportsVision(provider: TYPE_AI_PROVIDER, modelName?: string): boolean {
  // If provider doesn't support images at all, return false
  if (!provider?.input?.image) {
    return false;
  }
  
  // If provider doesn't have specific vision models defined, assume all models support vision
  if (!provider.visionModels || provider.visionModels.length === 0) {
    return true;
  }
  
  // Check if the specific model is in the vision models list
  const currentModel = modelName || provider.defaultModel;
  return currentModel ? provider.visionModels.includes(currentModel) : false;
}

/**
 * Get available vision models for a provider
 */
export function getVisionModels(provider: TYPE_AI_PROVIDER): string[] {
  if (!provider?.input?.image) {
    return [];
  }
  
  return provider.visionModels || [];
}

/**
 * Get vision model recommendations for a provider when image input fails
 */
export function getVisionModelRecommendations(provider: TYPE_AI_PROVIDER): string {
  if (!provider?.input?.image) {
    return `${provider.name} does not support image input.`;
  }
  
  const visionModels = getVisionModels(provider);
  
  if (visionModels.length === 0) {
    return `${provider.name} supports image input with all models.`;
  }
  
  return `For ${provider.name}, use one of these vision models: ${visionModels.join(", ")}`;
}

/**
 * Suggest the best vision model for a provider
 */
export function suggestBestVisionModel(provider: TYPE_AI_PROVIDER): string | null {
  if (!provider?.input?.image) {
    return null;
  }
  
  const visionModels = getVisionModels(provider);
  
  if (visionModels.length === 0) {
    return provider.defaultModel;
  }
  
  // Priority mappings for best vision models per provider
  const modelPriority: Record<string, string[]> = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    claude: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
    mistral: ["pixtral-large-latest", "pixtral-12b-2409"],
    grok: ["grok-vision-beta"],
    groq: ["llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview"],
    gemini: ["gemini-1.5-flash", "gemini-1.5-pro"]
  };
  
  const priorities = modelPriority[provider.id] || [];
  
  for (const preferred of priorities) {
    if (visionModels.includes(preferred)) {
      return preferred;
    }
  }
  
  // If no priority match, return first available
  return visionModels[0] || provider.defaultModel;
}
import { useEffect, useState } from "react";
import { useApp } from "@/contexts";
import { supportsVision, getVisionModels, suggestBestVisionModel } from "@/lib/ai-vision-utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertTriangle } from "lucide-react";

interface VisionModelSelectorProps {
  hasImages: boolean;
  onModelChange?: (model: string) => void;
}

export function VisionModelSelector({ hasImages, onModelChange }: VisionModelSelectorProps) {
  const { selectedAIProvider, allAiProviders } = useApp();
  const [suggestedModel, setSuggestedModel] = useState<string | null>(null);

  const currentProvider = allAiProviders.find(p => p.id === selectedAIProvider.provider);
  const currentModel = selectedAIProvider.model || currentProvider?.defaultModel;

  useEffect(() => {
    if (hasImages && currentProvider) {
      const suggested = suggestBestVisionModel(currentProvider);
      setSuggestedModel(suggested);
    } else {
      setSuggestedModel(null);
    }
  }, [hasImages, currentProvider]);

  if (!hasImages || !currentProvider) {
    return null;
  }

  const visionModels = getVisionModels(currentProvider);
  const currentSupportsVision = currentModel ? supportsVision(currentProvider, currentModel) : false;

  if (visionModels.length === 0) {
    // Provider supports all models for vision
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
        <Eye className="h-4 w-4" />
        <span>{currentProvider.name} supports image input with all models</span>
      </div>
    );
  }

  if (currentSupportsVision) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
        <Eye className="h-4 w-4" />
        <span>Current model "{currentModel}" supports image input</span>
        <Badge variant="secondary">Vision Ready</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 border rounded-md bg-amber-50 border-amber-200">
      <div className="flex items-center gap-2 text-amber-700">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Vision Model Required</span>
      </div>
      
      <p className="text-xs text-amber-600">
        Current model "{currentModel}" doesn't support images. Switch to a vision model:
      </p>

      <div className="flex items-center gap-2">
        <Select value={currentModel || ""} onValueChange={onModelChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a vision model" />
          </SelectTrigger>
          <SelectContent>
            {visionModels.map((model) => (
              <SelectItem key={model} value={model}>
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3 text-green-600" />
                  <span>{model}</span>
                  {model === suggestedModel && (
                    <Badge variant="default" className="text-xs">Recommended</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {suggestedModel && suggestedModel !== currentModel && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onModelChange?.(suggestedModel)}
            className="whitespace-nowrap"
          >
            Use {suggestedModel.split('-').slice(0, 2).join('-')}
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-500">
        💡 These models support both text and image inputs
      </div>
    </div>
  );
}
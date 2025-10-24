import {
  blobToBase64,
  getAuthHeaders,
  getByPath,
  setByPath,
} from "./common.function";
import { fetch } from "@tauri-apps/plugin-http";
import { TYPE_STT_PROVIDER } from "@/types/stt.types";

export const fetchSTT = async (params: {
  provider: TYPE_STT_PROVIDER;
  apiKey: string;
  audio: Blob;
}): Promise<string> => {
  try {
    const { provider, apiKey, audio } = params;
    if (!provider) {
      return `Provider not provided`;
    }
    
    // Special handling for AssemblyAI - requires file upload first
    if (provider?.id === "assemblyai-stt") {
      return await handleAssemblyAI(apiKey, audio);
    }
    let url = `${provider?.baseUrl ?? ""}${provider?.endpoint ?? ""}`;
    const queryParams = new URLSearchParams(provider?.request?.query as any);
    if ("authParam" in (provider ?? {}) && provider?.authParam) {
      queryParams.append(provider.authParam, apiKey);
    }
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    const headers = {
      ...provider?.request?.headers,
      ...getAuthHeaders(provider, apiKey),
    };
    let body: FormData | string | Blob | null = null;
    const audioFormat = provider?.request?.audioFormat ?? "";
    switch (provider?.request?.bodyType) {
      case "formdata":
        body = new FormData();
        if (provider?.request?.audioKey) {
          body.append(provider.request.audioKey, audio, `audio.${audioFormat}`);
        }
        for (const [key, value] of Object.entries(
          provider?.request?.fields ?? {}
        )) {
          body.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : value
          );
        }
        break;
      case "json":
        const jsonBody: any = { ...(provider?.request?.fields ?? {}) };
        if (provider?.request?.audioKey) {
          const base64 = await blobToBase64(audio);
          setByPath(jsonBody, provider.request.audioKey, base64);
        }
        body = JSON.stringify(jsonBody);
        break;
      case "raw":
        body = audio;
        if (!headers["Content-Type"]) {
          headers["Content-Type"] = `audio/${audioFormat}`;
        }
        break;
      default:
        return `Unsupported body type: ${
          provider?.request?.bodyType ?? "unknown"
        }`;
    }
    let response;
    try {
      response = await fetch(url, {
        method: provider?.method ?? "POST",
        headers: headers as any,
        body,
      });
    } catch (fetchError) {
      return `Network error during API request: ${
        fetchError instanceof Error ? fetchError.message : "Unknown error"
      }`;
    }
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {}
      return `API request failed: ${response.status} ${response.statusText}${
        errorText ? ` - ${errorText}` : ""
      }`;
    }
    let content: string = "";
    const fields = provider?.request?.fields as any;
    const isTextResponse = fields?.response_format === "text";
    if (isTextResponse) {
      try {
        content = await response.text();
      } catch (textError) {
        return `Failed to read text response: ${
          textError instanceof Error ? textError.message : "Unknown error"
        }`;
      }
    } else {
      let json;
      try {
        json = await response.json();
      } catch (parseError) {
        return `Failed to parse JSON response: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`;
      }
      if (provider?.id === "speechmatics-stt") {
        const jobId = getByPath(json, provider?.response?.contentPath ?? "");
        if (!jobId) {
          return "Job ID not found in response";
        }
        const transcriptUrl = `${
          provider?.baseUrl ?? ""
        }/v2/jobs/${jobId}/transcript?format=txt`;
        const transHeaders = getAuthHeaders(provider, apiKey);
        while (true) {
          let transResponse;
          try {
            transResponse = await fetch(transcriptUrl, {
              headers: transHeaders,
            });
          } catch (fetchError) {
            return `Network error during polling: ${
              fetchError instanceof Error ? fetchError.message : "Unknown error"
            }`;
          }
          if (!transResponse.ok) {
            let errText = "";
            try {
              errText = await transResponse.text();
            } catch {}
            if (transResponse.status === 404 || transResponse.status === 202) {
              await new Promise((resolve) => setTimeout(resolve, 500)); // Faster polling - 500ms
              continue;
            }
            return `Polling failed: ${transResponse.status} ${
              transResponse.statusText
            }${errText ? ` - ${errText}` : ""}`;
          }
          let transJson;
          try {
            transJson = await transResponse.json();
          } catch (parseError) {
            return `Failed to parse polling response: ${
              parseError instanceof Error ? parseError.message : "Unknown error"
            }`;
          }
          if (transJson?.job?.status === "done") {
            content = transJson.results
              .map((r: any) => r.alternatives[0].content)
              .join(" ");
            break;
          } else if (
            transJson?.job?.status === "rejected" ||
            transJson?.job?.status === "failed"
          ) {
            return `Transcription job failed: ${
              transJson?.job?.status ?? "unknown"
            }`;
          }
          await new Promise((resolve) => setTimeout(resolve, 500)); // Faster polling
        }
      } else {
        content = getByPath(json, provider?.response?.contentPath ?? "") || "";
      }
    }
    return content.trim();
  } catch (error) {
    return `Error in fetchSTT: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }
};

// AssemblyAI specific handler - three-step process
async function handleAssemblyAI(apiKey: string, audio: Blob): Promise<string> {
  try {
    // Step 1: Upload the audio file
    const uploadUrl = "https://api.assemblyai.com/v2/upload";
    const uploadHeaders = {
      "authorization": apiKey,
      "content-type": "application/octet-stream"
    };
    
    let uploadResponse;
    try {
      uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: uploadHeaders,
        body: audio,
      });
    } catch (uploadError) {
      return `AssemblyAI upload error: ${
        uploadError instanceof Error ? uploadError.message : "Unknown error"
      }`;
    }
    
    if (!uploadResponse.ok) {
      let errorText = "";
      try {
        errorText = await uploadResponse.text();
      } catch {}
      return `AssemblyAI upload failed: ${uploadResponse.status} ${uploadResponse.statusText}${
        errorText ? ` - ${errorText}` : ""
      }`;
    }
    
    let uploadData;
    try {
      uploadData = await uploadResponse.json();
    } catch (parseError) {
      return `Failed to parse upload response: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`;
    }
    
    const audioUrl = uploadData.upload_url;
    if (!audioUrl) {
      return "Upload URL not received from AssemblyAI";
    }
    
    // Step 2: Submit transcription job
    const transcriptUrl = "https://api.assemblyai.com/v2/transcript";
    const transcriptHeaders = {
      "authorization": apiKey,
      "content-type": "application/json"
    };
    
    const transcriptPayload = {
      audio_url: audioUrl,
      speech_model: "best",
      language_code: "en_us"
    };
    
    let transcriptResponse;
    try {
      transcriptResponse = await fetch(transcriptUrl, {
        method: "POST",
        headers: transcriptHeaders,
        body: JSON.stringify(transcriptPayload),
      });
    } catch (transcriptError) {
      return `AssemblyAI transcript submission error: ${
        transcriptError instanceof Error ? transcriptError.message : "Unknown error"
      }`;
    }
    
    if (!transcriptResponse.ok) {
      let errorText = "";
      try {
        errorText = await transcriptResponse.text();
      } catch {}
      return `AssemblyAI transcript submission failed: ${transcriptResponse.status} ${transcriptResponse.statusText}${
        errorText ? ` - ${errorText}` : ""
      }`;
    }
    
    let transcriptData;
    try {
      transcriptData = await transcriptResponse.json();
    } catch (parseError) {
      return `Failed to parse transcript response: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`;
    }
    
    const transcriptId = transcriptData.id;
    if (!transcriptId) {
      return "Transcript ID not received from AssemblyAI";
    }
    
    // Step 3: Poll for completion
    const statusUrl = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
    const statusHeaders = {
      "authorization": apiKey
    };
    
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Ultra-fast polling
      
      let statusResponse;
      try {
        statusResponse = await fetch(statusUrl, {
          headers: statusHeaders,
        });
      } catch (fetchError) {
        return `AssemblyAI polling error: ${
          fetchError instanceof Error ? fetchError.message : "Unknown error"
        }`;
      }
      
      if (!statusResponse.ok) {
        let errText = "";
        try {
          errText = await statusResponse.text();
        } catch {}
        return `AssemblyAI polling failed: ${statusResponse.status} ${
          statusResponse.statusText
        }${errText ? ` - ${errText}` : ""}`;
      }
      
      let statusData;
      try {
        statusData = await statusResponse.json();
      } catch (parseError) {
        return `Failed to parse status response: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`;
      }
      
      if (statusData.status === "completed") {
        return statusData.text || "";
      } else if (statusData.status === "error") {
        return `AssemblyAI transcription error: ${statusData.error || "Unknown error"}`;
      }
      // Continue polling if status is "queued" or "processing"
    }
  } catch (error) {
    return `Error in AssemblyAI handler: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }
}

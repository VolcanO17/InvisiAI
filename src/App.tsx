import { Card, Settings, Updater } from "./components";
import { Completion } from "./components/completion";
import { ChatHistory } from "./components/history";
import ErrorBoundary from "./components/ErrorBoundary";

import { CustomCursor } from "./components/ui/CustomCursor";

const App = () => {
  const handleSelectConversation = (conversation: any) => {
    // Use localStorage to communicate the selected conversation to Completion component
    localStorage.setItem("selectedConversation", JSON.stringify(conversation));
    // Trigger a custom event to notify Completion component
    window.dispatchEvent(
      new CustomEvent("conversationSelected", {
        detail: conversation,
      })
    );
  };

  const handleNewConversation = () => {
    // Clear any selected conversation and trigger new conversation
    localStorage.removeItem("selectedConversation");
    window.dispatchEvent(new CustomEvent("newConversation"));
  };

  return (
    <ErrorBoundary>
      <div className="relative w-screen h-screen flex overflow-hidden justify-center items-start">
        <Card className="w-full flex flex-row items-center gap-2 p-2 relative" data-main-card>
          
          
          <ErrorBoundary>
            <Completion />
          </ErrorBoundary>
          <ErrorBoundary>
            <ChatHistory
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              currentConversationId={null}
            />
          </ErrorBoundary>
          
          {/* Drag Button */}
          <button 
            data-tauri-drag-region
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-grab active:cursor-grabbing"
            title="Drag to move window"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="12" r="1"/>
              <circle cx="9" cy="5" r="1"/>
              <circle cx="9" cy="19" r="1"/>
              <circle cx="15" cy="12" r="1"/>
              <circle cx="15" cy="5" r="1"/>
              <circle cx="15" cy="19" r="1"/>
            </svg>
          </button>
          
          <ErrorBoundary>
            <Settings />
          </ErrorBoundary>
          <Updater />
        </Card>
        
        <CustomCursor />
      </div>
    </ErrorBoundary>
  );
};

export default App;

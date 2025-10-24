import { useEffect, useState } from 'react';

export const CustomCursor = () => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    // Add event listeners to entire document
    document.addEventListener('mousemove', handleMouseMove);
    
    // Always show custom cursor and hide default cursor globally
    document.body.style.cursor = 'none';
    
    // Also hide cursor on all input elements
    const style = document.createElement('style');
    style.textContent = `
      * {
        cursor: none !important;
      }
      input, textarea, [contenteditable] {
        cursor: none !important;
        caret-color: transparent;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = '';
      document.head.removeChild(style);
    };
  }, []);

  // Always show cursor

  return (
    <div
      className="fixed pointer-events-none z-[9999] transition-all duration-75 ease-out"
      style={{
        left: cursorPosition.x - 12,
        top: cursorPosition.y - 12,
        transform: 'translate(0, 0)', // Smooth positioning
      }}
    >
      {/* Custom cursor design */}
      <div className="relative">
        {/* Main cursor dot */}
        <div className="w-6 h-6 bg-blue-500/80 rounded-full border-2 border-white shadow-lg backdrop-blur-sm" />
        {/* Outer ring animation */}
        <div className="absolute inset-0 w-6 h-6 border-2 border-blue-400/50 rounded-full animate-ping" />
      </div>
    </div>
  );
};
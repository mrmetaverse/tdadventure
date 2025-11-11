import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

interface ChatMessage {
  id: string;
  player: string;
  message: string;
  timestamp: number;
  type: 'player' | 'system';
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Return') {
        if (!isOpen) {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        } else if (input.trim()) {
          handleSend();
        } else {
          setIsOpen(false);
          setInput('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, input]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      player: 'You',
      message: input.trim(),
      timestamp: Date.now(),
      type: 'player',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    // Here you would send to network
    // networkClient.sendChatMessage(input.trim());
  };

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      player: 'System',
      message,
      timestamp: Date.now(),
      type: 'system',
    };
    setMessages((prev) => [...prev, systemMessage]);
  };

  return (
    <div className="fixed bottom-20 left-4 z-50 pointer-events-auto">
      <div className="bg-game-panel border-2 border-game-border rounded-lg shadow-2xl">
        {/* Chat Header */}
        <div
          className="px-3 py-2 cursor-pointer border-b border-game-border"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="text-game-text text-sm font-bold">Chat</div>
        </div>

        {/* Messages */}
        {isOpen && (
          <>
            <div className="h-64 overflow-y-auto p-2 space-y-1">
              {messages.length === 0 ? (
                <div className="text-game-text text-xs opacity-50 text-center py-4">
                  No messages yet. Press Enter to chat.
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="text-xs">
                    <span
                      className={
                        msg.type === 'system'
                          ? 'text-yellow-400'
                          : 'text-game-text font-semibold'
                      }
                    >
                      {msg.player}:
                    </span>
                    <span className="text-game-text ml-1">{msg.message}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-game-border p-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-game-bg border border-game-border rounded px-2 py-1 text-game-text text-sm focus:outline-none focus:border-game-mana"
                maxLength={200}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;


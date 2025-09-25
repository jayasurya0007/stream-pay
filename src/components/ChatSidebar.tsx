import { Gift, Send, Smile } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isCreator?: boolean;
  gift?: string;
}

interface ChatSidebarProps {
  onOpenGiftStore: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onOpenGiftStore }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      username: 'StreamerPro',
      message: 'Welcome to my stream! Thanks for joining! 🎉',
      timestamp: new Date(),
      isCreator: true,
    },
    {
      id: '2',
      username: 'ViewerFan',
      message: 'Amazing content as always!',
      timestamp: new Date(),
    },
    {
      id: '3',
      username: 'GiftGiver',
      message: 'Sent a ❤️ Heart',
      timestamp: new Date(),
      gift: 'heart',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      username: 'You',
      message: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 shadow-2xl">
      {/* Chat header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
        <h3 className="text-gray-100 font-bold text-xl mb-1">Live Chat</h3>
        <p className="text-gray-400 text-sm font-medium">{messages.length} messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">
        {messages.map((message) => (
          <div key={message.id} className="group">
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-lg ${
                message.isCreator 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900'
                  : message.gift
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300'
              }`}>
                {message.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`font-semibold text-sm ${
                    message.isCreator ? 'text-yellow-400' : 'text-yellow-300'
                  }`}>
                    {message.username}
                  </span>
                  {message.isCreator && (
                    <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                      CREATOR
                    </span>
                  )}
                  <span className="text-yellow-400/70 text-xs font-medium">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-sm break-words leading-relaxed ${
                  message.gift ? 'text-yellow-300 font-semibold' : 'text-yellow-200'
                }`}>
                  {message.message}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Gift buttons */}
      <div className="p-4 border-t border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={onOpenGiftStore}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl px-6 py-3.5 font-bold hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-yellow-500/20 transform hover:translate-y-[-1px]"
          >
            <Gift className="w-5 h-5" />
            <span>Send Gift</span>
          </button>
        </div>

        {/* Message input */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Say something..."
              className="w-full bg-black/50 backdrop-blur-sm text-yellow-400 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 border border-yellow-600/30 placeholder-yellow-300/70 transition-all duration-300"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-300 hover:text-yellow-400 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl p-3 hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
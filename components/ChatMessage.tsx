import React from 'react';
import { AgentMessage } from '../types';
import { AiIcon } from './icons/AiIcon';

interface ChatMessageProps {
  message: AgentMessage;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAi = message.sender === 'ai';

  return (
    <div className={`flex items-start gap-3 my-4 ${isAi ? '' : 'justify-end'}`}>
      {isAi && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-slate-600 bg-slate-700">
          <div className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">
            <AiIcon />
          </div>
        </div>
      )}
      <div
        className={`rounded-xl px-4 py-2.5 max-w-md shadow-lg ${
          isAi ? 'glass-pane text-slate-200' : 'text-white bg-gradient-to-br from-indigo-500 to-purple-600'
        }`}
      >
        <div className="prose prose-sm prose-invert max-w-none text-white/95 whitespace-pre-wrap">{message.text}</div>
      </div>
    </div>
  );
};
import React from 'react';
import { FiSend } from 'react-icons/fi';

interface UserInputProps {
  onSubmit: (text: string) => void;
  placeholder: string;
  disabled?: boolean;
  value: string;
  onValueChange: (text: string) => void;
}

export const UserInput: React.FC<UserInputProps> = ({ onSubmit, placeholder, disabled, value, onValueChange }) => {

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !disabled) {
            onSubmit(value.trim());
            onValueChange('');
        }
    };
    
    return (
        <div className="p-4 border-t border-slate-700/50 bg-slate-950/70">
            <form onSubmit={handleSubmit}>
                <label htmlFor="user-input" className="sr-only">Your feedback</label>
                <div className="relative">
                    <textarea
                        id="user-input"
                        rows={2}
                        className="block w-full resize-none rounded-lg border-0 bg-slate-800/80 py-2.5 pl-4 pr-12 text-slate-200 shadow-sm ring-1 ring-inset ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 disabled:opacity-50 transition-all"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onValueChange(e.target.value)}
                        disabled={disabled}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                handleSubmit(e);
                            }
                        }}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <button 
                            type="submit" 
                            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                            disabled={!value.trim() || disabled}
                        >
                            <FiSend className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Send feedback</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
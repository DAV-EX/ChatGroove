import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Phone, Video, Mic, Download, Volume2 } from "lucide-react";
import type { MessageWithSender } from "@shared/schema";

interface MultimediaMessageProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export function MultimediaMessage({ message, isOwn }: MultimediaMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageIcon = () => {
    switch (message.messageType) {
      case 'voice_note':
        return <Mic className="w-4 h-4" />;
      case 'video_note':
        return <Video className="w-4 h-4" />;
      case 'audio_call':
        return <Phone className="w-4 h-4" />;
      case 'video_call':
        return <Video className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getMessageTitle = () => {
    switch (message.messageType) {
      case 'voice_note':
        return 'Voice Note';
      case 'video_note':
        return 'Video Message';
      case 'audio_call':
        return 'Audio Call';
      case 'video_call':
        return 'Video Call';
      default:
        return 'Media';
    }
  };

  if (message.messageType === 'voice_note') {
    return (
      <div className={`flex items-center space-x-3 p-3 rounded-2xl max-w-xs ${
        isOwn ? 'bg-telegram-blue text-white ml-auto' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
      }`}>
        <Button
          size="sm"
          variant={isOwn ? "secondary" : "ghost"}
          className="rounded-full p-2 h-8 w-8"
          onClick={() => setIsPlaying(!isPlaying)}
          data-testid={`button-play-voice-${message.id}`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-3 h-3 opacity-70" />
            <div className="h-1 bg-current opacity-30 rounded-full flex-1">
              <div className="h-full bg-current rounded-full w-1/3" />
            </div>
          </div>
          {message.duration && (
            <span className="text-xs opacity-70 mt-1 block">
              {formatDuration(message.duration)}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (message.messageType === 'video_note') {
    return (
      <div className={`relative rounded-2xl overflow-hidden max-w-xs ${isOwn ? 'ml-auto' : ''}`}>
        <div className="aspect-square bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          {message.thumbnailUrl ? (
            <img 
              src={message.thumbnailUrl} 
              alt="Video thumbnail" 
              className="w-full h-full object-cover"
            />
          ) : (
            <Video className="w-16 h-16 text-gray-400" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full p-3"
            onClick={() => setIsPlaying(!isPlaying)}
            data-testid={`button-play-video-${message.id}`}
          >
            <Play className="w-6 h-6" />
          </Button>
        </div>
        {message.duration && (
          <Badge variant="secondary" className="absolute bottom-2 right-2 text-xs">
            {formatDuration(message.duration)}
          </Badge>
        )}
      </div>
    );
  }

  if (message.messageType === 'audio_call' || message.messageType === 'video_call') {
    return (
      <div className={`flex items-center space-x-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-sm ${
        isOwn ? 'ml-auto' : ''
      }`}>
        <div className={`p-2 rounded-full ${
          message.messageType === 'video_call' 
            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
            : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
        }`}>
          {getMessageIcon()}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{getMessageTitle()}</p>
          {message.duration ? (
            <p className="text-xs text-gray-500">Duration: {formatDuration(message.duration)}</p>
          ) : (
            <p className="text-xs text-gray-500">Call ended</p>
          )}
        </div>
        <Button size="sm" variant="ghost" data-testid={`button-call-back-${message.id}`}>
          {getMessageIcon()}
        </Button>
      </div>
    );
  }

  // Default fallback for unsupported media types
  return (
    <div className={`p-3 rounded-2xl max-w-xs ${
      isOwn ? 'bg-telegram-blue text-white ml-auto' : 'bg-gray-100 dark:bg-gray-800'
    }`}>
      <div className="flex items-center space-x-2">
        {getMessageIcon()}
        <span className="text-sm">{message.fileName || getMessageTitle()}</span>
        <Button size="sm" variant="ghost">
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
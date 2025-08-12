import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck } from "lucide-react";
import type { MessageWithSender, User } from "@shared/schema";

interface MessageBubbleProps {
  message: MessageWithSender;
  currentUser: User;
  showAvatar?: boolean;
}

export function MessageBubble({ message, currentUser, showAvatar = true }: MessageBubbleProps) {
  const isOwn = message.senderId === currentUser.id;
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderInitials = (sender: User) => {
    return `${sender.firstName || ""} ${sender.lastName || ""}`.trim().split(" ").map(n => n[0]).join("").toUpperCase() || 
           sender.username?.[0]?.toUpperCase() || 
           "U";
  };

  if (isOwn) {
    return (
      <div className="flex items-end justify-end space-x-2 animate-fade-in">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-telegram-blue rounded-2xl rounded-tr-md p-3 shadow-sm">
            {message.messageType === "image" && message.fileUrl && (
              <img
                src={message.fileUrl}
                alt="Shared image"
                className="w-full h-48 object-cover rounded-lg mb-2"
                data-testid={`message-image-${message.id}`}
              />
            )}
            {message.content && (
              <p className="text-white" data-testid={`message-content-${message.id}`}>
                {message.content}
              </p>
            )}
          </div>
          <div className="flex items-center justify-end mt-1 px-1 space-x-1">
            <span className="text-xs text-gray-500 dark:text-gray-400" data-testid={`message-time-${message.id}`}>
              {formatTime(message.createdAt!)}
            </span>
            {message.isRead ? (
              <CheckCheck className="w-3 h-3 text-telegram-blue" data-testid={`message-read-${message.id}`} />
            ) : (
              <Check className="w-3 h-3 text-gray-400" data-testid={`message-sent-${message.id}`} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-2 animate-fade-in">
      {showAvatar && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={message.sender.profileImageUrl || undefined} />
          <AvatarFallback>{getSenderInitials(message.sender)}</AvatarFallback>
        </Avatar>
      )}
      <div className="max-w-xs lg:max-w-md">
        <div className="bg-white dark:bg-telegram-dark-secondary rounded-2xl rounded-tl-md shadow-sm overflow-hidden">
          {message.messageType === "image" && message.fileUrl && (
            <img
              src={message.fileUrl}
              alt="Shared image"
              className="w-full h-48 object-cover"
              data-testid={`message-image-${message.id}`}
            />
          )}
          {message.content && (
            <div className="p-3">
              <p className="text-gray-900 dark:text-white" data-testid={`message-content-${message.id}`}>
                {message.content}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-xs text-gray-500 dark:text-gray-400" data-testid={`message-time-${message.id}`}>
            {formatTime(message.createdAt!)}
          </span>
        </div>
      </div>
    </div>
  );
}

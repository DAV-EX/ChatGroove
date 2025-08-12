import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { Phone, Video, MoreVertical, Paperclip, Smile, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ChatWithParticipants, MessageWithSender, User } from "@shared/schema";

interface ChatAreaProps {
  selectedChatId: string;
  currentUser: User;
}

export function ChatArea({ selectedChatId, currentUser }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chat, isLoading: chatLoading } = useQuery<ChatWithParticipants>({
    queryKey: ["/api/chats", selectedChatId],
    enabled: !!selectedChatId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/chats", selectedChatId, "messages"],
    enabled: !!selectedChatId,
    refetchInterval: 2000, // Poll for new messages every 2 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/chats/${selectedChatId}/messages`, {
        content,
        messageType: "text",
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/chats", selectedChatId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/chats/${selectedChatId}/read`, {});
    },
  });

  useEffect(() => {
    // Mark messages as read when chat is opened
    if (selectedChatId && messages.length > 0) {
      markAsReadMutation.mutate();
    }
  }, [selectedChatId, messages.length]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    const content = messageText.trim();
    if (!content || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getChatName = () => {
    if (!chat) return "Loading...";
    
    if (chat.isGroup) {
      return chat.name || "Group Chat";
    } else {
      const otherParticipant = chat.participants.find(p => p.userId !== currentUser.id);
      if (otherParticipant) {
        return `${otherParticipant.user.firstName || ""} ${otherParticipant.user.lastName || ""}`.trim() || 
               otherParticipant.user.username || 
               "Unknown User";
      }
      return "Direct Message";
    }
  };

  const getChatAvatar = () => {
    if (!chat) return undefined;
    
    if (chat.isGroup) {
      return chat.imageUrl;
    } else {
      const otherParticipant = chat.participants.find(p => p.userId !== currentUser.id);
      return otherParticipant?.user.profileImageUrl;
    }
  };

  const getChatStatus = () => {
    if (!chat) return "Loading...";
    
    if (chat.isGroup) {
      return `${chat.participants.length} members`;
    } else {
      const otherParticipant = chat.participants.find(p => p.userId !== currentUser.id);
      if (otherParticipant?.user.isOnline) {
        return "online";
      } else if (otherParticipant?.user.lastSeen) {
        const lastSeen = new Date(otherParticipant.user.lastSeen);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
        
        if (diffMinutes < 1) return "just now";
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
        return lastSeen.toLocaleDateString();
      }
      return "offline";
    }
  };

  const getChatInitials = () => {
    const name = getChatName();
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!selectedChatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-telegram-dark">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 bg-telegram-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-medium mb-2">Welcome to TeleClone</h3>
          <p>Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  if (chatLoading || messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-telegram-dark">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading chat...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white dark:bg-telegram-dark-secondary border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={getChatAvatar() || undefined} />
              <AvatarFallback>{getChatInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white" data-testid="chat-name">
                {getChatName()}
              </h3>
              <p className={`text-sm ${getChatStatus() === "online" ? "text-green-500" : "text-gray-500 dark:text-gray-400"}`} data-testid="chat-status">
                {getChatStatus()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" data-testid="button-call">
              <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-video-call">
              <Video className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-chat-options">
              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-gray-50 dark:bg-telegram-dark" ref={scrollAreaRef}>
        <div className="p-4 space-y-4" data-testid="messages-container">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUser={currentUser}
                  showAvatar={showAvatar}
                />
              );
            })
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={getChatAvatar() || undefined} />
                <AvatarFallback>{getChatInitials()}</AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-telegram-dark-secondary rounded-2xl rounded-tl-md p-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input Area */}
      <div className="bg-white dark:bg-telegram-dark-secondary border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-3">
          <Button variant="ghost" size="sm" data-testid="button-attach-file">
            <Paperclip className="h-5 w-5 text-gray-500" />
          </Button>
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[44px] max-h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:ring-2 focus:ring-telegram-blue focus:border-transparent dark:bg-telegram-dark-tertiary dark:text-white"
              data-testid="input-message"
            />
          </div>
          <Button variant="ghost" size="sm" data-testid="button-emoji">
            <Smile className="h-5 w-5 text-gray-500" />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-telegram-blue hover:bg-telegram-blue-dark text-white p-3 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-send-message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  UserPlus,
  Info,
  Mic,
  Image as ImageIcon,
  File,
  MapPin,
  Menu
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { MultimediaMessage } from "./multimedia-message";
import { CallControls } from "./call-controls";
import type { MessageWithSender, ChatWithParticipants, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface EnhancedChatAreaProps {
  chatId: string;
  currentUser: User | null;
  onOpenMobileMenu?: () => void;
  isMobileSidebarOpen?: boolean;
}

export function EnhancedChatArea({ chatId, currentUser, onOpenMobileMenu, isMobileSidebarOpen }: EnhancedChatAreaProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // If no user, don't render the component
  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Please sign in to use ChatGroove</p>
        </div>
      </div>
    );
  }

  // Fetch chat details
  const { data: chat, isLoading: chatLoading } = useQuery<ChatWithParticipants>({
    queryKey: ['/api/chats', chatId],
    enabled: !!chatId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading, refetch } = useQuery<MessageWithSender[]>({
    queryKey: ['/api/chats', chatId, 'messages'],
    enabled: !!chatId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, messageType = 'text' }: { content: string; messageType?: string }) => {
      return await apiRequest(`/api/chats/${chatId}/messages`, 'POST', { content, messageType });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    if (editingMessageId) {
      handleUpdateMessage(editingMessageId, message.trim());
    } else {
      sendMessageMutation.mutate({ content: message.trim() });
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
    setMessage(content);
  };

  const handleUpdateMessage = async (messageId: string, content: string) => {
    try {
      await apiRequest(`/api/messages/${messageId}`, 'PUT', { content });
      setEditingMessageId(null);
      setEditingContent("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
      await apiRequest(`/api/messages/${messageId}`, 'DELETE');
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleMessageContextMenu = (e: React.MouseEvent, messageId: string, isOwn: boolean) => {
    e.preventDefault();
    if (isOwn) {
      // Could implement a context menu here
      console.log('Context menu for message:', messageId);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
    setMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    if (!chatId) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [chatId, refetch]);

  const getChatName = (chat: ChatWithParticipants | undefined) => {
    if (!chat) return 'Unknown Chat';
    if (chat?.name) return chat.name;
    
    const otherParticipants = chat?.participants?.filter(p => p.userId !== currentUser.id) || [];
    if (otherParticipants.length === 1) {
      const user = otherParticipants[0].user;
      return user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.email || 'Unknown User';
    }
    
    return `Group Chat (${otherParticipants.length + 1})`;
  };

  const getChatAvatar = (chat: ChatWithParticipants | undefined) => {
    if (!chat) return undefined;
    if (chat?.imageUrl) return chat.imageUrl;
    
    const otherParticipants = chat?.participants?.filter(p => p.userId !== currentUser.id) || [];
    if (otherParticipants.length === 1) {
      return otherParticipants[0].user.profileImageUrl;
    }
    
    return undefined;
  };

  const getChatInitials = (chat: ChatWithParticipants | undefined) => {
    const name = getChatName(chat);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (chatLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smile className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Welcome to ChatGroove</h2>
          <p className="text-gray-600 dark:text-gray-300">Select a chat or global room to start messaging</p>
        </div>
      </div>
    );
  }

  const isGroup = (chat?.participants?.length || 0) > 2;
  const otherParticipants = chat?.participants?.filter(p => p.userId !== currentUser.id) || [];
  const isGlobalRoom = chat?.isGlobalRoom;

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-black">
      {/* Chat Header */}
      <div className="p-3 lg:p-4 border-b border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 lg:space-x-4">
            {/* Mobile Menu Button */}
            {onOpenMobileMenu && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenMobileMenu}
                className="lg:hidden hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <div className="relative">
              <Avatar className="h-10 w-10 lg:h-12 lg:w-12 border-2 border-white dark:border-gray-700 shadow-lg">
                <AvatarImage src={getChatAvatar(chat) || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white font-bold text-sm lg:text-lg">
                  {getChatInitials(chat)}
                </AvatarFallback>
              </Avatar>
              {!isGroup && !isGlobalRoom && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </div>
            
            <div>
              <h2 className="font-bold text-base lg:text-lg text-gray-900 dark:text-white">
                {getChatName(chat)}
              </h2>
              <div className="flex items-center space-x-2">
                {isGlobalRoom ? (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                      Global Room
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {chat.participants?.length || 0} members
                    </span>
                  </div>
                ) : isGroup ? (
                  <span className="text-sm text-gray-500">
                    {otherParticipants.length + 1} members
                  </span>
                ) : (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    🟢 Online
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isGroup && !isGlobalRoom && <CallControls chatId={chatId} recipientName={getChatName(chat)} />}
            <Button variant="ghost" size="icon" className="text-purple-600 dark:text-purple-400">
              <Info className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 chatgroove-scrollbar">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smile className="w-8 h-8 text-purple-600 dark:text-purple-300" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((msg: MessageWithSender, index: number) => {
              const isOwn = msg.senderId === currentUser._id;
              const showAvatar = index === 0 || messages[index - 1]?.senderId !== msg.senderId;
              
              return (
                <div key={msg._id} className={`flex items-end space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && showAvatar && (
                    <Avatar className="h-8 w-8 mb-1 border border-white dark:border-gray-700">
                      <AvatarImage src={msg.sender.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-sm">
                        {msg.sender.firstName?.[0] || msg.sender.email?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[280px] sm:max-w-xs lg:max-w-md`}>
                    {!isOwn && showAvatar && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
                        {msg.sender.firstName && msg.sender.lastName
                          ? `${msg.sender.firstName} ${msg.sender.lastName}`
                          : msg.sender.firstName || msg.sender.email}
                      </span>
                    )}
                    
                    {msg.messageType !== 'text' ? (
                      <MultimediaMessage message={msg} isOwn={isOwn} />
                    ) : (
                      <div 
                        className={`message-bubble p-3 ${isOwn ? 'own' : ''} ${
                          isOwn 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm'
                        } group relative hover:shadow-md transition-shadow cursor-pointer`}
                        onDoubleClick={() => isOwn && handleEditMessage(msg._id!, msg.content || '')}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleMessageContextMenu(e, msg._id!, isOwn);
                        }}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        {msg.editedAt && (
                          <span className="text-xs opacity-70 italic ml-2">(edited)</span>
                        )}
                        
                        {/* Telegram-like message options */}
                        {isOwn && (
                          <div className="absolute -top-8 right-0 hidden group-hover:flex bg-black/80 rounded-lg px-2 py-1 space-x-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditMessage(msg._id!, msg.content || ''); }}
                              className="text-white hover:text-blue-300 text-xs px-1"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg._id!); }}
                              className="text-white hover:text-red-300 text-xs px-1"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-2">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {!isOwn && !showAvatar && <div className="w-8" />}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 lg:p-4 border-t border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 lg:space-x-3">
          {/* Attachment buttons - hidden on mobile by default, shown on larger screens */}
          <div className="hidden sm:flex items-center space-x-1 lg:space-x-2">
            <Button type="button" variant="ghost" size="icon" className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 w-8 h-8 lg:w-10 lg:h-10">
              <Paperclip className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 w-8 h-8 lg:w-10 lg:h-10">
              <ImageIcon className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 w-8 h-8 lg:w-10 lg:h-10">
              <Mic className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
          </div>
          
          {/* Mobile attachment button */}
          <Button type="button" variant="ghost" size="icon" className="sm:hidden text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 w-8 h-8">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
              className="pl-3 pr-10 py-2 lg:pl-4 lg:pr-12 lg:py-3 rounded-2xl bg-purple-50 dark:bg-gray-800 border-purple-200 dark:border-purple-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm lg:text-base"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 lg:right-2 top-1/2 transform -translate-y-1/2 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900 w-7 h-7 lg:w-8 lg:h-8"
            >
              <Smile className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
          </div>
          
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-10 h-10 lg:w-12 lg:h-12 p-0 flex items-center justify-center"
            data-testid="button-send-message"
          >
            {sendMessageMutation.isPending ? (
              <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 lg:w-5 lg:h-5" />
            )}
          </Button>
          
          {editingMessageId && (
            <Button type="button" onClick={handleCancelEdit} variant="ghost" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
              Cancel
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
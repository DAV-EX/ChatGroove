import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/chat/sidebar";
import { EnhancedChatArea } from "@/components/chat/enhanced-chat-area";
import { ProfileModal } from "@/components/profile/profile-modal";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ChatWithParticipants } from "@shared/schema";

export default function Home() {
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Fetch global rooms to auto-select the main one
  const { data: globalRooms = [] } = useQuery<ChatWithParticipants[]>({
    queryKey: ["/api/chats/global"],
    enabled: !!user,
  });

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  // Auto-select the main global chatroom when user first lands
  useEffect(() => {
    if (user && globalRooms.length > 0 && !selectedChatId) {
      // Find the main global room (usually "General" or first one)
      const mainRoom = globalRooms.find(room => 
        room.name?.toLowerCase().includes('general') || 
        room.name?.toLowerCase().includes('welcome') ||
        room.name?.toLowerCase().includes('main')
      ) || globalRooms[0]; // Fallback to first room
      
      if (mainRoom) {
        setSelectedChatId(mainRoom._id!);
      }
    }
  }, [user, globalRooms, selectedChatId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-telegram-dark">
        <div className="text-center">
          <div className="w-16 h-16 bg-telegram-blue rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded opacity-75"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    // Close mobile sidebar when selecting a chat on mobile
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-telegram-dark" data-testid="home-page">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onShowProfile={() => setIsProfileModalOpen(true)}
          currentUser={user}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <EnhancedChatArea
          chatId={selectedChatId || ""}
          currentUser={user}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={user}
      />
    </div>
  );
}

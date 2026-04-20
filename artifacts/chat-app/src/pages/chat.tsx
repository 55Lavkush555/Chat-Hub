import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { User } from "@workspace/api-client-react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function ChatPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, token, user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { typingUsers, emitTyping } = useSocket(token, currentUser?.id);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20"></div>
          <div className="text-muted-foreground font-medium">Connecting...</div>
        </div>
      </div>
    );
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 lg:w-96 border-r border-border bg-sidebar flex-col">
        <Sidebar
          currentUser={currentUser}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
        />
      </div>

      {/* Mobile Sidebar (controlled Sheet — no SheetTrigger needed) */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80 flex flex-col bg-sidebar">
          <Sidebar
            currentUser={currentUser}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        {/* Mobile header — plain button opens the controlled Sheet */}
        <div className="md:hidden flex items-center p-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setIsMobileSidebarOpen(true)}
            data-testid="button-open-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {selectedUser ? (
            <div className="font-semibold">{selectedUser.username}</div>
          ) : (
            <div className="font-semibold text-muted-foreground">Select a chat</div>
          )}
        </div>

        <ChatArea
          currentUser={currentUser}
          selectedUser={selectedUser}
          typingUsers={typingUsers}
          emitTyping={emitTyping}
        />
      </div>
    </div>
  );
}

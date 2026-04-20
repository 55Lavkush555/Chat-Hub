import { useState } from "react";
import { useGetUsers, useGetOnlineUsers, User } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
}

export function Sidebar({ currentUser, selectedUser, onSelectUser }: SidebarProps) {
  const [search, setSearch] = useState("");
  const { logout } = useAuth();

  const { data: onlineUsersData } = useGetOnlineUsers();
  const { data: searchUsersData } = useGetUsers(
    search ? { search } : undefined,
    { query: { enabled: true } }
  );

  const onlineUserIds = new Set(onlineUsersData?.users.map(u => u.id) || []);
  
  // All users, ensuring current user is excluded
  const users = (searchUsersData?.users || []).filter(u => u.id !== currentUser.id);

  // Sort: Online first, then alphabetical
  const sortedUsers = [...users].sort((a, b) => {
    const aOnline = onlineUserIds.has(a.id);
    const bOnline = onlineUserIds.has(b.id);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return a.username.localeCompare(b.username);
  });

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={currentUser.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(currentUser.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground truncate max-w-[120px]">
                {currentUser.username}
              </span>
              <span className="text-xs text-green-500 font-medium">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-none shadow-none focus-visible:ring-1"
          />
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-1">
          {sortedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No users found
            </div>
          ) : (
            sortedUsers.map(user => {
              const isOnline = onlineUserIds.has(user.id) || user.isOnline;
              const isSelected = selectedUser?.id === user.id;

              return (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200",
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-background/20">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className={cn(
                        "font-semibold",
                        isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background ring-1 ring-background shadow-sm" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium truncate">{user.username}</div>
                    <div className={cn(
                      "text-xs truncate",
                      isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {isOnline ? "Active now" : "Offline"}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

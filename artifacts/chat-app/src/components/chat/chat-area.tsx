import { useEffect, useRef, useState } from "react";
import { useGetMessages, useSendMessage, User } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  currentUser: User;
  selectedUser: User | null;
  typingUsers: Set<string>;
  emitTyping: (receiverId: string, isTyping: boolean) => void;
}

export function ChatArea({ currentUser, selectedUser, typingUsers, emitTyping }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: messagesData, isLoading } = useGetMessages(
    selectedUser?.id || "",
    { query: { enabled: !!selectedUser?.id } }
  );

  const sendMessageMutation = useSendMessage();

  const messages = messagesData?.messages || [];
  const isTyping = selectedUser && typingUsers.has(selectedUser.id);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    if (!selectedUser) return;

    // Emit typing true
    emitTyping(selectedUser.id, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing false after 2s of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(selectedUser.id, false);
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedUser) return;

    sendMessageMutation.mutate({
      data: {
        receiverId: selectedUser.id,
        content: trimmed
      }
    });

    setInput("");
    emitTyping(selectedUser.id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-card/30 p-8 text-center">
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="h-10 w-10 text-primary/40" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your Messages</h2>
        <p className="text-muted-foreground max-w-sm">
          Select a user from the sidebar to start a conversation or continue an existing one.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="hidden md:flex h-16 items-center px-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedUser.avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(selectedUser.username)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground">{selectedUser.username}</h2>
            {typingUsers.has(selectedUser.id) ? (
              <p className="text-xs text-primary font-medium animate-pulse">Typing...</p>
            ) : (
              <p className="text-xs text-muted-foreground">View profile</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-muted" />
            </div>
            <p>Say hello to {selectedUser.username}!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full",
                  isMe ? "justify-end" : "justify-start",
                  showAvatar ? "mt-6" : "mt-2"
                )}
              >
                <div className={cn("flex max-w-[75%] md:max-w-[65%]", isMe ? "flex-row-reverse" : "flex-row")}>
                  {/* Avatar for other user */}
                  {!isMe && (
                    <div className="w-8 shrink-0 mr-2 flex items-end pb-1">
                      {showAvatar && (
                        <Avatar className="h-8 w-8 shadow-sm">
                          <AvatarImage src={selectedUser.avatarUrl} />
                          <AvatarFallback className="text-xs bg-sidebar-accent">
                            {getInitials(selectedUser.username)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={cn(
                    "flex flex-col",
                    isMe ? "items-end" : "items-start"
                  )}>
                    <div
                      className={cn(
                        "px-4 py-2.5 rounded-2xl whitespace-pre-wrap break-words text-[15px] leading-relaxed shadow-sm",
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-br-sm" 
                          : "bg-card border border-border text-card-foreground rounded-bl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 mx-1 px-1">
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex justify-start items-end mt-4">
            <div className="w-8 shrink-0 mr-2">
              <Avatar className="h-8 w-8 shadow-sm">
                <AvatarImage src={selectedUser.avatarUrl} />
                <AvatarFallback className="text-xs bg-sidebar-accent">
                  {getInitials(selectedUser.username)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm w-fit">
              <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-card border border-input rounded-2xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-shadow">
          <Textarea
            value={input}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedUser.username}...`}
            className="min-h-[44px] max-h-32 resize-none border-0 shadow-none focus-visible:ring-0 py-3 px-3 bg-transparent"
            rows={1}
          />
          <Button 
            size="icon" 
            className="h-10 w-10 shrink-0 rounded-xl mb-1 mr-1" 
            disabled={!input.trim() || sendMessageMutation.isPending}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center mt-2 text-[10px] text-muted-foreground">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  );
}

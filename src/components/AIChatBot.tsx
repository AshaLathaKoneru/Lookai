import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your nutrition assistant. Ask me anything about food, calories, or diet tips! 🥗" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("nutrition-chat", {
        body: { message: userMessage }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.response || "I couldn't process that. Please try again." 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I'm having trouble right now. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg pressable"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Nutrition AI</h3>
                    <p className="text-xs text-muted-foreground">Your food assistant</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center pressable"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-accent" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === "user" 
                        ? "bg-accent text-white rounded-br-md" 
                        : "bg-background border border-border text-foreground rounded-bl-md"
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                    <div className="bg-background border border-border px-4 py-3 rounded-2xl rounded-bl-md">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-background">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask about nutrition..."
                    className="flex-1 h-11 bg-secondary rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="w-11 h-11 rounded-full"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

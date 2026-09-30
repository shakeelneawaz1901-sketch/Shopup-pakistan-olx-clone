import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Send, MessageCircle, Loader2, Trash2, CheckCheck,
} from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import type { Session, Message, Ad } from '../types';
import { timeAgo } from '../utils';

type ChatPartner = {
  id: string;
  name: string;
};

type ConversationSummary = {
  other_user_id: string;
  other_user_name: string;
  ad_id: string;
  ad_title: string;
  last_message: string;
  last_time: string;
  unread: number;
};

type Props = {
  session: Session;
  initialChat?: { adId: string; receiverId: string; adTitle: string } | null;
  onClearInitialChat?: () => void;
};

export default function ChatView({ session, initialChat, onClearInitialChat }: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<{
    adId: string;
    receiverId: string;
    adTitle: string;
    receiverName: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch conversation list ──────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('messages')
      .select(`
        id, sender_id, receiver_id, ad_id, content, created_at, read_at,
        ad:ads(title)
      `)
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Group by (other_user_id + ad_id) to build conversation summaries
    const convMap = new Map<string, ConversationSummary>();
    for (const m of (data as any[]) ?? []) {
      const isSender = m.sender_id === session.user.id;
      const otherId = isSender ? m.receiver_id : m.sender_id;
      const key = `${otherId}-${m.ad_id}`;
      if (!convMap.has(key)) {
        convMap.set(key, {
          other_user_id: otherId,
          other_user_name: isSender ? 'Seller' : 'Buyer',
          ad_id: m.ad_id,
          ad_title: m.ad?.title ?? 'Ad',
          last_message: m.content,
          last_time: m.created_at,
          unread: 0,
        });
      }
      const conv = convMap.get(key)!;
      if (new Date(m.created_at) > new Date(conv.last_time)) {
        conv.last_message = m.content;
        conv.last_time = m.created_at;
      }
      if (!isSender && !m.read_at) {
        conv.unread += 1;
      }
    }
    setConversations(Array.from(convMap.values()).sort(
      (a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime(),
    ));
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Realtime: listen for new messages ─────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages',
          filter: `receiver_id=eq.${session.user.id}` },
        () => { fetchConversations(); },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages',
          filter: `sender_id=eq.${session.user.id}` },
        () => { fetchConversations(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session.user.id, fetchConversations]);

  // ── Open conversation from initialChat (e.g. clicking Chat on an ad) ─────
  useEffect(() => {
    if (initialChat) {
      setActiveConv({
        adId: initialChat.adId,
        receiverId: initialChat.receiverId,
        adTitle: initialChat.adTitle,
        receiverName: 'Seller',
      });
      onClearInitialChat?.();
    }
  }, [initialChat, onClearInitialChat]);

  // ── Fetch messages for active conversation ───────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!activeConv) return;
    const { data, error: err } = await supabase
      .from('messages')
      .select('*')
      .eq('ad_id', activeConv.adId)
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order('created_at', { ascending: true });

    if (err) {
      setError(err.message);
      return;
    }
    setMessages((data as Message[]) ?? []);

    // Mark received messages as read
    const unreadIds = (data as Message[])
      ?.filter((m) => m.receiver_id === session.user.id && !m.read_at)
      .map((m) => m.id) ?? [];
    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }
  }, [activeConv, session.user.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Realtime for active conversation messages ────────────────────────────
  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`chat-${activeConv.adId}-${activeConv.receiverId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `ad_id=eq.${activeConv.adId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === session.user.id || newMsg.receiver_id === session.user.id) &&
            (newMsg.sender_id === activeConv.receiverId || newMsg.receiver_id === activeConv.receiverId)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // Mark as read if we're the receiver
            if (newMsg.receiver_id === session.user.id && !newMsg.read_at) {
              supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', newMsg.id)
                .then(() => fetchConversations());
            }
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConv, session.user.id, fetchConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !msgInput.trim()) return;
    setSending(true);
    setError(null);
    const { error: insErr } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: activeConv.receiverId,
      ad_id: activeConv.adId,
      content: msgInput.trim(),
    });
    if (insErr) {
      setError(insErr.message);
    } else {
      setMsgInput('');
    }
    setSending(false);
  };

  // ── Delete a message ─────────────────────────────────────────────────────
  const handleDeleteMsg = async (id: string) => {
    await supabase.from('messages').delete().eq('id', id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // ── RENDER: Message thread ────────────────────────────────────────────────
  if (activeConv) {
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Chat header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => { setActiveConv(null); fetchConversations(); }}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 truncate">{activeConv.receiverName}</p>
              <p className="text-xs text-gray-400 truncate">{activeConv.adTitle}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
          <div className="mx-auto max-w-2xl space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No messages yet. Say hello!</p>
              </div>
            )}
            {messages.map((m) => {
              const isMine = m.sender_id === session.user.id;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`group relative max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                    isMine
                      ? 'bg-emerald-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'text-emerald-100' : 'text-gray-400'}`}>
                      <span className="text-[10px]">{timeAgo(m.created_at)}</span>
                      {isMine && m.read_at && <CheckCheck className="w-3 h-3" />}
                    </div>
                    <button
                      onClick={() => handleDeleteMsg(m.id)}
                      className={`absolute -top-2 ${
                        isMine ? '-left-2' : '-right-2'
                      } opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md rounded-full p-1 text-red-500 hover:text-red-600`}
                      aria-label="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200">
          {error && (
            <div className="mx-auto max-w-2xl px-4 pt-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSend} className="mx-auto max-w-2xl px-3 py-2.5 flex items-center gap-2">
            <input
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={sending || !msgInput.trim()}
              className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
              aria-label="Send"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── RENDER: Conversation list ──────────────────────────────────────────────
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Chats</h2>
        <p className="text-sm text-gray-500">Your conversations with buyers and sellers</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading chats...
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <MessageCircle className="w-12 h-12 mb-3" />
          <p className="text-sm">No conversations yet.</p>
          <p className="text-xs mt-1">Tap the Chat button on any ad to start chatting.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {conversations.map((conv, idx) => (
            <button
              key={`${conv.other_user_id}-${conv.ad_id}-${idx}`}
              onClick={() => setActiveConv({
                adId: conv.ad_id,
                receiverId: conv.other_user_id,
                adTitle: conv.ad_title,
                receiverName: conv.other_user_name,
              })}
              className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-emerald-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-900 truncate">{conv.other_user_name}</p>
                  <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(conv.last_time)}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.ad_title}</p>
                <p className="text-sm text-gray-600 truncate mt-0.5">{conv.last_message}</p>
              </div>
              {conv.unread > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

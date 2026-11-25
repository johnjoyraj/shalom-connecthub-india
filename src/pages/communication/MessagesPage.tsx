import { Bell, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBanner, LoadingState } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { communicationStore } from '../../services/communicationStore';
import type { ChatMessage, Conversation, NotificationItem } from '../../types/communication';

export function MessagesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [convData, notifs] = await Promise.all([
        communicationStore.getMyConversations(user),
        communicationStore.getMyNotifications(user.profile.id),
      ]);
      setConversations(convData.conversations);
      setMessages(convData.messages);
      setNotifications(notifs);
      if (convData.conversations.length > 0 && !selectedId) {
        setSelectedId(convData.conversations[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!user) return null;
  if (loading) return <LoadingState label="Loading Messages & Alerts..." />;

  const activeMessages = messages.filter((m) => m.conversation_id === selectedId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setError(null);
    try {
      await communicationStore.sendConversationMessage(user, selectedId, draft);
      setDraft('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Messages &amp; Notifications</h1>
      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4">
          <h2 className="text-sm font-bold text-slate-900">Enquiry Threads ({conversations.length})</h2>
          <div className="mt-3 space-y-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`w-full rounded-xl border p-3 text-left text-xs ${
                  c.id === selectedId ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <p className="font-bold text-slate-900">{c.listing_title}</p>
                <p className="mt-0.5 text-slate-500">Status: {c.status}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-8">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Conversation History</h2>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
              {activeMessages.length === 0 ? (
                <p className="text-xs text-slate-500">Select a conversation to view messages.</p>
              ) : (
                activeMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-xl p-3 text-xs ${
                      m.sender_id === user.profile.id ? 'ml-8 bg-brand-700 text-white' : 'mr-8 bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    <p className="font-bold opacity-80">{m.sender_name}</p>
                    <p className="mt-0.5">{m.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedId ? (
            <form onSubmit={handleSend} className="mt-4 flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
                <Send className="h-4 w-4" /> Send
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-brand-700">
          <Bell className="h-5 w-5" />
          <h2 className="text-base font-bold text-slate-900">Recent Notifications ({notifications.length})</h2>
        </div>
        <div className="mt-3 space-y-2 text-xs">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div>
                <p className="font-bold text-slate-900">{n.title}</p>
                <p className="text-slate-600">{n.body}</p>
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">{n.channel}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

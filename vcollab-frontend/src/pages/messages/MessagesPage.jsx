import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  listConversations,
  markConversationRead
} from "../../services/conversation.service";
import {
  deleteMessage,
  listMessages,
  sendMessage
} from "../../services/message.service";
import useMessageUpdates from "../../websocket/useMessageUpdates";

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const currentUser = useAuthStore((state) => state.user);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();

  const { data: conversationPage } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations({ page: 0, size: 50, sort: "updatedAt,desc" })
  });

  const conversations = conversationPage?.content || [];

  useEffect(() => {
    const param = searchParams.get("conversation");
    if (param) {
      const parsed = Number(param);
      if (!Number.isNaN(parsed)) {
        setActiveId(parsed);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [activeId, conversations]);

  useEffect(() => {
    if (!activeId) return;
    markConversationRead(activeId).then(() => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
  }, [activeId, queryClient]);

  const { data: messagePage } = useQuery({
    queryKey: ["messages", String(activeId)],
    queryFn: () => listMessages(activeId, { page: 0, size: 50, sort: "createdAt,desc" }),
    enabled: Boolean(activeId)
  });

  useMessageUpdates(activeId);

  const messages = useMemo(() => {
    const list = messagePage?.content || [];
    return [...list].reverse();
  }, [messagePage]);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId);
  const activeParticipant = activeConversation?.participants?.find(
    (participant) => participant.id !== currentUser?.id
  ) || activeConversation?.participants?.[0];

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !activeId) return;
    await sendMessage({ conversationId: activeId, content });
    setDraft("");
    await queryClient.invalidateQueries({ queryKey: ["messages", String(activeId)] });
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const handleDeleteMessage = async (messageId) => {
    await deleteMessage(messageId);
    await queryClient.invalidateQueries({ queryKey: ["messages", String(activeId)] });
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return (
    <div className="messages-layout">
      <div className="conversation-panel card">
        <h3>Messages</h3>
        {conversations.length === 0 && (
          <div className="comment-muted">No conversations yet.</div>
        )}
        <div className="conversation-list">
          {conversations.map((conversation) => {
            const other = conversation.participants?.find(
              (participant) => participant.id !== currentUser?.id
            ) || conversation.participants?.[0];
            return (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-item ${activeId === conversation.id ? "active" : ""}`}
                onClick={() => setActiveId(conversation.id)}
              >
                <div className="conversation-title">
                  {other?.fullName || other?.username || "Unknown"}
                </div>
                <div className="comment-muted">
                  {conversation.lastMessage?.content || "No messages yet."}
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="badge">{conversation.unreadCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="message-panel card">
        <div className="message-header">
          <h3>{activeParticipant?.fullName || activeParticipant?.username || "Conversation"}</h3>
          <span className="comment-muted">
            {activeConversation?.lastMessage?.createdAt
              ? new Date(activeConversation.lastMessage.createdAt).toLocaleString()
              : ""}
          </span>
        </div>
        <div className="message-thread">
          {messages.length === 0 && (
            <div className="comment-muted">Start the conversation with a message.</div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${
                message.sender?.id === currentUser?.id ? "self" : ""
              }`}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>{message.content}</div>
                {message.sender?.id === currentUser?.id && (
                  <button
                    type="button"
                    className="btn-glass"
                    style={{ padding: "6px 8px", minWidth: "auto" }}
                    onClick={() => handleDeleteMessage(message.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <span className="comment-muted">
                {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ""}
              </span>
            </div>
          ))}
        </div>
        <div className="message-input">
          <textarea
            rows="2"
            value={draft}
            placeholder="Write a message..."
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="btn-primary" type="button" onClick={handleSend} disabled={!activeId}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

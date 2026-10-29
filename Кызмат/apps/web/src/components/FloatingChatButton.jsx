import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const BUTTON_SIZE = 52;
const EDGE_GAP = 16;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getInitialPosition() {
  if (typeof window === "undefined") {
    return { x: EDGE_GAP, y: EDGE_GAP };
  }

  const saved = window.localStorage.getItem("kyzmat_floating_chat_position");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
        return {
          x: clamp(parsed.x, EDGE_GAP, window.innerWidth - BUTTON_SIZE - EDGE_GAP),
          y: clamp(parsed.y, EDGE_GAP, window.innerHeight - BUTTON_SIZE - EDGE_GAP),
        };
      }
    } catch {
      // Ignore old or broken saved positions.
    }
  }

  return {
    x: window.innerWidth - BUTTON_SIZE - EDGE_GAP,
    y: window.innerHeight - BUTTON_SIZE - EDGE_GAP,
  };
}

function ChatBubbleIcon() {
  return (
    <svg aria-hidden="true" className="relative h-[26px] w-[26px]" fill="none" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="kyzmat-chat-icon-fill" x1="8" x2="24" y1="7" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.16)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>
      </defs>
      <path
        d="M8.4 9.45c0-1.78 1.44-3.22 3.22-3.22h8.76c1.78 0 3.22 1.44 3.22 3.22v6.86c0 1.78-1.44 3.22-3.22 3.22h-4.47l-4.14 3.12c-.4.3-.97.02-.97-.48v-2.64c-1.37-.34-2.4-1.58-2.4-3.22V9.45Z"
        fill="url(#kyzmat-chat-icon-fill)"
        stroke="rgba(255,255,255,0.98)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M12.7 12.15h6.6"
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="2.15"
      />
      <path
        d="M12.7 15.95h4.8"
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="2.15"
      />
    </svg>
  );
}

function FloatingChatButton() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [position, setPosition] = useState(getInitialPosition);
  const dragStateRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessages(0);
      return undefined;
    }

    let isMounted = true;

    const loadUnreadMessages = async () => {
      try {
        const { data } = await api.get("/messages/conversations");
        const nextUnread = Array.isArray(data)
          ? data.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0)
          : 0;
        if (isMounted) setUnreadMessages(nextUnread);
      } catch {
        if (isMounted) setUnreadMessages(0);
      }
    };

    void loadUnreadMessages();
    const intervalId = window.setInterval(loadUnreadMessages, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, location.pathname, location.search]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => ({
        x: clamp(current.x, EDGE_GAP, window.innerWidth - BUTTON_SIZE - EDGE_GAP),
        y: clamp(current.y, EDGE_GAP, window.innerHeight - BUTTON_SIZE - EDGE_GAP),
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kyzmat_floating_chat_position", JSON.stringify(position));
    }
  }, [position]);

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
      moved: false,
    };
  };

  const handlePointerMove = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = Math.abs(event.clientX - dragState.startX);
    const deltaY = Math.abs(event.clientY - dragState.startY);
    if (deltaX > 4 || deltaY > 4) {
      dragState.moved = true;
    }

    setPosition({
      x: clamp(event.clientX - dragState.offsetX, EDGE_GAP, window.innerWidth - BUTTON_SIZE - EDGE_GAP),
      y: clamp(event.clientY - dragState.offsetY, EDGE_GAP, window.innerHeight - BUTTON_SIZE - EDGE_GAP),
    });
  };

  const handlePointerUp = (event) => {
    const dragState = dragStateRef.current;
    dragStateRef.current = null;

    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (!dragState.moved) {
      navigate("/chat");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      aria-label={t("nav.messages")}
      className="fixed z-[1200] flex h-[52px] w-[52px] touch-none select-none items-center justify-center overflow-visible rounded-full border border-white/80 bg-[linear-gradient(180deg,#36df77_0%,#21ca66_56%,#13ad54_100%)] text-white shadow-[0_14px_28px_-14px_rgba(9,122,72,0.56),0_6px_14px_-10px_rgba(15,23,42,0.22)] ring-[2px] ring-white/95 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_18px_32px_-14px_rgba(9,122,72,0.62),0_10px_18px_-12px_rgba(15,23,42,0.24)] active:translate-y-0 active:scale-[0.97]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      type="button"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.32),transparent_36%)]" />
      <span className="pointer-events-none absolute inset-[3px] rounded-full border border-white/28" />
      <span className="pointer-events-none absolute inset-[8px] rounded-full border border-white/10" />
      <span className="pointer-events-none absolute inset-[-2px] rounded-full shadow-[inset_0_-8px_14px_rgba(0,0,0,0.06)]" />
      <ChatBubbleIcon />
      {unreadMessages > 0 ? (
        <span className="absolute right-[-2px] top-[-5px] flex h-[21px] min-w-[21px] items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(180deg,#6fd6ff_0%,#3db7f6_100%)] px-1 text-[10px] font-extrabold tabular-nums leading-none text-[#0b3559] shadow-[0_10px_18px_-10px_rgba(34,116,184,0.65)]">
          {unreadMessages > 99 ? "99+" : unreadMessages}
        </span>
      ) : null}
    </button>
  );
}

export default FloatingChatButton;

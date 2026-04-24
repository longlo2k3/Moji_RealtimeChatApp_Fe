// import { create } from "zustand";
// import { io, type Socket } from "socket.io-client";
// import { useAuthStore } from "./useAuthStore";
// import type { SocketState } from "@/types/store";
// import { useChatStore } from "./useChatStore";
// import { useFriendStore } from "./useFriendStore";
// import { toast } from "sonner";
// import { playNotificationSound } from "@/lib/sound";

// const baseURL = import.meta.env.VITE_SOCKET_URL;

// export const useSocketStore = create<SocketState>((set, get) => ({
//   socket: null,
//   onlineUsers: [],
//   connectSocket: () => {
//     const accessToken = useAuthStore.getState().accessToken;
//     const existingSocket = get().socket;

//     if (existingSocket) return; // tránh tạo nhiều socket

//     const socket: Socket = io(baseURL, {
//       auth: { token: accessToken },
//       transports: ["websocket"],
//     });

//     set({ socket });

//     socket.on("connect", () => {
//       console.log("Đã kết nối với socket");
//     });

//     // online users
//     socket.on("online-users", (userIds) => {
//       set({ onlineUsers: userIds });
//     });

//     // new friend request
//     socket.on("new-friend-request", (request) => {
//       useFriendStore.getState().getAllFriendRequests();
//       let isTabVisible = true;
//       document.addEventListener("visibilitychange", () => {
//         if (document.visibilityState === "visible") {
//           // Người dùng đang ở tab hiện tại
//           isTabVisible = true;
//         } else {
//           // Người dùng đã chuyển tab, thu nhỏ trình duyệt, hoặc chuyển app
//           isTabVisible = false;
//           playNotificationSound();
//         }
//       });

//       toast.info(
//         `Bạn có lời mời kết bạn từ ${request.from?.displayName || "ai đó"}`,
//       );
//     });

//     // new message
//     socket.on("new-message", ({ message, conversation, unreadCounts }) => {
//       useChatStore.getState().addMessage(message);

//       const targetConvo = useChatStore
//         .getState()
//         .conversations.find((c) => c._id === conversation._id);
//       const sender = targetConvo?.participants.find(
//         (p) => p._id === message.senderId,
//       );
//       const senderName = sender?.displayName || "ai đó";

//       const lastMessage = {
//         _id: conversation.lastMessage._id,
//         content: conversation.lastMessage.content,
//         createdAt: conversation.lastMessage.createdAt,
//         sender: {
//           _id: conversation.lastMessage.senderId,
//           displayName: senderName,
//           avatarUrl: sender?.avatarUrl || null,
//         },
//       };

//       const updatedConversation = {
//         ...conversation,
//         lastMessage,
//         unreadCounts,
//       };

//       const myId = useAuthStore.getState().user?._id;

//       if (
//         useChatStore.getState().activeConversationId === message.conversationId
//       ) {
//         useChatStore.getState().markAsSeen();
//       } else {
//         if (message.senderId !== myId) {
//           const groupName = targetConvo?.group?.name;
//           const title =
//             targetConvo?.type === "group"
//               ? `Tin nhắn mới trong ${groupName}`
//               : `Tin nhắn mới từ ${senderName}`;
//           let isTabVisible = true;
//           document.addEventListener("visibilitychange", () => {
//             if (document.visibilityState === "visible") {
//               // Người dùng đang ở tab hiện tại
//               isTabVisible = true;
//             } else {
//               // Người dùng đã chuyển tab, thu nhỏ trình duyệt, hoặc chuyển app
//               isTabVisible = false;
//               playNotificationSound();
//             }
//           });

//           if (Notification.permission !== "granted") return;

//           const notification = new Notification(title, {
//             body: message.content,
//           });

//           notification.onclick = () => {
//             const previousConversationId =
//               useChatStore.getState().activeConversationId;
//             if (
//               previousConversationId === message.conversationId ||
//               document.hidden
//             ) {
//               window.focus();
//             }
//           };
//         }
//       }

//       useChatStore.getState().updateConversation(updatedConversation);
//     });

//     // read message
//     socket.on("read-message", ({ conversation, lastMessage }) => {
//       const updated = {
//         _id: conversation._id,
//         lastMessage,
//         lastMessageAt: conversation.lastMessageAt,
//         unreadCounts: conversation.unreadCounts,
//         seenBy: conversation.seenBy,
//       };

//       useChatStore.getState().updateConversation(updated);
//     });

//     // new group chat
//     socket.on("new-group", (conversation) => {
//       useChatStore.getState().addConvo(conversation);
//       socket.emit("join-conversation", conversation._id);
//     });
//   },
//   disconnectSocket: () => {
//     const socket = get().socket;
//     if (socket) {
//       socket.disconnect();
//       set({ socket: null });
//     }
//   },
// }));
import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/sound";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return;

    // ✅ Quản lý trạng thái tab 1 lần duy nhất khi connect
    let isTabVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isTabVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // new friend request
    socket.on("new-friend-request", (request) => {
      useFriendStore.getState().getAllFriendRequests();

      // ✅ Phát âm thanh khi user không đang nhìn thấy tab
      if (!isTabVisible) {
        playNotificationSound();
      }

      toast.info(
        `Bạn có lời mời kết bạn từ ${request.from?.displayName || "ai đó"}`,
      );
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const targetConvo = useChatStore
        .getState()
        .conversations.find((c) => c._id === conversation._id);
      const sender = targetConvo?.participants.find(
        (p) => p._id === message.senderId,
      );
      const senderName = sender?.displayName || "ai đó";

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: senderName,
          avatarUrl: sender?.avatarUrl || null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      const myId = useAuthStore.getState().user?._id;

      if (
        useChatStore.getState().activeConversationId === message.conversationId
      ) {
        useChatStore.getState().markAsSeen();
      } else {
        if (message.senderId !== myId) {
          // ✅ Phát âm thanh khi user không đang nhìn thấy tab
          if (!isTabVisible) {
            playNotificationSound();
          }

          if (Notification.permission !== "granted") return;

          const groupName = targetConvo?.group?.name;
          const title =
            targetConvo?.type === "group"
              ? `Tin nhắn mới trong ${groupName}`
              : `Tin nhắn mới từ ${senderName}`;

          const notification = new Notification(title, {
            body: message.content,
          });

          notification.onclick = () => {
            const previousConversationId =
              useChatStore.getState().activeConversationId;
            if (
              previousConversationId === message.conversationId ||
              document.hidden
            ) {
              window.focus();
            }
          };
        }
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));

import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // Custom notification component for better styling
  // const CustomToast = ({ sender, message }) => (
  //   <div className="flex items-center gap-3 min-w-[300px]">
  //     <img 
  //       src={sender.profilePic || "/avatar.png"} 
  //       alt={sender.name} 
  //       className="w-10 h-10 rounded-full"
  //     />
  //     <div>
  //       <p className="font-semibold">{sender.name}</p>
  //       <p className="text-sm text-gray-600 truncate">{message}</p>
  //     </div>
  //   </div>
  // );

  const CustomToast = ({ sender, message }) => (
    <div className="flex items-center gap-4 min-w-[300px] p-4 bg-white shadow-lg rounded-lg border border-gray-200">
      <img 
        src={sender.profilePic || "/avatar.png"} 
        alt={sender.fullName} 
        className="w-12 h-12 rounded-full border-2 border-blue-500"
      />
      <div>
        <p className="font-semibold text-blue-700">{sender.fullName}</p>
        <p className="text-sm text-gray-500 truncate">{message}</p>
      </div>
    </div>
  );

  useEffect(() => {
    getMessages(selectedUser._id);
    
    // Set up notification handler
    const handleNewMessage = (message, sender) => {
      // Only show notification if the message is not from the current user
      if (message.senderId !== authUser._id) {
        // Don't show notification if we're currently chatting with this user
        const isCurrentChat = selectedUser && selectedUser._id === message.senderId;
        if (!isCurrentChat) {
          toast.custom(
            (t) => (
              <CustomToast
                sender={sender}
                message={message.text || "Sent an image"}
              />
            ),
            {
              duration: 4000,
              position: "top-center",
              onClick: () => {
                // Optionally switch to this chat when clicking the notification
                if (message.senderId !== selectedUser?._id) {
                  // Find the sender in users list and set as selected
                  const sender = useChatStore.getState().users.find(
                    user => user._id === message.senderId
                  );
                  if (sender) {
                    useChatStore.getState().setSelectedUser(sender);
                  }
                }
              }
            }
          );
        }
      }
    };

    subscribeToMessages(handleNewMessage);

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages, authUser._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;

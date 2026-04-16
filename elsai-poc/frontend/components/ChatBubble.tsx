interface Props {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble({ role, content }: Props) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={
          "max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed " +
          (isUser
            ? "bg-elsai-primary text-white rounded-br-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm")
        }
      >
        {content}
      </div>
    </div>
  );
}

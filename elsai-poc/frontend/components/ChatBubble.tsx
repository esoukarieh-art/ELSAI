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
          "max-w-[85%] whitespace-pre-wrap px-4 py-3 leading-relaxed shadow-sm " +
          (isUser
            ? "rounded-organic rounded-br-md bg-elsai-pin text-elsai-creme"
            : "rounded-organic rounded-bl-md border border-elsai-pin/15 bg-white/90 text-elsai-ink backdrop-blur")
        }
      >
        {content}
      </div>
    </div>
  );
}

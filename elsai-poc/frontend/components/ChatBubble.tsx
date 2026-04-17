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
          "max-w-[85%] px-4 py-3 leading-relaxed whitespace-pre-wrap shadow-sm " +
          (isUser
            ? "rounded-organic bg-elsai-pin text-elsai-creme rounded-br-md"
            : "rounded-organic border-elsai-pin/15 text-elsai-ink rounded-bl-md border bg-white/90 backdrop-blur")
        }
      >
        {content}
      </div>
    </div>
  );
}

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
          "max-w-[85%] px-4 py-3 whitespace-pre-wrap leading-relaxed shadow-sm " +
          (isUser
            ? "bg-elsai-pin text-elsai-creme rounded-organic rounded-br-md"
            : "bg-white/90 backdrop-blur border border-elsai-pin/15 text-elsai-ink rounded-organic rounded-bl-md")
        }
      >
        {content}
      </div>
    </div>
  );
}

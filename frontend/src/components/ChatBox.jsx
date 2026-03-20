import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function ChatBox({ chatHistory }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  return (
    <div className="chat-window h-[60vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-4">
      {chatHistory.map((item, index) => (
        <MessageBubble key={index} message={item.text} from={item.from} />
      ))}
      <div ref={endRef} />
    </div>
  )
}

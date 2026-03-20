export default function MessageBubble({ message, from }) {
  const isBot = from === 'bot'
  const containerClasses = isBot ? 'justify-start' : 'justify-end'
  const bubbleClasses = isBot
    ? 'bg-slate-800 text-white rounded-lg rounded-tl-none p-3 max-w-[80%] animate-fadeIn'
    : 'bg-blue-600 text-white rounded-lg rounded-tr-none p-3 max-w-[80%] animate-fadeIn'

  return (
    <div className={`flex ${containerClasses} py-1`}>
      <div className={bubbleClasses}>
        {message}
      </div>
    </div>
  )
}

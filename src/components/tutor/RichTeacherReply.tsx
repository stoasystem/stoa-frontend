import type { TeacherReplyRichContent } from '@/types/tutor'

export function RichTeacherReply({ content, fallback }: { content?: TeacherReplyRichContent; fallback: string }) {
  if (!content?.blocks?.length) {
    return <p className="text-sm leading-6 text-muted-foreground">{fallback}</p>
  }

  return (
    <div className="space-y-2 text-sm leading-6 text-muted-foreground">
      {content.blocks.map((block, index) => {
        const key = `${block.type}-${index}`
        if (block.type === 'formula') {
          return (
            <div
              key={key}
              className="overflow-x-auto rounded-md border bg-background px-3 py-2 font-mono text-sm text-foreground"
            >
              {block.latex}
            </div>
          )
        }
        if (block.type === 'heading') {
          return <h3 key={key} className="text-sm font-semibold text-foreground">{block.text}</h3>
        }
        if (block.type === 'quote') {
          return <blockquote key={key} className="border-l-2 pl-3 text-foreground">{block.text}</blockquote>
        }
        if (block.type === 'code') {
          return (
            <pre key={key} className="overflow-x-auto rounded-md bg-secondary px-3 py-2 font-mono text-xs">
              {block.text}
            </pre>
          )
        }
        if (block.type === 'ordered_list') {
          return <p key={key} className="pl-4">1. {block.text}</p>
        }
        if (block.type === 'unordered_list') {
          return <p key={key} className="pl-4">- {block.text}</p>
        }
        return <p key={key}>{block.text}</p>
      })}
    </div>
  )
}

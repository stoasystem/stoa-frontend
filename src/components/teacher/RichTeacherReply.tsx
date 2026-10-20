import type { TeacherReplyRichContent } from '@/types/teacher'

export function RichTeacherReply({ content, fallback }: { content?: TeacherReplyRichContent | null; fallback: string }) {
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
          return <h3 key={key} className="whitespace-pre-wrap text-sm font-semibold text-foreground">{block.text}</h3>
        }
        if (block.type === 'quote') {
          return <blockquote key={key} className="whitespace-pre-wrap border-l-2 pl-3 text-foreground">{block.text}</blockquote>
        }
        if (block.type === 'code') {
          return (
            <pre key={key} className="overflow-x-auto rounded-md bg-secondary px-3 py-2 font-mono text-xs">
              {block.text}
            </pre>
          )
        }
        // A list block holds one item per line (#332).
        if (block.type === 'ordered_list') {
          return (
            <ol key={key} className="list-decimal space-y-1 pl-6">
              {listItems(block.text).map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
            </ol>
          )
        }
        if (block.type === 'unordered_list') {
          return (
            <ul key={key} className="list-disc space-y-1 pl-6">
              {listItems(block.text).map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
            </ul>
          )
        }
        // The teacher's line breaks are kept, not run together (#332).
        return <p key={key} className="whitespace-pre-wrap">{block.text}</p>
      })}
    </div>
  )
}

function listItems(text: string) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

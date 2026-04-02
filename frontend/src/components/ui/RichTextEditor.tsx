import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import clsx from 'clsx'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import SaveIndicator from './SaveIndicator'

interface Props {
  value: string
  onSave: (value: string) => void | Promise<void>
  disabled?: boolean
}

export default function RichTextEditor({ value, onSave, disabled }: Props) {
  const { state, errorMsg, wrap } = useSaveFeedback()

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    onBlur: ({ editor }) => {
      const html = editor.getHTML()
      if (html !== value) wrap(() => onSave(html))
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false)
    }
  }, [value, editor])

  return (
    <div className="relative">
      <div
        className={clsx(
          'border rounded p-2 min-h-[60px] transition-colors duration-300',
          disabled ? 'bg-gray-50' : 'bg-white focus-within:border-blue-400',
          state === 'saving' && 'animate-pulse border-blue-300',
          state === 'success' && 'border-green-400 bg-green-50',
          state === 'error' && 'border-red-400 bg-red-50',
        )}
      >
        <EditorContent editor={editor} />
      </div>
      <div className="absolute top-2 right-2">
        <SaveIndicator state={state} errorMsg={errorMsg} />
      </div>
    </div>
  )
}

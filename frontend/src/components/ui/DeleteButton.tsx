interface Props {
  onClick: () => void
  label?: string
}

export default function DeleteButton({ onClick, label = 'Delete' }: Props) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-red-500 hover:text-red-700"
      title={label}
    >
      ×
    </button>
  )
}

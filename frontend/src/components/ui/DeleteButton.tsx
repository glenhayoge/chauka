interface Props {
  onClick: () => void
  label?: string
}

export default function DeleteButton({ onClick, label = 'Delete' }: Props) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-destructive hover:text-destructive/80"
      title={label}
    >
      ×
    </button>
  )
}

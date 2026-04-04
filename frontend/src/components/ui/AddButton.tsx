interface Props {
  onClick: () => void
  label?: string
}

export default function AddButton({ onClick, label = 'Add' }: Props) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
    >
      <span className="text-lg leading-none">+</span> {label}
    </button>
  )
}

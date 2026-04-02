interface Props {
  onClick: () => void
  label?: string
}

export default function AddButton({ onClick, label = 'Add' }: Props) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
    >
      <span className="text-lg leading-none">+</span> {label}
    </button>
  )
}

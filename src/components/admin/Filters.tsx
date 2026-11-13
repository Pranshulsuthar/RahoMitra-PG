import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/** Compact search field used in admin toolbars. */
export function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" aria-hidden />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="form-input py-2.5 pl-10 text-sm"
      />
    </div>
  )
}

interface FilterSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  className?: string
}

/** Compact labelled select used in admin toolbars. */
export function FilterSelect({ label, value, onChange, options, className }: FilterSelectProps) {
  return (
    <label className={cn('flex items-center gap-2', className)}>
      <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="form-input w-auto min-w-[9rem] rounded-xl px-3 py-2.5 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

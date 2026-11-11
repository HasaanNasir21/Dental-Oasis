interface Props {
  value: string[]
  onChange: (teeth: string[]) => void
}

// FDI dental numbering system.
// Each quadrant is displayed as positions 1–8 from the midline outward,
// but stored internally as FDI numbers (11–18, 21–28, 31–38, 41–48).
//
// Visual layout (positions shown to the user):
//   Upper Right: 8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8  Upper Left
//   ─────────────────────────────────────────────────
//   Lower Right: 8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8  Lower Left
//
// FDI mapping:
//   Upper Right pos 1→"11", pos 2→"12", … pos 8→"18"
//   Upper Left  pos 1→"21", pos 2→"22", … pos 8→"28"
//   Lower Left  pos 1→"31", pos 2→"32", … pos 8→"38"
//   Lower Right pos 1→"41", pos 2→"42", … pos 8→"48"

// Each quadrant: array of [displayLabel, fdiNumber] from midline (pos 1) to outer (pos 8)
const upperRight: [string, string][] = [
  ['1', '11'], ['2', '12'], ['3', '13'], ['4', '14'],
  ['5', '15'], ['6', '16'], ['7', '17'], ['8', '18'],
]
const upperLeft: [string, string][] = [
  ['1', '21'], ['2', '22'], ['3', '23'], ['4', '24'],
  ['5', '25'], ['6', '26'], ['7', '27'], ['8', '28'],
]
const lowerLeft: [string, string][] = [
  ['1', '31'], ['2', '32'], ['3', '33'], ['4', '34'],
  ['5', '35'], ['6', '36'], ['7', '37'], ['8', '38'],
]
const lowerRight: [string, string][] = [
  ['1', '41'], ['2', '42'], ['3', '43'], ['4', '44'],
  ['5', '45'], ['6', '46'], ['7', '47'], ['8', '48'],
]

// Map every FDI number → human-readable chip label, e.g. "15" → "UR5"
const FDI_LABEL: Record<string, string> = {}
upperRight.forEach(([pos, fdi]) => { FDI_LABEL[fdi] = `UR${pos}` })
upperLeft.forEach(([pos, fdi])  => { FDI_LABEL[fdi] = `UL${pos}` })
lowerLeft.forEach(([pos, fdi])  => { FDI_LABEL[fdi] = `LL${pos}` })
lowerRight.forEach(([pos, fdi]) => { FDI_LABEL[fdi] = `LR${pos}` })

export default function TeethSelector({ value, onChange }: Props) {
  const selectedSet = new Set(value)

  const toggle = (fdi: string) => {
    if (selectedSet.has(fdi)) {
      onChange(value.filter((t) => t !== fdi))
    } else {
      onChange([...value, fdi].sort())
    }
  }

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-primary-600/40 border border-primary-500/50" />
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-dark-500 border border-dark-400" />
          Unselected
        </span>
        <span className="text-gray-500">·</span>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-primary-400 hover:text-primary-300 transition-colors"
        >
          Clear all
        </button>
        {value.length > 0 && (
          <span className="text-gray-300">
            {value.length} {value.length !== 1 ? 'teeth' : 'tooth'} selected
          </span>
        )}
      </div>

      {/* Dental chart */}
      <div className="bg-dark-600 border border-dark-400 rounded-xl p-4 overflow-x-auto">
        <div className="min-w-[480px]">

          {/* Quadrant labels — upper */}
          <div className="flex text-xs text-gray-500 mb-1">
            <div className="flex-1 text-center font-medium">Upper Right</div>
            <div className="w-3" />
            <div className="flex-1 text-center font-medium">Upper Left</div>
          </div>

          {/* Upper row: UR runs 8→1 (right to left), UL runs 1→8 (left to right) */}
          <div className="flex gap-1">
            {[...upperRight].reverse().map(([label, fdi]) => (
              <ToothButton
                key={fdi}
                label={label}
                fdi={fdi}
                isSelected={selectedSet.has(fdi)}
                onClick={() => toggle(fdi)}
              />
            ))}
            {/* Midline */}
            <div className="w-0.5 bg-dark-300 mx-1 rounded-full self-stretch" />
            {upperLeft.map(([label, fdi]) => (
              <ToothButton
                key={fdi}
                label={label}
                fdi={fdi}
                isSelected={selectedSet.has(fdi)}
                onClick={() => toggle(fdi)}
              />
            ))}
          </div>

          {/* Horizontal divider */}
          <div className="border-t-2 border-dark-400 my-2" />

          {/* Lower row: LR runs 8→1 (right to left), LL runs 1→8 (left to right) */}
          <div className="flex gap-1">
            {[...lowerRight].reverse().map(([label, fdi]) => (
              <ToothButton
                key={fdi}
                label={label}
                fdi={fdi}
                isSelected={selectedSet.has(fdi)}
                onClick={() => toggle(fdi)}
              />
            ))}
            <div className="w-0.5 bg-dark-300 mx-1 rounded-full self-stretch" />
            {lowerLeft.map(([label, fdi]) => (
              <ToothButton
                key={fdi}
                label={label}
                fdi={fdi}
                isSelected={selectedSet.has(fdi)}
                onClick={() => toggle(fdi)}
              />
            ))}
          </div>

          {/* Quadrant labels — lower */}
          <div className="flex text-xs text-gray-500 mt-1">
            <div className="flex-1 text-center font-medium">Lower Right</div>
            <div className="w-3" />
            <div className="flex-1 text-center font-medium">Lower Left</div>
          </div>

        </div>
      </div>

      {/* Selected teeth chips — show readable label (e.g. UR5, UL6) with FDI as tooltip */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((fdi) => (
            <span
              key={fdi}
              title={`FDI: ${fdi}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-600/20 border border-primary-500/30 text-xs text-primary-300 font-medium"
            >
              {FDI_LABEL[fdi] ?? fdi}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== fdi))}
                className="text-primary-400 hover:text-primary-200 leading-none"
                aria-label={`Remove tooth ${FDI_LABEL[fdi] ?? fdi}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ToothButton({
  label,
  fdi,
  isSelected,
  onClick,
}: {
  label: string
  fdi: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${FDI_LABEL[fdi] ?? fdi} (FDI ${fdi})`}
      className={`flex-1 min-w-[32px] h-10 rounded-lg text-xs font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary-400 ${
        isSelected
          ? 'bg-primary-600 text-white border border-primary-400 shadow-md shadow-primary-600/20 scale-105'
          : 'bg-dark-500 text-gray-400 border border-dark-400 hover:bg-dark-400 hover:text-gray-200 hover:border-gray-500'
      }`}
      aria-pressed={isSelected}
      aria-label={`${FDI_LABEL[fdi] ?? fdi}${isSelected ? ' (selected)' : ''}`}
    >
      {label}
    </button>
  )
}

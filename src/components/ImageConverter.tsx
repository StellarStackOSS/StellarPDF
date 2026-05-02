import { ConverterPage } from '@/components/converters/ConverterPage'

interface Props {
  isDark: boolean
  onBack: () => void
  onToggleTheme: () => void
}

export function ImageConverter({ isDark, onBack, onToggleTheme }: Props) {
  return <ConverterPage type="image" isDark={isDark} onBack={onBack} onToggleTheme={onToggleTheme} />
}

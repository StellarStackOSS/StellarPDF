import { ConverterPage } from '@/components/converters/ConverterPage'

interface Props {
  isDark: boolean
  onBack: () => void
  onToggleTheme: () => void
}

export function AudioConverter({ isDark, onBack, onToggleTheme }: Props) {
  return <ConverterPage type="audio" isDark={isDark} onBack={onBack} onToggleTheme={onToggleTheme} />
}

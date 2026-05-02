import { ConverterPage } from '@/components/converters/ConverterPage'

interface Props {
  isDark: boolean
  onBack: () => void
  onToggleTheme: () => void
}

export function VideoConverter({ isDark, onBack, onToggleTheme }: Props) {
  return <ConverterPage type="video" isDark={isDark} onBack={onBack} onToggleTheme={onToggleTheme} />
}

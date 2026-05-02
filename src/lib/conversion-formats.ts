export type ConverterType = 'image' | 'video' | 'audio'

export interface FormatGroup {
  label: string
  formats: string[]
}

export const FORMATS: Record<ConverterType, { input: string[]; output: FormatGroup[] }> = {
  image: {
    input: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'avif', 'ico', 'tga', 'ppm', 'pbm', 'pgm'],
    output: [
      { label: 'Common', formats: ['jpg', 'png', 'webp', 'gif'] },
      { label: 'Lossless', formats: ['bmp', 'tiff'] },
      { label: 'Other', formats: ['tga', 'ppm', 'ico'] },
    ],
  },
  video: {
    input: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'mpeg', 'mpg', '3gp', 'ogv', 'm4v', 'ts'],
    output: [
      { label: 'Common', formats: ['mp4', 'webm', 'mov'] },
      { label: 'Universal', formats: ['avi', 'mkv'] },
      { label: 'Animated', formats: ['gif'] },
    ],
  },
  audio: {
    input: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'wma', 'aiff', 'aif', 'ac3'],
    output: [
      { label: 'Compressed', formats: ['mp3', 'aac', 'm4a', 'ogg', 'opus'] },
      { label: 'Lossless', formats: ['wav', 'flac'] },
    ],
  },
}

export function getMimeType(format: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', bmp: 'image/bmp', tiff: 'image/tiff', tif: 'image/tiff',
    avif: 'image/avif', ico: 'image/x-icon', tga: 'image/x-tga', ppm: 'image/x-portable-pixmap',
    mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo', mov: 'video/quicktime',
    mkv: 'video/x-matroska', ogv: 'video/ogg', flv: 'video/x-flv',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
    aac: 'audio/aac', m4a: 'audio/mp4', opus: 'audio/opus', aiff: 'audio/aiff', aif: 'audio/aiff',
  }
  return map[format.toLowerCase()] ?? 'application/octet-stream'
}

export function buildFFmpegArgs(
  inputFile: string,
  outputFile: string,
  converterType: ConverterType,
  outputFormat: string,
): string[] {
  if (converterType === 'image') {
    if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
      return ['-i', inputFile, '-q:v', '2', outputFile]
    }
    return ['-i', inputFile, outputFile]
  }

  if (converterType === 'video') {
    if (outputFormat === 'gif') {
      return [
        '-i', inputFile,
        '-vf', 'fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        outputFile,
      ]
    }
    if (outputFormat === 'mp4') {
      return ['-i', inputFile, '-c:v', 'libx264', '-crf', '23', '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputFile]
    }
    if (outputFormat === 'webm') {
      return ['-i', inputFile, '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus', outputFile]
    }
    if (outputFormat === 'avi') {
      return ['-i', inputFile, '-c:v', 'mpeg4', '-c:a', 'libmp3lame', '-b:a', '128k', outputFile]
    }
    if (outputFormat === 'mov') {
      return ['-i', inputFile, '-c:v', 'libx264', '-c:a', 'aac', outputFile]
    }
    return ['-i', inputFile, outputFile]
  }

  if (converterType === 'audio') {
    if (outputFormat === 'mp3') {
      return ['-i', inputFile, '-codec:a', 'libmp3lame', '-qscale:a', '2', outputFile]
    }
    if (outputFormat === 'ogg') {
      return ['-i', inputFile, '-codec:a', 'libvorbis', '-qscale:a', '4', outputFile]
    }
    if (outputFormat === 'opus') {
      return ['-i', inputFile, '-codec:a', 'libopus', '-b:a', '128k', outputFile]
    }
    if (outputFormat === 'aac' || outputFormat === 'm4a') {
      return ['-i', inputFile, '-codec:a', 'aac', '-b:a', '128k', outputFile]
    }
    if (outputFormat === 'flac') {
      return ['-i', inputFile, '-codec:a', 'flac', outputFile]
    }
    return ['-i', inputFile, outputFile]
  }

  return ['-i', inputFile, outputFile]
}

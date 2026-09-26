import imageCompression from 'browser-image-compression'

export type OptimizeImageOptions = {
  purpose: 'kyc' | 'item' | 'ad'
  maxOriginalSizeMB?: number
}

export type OptimizeImageResult = {
  file: File
  originalSize: number
  optimizedSize: number
  originalName: string
  outputName: string
  wasOptimized: boolean
  formattedOriginalSize: string
  formattedOptimizedSize: string
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]

/**
 * Optimizes an image before upload using client-side Web Worker canvas compression.
 * PDFs bypass compression and are validated against a 20 MB limit.
 * Images up to 30 MB original size are compressed to <= 10 MB.
 */
export async function optimizeImageBeforeUpload(
  sourceFile: File,
  options: OptimizeImageOptions
): Promise<OptimizeImageResult> {
  const maxOriginalSizeMB = options.maxOriginalSizeMB || 30
  const maxOriginalSizeBytes = maxOriginalSizeMB * 1024 * 1024
  const finalMaxSizeBytes = 10 * 1024 * 1024 // 10 MB server limit
  const maxPdfSizeBytes = 20 * 1024 * 1024 // 20 MB PDF limit

  // 1. Handle PDF files
  if (sourceFile.type === 'application/pdf' || sourceFile.name.toLowerCase().endsWith('.pdf')) {
    if (sourceFile.size > maxPdfSizeBytes) {
      throw new Error(`This PDF is larger than 20 MB (${formatFileSize(sourceFile.size)}). Please choose a smaller file.`)
    }
    return {
      file: sourceFile,
      originalSize: sourceFile.size,
      optimizedSize: sourceFile.size,
      originalName: sourceFile.name,
      outputName: sourceFile.name,
      wasOptimized: false,
      formattedOriginalSize: formatFileSize(sourceFile.size),
      formattedOptimizedSize: formatFileSize(sourceFile.size),
    }
  }

  // 2. Validate MIME type for images
  const fileType = sourceFile.type.toLowerCase()
  const isImage = ALLOWED_IMAGE_TYPES.includes(fileType) || /\.(jpe?g|png|webp|heic|heif)$/i.test(sourceFile.name)
  
  if (!isImage) {
    throw new Error('This file is not a supported image format. Please select a JPG, PNG, WebP, or HEIC photo.')
  }

  // 3. Validate original image size limit (30 MB)
  if (sourceFile.size > maxOriginalSizeBytes) {
    throw new Error(`This image is too large (${formatFileSize(sourceFile.size)}). Please choose a photo smaller than ${maxOriginalSizeMB} MB.`)
  }

  const isHeic = fileType.includes('heic') || fileType.includes('heif') || /\.(heic|heif)$/i.test(sourceFile.name)
  const isKyc = options.purpose === 'kyc'
  
  const targetFileType = isKyc ? 'image/jpeg' : (sourceFile.type === 'image/png' ? 'image/png' : 'image/jpeg')

  const baseCompressionConfig = isKyc
    ? {
        maxSizeMB: 3.5,
        maxWidthOrHeight: 2500,
        initialQuality: 0.88,
        useWebWorker: true,
        fileType: targetFileType,
        preserveExif: false, // Normalizes EXIF and strips GPS
      }
    : {
        maxSizeMB: 2.5,
        maxWidthOrHeight: 2200,
        initialQuality: 0.82,
        useWebWorker: true,
        fileType: targetFileType,
        preserveExif: false,
      }

  try {
    // Primary compression run
    let compressedBlob = await imageCompression(sourceFile, baseCompressionConfig)

    // Progressive reduction fallback if compressed result still exceeds 10 MB
    if (compressedBlob.size > finalMaxSizeBytes) {
      console.warn(`Initial compression (${formatFileSize(compressedBlob.size)}) exceeded 10MB limit. Attempting secondary optimization...`)
      
      const secondaryConfig = {
        ...baseCompressionConfig,
        maxSizeMB: 2.0,
        maxWidthOrHeight: 1800,
        initialQuality: 0.75,
      }
      compressedBlob = await imageCompression(sourceFile, secondaryConfig)
    }

    if (compressedBlob.size > finalMaxSizeBytes) {
      console.warn(`Secondary compression (${formatFileSize(compressedBlob.size)}) exceeded 10MB limit. Attempting aggressive optimization...`)
      
      const aggressiveConfig = {
        ...baseCompressionConfig,
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1400,
        initialQuality: 0.65,
      }
      compressedBlob = await imageCompression(sourceFile, aggressiveConfig)
    }

    // Ultimate check
    if (compressedBlob.size > finalMaxSizeBytes) {
      throw new Error('We could not optimize this photo enough for upload. Please capture a clearer photo from closer distance or select another image.')
    }

    // Construct a new File object preserving/updating extension
    const extension = compressedBlob.type === 'image/png' ? '.png' : '.jpg'
    let baseName = sourceFile.name.substring(0, sourceFile.name.lastIndexOf('.')) || sourceFile.name
    if (isHeic) baseName += '_converted'
    const outputFileName = `${baseName}${extension}`

    const optimizedFile = new File([compressedBlob], outputFileName, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    })

    const wasOptimized = optimizedFile.size < sourceFile.size || isHeic

    return {
      file: optimizedFile,
      originalSize: sourceFile.size,
      optimizedSize: optimizedFile.size,
      originalName: sourceFile.name,
      outputName: outputFileName,
      wasOptimized,
      formattedOriginalSize: formatFileSize(sourceFile.size),
      formattedOptimizedSize: formatFileSize(optimizedFile.size),
    }
  } catch (error: any) {
    if (error?.message && error.message.includes('optimize this photo enough')) {
      throw error
    }
    console.error('Image compression failed:', error)
    throw new Error(error?.message || 'Image optimization failed. Please select another image or try again.')
  }
}

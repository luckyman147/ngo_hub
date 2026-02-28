import supabase from './supabase'

// File validation constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', "text/plain"]
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Validate file type and size
 */
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
    }
  }

  return { valid: true }
}

/**
 * Generate unique filename
 */
const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  return `${timestamp}-${randomString}.${extension}`
}
export const uploadAvatarImage = async (file: File): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name)
    const filePath = `avatar/${filename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profiles_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profiles_images')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}


/**
 * Upload activity image to Supabase Storage
 */
export const uploadActivityImage = async (file: File): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name)
    const filePath = `activities/${filename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('activity-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('activity-images')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

/**
 * Upload activity video to Supabase Storage
 */
export const uploadActivityVideo = async (file: File): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file, ALLOWED_VIDEO_TYPES, MAX_VIDEO_SIZE)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name)
    const filePath = `activities/videos/${filename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('activity-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('activity-attachments')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload video' }
  }
}

/**
 * Upload multiple recap videos
 */
export const uploadRecapVideos = async (files: File[]): Promise<UploadResult[]> => {
  const uploadPromises = files.map(file => uploadActivityVideo(file))
  return Promise.all(uploadPromises)
}

/**
 * Upload team resource (image or document)
 */
export const uploadTeamResource = async (file: File): Promise<UploadResult> => {
  try {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE
    const allowedTypes = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES

    // Validate file
    const validation = validateFile(file, allowedTypes, maxSize)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name)
    const filePath = `team-resources/${filename}`

    // Upload to Supabase Storage - using 'activity-attachments' as it's a known existing generic bucket
    // or just try 'team-resources' if we think it exists. I'll use 'activity-attachments' to be safe
    // but name the folder 'team-resources' inside it.
    const { data, error } = await supabase.storage
      .from('team-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('team-attachments')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload resource' }
  }
}

/**
 * Upload activity attachment (PV, course materials, etc.)
 */
export const uploadActivityAttachment = async (file: File): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name)
    const filePath = `attachments/${filename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('activity-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('activity-attachments')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload attachment' }
  }
}

/**
 * Upload post image to Supabase Storage
 */
export const uploadPostImage = async (file: File): Promise<UploadResult> => {
  try {
    const validation = validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const filename = generateUniqueFilename(file.name)
    const filePath = `posts/${filename}`

    const { data, error } = await supabase.storage
      .from('activity-images') // Using existing bucket to avoid creating new ones unnecessarily
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { success: false, error: error.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('activity-images')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    return { success: false, error: 'Failed to upload image' }
  }
}

/**
 * Upload multiple recap images
 */
export const uploadRecapImages = async (files: File[]): Promise<UploadResult[]> => {
  const uploadPromises = files.map(file => uploadActivityImage(file))
  return Promise.all(uploadPromises)
}

/**
 * Delete file from any Supabase Storage bucket
 */
export const deleteStorageFile = async (fileUrl: string, bucket: string): Promise<boolean> => {
  try {
    const filePath = extractFilePath(fileUrl);
    if (!filePath) {
      console.error('Could not extract file path from URL:', fileUrl);
      return false;
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error(`Delete error from bucket ${bucket}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Delete file from Supabase Storage (Legacy wrapper)
 */
export const deleteFile = async (fileUrl: string, bucket: 'activity-images' | 'activity-attachments'): Promise<boolean> => {
  return deleteStorageFile(fileUrl, bucket);
}

/**
 * Extract file path from Supabase Storage URL
 */
export const extractFilePath = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // Standard Supabase URL pattern: .../storage/v1/object/public/BUCKET_NAME/FILE_PATH
    const parts = urlObj.pathname.split('/');
    const publicIndex = parts.indexOf('public');
    if (publicIndex !== -1 && parts.length > publicIndex + 2) {
      // The path starts after the bucket name (which is at publicIndex + 1)
      return parts.slice(publicIndex + 2).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

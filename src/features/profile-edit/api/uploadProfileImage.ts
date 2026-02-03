type UploadProfileImageResult = { ok: true } | { ok: false; reason: string }

export async function uploadProfileImage(
  uploadUrl: string,
  file: File,
): Promise<UploadProfileImageResult> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!response.ok) {
      return { ok: false, reason: 'upload_failed' }
    }

    return { ok: true }
  } catch (error) {
    console.error('Failed to upload profile image', error)
    return { ok: false, reason: 'request_failed' }
  }
}

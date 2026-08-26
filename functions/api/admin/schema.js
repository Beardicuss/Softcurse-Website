import { ASSET_SPECS, CONTENT_TYPES, json } from '../../_lib/cms.js'

export function onRequestGet(context) {
  return json({
    ok: true,
    contentTypes: [...CONTENT_TYPES],
    assetSpecs: ASSET_SPECS,
    releaseKinds: ['web', 'file'],
    platforms: ['web', 'windows', 'macos', 'linux', 'android', 'ios', 'other'],
    architectures: ['universal', 'x64', 'arm64', 'x86', 'other'],
    uploadPartBytes: Number(context.env.CMS_UPLOAD_PART_BYTES || 8388608),
  })
}

import { ASSET_SPECS, CONTENT_TYPES, json } from '../../_lib/cms.js'

export function onRequestGet(context) {
  return json({
    ok: true,
    contentTypes: [...CONTENT_TYPES],
    assetSpecs: ASSET_SPECS,
    releaseKinds: ['web', 'external', 'file'],
    releaseRoles: ['play', 'download', 'store', 'source'],
    releaseProviders: ['softcurse', 'github', 'mega', 'itchio', 'google_drive', 'onedrive', 'dropbox', 'custom'],
    releaseChannels: ['stable', 'beta', 'alpha', 'dev'],
    saleModes: ['free', 'paid', 'external_store', 'coming_soon'],
    storefrontStatuses: ['disabled', 'preview', 'live'],
    checkoutProviders: ['stripe', 'lemon_squeezy', 'itchio', 'gumroad', 'custom'],
    platforms: ['web', 'windows', 'macos', 'linux', 'android', 'ios', 'other'],
    architectures: ['universal', 'x64', 'arm64', 'x86', 'other'],
    commerceIdentityConfigured: Boolean(context.env.COMMERCE_DATA_KEY),
    maxChapterBytes: Number(context.env.CMS_MAX_CHAPTER_BYTES || 2097152),
    uploadPartBytes: Number(context.env.CMS_UPLOAD_PART_BYTES || 8388608),
  })
}

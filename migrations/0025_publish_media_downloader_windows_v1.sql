-- Refresh Softcurse Media Downloader with the stable Windows 1.0.0 installer.
-- Android artifacts in the shared GitHub release are intentionally not exposed here.

UPDATE content_items
SET
  title = 'Softcurse Media Downloader',
  data_json = json_set(
    data_json,
    '$.status', 'active',
    '$.version', '1.0.0',
    '$.releaseDate', '2026-10-12',
    '$.shortDesc', 'Windows media downloader for audio, video, playlists, conversion, metadata, and playback.',
    '$.desc', 'Softcurse Media Downloader is a Windows desktop application for downloading and organizing audio and video from supported media platforms. It combines configurable MP3, MP4, FLAC, and WAV output, playlist and sequential queue handling, thumbnail previews, clip trimming, SponsorBlock support, metadata editing, history tools, and an integrated media player inside the Softcurse cyberpunk interface.',
    '$.features', json('["MP3, MP4, FLAC & WAV Output","YouTube, Instagram, TikTok & X Support","YouTube Playlist & Sequential Download Queue","Configurable Audio and Video Quality","Thumbnail Preview & Clip Trimming","SponsorBlock Integration","Metadata Editor & Searchable Download History","Built-In Player with Playback and Shuffle Controls","Reliable Cancellation, Validation & Diagnostics","Windows Installer with Bundled FFmpeg"]'),
    '$.techStack', json('["Python 3.10+","tkinter","yt-dlp","FFmpeg","PyInstaller","Inno Setup 7"]')
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-app-ytdl';

UPDATE releases
SET
  label = 'DOWNLOAD FOR WINDOWS',
  version = '1.0.0',
  channel = 'stable',
  platform = 'windows',
  architecture = 'x64',
  external_url = 'https://github.com/Beardicuss/Softcurse-YouTube-Downloader/releases/download/softcurse/Softcurse_Media_Downloader_v1.0.0_Setup.exe',
  file_name = 'Softcurse_Media_Downloader_v1.0.0_Setup.exe',
  mime_type = 'application/vnd.microsoft.portable-executable',
  size_bytes = 84519618,
  sha256 = 'bc124a59c18a7c3574e2770c4d95c3ab4258c81e7248ed47e734ed68b46529ed',
  release_notes = 'Stable Windows 1.0.0 release. Includes refreshed Softcurse HEX visuals, explicit playback controls, sequential downloads, improved history filtering, reliable cancellation and playlist accounting, validation and diagnostics, a portable executable, and an Inno Setup 7 installer with FFmpeg included.',
  status = 'published',
  is_primary = 1,
  updated_at = CURRENT_TIMESTAMP,
  published_at = COALESCE(published_at, CURRENT_TIMESTAMP)
WHERE id = '36d13776-2700-4775-8e47-b1afd8182bd8';

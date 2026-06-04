export const mediaToolCatalog = [
  {
    key: 'media_text_to_speech',
    kind: 'server_media_tool',
    categoryKey: 'media_tools',
    label: '文字转语音',
    helperText: '支持中文普通话和英文文本合成音频，第一版可导出 MP3 / WAV。',
    badgeTone: 'orange'
  },
  {
    key: 'media_audio_clip',
    kind: 'file_media_tool',
    categoryKey: 'media_tools',
    label: '音频剪切',
    accepts: '.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus',
    maxFileSizeMb: 80,
    helperText: '上传音频后按时间范围截取片段，可导出 MP3 / WAV。',
    badgeTone: 'blue'
  },
  {
    key: 'media_audio_merge',
    kind: 'file_media_tool',
    categoryKey: 'media_tools',
    label: '音频合并',
    accepts: '.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus',
    maxFileSizeMb: 50,
    maxTotalFileSizeMb: 150,
    helperText: '支持上传多段音频并按当前顺序合并，可导出 MP3 / WAV。',
    badgeTone: 'purple'
  },
  {
    key: 'media_audio_player',
    kind: 'local_media_tool',
    categoryKey: 'media_tools',
    label: '音频试听播放',
    helperText: '本地加载音频并显示简易波形，适合试听和定位片段。',
    badgeTone: 'green'
  },
  {
    key: 'media_video_speed_preview',
    kind: 'local_media_tool',
    categoryKey: 'media_tools',
    label: '视频加速播放',
    helperText: '本地加载视频并调整播放速度，适合预览和快看。',
    badgeTone: 'cyan'
  },
  {
    key: 'media_tone_generator',
    kind: 'local_media_tool',
    categoryKey: 'media_tools',
    label: '特定频率音频生成',
    helperText: '输入频率和时长，生成可试听和下载的测试音频。',
    badgeTone: 'yellow'
  },
  {
    key: 'media_white_noise_generator',
    kind: 'local_media_tool',
    categoryKey: 'media_tools',
    label: '白噪音生成器',
    helperText: '快速生成白噪音音频，适合试听和下载。',
    badgeTone: 'slate'
  }
];

export function getMediaToolByKey(toolKey) {
  return mediaToolCatalog.find((item) => item.key === toolKey) || null;
}

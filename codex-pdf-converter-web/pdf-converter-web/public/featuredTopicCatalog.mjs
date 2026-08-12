export const featuredTopicCatalog = [
  {
    key: 'teaching_materials',
    label: '教学资料处理',
    description: '试卷整理、讲义扫描、表格提取、录音转文字一站完成。',
    summary: '适合老师、学生和教务资料整理场景，把现有高频工具集中成一个更好理解的专题入口。',
    toolKeys: [
      'exam_paper_cleanup',
      'scan_to_searchable_pdf',
      'images_to_searchable_pdf',
      'images_to_word',
      'pdf_to_excel',
      'image_table_to_excel',
      'ocr_text_extract',
      'image_exam_info_redact',
      'batch_file_rename',
      'text_srt_to_text',
      'media_audio_to_text',
      'media_lecture_audio_to_text',
      'media_lecture_audio_segment'
    ]
  }
];

export function getFeaturedTopicByKey(topicKey) {
  return featuredTopicCatalog.find((item) => item.key === topicKey) || null;
}

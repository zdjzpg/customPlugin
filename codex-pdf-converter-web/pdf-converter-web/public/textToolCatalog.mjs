export const textToolCatalog = [
  {
    key: 'text_unique',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'high_frequency',
    label: '文本去重',
    helperText: '删除重复文本行，保留首次出现的内容。',
    badgeTone: 'green'
  },
  {
    key: 'text_remove_blank_lines',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'high_frequency',
    label: '删除空行',
    helperText: '移除文本中的空白行，保留有效内容。',
    badgeTone: 'orange'
  },
  {
    key: 'text_remove_spaces',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'high_frequency',
    label: '删除所有空格',
    helperText: '批量去除文本中的所有空格字符。',
    badgeTone: 'blue'
  },
  {
    key: 'text_replace_batch',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'high_frequency',
    label: '批量替换',
    helperText: '把文本中的指定内容批量替换成新内容。',
    badgeTone: 'purple'
  },
  {
    key: 'text_char_count',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'high_frequency',
    label: '字符数统计',
    helperText: '实时统计字符数、非空白字符数和行数。',
    badgeTone: 'cyan'
  },
  {
    key: 'text_case_convert',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'high_frequency',
    label: '英文大小写转换',
    helperText: '支持英文文本转大写、小写和首字母大写。',
    badgeTone: 'yellow'
  },
  {
    key: 'text_extract_urls',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'extract_filter',
    label: '链接提取',
    helperText: '从混合文本中批量提取网址链接。',
    badgeTone: 'blue'
  },
  {
    key: 'text_extract_emails',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'extract_filter',
    label: '邮箱提取',
    helperText: '从文本中批量提取邮箱地址。',
    badgeTone: 'green'
  },
  {
    key: 'text_extract_phones',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'extract_filter',
    label: '手机号提取',
    helperText: '从文本中提取 11 位手机号。',
    badgeTone: 'orange'
  },
  {
    key: 'text_extract_domains',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'extract_filter',
    label: '域名提取',
    helperText: '从文本中提取域名并自动去掉路径部分。',
    badgeTone: 'purple'
  },
  {
    key: 'text_extract_ips',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'extract_filter',
    label: 'IP 提取',
    helperText: '从文本中提取 IPv4 地址。',
    badgeTone: 'cyan'
  },
  {
    key: 'text_extract_numbers',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'extract_filter',
    label: '数字提取',
    helperText: '从文本中批量提取数字序列。',
    badgeTone: 'yellow'
  },
  {
    key: 'text_to_list',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'list_helper',
    label: '文本转列表',
    helperText: '按指定分隔符把单行文本拆成逐行列表。',
    badgeTone: 'blue'
  },
  {
    key: 'list_to_text',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'list_helper',
    label: '列表转文本',
    helperText: '把逐行列表合并成一行文本。',
    badgeTone: 'purple'
  },
  {
    key: 'list_sort',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'list_helper',
    label: '列表排序',
    helperText: '对文本列表进行升序或降序排序。',
    badgeTone: 'orange'
  },
  {
    key: 'list_shuffle',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'list_helper',
    label: '列表随机打乱',
    helperText: '随机打乱文本列表顺序。',
    badgeTone: 'green'
  },
  {
    key: 'list_duplicate_count',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'list_helper',
    label: '列表重复统计',
    helperText: '统计每个重复文本出现的次数。',
    badgeTone: 'cyan'
  },
  {
    key: 'list_add_prefix_suffix',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'list_helper',
    label: '列表前后缀添加',
    helperText: '给每一行文本统一添加前缀和后缀。',
    badgeTone: 'red'
  },
  {
    key: 'list_cut_left',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'list_helper',
    label: '列表截取左边字符',
    helperText: '保留每一行左侧前 n 个字符。',
    badgeTone: 'yellow'
  },
  {
    key: 'list_cut_right',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'list_helper',
    label: '列表截取右边字符',
    helperText: '保留每一行右侧后 n 个字符。',
    badgeTone: 'blue'
  },
  {
    key: 'text_regex_extract',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'advanced',
    label: '正则提取',
    helperText: '使用正则表达式从文本中批量提取匹配内容。',
    badgeTone: 'purple'
  },
  {
    key: 'text_unicode_convert',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'advanced',
    label: 'Unicode 编解码',
    helperText: '支持文本与 Unicode 转义序列互相转换。',
    badgeTone: 'blue'
  },
  {
    key: 'text_money_upper',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'advanced',
    label: '金额大写转换',
    helperText: '把数字金额转换成中文大写金额。',
    badgeTone: 'orange'
  },
  {
    key: 'text_symbol_convert',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'advanced',
    label: '中英文符号转换',
    helperText: '支持常见英文符号与中文符号互转。',
    badgeTone: 'cyan'
  },
  {
    key: 'text_banned_words_check',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'advanced',
    label: '通用违禁词检测',
    helperText: '检测文本中是否包含指定违禁词。',
    badgeTone: 'red'
  },
  {
    key: 'text_uuid_generate',
    kind: 'local_text',
    categoryKey: 'text_tools',
    groupKey: 'advanced',
    label: 'UUID 生成',
    helperText: '按数量生成 UUID 标识符。',
    badgeTone: 'green'
  }
];

export function getTextToolByKey(toolKey) {
  return textToolCatalog.find((item) => item.key === toolKey) || null;
}

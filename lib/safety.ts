const HIGH_RISK_KEYWORDS = [
  '不想活了',
  '想消失',
  '自杀',
  '活着没意义',
  '伤害自己',
  '撑不下去了',
]

const MEDIUM_RISK_KEYWORDS = [
  '绝望',
  '没有意义',
  '太累了',
  '放弃',
  '不想坚持',
  '活不下去',
  '痛苦死了',
  '没有希望',
  '不想面对',
]

export function checkRiskLevel(text: string): 'L1' | 'L2' | 'L3' {
  for (const kw of HIGH_RISK_KEYWORDS) {
    if (text.includes(kw)) return 'L3'
  }
  for (const kw of MEDIUM_RISK_KEYWORDS) {
    if (text.includes(kw)) return 'L2'
  }
  return 'L1'
}

export const SAFE_RESPONSE = {
  understanding: '谢谢你把这些说出来。',
  evidence: '你现在提到的内容让我感觉你可能正处在一个很艰难、很需要真实支持的状态。',
  suggestion:
    '我没法提供专业危机帮助，但我很希望你现在先联系一位现实中可信任的人，或者尽快联系当地心理危机支持热线。',
  suggestion_type: 'safety',
}

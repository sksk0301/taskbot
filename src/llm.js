import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

function today() {
  return new Date().toISOString().slice(0, 10)
}

export async function parseTask(text) {
  const prompt = `
현재 날짜: ${today()}

사용자 메시지를 할 일 JSON으로 변환하라.

반드시 아래 필드만 포함한 JSON만 출력:
- task: string
- area: "생활" | "직장" | "건강" | "집안일" | "관리"
- startRelative: string
- dueRelative: string
- note: string

규칙:
- JSON만 출력
- 날짜를 계산하지 말 것
- "오늘", "내일", "다음주 월요일" 같은 상대 표현은 그대로 간단한 문자열로 넣을 것
- 시작 시점을 뜻하면 startRelative
- 마감 의미면 dueRelative
- 마감 의미가 없으면 dueRelative는 ""
- 애매하면 area는 "관리"
- note는 짧게, 없으면 ""

예시:
입력: 오늘 속옷 빨래하기
출력:
{"task":"속옷 빨래하기","area":"집안일","startRelative":"오늘","dueRelative":"","note":""}

입력: 오늘 저녁에 자기소개서 적어야 함
출력:
{"task":"자기소개서 작성","area":"직장","startRelative":"오늘","dueRelative":"오늘","note":"오늘 저녁에 해야 함"}

사용자 메시지:
${text}
`.trim()

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
    contents: prompt,
  })

  const raw = response.text.trim()
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  return JSON.parse(cleaned)
}
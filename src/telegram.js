import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { parseTask } from './llm.js'
import { normalizeTask } from './normalize.js'
import { appendTask } from './sheets.js'

dotenv.config()

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })

const pendingTasks = new Map()

bot.on('message', async (msg) => {
  const text = msg.text?.trim()
  if (!text) return

  // 버튼 눌렀을 때 생기는 콜백 메시지 등은 무시
  if (text.startsWith('/')) return

  try {
    const parsed = await parseTask(text)
    const finalTask = normalizeTask(parsed)

    const taskId = `${msg.chat.id}:${Date.now()}`
    pendingTasks.set(taskId, finalTask)

    await bot.sendMessage(
      msg.chat.id,
      [
        '기록 후보',
        `task: ${finalTask.task}`,
        `area: ${finalTask.area}`,
        `startDate: ${finalTask.startDate || '(없음)'}`,
        `dueDate: ${finalTask.dueDate || '(없음)'}`,
        `priority: ${finalTask.priority}`,
        `points: ${finalTask.points}`,
        `note: ${finalTask.note || '(없음)'}`,
      ].join('\n'),
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '기록', callback_data: `save:${taskId}` },
            { text: '취소', callback_data: `cancel:${taskId}` },
          ]],
        },
      }
    )
  } catch (err) {
    console.error(err)
    await bot.sendMessage(msg.chat.id, '파싱 실패')
  }
})

bot.on('callback_query', async (query) => {
  const data = query.data || ''
  const chatId = query.message?.chat.id
  const messageId = query.message?.message_id

  if (!chatId || !messageId) return

  try {
    if (data.startsWith('save:')) {
      const taskId = data.replace('save:', '')
      const task = pendingTasks.get(taskId)

      if (!task) {
        await bot.answerCallbackQuery(query.id, { text: '기록 후보가 만료됨' })
        return
      }

      await appendTask(task)
      pendingTasks.delete(taskId)

      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: messageId }
      )

      await bot.answerCallbackQuery(query.id, { text: '기록 완료' })
      await bot.sendMessage(chatId, 'Dump에 저장했어')
      return
    }

    if (data.startsWith('cancel:')) {
      const taskId = data.replace('cancel:', '')
      pendingTasks.delete(taskId)

      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: messageId }
      )

      await bot.answerCallbackQuery(query.id, { text: '취소됨' })
      await bot.sendMessage(chatId, '취소했어')
    }
  } catch (err) {
    console.error(err)
    await bot.answerCallbackQuery(query.id, { text: '처리 실패' })
  }
})
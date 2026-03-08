import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
dotenv.config()

const token = process.env.TELEGRAM_TOKEN

const bot = new TelegramBot(token, { polling: true })

bot.on('message', msg => {
  console.log(msg.text)
  bot.sendMessage(msg.chat.id, '받았다')
})
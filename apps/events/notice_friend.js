import { common } from '../../model/index.js'
import { Config } from '../../components/index.js'

Bot.on?.('notice.friend', async (e) => {
  let msg
  let forwardMsg
  switch (e.sub_type) {
    case 'increase': {
      if (!Config.whole.friendNumberChange) return false
      logger.info('[Yenai-Plugin]新增好友')
      msg = [
        segment.image(`https://q1.qlogo.cn/g?b=qq&s=100&nk=${e.user_id}`),
        `[通知(${e.self_id}) - 新增好友]\n`,
          `好友账号：${e.user_id}\n`,
          `好友昵称：${e.nickname}`
      ]
      break
    }
    case 'decrease': {
      if (!Config.whole.friendNumberChange) return false
      logger.info('[Yenai-Plugin]好友减少')
      msg = [
        segment.image(`https://q1.qlogo.cn/g?b=qq&s=100&nk=${e.user_id}`),
        `[通知(${e.self_id}) - 好友减少]\n`,
          `好友账号：${e.user_id}\n`,
          `好友昵称：${e.nickname}`
      ]
      break
    }
    default:
      return false
  }
  await common.sendMasterMsg(msg)
  if (forwardMsg) await common.sendMasterMsg(forwardMsg)
}
)

/** 时间转换 */
function formatDate (time) {
  let now = new Date(parseFloat(time) * 1000)
  // 月
  let month = now.getMonth() + 1
  // 日
  let date = now.getDate()
  // 补0
  if (month >= 1 && month <= 9) month = '0' + month
  if (date >= 0 && date <= 9) date = '0' + date
  // 时
  let hour = now.getHours()
  // 分
  let minute = now.getMinutes()
  // 补0
  if (hour >= 1 && hour <= 9) hour = '0' + hour
  if (minute >= 0 && minute <= 9) minute = '0' + minute
  return `${month}-${date} ${hour}:${minute} `
}

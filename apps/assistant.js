import plugin from '../../../lib/plugins/plugin.js'
import { common, QQApi } from '../model/index.js'
import { Version } from '../components/index.js'
import _ from 'lodash'
import moment from 'moment'
import { status } from '../constants/other.js'
import yaml from 'yaml'
import fs from 'node:fs'

export class Assistant extends plugin {
  constructor() {
    super({
      name: '吴淞表白墙',
      event: 'message',
      priority: 2000,
      rule: [
        {
          reg: '^#获?取说说列表(\\d+)?$',
          fnc: 'Qzonelist'
        },
        {
          reg: '^#删说说(\\d+)$',
          fnc: 'Qzonedel'
        },
        {
          reg: '^#发说说.*$',
          fnc: 'Qzonesay'
        },
		{
          reg: '^#(发墙|发表白墙|表白|墙).*$',
          fnc: 'ConfessionSay'
        },
        {
          reg: '^#(清空说说|清空留言)$',
          fnc: 'QzonedelAll'
        }
      ]
    })
  }

  get Bot() {
    return this.e.bot ?? Bot
  }

  /** QQ空间 说说列表 */
  async Qzonelist(e) {
    if (!(this.e.isMaster)) { return true }
    let page = e.msg.replace(/#|获?取说说列表/g, '').trim()
    if (!page) {
      page = 0
    } else {
      page = page - 1
    }

    // 获取说说列表
    let list = await new QQApi(e).getQzone(5, page * 5)

    if (!list) return e.reply(API_ERROR)
    if (list.total == 0) return e.reply('✅ 说说列表为空')

    let msg = [
      '✅ 获取成功，说说列表如下:\n',
      ...list.msglist.map((item, index) =>
        `${page * 5 + index + 1}.${_.truncate(item.content, { length: 15 })}\n- [${item.secret ? '私密' : '公开'}] | ${moment(item.created_time * 1000).format('MM/DD HH:mm')} | ${item.commentlist?.length || 0}条评论\n`
      ),
      `页数：[${page + 1}/${Math.ceil(list.total / 5)}]`
    ]
    e.reply(msg)
  }

  /** 删除说说 */
  async Qzonedel(e) {
    if (!(this.e.isMaster)) { return true }
    let pos = e.msg.match(/\d+/)
    // 获取说说列表
    let list = await new QQApi(e).getQzone(1, pos - 1)

    if (!list) return e.reply(API_ERROR)
    if (!list.msglist) return e.reply('❎ 未获取到该说说')

    // 要删除的说说
    let domain = list.msglist[0]
    // 请求接口
    let result = await new QQApi(e).delQzone(domain.tid, domain.t1_source)
    if (!result) return e.reply(API_ERROR)
    // debug
    logger.debug(e.logFnc, result)

    if (result.subcode != 0) e.reply('❎ 未知错误' + JSON.parse(result))
    // 发送结果
    e.reply(`✅ 删除说说成功：\n ${pos}.${_.truncate(domain.content, { length: 15 })} \n - [${domain.secret ? '私密' : '公开'}] | ${moment(domain.created_time * 1000).format('MM/DD HH:mm')} | ${domain.commentlist?.length || 0} 条评论`)
  }
  
  /** 发墙 */
  async ConfessionSay(e) {
    e.con = e.msg.replace(/#|(发墙|发表白墙|表白|墙)/g, '').trim()
	
	this.setContext('_isAnonymous')
	e.reply('✳️ 知道啦，要不要匿名呐（实名会带上昵称和QQ号的前后两位）？发送：\n' + '------“匿名”或“实名”------')
  }
  
  async _isAnonymous(e) {
    let msg = this.e.msg
	let con = ""
	
    if (/#?匿名/.test(msg)) {
      this.finish('_isAnonymous')
	  con = e.con
    } else if (/#?实名/.test(msg)) {
      this.finish('_isAnonymous')
	  const senderQQStr = e.sender.user_id.toString()
	  const firstTwoDigits = senderQQStr.slice(0, 2);
      const lastTwoDigits = senderQQStr.slice(-2);
	  const middleStars = '*'.repeat(senderQQStr.length - 4);
	  const maskedNumber = firstTwoDigits + middleStars + lastTwoDigits;
	  con = "来自: " + "[" + maskedNumber + "] " + e.sender.nickname + "\n" + e.con + "\n"
    } else {
      this.setContext('_isAnonymous')
      this.e.reply('❎ 请输入:“匿名”或“实名”')
      return false
    }
	
	let result = await new QQApi(e).setQzone(con, e.img)
    if (!result) return e.reply(API_ERROR)

    if (result.code != 0) return e.reply(`❎ 发表失败\n${JSON.stringify(result)}`)

    let retmsg = ['✅ 发表成功，内容：\n', _.truncate(result.content, { length: 15 })]
    if (result.pic) {
      retmsg.push(segment.image(result.pic[0].url1))
    }
    retmsg.push(`\n- [${result.secret ? '私密' : '公开'}] | ${moment(result.t1_ntime * 1000).format('MM/DD HH:mm')}`)
    e.reply(retmsg)
  }

  /** 清空说说和留言 */
  async QzonedelAll(e) {
    //if (!(this.e.isMaster)) { return true }
    if (/清空说说/.test(e.msg)) {
      this.setContext('_QzonedelAllContext')
      e.reply('✳️ 即将删除全部说说请发送：\n' + '------确认清空或取消------')
      e.Qzonedetermine = true
    } else if (/清空留言/.test(e.msg)) {
      this.setContext('_QzonedelAllContext')
      e.reply('✳️ 即将删除全部留言请发送：\n' + '------确认清空或取消------')
      e.Qzonedetermine = false
    }
  }

  async _QzonedelAllContext(e) {
    let msg = this.e.msg
    if (/#?确认清空/.test(msg)) {
      this.finish('_QzonedelAllContext')
      let result
      if (e.Qzonedetermine) {
        result = await new QQApi(this.e).delQzoneAll()
      } else {
        result = await new QQApi(this.e).delQzoneMsgbAll()
      }

      this.e.reply(result)
      return true
    } else if (/#?取消/.test(msg)) {
      this.finish('_QzonedelAllContext')
      this.e.reply('✅ 已取消')
      return false
    } else {
      this.setContext('_QzonedelAllContext')
      this.e.reply('❎ 请输入:确认清空或取消')
      return false
    }
  }
}

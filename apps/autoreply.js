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
      name: '任意文本',
      event: 'message',
      priority: 9999,
      rule: [
        {
          reg: '(.*?)',
          fnc: 'autoReply'
        }
      ]
    })
  }

  async autoReply(e) {
	  e.reply("直接发消息是没有结果的！发送 #帮助 查看帮助！")
	  return true
  }
}

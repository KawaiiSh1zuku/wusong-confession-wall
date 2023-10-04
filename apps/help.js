import plugin from '../../../lib/plugins/plugin.js'
import fs from 'fs'
import _ from 'lodash'
import { Data } from '../components/index.js'
import { puppeteer } from '../model/index.js'
const helpReg = new RegExp(
  `^#(帮助|菜单|功能|help)$`
)
export class YenaiHelp extends plugin {
  constructor () {
    super({
      name: '帮助',
      event: 'message',
      priority: 2000,
      rule: [
        {
          reg: helpReg,
          fnc: 'message'
        }
      ]
    })
  }

  async message () {
    await this.reply('给我发 #发墙+内容 发墙，可选实名或匿名', false, { at: true })
  }
}
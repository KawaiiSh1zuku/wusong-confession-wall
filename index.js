import fs from 'fs'
import Data from './components/Data.js'
import Ver from './components/Version.js'

if (!global.segment) {
  try {
    global.segment = (await import('oicq')).segment
  } catch (err) {
    global.segment = (await import('icqq')).segment
  }
}

// 加载监听事件
const eventsPath = './plugins/confession/apps/events'
const events = fs.readdirSync(eventsPath)
  .filter(file => file.endsWith('.js'))
for (const File of events) {
  try {
    logger.debug(`[Wusong-Confession] 加载监听事件：${File}`)
    await import(`./apps/events/${File}`)
  } catch (e) {
    logger.error(`[Wusong-Confession] 监听事件错误：${File}`)
    logger.error(e)
  }
}

const appsPath = './plugins/confession/apps'
const jsFiles = Data.readDirRecursive(appsPath, 'js', 'events')

let ret = jsFiles.map(file => {
  return import(`./apps/${file}`)
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in jsFiles) {
  let name = jsFiles[i].replace('.js', '')

  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}

export { apps }

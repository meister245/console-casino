const fs = require('fs')
const path = require('path')

const readConfig = (name = 'roulette') => {
  const filePath = path.resolve(
    __dirname, '..', '..', 'resources', 'config', `${name}.json`)

  return fs.readFileSync(filePath, (err, data) => {
    if (err) throw err
    return data
  })
}

const readClient = () => {
  const filePath = path.resolve(
    __dirname, '..', '..', 'dist', 'console-casino.min.js')

  return fs.readFileSync(filePath, 'utf8', (err, data) => {
    if (err) throw err
    return data
  })
}

module.exports = {
  getConfig: (name) => JSON.parse(readConfig(name)),
  getClient: () => readClient()
}

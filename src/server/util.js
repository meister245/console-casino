const fs = require('fs')
const path = require('path')

const readConfig = (name) => {
  const filePath = path.resolve(__dirname, 'config', name + '.json')

  return fs.readFileSync(filePath, (err, data) => {
    if (err) throw err
    return data
  })
}

module.exports = {
  getConfig: (name) => JSON.parse(readConfig(name))
}

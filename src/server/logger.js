const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/var/tmp/console-casino.log' })
  ]
})

const logRequest = (req, res, next) => {
  logger.info(`${req.url} - ${JSON.stringify(req.body)}`)
  next()
}

const logRequestError = (err, req, res, next) => {
  logger.error(err)
  next()
}

module.exports = {
  logger,
  logRequest,
  logRequestError
}

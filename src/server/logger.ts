import winston = require('winston')

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/var/tmp/console-casino.log' })
  ]
})

export const logRequest = ({req, next}: any) => {
  logger.info(`${req.method} ${req.url}`)

  if (Object.keys(req.body).length > 0) {
    logger.info(JSON.stringify(req.body))
  }

  next()
}

export const logRequestError = ({err, next}: any) => {
  logger.error(err)
  next()
}

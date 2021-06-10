const app = require('./server/app')

const { logger, logRequest, logRequestError } = require('./server/logger')

app.use(logRequest)
app.use(logRequestError)

app.listen(8080, () => logger.info('console-casino server is running'))

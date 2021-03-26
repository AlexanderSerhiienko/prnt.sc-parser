const isProd = process.env.NODE_ENV === 'production'

export default {
  API_URL: isProd ? '' : 'http://localhost:3001',
  PORT: 3001,
  MESSAGES: {
    BAD_REQUEST: 'Ошибка запроса'
  }
}

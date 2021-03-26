const isProd = process.env.NODE_ENV === 'production'

export const API_URL = isProd ? '' : 'http://localhost:3001'

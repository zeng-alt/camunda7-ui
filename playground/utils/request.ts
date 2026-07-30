import axios from 'axios'

const request = axios.create({
  baseURL: '/engine-rest',
  timeout: 30000,
})

request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error.message || '请求失败'
    alert(message)
    return Promise.reject(error)
  },
)

export default request

import axios from 'axios'

// 클라이언트는 상대 경로 /proxy-api/* 만 호출하고 인증은 서버 프록시가 담당한다.
export const proxyApiClient = axios.create({
  baseURL: '',
})

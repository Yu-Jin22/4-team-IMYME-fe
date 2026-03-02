// PvP 매칭 페이지에서 쓰는 방 상태 상수
export const OPEN_ROOM_STATUS = 'OPEN'
export const THINKING_ROOM_STATUS = 'THINKING'
export const RECORDING_ROOM_STATUS = 'RECORDING'
export const PROCESSING_ROOM_STATUS = 'PROCESSING'
export const FINISHED_ROOM_STATUS = 'FINISHED'
export const CANCELED_ROOM_STATUS = 'CANCELED'
export const EXPIRED_ROOM_STATUS = 'EXPIRED'

// PvP 매칭 페이지에서 쓰는 사용자 메시지 상수
export const PVP_MATCHING_ERROR_MESSAGE = '매칭 방에 입장하지 못했습니다.'
export const PVP_MATCHING_ACCESS_DENIED_MESSAGE = '참여 중인 매칭 방이 아닙니다.'
export const PVP_MATCHING_INVALID_ROOM_ID_MESSAGE = '잘못된 방 정보입니다.'
export const PVP_MATCHING_LOADING_MESSAGE = '매칭 방 정보를 불러오는 중입니다.'
export const PVP_MATCHING_EMPTY_GUEST_NAME = '...'
export const PVP_START_RECORDING_ERROR_MESSAGE = '녹음 시작 요청에 실패했습니다. 다시 시도해주세요.'
export const PVP_OPPONENT_SUBMITTED_TOAST_MESSAGE = '상대방이 음성 제출을 완료했습니다.'
export const PVP_MATCHING_PENDING_KEYWORD_MESSAGE = '키워드를 생성하는 중...'

// PvP 매칭 페이지 라우팅 경로/타이밍 상수
export const PVP_FEEDBACK_PATH_PREFIX = '/pvp/feedback'
export const PVP_MAIN_PATH = '/main'
export const PVP_ROOMS_PATH = '/pvp/rooms'
export const PVP_MATCHING_ERROR_REDIRECT_DELAY_MS = 3000

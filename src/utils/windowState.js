import { reactive } from 'vue'

// 单窗口外壳的共享状态：标题栏文字、状态栏左侧文字、需要登录的对话框
export const windowState = reactive({
  title: '',
  status: '',
  authRequired: false,
  authApiIndex: 0
})

export const setWindowTitle = (title) => {
  windowState.title = String(title || '')
  if (typeof document !== 'undefined' && title) document.title = title
}

export const setWindowStatus = (status) => {
  windowState.status = String(status || '')
}

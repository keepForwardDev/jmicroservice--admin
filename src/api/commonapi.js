import request from '@/libs/request.js'

/**
 * 根据nameKey获取子级字典，只能获取一级
 * @param nameKey
 * @returns {Promise<AxiosResponse<T>>}
 */
export function getDictionaryListByKey (nameKey) {
  return request.get('/dic/selectList/' + nameKey)
}

/**
 * 根据nameKey 获取字典树
 * @param nameKey
 * @returns {Promise<AxiosResponse<T>>}
 */
export function getDictionaryTreeByKey (nameKey) {
  return request.get('/dic/treeNodeByNameKey/' + nameKey)
}

export async function uploadFile (params) {
  return request.postJson('/common/upload/singleFile', params)
}


export async function getDictionaryTree (key, lazy) {
  return request.get('/dic/getTree/' + key, {
    lazy: lazy ? 1 : 0
  })
}

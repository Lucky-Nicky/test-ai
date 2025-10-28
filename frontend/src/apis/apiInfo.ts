import { request } from '@/utils/requests';


export async function apiInfoGetApi(info:any) {
  return await request({
    url: '/api/api_info/get',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function apiInfoSaveApi(info:any) {
  return await request({
    url: '/api/api_info/save',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function apiInfoDeleteApi(info:any) {
  return await request({
    url: '/api/api_info/delete',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function executePyScriptApi(info:any) {
  return await request({
    url: '/api/api_case/exec_py_script',
    method: 'post',
    data: info,
    header: null,
  });
}
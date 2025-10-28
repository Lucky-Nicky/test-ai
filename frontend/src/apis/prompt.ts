import { request } from '@/utils/requests';


export async function PromptGetApi(info:any) {
  return await request({
    url: '/api/prompt/get',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function PromptAddApi(info:any) {
  return await request({
    url: '/api/prompt/add',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function PromptValidateApi(info:any) {
  return await request({
    url: '/api/prompt/validate',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function PromptDeleteApi(info:any) {
  return await request({
    url: '/api/prompt/delete',
    method: 'post',
    data: info,
    header: null,
  });
}
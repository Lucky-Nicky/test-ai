import { request, exportRequest } from '@/utils/requests';

export async function caseMindInitApi(info:any) {
  return await request({
    url: '/api/case/mind/init',
    method: 'post',
    data: info,
    header: null,
  });
}


export async function caseMindSaveApi(info:any) {
  return await request({
    url: '/api/case/mind/save',
    method: 'post',
    data: info,
    header: null,
  });
}
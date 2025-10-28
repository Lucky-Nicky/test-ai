import { request } from '@/utils/requests';

export async function getPlansApi(info:any) {
  return await request({
    url: '/api/plan/get',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function addPlanApi(info:any) {
  return await request({
    url: '/api/plan/add',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function deletePlanApi(info:any) {
  return await request({
    url: '/api/plan/delete',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function genBusinessBackgroundByStory(info:any) {
  return await request({
    url: '/api/plan/gen_business_background_by_story',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function genTestResrouceHtml(info:any) {
  return await request({
    url: '/api/plan/test_source_html',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function genTestScopeHtml(info:any) {
  return await request({
    url: '/api/plan/test_scope_html',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function genTestExecutePlanHtml(info:any) {
  return await request({
    url: '/api/plan/execute_pan_html',
    method: 'post',
    data: info,
    header: null,
  });
}
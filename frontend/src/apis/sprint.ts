import { request } from '@/utils/requests';


export async function sprintGetApi(info:any) {
  return await request({
    url: '/api/sprint/get',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function sprintAddApi(info:any) {
  return await request({
    url: '/api/sprint/add',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function sprintEditApi(info:any) {
  return await request({
    url: '/api/sprint/edit',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function sprintDeleteApi(info:any) {
  return await request({
    url: '/api/sprint/delete',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function searchJiraSprintApi(info:any) {
  return await request({
    url: '/api/sprint/search_jira_sprint',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function searchJiraReleaseApi(info:any) {
  return await request({
    url: '/api/sprint/search_jira_release',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function syncJiraInfoApi(info:any) {
  return await request({
    url: '/api/sprint/sync_jira_info',
    method: 'post',
    data: info,
    header: null,
  });
}
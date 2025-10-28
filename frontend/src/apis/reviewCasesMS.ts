import { request } from '@/utils/requests';

export async function MSGetReviewListApi(info:any) {
  return await request({
    url: '/api/case_review_ms/get_review_list',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function MSGetReviewCaseListApi(info:any) {
  return await request({
    url: '/api/case_review_ms/get_review_case_list',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function MSGetReviewCaseDetailApi(info:any) {
  return await request({
    url: '/api/case_review_ms/get_review_case_detail',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function MSGetReviewNodeListApi(info:any) {
  return await request({
    url: '/api/case_review_ms/get_review_node_list',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function MSMarkReviewCaseResultApi(info:any) {
  return await request({
    url: '/api/case_review_ms/mark_result',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function MSButchMarkReviewCaseResultApi(info:any) {
  return await request({
    url: '/api/case_review_ms/butch_mark_result',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function MSGetReviewHistoryApi(info:any) {
  return await request({
    url: '/api/case_review_ms/history',
    method: 'post',
    data: info,
    header: null,
  });
}
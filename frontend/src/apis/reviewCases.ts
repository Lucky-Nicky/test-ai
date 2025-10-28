import { request } from '@/utils/requests';

export async function caseReviewMarkResultApi(info:any) {
  return await request({
    url: '/api/case_review/mark_result',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function caseReviewHistoryApi(info:any) {
  return await request({
    url: '/api/case_review/history',
    method: 'post',
    data: info,
    header: null,
  });
}

import { request } from '@/utils/requests';

export async function prdReviewMarkResultApi(info:any) {
  return await request({
    url: '/api/prd_review/mark_result',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function prdReviewEditReviewIssuesApi(info:any) {
  return await request({
    url: '/api/prd_review/edit_left_issues',
    method: 'post',
    data: info,
    header: null,
  });
}

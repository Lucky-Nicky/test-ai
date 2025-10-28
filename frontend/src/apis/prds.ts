import { request } from '@/utils/requests';

export async function getProductFilesApi(info:any) {
  return await request({
    url: '/api/get_product_files',
    method: 'post',
    data: info,
    header: null,
  });
}


export async function getProductFileDetailApi(info:any) {
  return await request({
    url: '/api/get_product_files_detail',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function addProductFilesApi(info:any) {
  return await request({
    url: '/api/add_product_file',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function deleteProductFilesApi(info:any) {
  return await request({
    url: '/api/delete_product_file',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function getPrdPagesApi(info:any) {
  return await request({
    url: '/api/get_prd_pages',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function prdReviewCasesPrepareApi(info:any) {
  return await request({
    url: '/api/prd_review_case_prepare',
    method: 'post',
    data: info,
    header: null,
  });
}

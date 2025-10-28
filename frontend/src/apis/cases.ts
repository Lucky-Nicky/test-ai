import { request, exportRequest } from '@/utils/requests';

export async function extractTestPointApi(info:any) {
  return await request({
    url: '/api/case/extract_test_point',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function generateCasesApi(info:any) {
  return await request({
    url: '/api/generate_cases',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function generateCasesByTitleApi(info:any) {
  return await request({
    url: '/api/generate_cases_by_title',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function  createSingleCaseByTitleApi(info:any) {
  return await request({
    url: '/api/create_single_case_by_title',
    method: 'post',
    data: info,
    header: null,
  });
}



export async function saveCaseApi(info:any) {
  return await request({
    url: '/api/save_cases',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function saveOptimisedCaseApi(info:any) {
  return await request({
    url: '/api/save_optimised_cases',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function EditCaseApi(info:any) {
  return await request({
    url: '/api/case/edit',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function getCaseApi(info:any) {
  return await request({
    url: '/api/get_cases',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function CaseDetailApi(info:any) {
  return await request({
    url: '/api/case_detail',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function deleteCaseApi(info:any) {
  return await request({
    url: '/api/delete_cases',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function bunchDeleteCaseApi(info:any) {
  return await request({
    url: '/api/cases/bunch_delete',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function bunchMoveCaseApi(info:any) {
  return await request({
    url: '/api/cases/bunch_move',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function bunchCopyCaseApi(info:any) {
  return await request({
    url: '/api/cases/bunch_copy',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function exportCasesApi(info:any) {
  return await exportRequest({
    url: '/api/export_cases',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function optimiseCasesApi(info:any) {
  return await request({
    url: '/api/case/optimise',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function importCaseApi(info:any) {
  return await request({
    url: '/api/import_cases',
    method: 'post',
    data: info,
    header: null,
  });
}

import { request, exportRequest } from '@/utils/requests';


export async function DataPrepareGetApi(info:any) {
  return await request({
    url: '/api/data_prepare/get',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareGetDetailApi(info:any) {
  return await request({
    url: '/api/data_prepare/get_detail',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareAddApi(info:any) {
  return await request({
    url: '/api/data_prepare/add',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareAddSheetApi(info:any) {
  return await request({
    url: '/api/data_prepare/add_sheet',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareDeleteApi(info:any) {
  return await request({
    url: '/api/data_prepare/delete',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareDeleteSheetApi(info:any) {
  return await request({
    url: '/api/data_prepare/delete_sheet',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareGetSheetsApi(info:any) {
  return await request({
    url: '/api/data_prepare/get_sheets',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareGetHeadersApi(info:any) {
  return await request({
    url: '/api/data_prepare/get_headers',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareSaveColumnsDemandApi(info:any) {
  return await request({
    url: '/api/data_prepare/save_columns_demand',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareGenerateDataApi(info:any) {
  return await request({
    url: '/api/data_prepare/generate_data',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareDataRecommendPrepareApi(info:any) {
  return await request({
    url: '/api/data_prepare/data_recommend_prepare',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareSaveDataApi(info:any) {
  return await request({
    url: '/api/data_prepare/save_data',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareDeleteGenDataApi(info:any) {
  return await request({
    url: '/api/data_prepare/deleteGenData',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareDownloadApi(info:any) {
  return await exportRequest({
    url: '/api/data_prepare/download',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function DataPrepareDownloadAllApi(info:any) {
  return await exportRequest({
    url: '/api/data_prepare/download_all',
    method: 'post',
    data: info,
    header: null,
  });
}
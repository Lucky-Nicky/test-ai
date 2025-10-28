import { request } from '@/utils/requests';


export async function nodesGetApi(info:any) {
  return await request({
    url: '/api/nodes/get',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function nodesAddApi(info:any) {
  return await request({
    url: '/api/nodes/add',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function nodesEditApi(info:any) {
  return await request({
    url: '/api/nodes/edit',
    method: 'post',
    data: info,
    header: null,
  });
}


export async function nodesDeleteApi(info:any) {
  return await request({
    url: '/api/nodes/delete',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function nodesDragNodeApi(info:any) {
  return await request({
    url: '/api/nodes/drag_node',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function nodesGetMSNodesApi(info:any) {
  return await request({
    url: '/api/nodes/get_ms_nodes',
    method: 'post',
    data: info,
    header: null,
  });
}

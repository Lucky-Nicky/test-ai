import { request } from '@/utils/requests';


export async function LlmGetApi(info:any) {
  return await request({
    url: '/api/llm/get',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function LlmCreateChatApi(info:any) {
  return await request({
    url: '/api/llm/create_chat',
    method: 'post',
    data: info,
    header: null,
  });
}


export async function LlmAskApi(info:any) {
  return await request({
    url: '/api/llm/ask',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function LlmExtractJsonApi(info:any) {
  return await request({
    url: '/api/llm/extract_json',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function LlmChatInfoApi(info:any) {
  return await request({
    url: '/api/llm/chat_info',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function LlmChatHistoryApi(info:any) {
  return await request({
    url: '/api/llm/chat_history',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function LlmChatDetailApi(info:any) {
  return await request({
    url: '/api/llm/chat_detail_info',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function LlmSaveChatDetailApi(info:any) {
  return await request({
    url: '/api/llm/save_chat_detail',
    method: 'post',
    data: info,
    header: null,
  });
}

export async function LlmChatDeleteApi(info:any) {
  return await request({
    url: '/api/llm/chat/delete',
    method: 'post',
    data: info,
    header: null,
  });
}


export async function LlmSwitchDefaultApi(info:any) {
  return await request({
    url: '/api/llm/switch_default',
    method: 'post',
    data: info,
    header: null,
  });
}
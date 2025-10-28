import { request } from '@/utils/requests';


export async function loginApi(info:any) {
    return await request({
        url: '/api/login',
        method: 'post',
        data: info,
        header: null,
    });
}
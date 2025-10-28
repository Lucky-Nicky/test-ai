import { request } from '@/utils/requests';


export async function sprintStaticsGetApi(info:any) {
    return await request({
        url: '/api/sprint_statics/get',
        method: 'post',
        data: info,
        header: null,
    });
}
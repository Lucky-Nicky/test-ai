import { request } from '@/utils/requests';
import axios from 'axios';

export async function projectsApi() {
  return await request({
    url: '/api/projects',
    method: 'get',
    data: null,
    header: null,
  });
}

export async function projectsDetailApi(info) {
    return await request({
        url: '/api/projects_detail',
        method: 'post',
        data: info,
        header: null,
    });
}

export async function subProjectsApi(info) {
    return await request({
        url: '/api/sub_projects',
        method: 'post',
        data: info,
        header: null,
    });
}

export async function developersApi(info) {
    return await request({
        url: '/api/developers',
        method: 'post',
        data: info,
        header: null,
    });
}

export async function uploadApi(file_name, file) {
    return new Promise((resolve, reject) => {
        axios({
            url: 'https://osssit.jus-link.com/chenlong/qa_center/' + file_name,
            method: "put",
            data: file,
        })
            .then(response => {
                // console.log(response.data); // 处理上传成功后的响应
                resolve('https://osssit.jus-link.com/chenlong/qa_center/' + file_name)
            })
            .catch(error => {
                reject(error); // 处理上传失败时的错误
            });
    });
}


export async function getPdfPagesApi(info:any) {
    return await request({
        url: '/api/get_prd_pages',
        method: 'post',
        data: info,
        header: null,
    });
}


export async function basicAskAnswerApi(info:any) {
    return await request({
        url: '/api/basic/ask_answer',
        method: 'post',
        data: info,
        header: null,
    });
}

export async function basicWikiSpaceGetApi() {
    return await request({
        url: '/api/basic/wiki_space_get',
        method: 'post',
        data: {},
        header: null,
    });
}

export async function basicWikiPagesGetApi(info:any) {
    return await request({
        url: '/api/basic/wiki_child_pages',
        method: 'post',
        data: info,
        header: null,
    });
}

export async function basicUploadWikiApi(info:any) {
    return await request({
        url: '/api/basic/upload_wiki',
        method: 'post',
        data: info,
        header: null,
    });
}
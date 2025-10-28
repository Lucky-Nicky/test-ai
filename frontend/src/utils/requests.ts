import axios from 'axios';
import { message } from 'antd';
import {history} from "umi";

export function request(config: any) {
  return new Promise((resolve, reject) => {
    axios({
      url: config.url,
      method: config.method,
      data: config.data,
      headers: {
        'content-type': 'application/json',
        ...config.headers,
      },
    })
      .then((res) => {
        resolve(res?.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}


export function exportRequest(config: any) {
    return new Promise((resolve, reject) => {
        axios({
            url: config.url,
            method: config.method,
            data: config.data,
            headers: {
                'content-type': 'application/json',
                ...config.headers,
            },
            responseType: "blob"
        })
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

// 添加响应拦截器
axios.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    if (response.data?.message) {
      message.error(response.data.message);
    }
    if (response.data?.need_login){
        history.push('/login');
    }
    // 设置cookie
      const serverCookie:any = response.headers['set-cookie'];
      serverCookie && (document.cookie = serverCookie);
    return response;
  },
  function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    return Promise.reject(error);
  },
);

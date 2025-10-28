import time

import urllib3
import requests
import json

from flask import Response

from common.other import success, error, save_chat_detail
from models.llm import Chat, ChatDetail
from main import app, db
from common.LogController import logger

urllib3.disable_warnings()
# -----------------------------公司代理---------------------------------------
# API_KEY should be set from environment variables
# URL should be set from configuration
# --------------------------------------------------------------------------


class OpenAIModel:
    # # api_key = os.getenv('OPENAI_API_KEY', '你的OpenAI秘钥')
    # api_key = os.getenv('OPENAI_API_KEY', '你的OpenAI秘钥')
    # # url = 'https://api.openai-proxy.org/v1/chat/completions'
    # url = 'https://api.closeai-proxy.xyz/v1/chat/completions'
    # header = {
    #     'Content-Type': 'application/json',
    #     'Authorization': 'Bearer ' + api_key
    # }

    @classmethod
    def ask(cls, prompt, chat_id, model_name, api_key,url,history_limit=None,):
        header = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + api_key
        }
        prompt = prompt.strip()
        with app.app_context():
            chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
            if not chat_row:
                return error('没有找到chat_id:{}'.format(chat_id))
            messages = []
            # 查看是否存在历史提问， 如果有，添加
            chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(ChatDetail.id).all()
            if chat_detail_rows:
                chat_detail_rows = chat_detail_rows[history_limit[0]:history_limit[1]] if history_limit else chat_detail_rows
                for detail in chat_detail_rows:
                    messages.append({
                        "role": 'user' if detail.role == 'HUMAN' else 'assistant',
                        "content": json.loads(detail.content)['question'] if detail.role == 'HUMAN' else json.loads(detail.content)['answer']
                    })
            messages.append({
                "role": "user",
                "content": prompt
            })
            payload = {
                'model': model_name,
                'messages': messages,
                'temperature': 0.7
            }
            # print(payload)
            try:
                # print(url)
                response = requests.post(url, json=payload, headers=header, verify=False)
                logger.info(response.json())
                if 'error' in response.json():
                    return error(response.json()['error']['message'])
                rtn = response.json()['choices'][0]["message"]["content"]
                save_chat_detail(chat_id, 'HUMAN', {'question': prompt})
                save_chat_detail(chat_id, 'AI', {'answer': rtn})
                return success(rtn)
            except Exception as e:
                return error('调用chatGPT接口异常:{}'.format(e))

    @classmethod
    def stream_ask(cls, prompt, chat_id, model_name, api_key,url, is_retry=False):
        header = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + api_key
        }
        prompt = prompt.strip()
        with app.app_context():
            chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
            if not chat_row:
                return error('没有找到chat_id:{}'.format(chat_id))
            messages = []
            # 查看是否存在历史提问， 如果有，添加
            chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(ChatDetail.id).all()
            if chat_detail_rows:
                for detail in chat_detail_rows:
                    messages.append({
                        "role": 'user' if detail.role == 'HUMAN' else 'assistant',
                        "content": json.loads(detail.content)['question'] if detail.role == 'HUMAN' else json.loads(detail.content)['answer']
                    })
            if not is_retry:
                messages.append({
                    "role": "user",
                    "content": prompt
                })
            payload = {
                'model': model_name,
                'messages': messages,
                'temperature': 0.7,
                'stream': True
            }
            # print(payload)
            try:
                if not is_retry:
                    save_chat_detail(chat_id, 'HUMAN', {'question': prompt})
                return requests.post(url, json=payload, headers=header, stream=True, verify=False)

            except Exception as e:
                return error('调用chatGPT接口异常:{}'.format(e))


class QianFanAIModel:
    # API credentials should be loaded from environment variables
    import os
    api_key = os.getenv('BAIDU_API_KEY', '你的百度秘钥')
    secret_key = os.getenv('BAIDU_SECRET_KEY', '')
    auth_url = "https://aip.baidubce.com/oauth/2.0/token?client_id={API_KEY}&client_secret={Secret_Key}&grant_type=client_credentials"

    chat_url = {
        'ERNIE-3.5-8K': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions'
    }
    @classmethod
    def get_token(cls):
        payload = json.dumps("")
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        response = requests.request("POST", cls.auth_url.format(API_KEY=cls.api_key, Secret_Key=cls.secret_key), headers=headers,
                                    data=payload)
        return response.json().get("access_token")

    @classmethod
    def get_model_url(cls, model_name):
        return cls.chat_url.get(model_name, None)

    @classmethod
    def ask(cls, prompt, chat_id, model_name, history_limit=None):
        prompt = prompt.strip()
        with app.app_context():
            chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
            if not chat_row:
                return error('没有找到chat_id:{}'.format(chat_id))
            # 查看是否存在历史提问， 如果有，添加messages中
            messages = []
            chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(
                ChatDetail.id).all()
            chat_detail_rows = chat_detail_rows[
                               history_limit[0]:history_limit[1]] if history_limit else chat_detail_rows
            for detail in chat_detail_rows:
                messages.append({
                    "role": 'user' if detail.role == 'HUMAN' else 'assistant',
                    "content": json.loads(detail.content)['question'] if detail.role == 'HUMAN' else
                    json.loads(detail.content)['answer']
                })
            url = '{url}?access_token={token}'.format(url=cls.get_model_url(model_name), token=cls.get_token())
            messages.append({
                "role": "user",
                "content": prompt
            })
            payload = {
                "messages": messages
            }
            headers = {
                'Content-Type': 'application/json'
            }
            try:
                response = requests.post(url, headers=headers, json=payload)
                rtn = response.json()['result']
                save_chat_detail(chat_id, 'HUMAN', {'question': prompt})
                save_chat_detail(chat_id, 'AI', {'answer': rtn})
                return success(rtn)
            except Exception as e:
                return error('调用文心一言接口异常：{}'.format(e))

    @classmethod
    def stream_ask(cls, prompt, chat_id, model_name, is_retry=False):
        prompt = prompt.strip()
        with app.app_context():
            chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
            if not chat_row:
                return error('没有找到chat_id:{}'.format(chat_id))
            # 查看是否存在历史提问， 如果有，添加messages中
            messages = []
            chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(
                ChatDetail.id).all()
            for detail in chat_detail_rows:
                messages.append({
                    "role": 'user' if detail.role == 'HUMAN' else 'assistant',
                    "content": json.loads(detail.content)['question'] if detail.role == 'HUMAN' else
                    json.loads(detail.content)['answer']
                })
            url = '{url}?access_token={token}'.format(url=cls.get_model_url(model_name), token=cls.get_token())
            if not is_retry:
                messages.append({
                    "role": "user",
                    "content": prompt
                })
            payload = {
                "messages": messages,
                "stream": True
            }
            headers = {
                'Content-Type': 'application/json'
            }
            try:
                if not is_retry:
                    save_chat_detail(chat_id, 'HUMAN', {'question': prompt})
                return requests.post(url, headers=headers, json=payload, stream=True)
            except Exception as e:
                return None


class OpenAIModel_4o:
    # API credentials should be loaded from environment variables
    import os
    api_key = os.getenv('OPENAI_API_KEY', '你的OpenAI秘钥')
    url = os.getenv('OPENAI_URL', 'http://test_gpt.nicky-deng.cn/v1/chat/completions')
    header = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + api_key
    }

    @classmethod
    def ask(cls, prompt, chat_id, model_name, history_limit=None):
        prompt = prompt.strip()
        with app.app_context():
            chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
            if not chat_row:
                return error('没有找到chat_id:{}'.format(chat_id))
            messages = []
            # 查看是否存在历史提问， 如果有，添加
            chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(ChatDetail.id).all()
            if chat_detail_rows:
                chat_detail_rows = chat_detail_rows[history_limit[0]:history_limit[1]] if history_limit else chat_detail_rows
                for detail in chat_detail_rows:
                    messages.append({
                        "role": 'user' if detail.role == 'HUMAN' else 'assistant',
                        "content": json.loads(detail.content)['question'] if detail.role == 'HUMAN' else json.loads(detail.content)['answer']
                    })
            messages.append({
                "role": "user",
                "content": prompt
            })
            payload = {
                'model': model_name,
                'messages': messages,
                'temperature': 0.7
            }
            # print(payload)
            try:
                # print(url)
                response = requests.post(cls.url, json=payload, headers=cls.header, verify=False)
                logger.info(response.json())
                if 'error' in response.json():
                    return error(response.json()['error']['message'])
                rtn = response.json()['choices'][0]["message"]["content"]
                # print(rtn)
                save_chat_detail(chat_id, 'HUMAN', {'question': prompt})
                save_chat_detail(chat_id, 'AI', {'answer': rtn})
                return success(rtn)
            except Exception as e:
                return error('调用chatGPT接口异常:{}'.format(e))

    @classmethod
    def stream_ask(cls, prompt, chat_id, model_name, is_retry=False):
        prompt = prompt.strip()
        with app.app_context():
            chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
            if not chat_row:
                return error('没有找到chat_id:{}'.format(chat_id))
            messages = []
            # 查看是否存在历史提问， 如果有，添加
            chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(ChatDetail.id).all()
            if chat_detail_rows:
                for detail in chat_detail_rows:
                    messages.append({
                        "role": 'user' if detail.role == 'HUMAN' else 'assistant',
                        "content": json.loads(detail.content)['question'] if detail.role == 'HUMAN' else json.loads(detail.content)['answer']
                    })
            if not is_retry:
                messages.append({
                    "role": "user",
                    "content": prompt
                })
            payload = {
                'model': model_name,
                'messages': messages,
                'temperature': 0.7,
                'stream': True
            }
            # print(payload)
            try:
                if not is_retry:
                    save_chat_detail(chat_id, 'HUMAN', {'question': prompt})
                return requests.post(cls.url, json=payload, headers=cls.header, stream=True, verify=False)

            except Exception as e:
                return error('调用chatGPT接口异常:{}'.format(e))



class TongYiAIModel:
    @classmethod
    def ask(cls, prompt, chat_id, model_name, history_limit=None):
        prompt = prompt.strip()
        with app.app_context():
            chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
            if not chat_row:
                return error('没有找到chat_id:{}'.format(chat_id))
            messages = []
            # 查看是否存在历史提问， 如果有，添加
            chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(
                ChatDetail.id).all()
            if chat_detail_rows:
                chat_detail_rows = chat_detail_rows[
                                   history_limit[0]:history_limit[1]] if history_limit else chat_detail_rows
                for detail in chat_detail_rows:
                    messages.append({
                        "role": 'user' if detail.role == 'HUMAN' else 'assistant',
                        "content": json.loads(detail.content)['question'] if detail.role == 'HUMAN' else
                        json.loads(detail.content)['answer']
                    })
            messages.append({
                "role": "user",
                "content": prompt
            })

            try:
                # print(url)
                # response = requests.post(cls.url,  headers=cls.header, verify=False)
                import dashscope
                import os
                responses = dashscope.Generation.call(
                    # model="qwen-turbo",
                    model=model_name,
                    api_key=os.getenv('DASHSCOPE_API_KEY', '你的阿里通义秘钥'),
                    messages=messages,
                    stream=False,
                    result_format='message',  # 将返回结果格式设置为 message
                    top_p=0.8,
                    temperature=0.7,
                    enable_search=False
                )

                if responses.status_code == 200:
                    rtn = responses.output.choices[0].message.content
                save_chat_detail(chat_id, 'HUMAN', {'question': prompt})
                save_chat_detail(chat_id, 'AI', {'answer': rtn})
                return success(rtn)
            except Exception as e:
                return error('调用通义千问接口异常:{}'.format(e))


    @classmethod
    def stream_ask(cls, prompt, chat_id, model_name, history_limit=None):
        prompt = prompt.strip()
        with app.app_context():
            chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
            if not chat_row:
                return error('没有找到chat_id:{}'.format(chat_id))
            messages = []
            # 查看是否存在历史提问， 如果有，添加
            chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(
                ChatDetail.id).all()
            if chat_detail_rows:
                chat_detail_rows = chat_detail_rows[
                                   history_limit[0]:history_limit[1]] if history_limit else chat_detail_rows
                for detail in chat_detail_rows:
                    messages.append({
                        "role": 'user' if detail.role == 'HUMAN' else 'assistant',
                        "content": json.loads(detail.content)['question'] if detail.role == 'HUMAN' else
                        json.loads(detail.content)['answer']
                    })
            messages.append({
                "role": "user",
                "content": prompt
            })

            try:
                # print(url)
                # response = requests.post(cls.url,  headers=cls.header, verify=False)
                import dashscope
                import os
                responses = dashscope.Generation.call(
                    # model="qwen-turbo",
                    model=model_name,
                    api_key=os.getenv('DASHSCOPE_API_KEY', '你的阿里通义秘钥'),
                    messages=messages,
                    stream=True,
                    result_format='message',  # 将返回结果格式设置为 message
                    top_p=0.8,
                    temperature=0.7,
                    enable_search=False
                )
            except Exception as e:
                return error('调用通义千问接口异常:{}'.format(e))
            return responses
            #     for response in responses:
            #         yield response.output.choices[0].message.content
            #
            #     def generator():
            #         for response in responses:
            #             yield response.output.choices[0].message.content
            #             time.sleep(0.01)
            #
            #     return Response(generator(), mimetype="application/x-ndjson", )
            # except Exception as e:
            #     return error('调用通义千问接口异常:{}'.format(e))


if __name__ == '__main__':
    prompt = """
            写一首夏天的作文
        """
    from common.spliter import text_spliter

    # response = OpenAIModel.stream_ask(prompt, chat_id=3989, model_name='gpt-4o-mini')
    # response = BaiduAIModel.stream_ask(prompt, chat_id=3984, model_name='ERNIE-3.5-8K')

    # for line in response.iter_lines():
    #     print('------------------------------------------------')
    #     print(line.decode())
    from http import HTTPStatus
    import dashscope
    def call_with_messages():
        messages = [{"role": "system", "content": "你是一名助手"},
                    {"role": "user", "content": "你的版本是什么"},
                   ]

        import os
        responses = dashscope.Generation.call(
            model="qwen-turbo",
            api_key=os.getenv('DASHSCOPE_API_KEY', '你的阿里通义秘钥'),
            messages=messages,
            stream=True,
            result_format='message',  # 将返回结果格式设置为 message
            top_p=0.8,
            temperature=0.7,
            enable_search=True
        )
        # yield responses
        for response in responses:
             print(response)
        #      yield response.output.choices[0].message.content

        # def generator():
        #     for response in responses:
        #         print(response.output.choices[0].message.content)
        #         yield response.output.choices[0].message.content
        #         time.sleep(0.01)
        # return Response(generator(), mimetype="application/x-ndjson",)


    # print(    call_with_messages())
    # responses=call_with_messages()
    # for response in responses:
    #     print(response.data)
    # for resut in response:
    #     print(resut.output.choices[0].message.content)
    # req=OpenAIModel_4o()
    # response=req.stream_ask("你是一个知识达人","102","gpt-4o")
    # for line in response.iter_lines():
    #     print(line.decode('utf-8') + '\n')
    # #     # yield line.decode('utf-8') + '\n'
    # #     time.sleep(0.01)
    # import requests
    # import json
    #
    # # 替换为你的灵码主域名
    # base_url = 'http://openapi-rdc.aliyuncs.com'
    # # 替换为你的个人令牌 token
    # token = 'pt-hywEukEnoZmLBNCBUhkxKchs_c94683df-f0d5-41d6-9cf9-abf7077bc298'
    # # 替换为你的组织 ID
    # organization_id = '67384161e17c078f97cae261'
    #
    # url = f'{base_url}/oapi/v1/platform/organizations/{organization_id}/departments'
    #
    # headers = {
    #     'accept': 'application/json',
    #     'x-yunxiao-token': token,
    #     'Content-Type': 'application/json'
    # }
    #
    # data = {
    #     "input": {
    #         "messages": [
    #             {
    #                 "role": "system",
    #                 "content": "假设你是一位数学计算大师"
    #             },
    #             {
    #                 "role": "user",
    #                 "content": "10 的平方等于多少？"
    #             }
    #
    #         ]
    #     },
    #     "parameters": {
    #         "temperature": 0.9,
    #         "top_p": 0.6,
    #         "top_k": 1024,
    #         "max_tokens": 512,
    #         "seed": 1234
    #     }
    # }
    #
    # response = requests.post(url, headers=headers, data=json.dumps(data))
    #
    # if response.status_code == 200:
    #     response_data = response.json()
    #     print("Response ID:", response_data.get("requestId"))
    #     print("Output Text:", response_data.get("output", {}).get("text"))
    #     print("Finish Reason:", response_data.get("output", {}).get("finishReason"))
    #     print("Input Tokens:", response_data.get("usage", {}).get("inputTokens"))
    #     print("Output Tokens:", response_data.get("usage", {}).get("outputTokens"))
    # else:
    #     print("Request failed with status code:", response.status_code)
    #     print("Response:", response.text)

import json
import sys

import requests, time, uuid
import base64
from Crypto.Cipher import AES

class MSUtils:
    host = "https://metersphere.jus-link.com"
    # 新的: host = "http://ms.nicky.org.cn"
    project_id = None
    headers = {}
    workspace_id = '2ae7e907-651e-475f-a5a7-60e85832d7ab'
    # 新的: workspace_id = '416705db-5902-466d-b2c7-82b17b6d767b'

    def __init__(self, project_name, ak="LfqPvzqdlGvvrDRH", sk="qKXHhQxxyrgKw8EK"):
        # 新的: ak="Dc2sWVLRnV3LcnEg", sk="jSCjzUKRCiBZOYwA"
        if not project_name or not ak or not sk:
            print("metersphere参数为空")
            sys.exit(-1)
        self.setHeaders(ak, sk)
        self.set_project_id(project_name)

    @staticmethod
    def aesEncrypt(text, secretKey, iv):
        BS = AES.block_size  # 这个等于16
        mode = AES.MODE_CBC

        def pad(s): return s + (BS - len(s) % BS) * \
                           chr(BS - len(s) % BS)

        cipher = AES.new(secretKey.encode('UTF-8'), mode, iv.encode('UTF-8'))
        encrypted = cipher.encrypt(pad(text).encode('UTF-8'))
        # 通过aes加密后，再base64加密
        b_encrypted = base64.b64encode(encrypted)
        return b_encrypted

    def setHeaders(self, accessKey, secretKey):
        timeStamp = int(round(time.time() * 1000))
        combox_key = accessKey + '|' + str(uuid.uuid4()) + '|' + str(timeStamp)
        signature = self.aesEncrypt(combox_key, secretKey, accessKey)
        # print(signature.decode('UTF-8'))
        header = {'Content-Type': 'application/json', 'ACCEPT': 'application/json, text/plain, */*', 'accessKey': accessKey,
                  'signature': signature.decode('UTF-8'), 'Connection': 'close',
                  }
        header_upload = {'accessKey': accessKey,
                  'signature': signature.decode('UTF-8'), 'Accept-Language':'zh-CN'
                  }
        self.headers = header
        self.headers_upload = header_upload
        # print(header)

    def set_project_id(self, project_name):
        url = self.host + "/api/project/listAll/" + self.workspace_id
        response = requests.get(url, headers=self.headers)
        for row in response.json()['data']:
            if row['name'] == project_name:
                # print("project:{}, id:{}".format(project_name, row['id']))
                self.project_id = row['id']
                break
        if not self.project_id:
            print("没有找到project:{}".format(project_name))

    def search_test_plan(self, key, **kwargs):
        url = self.host + "/track/test/plan/list/1/20"
        data = {'name': key, 'projectId': self.project_id, **kwargs}
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def get_plan_metric(self, plan_id):
        url = self.host + "/track/test/plan/metric"
        data = [plan_id, ]
        response = requests.post(url, json=data, headers=self.headers)
        # print('--------------------------metric------------------------------')
        # print(response.json())
        return response.json()


    def get_case_in_plan(self, plan, **kwargs):
        url = self.host + "/track/test/plan/case/list/1/10"
        data = {"planId": plan, "projectId": self.project_id, **kwargs}
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def get_case_by_plan_and_num(self, case_num, plan_id):
        case_list = self.get_case_in_plan(case_num, plan_id)['data']['listObject']
        target_cases = [x for x in case_list if x['customNum'] == case_num]
        if not target_cases:
            return None
        return target_cases[0]

    def mark_case_result(self, case_id, result="Pass"):
        """
        :param case_id:
        :param result: Failure, Pass
        :return:
        """
        url = self.host + "/track/test/plan/case/edit"
        body = {"id": case_id, "status": result}
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def search_case_review(self, key, **kwargs):
        url = self.host + '/track/test/case/review/list/1/10'
        body = {'projectId': self.project_id, 'workspaceId': self.workspace_id,
                'name': key, **kwargs}
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def search_cases_in_case_review(self, review_id, **kwargs):
        url = self.host + '/track/test/review/case/list/1/10'
        body = {'reviewId': review_id, **kwargs}
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def get_reviewers(self, review_id):
        url = self.host + '/track/test/case/review/reviewer'
        body = {'id': review_id}
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def get_node_list(self):
        url = self.host + '/track/case/node/list/' + self.project_id
        body = {"casePublic": False}
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def add_node(self, name, parent_node_id, level=2):
        print(name, parent_node_id, level)
        url = self.host + '/track/case/node/add'
        body = {
            'label': name, 'level': level, 'parentId': parent_node_id, 'projectId': self.project_id,
            'name': name, 'type': 'add'
        }
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def import_excel_case(self, file_name, file_obj):
        url = self.host + '/track/test/case/import'
        body = {"projectId":self.project_id,"userId":"nicky-deng","importType":"Create","versionId":None,"ignore":False}
        files = {
            'file': (file_name, file_obj, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
            'request': ('blob', json.dumps(body), 'application/json')
        }

        response = requests.post(url, files=files, headers=self.headers_upload)
        # print(response.text)
        return response.json()

    def get_case_review_list(self, name=None, page=1):
        url = self.host + '/track/test/case/review/list/{}/10'.format(page)
        body = {
            'projectId': self.project_id, 'workspaceId': self.workspace_id
        }
        if name:
            body['name'] = name
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def get_case_review_info(self, review_id):
        url = self.host + '/track/test/case/review/get/{}'.format(review_id)
        response = requests.get(url, headers=self.headers)
        return response.json()

    def get_case_review_node_list(self, review_id):
        url = self.host + '/track/case/node/list/review/{}'.format(review_id)
        response = requests.post(url, headers=self.headers)
        return response.json()

    def get_case_review_case_list(self, review_id, page, num, node_ids):
        url = self.host + '/track/test/review/case/list/{}/{}'.format(page, num)
        body = {'nodeIds': node_ids, 'reviewId': review_id}
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def get_case_review_case_detail(self, id):
        url = self.host + '/track/test/review/case/get/{}'.format(id)
        response = requests.get(url, headers=self.headers)
        return response.json()

    def get_case_review_case_edit(self, id, review_id, case_id, status, comment):
        url = self.host + '/track/test/review/case/edit'
        body = {'caseId': case_id, 'reviewId': review_id, 'id': id, 'status': status, 'comment': comment}
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def case_review_case_butch_edit(self, ids, review_id, status, comment):
        url = self.host + '/track/test/review/case/batch/edit/status'
        body = {'ids': ids, 'description': comment, 'projectId': self.project_id, 'reviewId': review_id,
                'status': status, 'reviewStatus': status
                }
        print('111111')
        print(body)
        response = requests.post(url, json=body, headers=self.headers)
        return response.json()

    def get_case_review_case_history(self, case_id, review_id):
        url = self.host + f'/track/test/case/comment/list/{case_id}/REVIEW/{review_id}'
        response = requests.get(url, headers=self.headers)
        return response.json()

if __name__ == '__main__':
    tt = MSUtils('4PL-询竞价管理')
    # case_review_list = tt.get_case_review_list(1)
    # print(case_review_list)
    # case_review_info = tt.get_case_review_info('e13838df-1f97-495a-b2ff-258d6fcf90ef')
    # print(case_review_info)
    # node_list_info = tt.get_case_review_node_list('e13838df-1f97-495a-b2ff-258d6fcf90ef')
    # print(node_list_info)
    case_list = tt.get_node_list()
    for row in case_list['data']:
        print(row)
    # print(case_list)



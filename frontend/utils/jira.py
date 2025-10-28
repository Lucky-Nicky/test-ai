from atlassian import Jira
import urllib3
urllib3.disable_warnings()


class JiraUtils:
    def __init__(self, username='nicky-deng', password='P@ssw0rd1'):
        self.jira = Jira(
            url='https://jira.jusda.int/',
            username=username,
            password=password,
            verify_ssl=False)

    def jql(self, jql, **kwargs):
        return self.jira.jql(jql, **kwargs)

    def jql_basic_only(self, jql):
        return self.jira.jql(jql, fields=['summary', 'description', 'priority', 'status'])

    def get_board_id(self, board_name, project_key):
        for item in self.jira.get_all_agile_boards(project_key=project_key)['values']:
            if item['name'] == board_name:
                return item['id']
        return None

    def get_sprint(self, board_id, sprint_name):
        for num in range(5):
            for row in self.jira.get_all_sprints_from_board(board_id, start=num * 50, limit=50)['values'][::-1]:
                if sprint_name.lower() in row['name'].lower():
                    return row
        return None

    def get_release(self, board_id, release_name):
        for num in range(5):
            for row in self.jira.get_all_versions_from_board(board_id=board_id, start=num * 50, limit=50, released='false')['values'][::-1]:
                if release_name.lower() in row['name'].lower().replace(' ', ''):
                    return row
        for num in range(5):
            for row in self.jira.get_all_versions_from_board(board_id=board_id, start=num * 50, limit=50, released='true')['values'][::-1]:
                if release_name.lower() in row['name'].lower().replace(' ', ''):
                    return row
        return None

    def search_sprint(self, board_id, key):
        rtn = []
        for num in range(10):
            response = self.jira.get_all_sprints_from_board(
                    board_id,
                    # state='active,future',
                    start=num * 50, limit=50)
            if not response['values']:
                return rtn[::-1][:50]
            for row in response['values']:
                if key.lower() in row['name'].lower():
                    rtn.append({'value': row['name'], 'name': row['name']})
        return rtn[::-1][:50]

    def search_release(self, board_id, key):
        released_list = []
        unreleased_list = []
        response = self.jira.get_all_versions_from_board(board_id=board_id, start=0, limit=50, released='false')
        for row in response['values']:
            if key.lower() in row['name'].lower():
                unreleased_list.append({'value': row['name'], 'name': row['name']})
        for num in range(10):
            response = self.jira.get_all_versions_from_board(board_id=board_id, start=num * 50, limit=50, released='true')
            if not response['values']:
                break
            for row in response['values']:
                if key.lower() in row['name'].lower():
                    released_list.append({'value': row['name'], 'name': row['name']})
        return unreleased_list[::-1] + released_list[::-1][:50]





if __name__ == '__main__':
    jira = JiraUtils()
    # board_id = jira.get_board_id('POM 看板', 'POM')
    board_id = jira.get_board_id('USERCENTER 看板', 'MIDDLE')
    rtn = jira.get_sprint(board_id, sprint_name='JusLink 官网 V1.0.0')
    print(rtn)
    # rtn = jira.get_release(board_id=board_id, release_name='OpenAPIV2.6.0')
    # print(rtn)
    # jql = "project = VMI AND issuetype = 子任务 AND resolution = Unresolved ORDER BY priority DESC, updated DESC"
    # temp = jira.jql_basic_only(jql)
    # for row in temp['issues']:
    #     print(row)
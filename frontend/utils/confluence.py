from atlassian import Confluence
import urllib3
urllib3.disable_warnings()


class Wiki:
    base = 'https://wiki.jusda.int'

    def __init__(self, username='nicky-deng', password='P@ssw0rd1'):
        self.confluence = Confluence(
            url='https://wiki.jusda.int/',
            username=username,
            password=password,
            verify_ssl=False)

    def get_spaces(self, **kwargs):
        return self.confluence.get_all_spaces(**kwargs)

    def search_space(self, space_name):
        spaces = self.confluence.get_all_spaces()['results']
        temp = [x for x in spaces if x['name'] == space_name]
        if not temp:
            print('没有找到space')
            return None
        return temp[0]

    def search_page(self, space_key, title):
        return self.confluence.get_page_by_title(space_key, title)

    def get_page_by_id(self, page_id):
        return self.confluence.get_page_by_id(page_id)

    def get_page_as_pdf(self, page_id):
        return self.confluence.get_page_as_pdf(page_id)

    def get_home_page(self, space_key):
        return self.confluence.get_home_page_of_space(space_key)

    def get_page_child(self, page_id):
        return self.confluence.get_page_child_by_type(page_id)


if __name__ == '__main__':
    wiki = Wiki('nicky-deng', 'P@ssw0rd1')

    # space_info = wiki.search_space('创新产品部-质量控制課')
    # print(space_info['key'])
    # home_page_info = wiki.get_home_page(space_info['key'])
    # print(home_page_info)
    # rtn = wiki.confluence.get_page_by_id('108987948', expand='body.view')
    # print(rtn['body']['view']['value'])

    html_body3 = """
    <p>
        <span class="jira-issue conf-macro output-block">
            <a href="https://jira.jusda.int/browse/MIDDLE-8888"><img class="icon" src="https://jira.jusda.int/secure/viewavatar?size=xsmall&amp;avatarId=10315&amp;avatarType=issuetype" />MIDDLE-8888</a>
            -
            <span>支持客户关系导出、导入</span>
        </span>
    </p>
    <p>
        <span class="jira-issue conf-macro output-block">
        <a href="https://jira.jusda.int/browse/MIDDLE-8888"><img class="icon" src="https://jira.jusda.int/secure/viewavatar?size=xsmall&amp;avatarId=10315&amp;avatarType=issuetype" />MIDDLE-8888</a>
        -
        <span>支持客户关系导出、导入</span>
    </span>
    </p>
    """
    # rtn = wiki.confluence.create_page(page_id="108995169", title='测试API添加页面', body=html_body3)
    # print(rtn)
    rtn = wiki.confluence.update_page(page_id=108995169, title='测试API添加页面', body=html_body3)
    print(rtn)
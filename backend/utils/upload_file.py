import requests


def upload(file_name, file):
    url = 'https://osssit.jus-link.com/chenlong/qa_center/' + file_name
    try:
            response = requests.put(url, data=file)
            print(response.text)
    except Exception as e:
        print('上传失败')
        print(e)
        return ''
    return url



if __name__ == '__main__':
    rtn = upload('prd.pdf', 'prd.pdf')
    print(rtn)
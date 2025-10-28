FROM python:3.9.16
COPY ./ /root/
WORKDIR /root
RUN pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
EXPOSE 8001
ENTRYPOINT python application.py
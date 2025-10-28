import React, {useState, useEffect } from "react";
import  styles from './index.less';
import './index.less';
import {
    Space,
    Row,
    Col, Button, Input, List, Avatar, message, Select
} from "antd";
import copy from "copy-to-clipboard";
import {
    LlmChatHistoryApi,
    LlmCreateChatApi,
    LlmExtractJsonApi,
    LlmChatDeleteApi,
    LlmGetApi, LlmChatInfoApi, LlmSaveChatDetailApi
} from '@/apis/llm';
import { PromptGetApi } from '@/apis/prompt';
import {SelectProject} from "@/components/myAntd";
import {formatDate, get_init_project, ParseDeltaStr} from "@/utils/utils";
import {GenCasePreview, GenDataPreviewModal} from "./chatCompononts";
import showdown from "showdown";
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/stackoverflow-dark.css';
import {DeleteOutlined, UserOutlined} from "@ant-design/icons";
let controller = new AbortController();
let signal = controller.signal;

export default () =>{
    const [currentProjectId, setCurrentProjectId] = useState(get_init_project());
    const [historyData, setHistoryData] = useState([]);
    const getUrlChatId = ()=>{
        const url_sprint_id = new URLSearchParams(location.search).get('chat_id');
        if(url_sprint_id){
            return Number(url_sprint_id)
        }
        return null
    }
    const [currentChatId, setCurrentChatId] = useState(getUrlChatId() || 0);
    const [chatDetail, setChatDetail] = useState([]);
    const [loading, setLoading] = useState(false);
    const [question, setQuestion] = useState('');
    const [casePreviewOpen, setCasePreviewOpen] = useState(false);
    const [previewCases, setPreviewCases] = useState([]);
    const [dataPreviewOpen, setDataPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [llmOptions, setLlmOptions] = useState([]);
    // const [currentLlm, setCurrentLlm] = useState(null);
    const [promptTemplates, setPromptTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [currentChatInfo, setCurrentChatInfo] = useState({
        llm_id: null,
        llm_name: '',
        detail: []
    });
    const getHistory = async ()=>{
        const res:any = await  LlmChatHistoryApi({
            project_id: currentProjectId,
        });
        if(res.success){
            // setHistoryData(res.data.map((x)=>x.title));
            setHistoryData(res.data);
        }
    };
    const createChat = async ()=>{
        const res:any = await LlmCreateChatApi({
            project_id: currentProjectId,
            llm_id: currentChatInfo.llm_id || llmOptions.filter((x)=>x.default == 1)[0]?.id
        });
        if(res.success){
            return res.data.id
        }
        return null
    };
    const handleDone = async (chatId, answer)=>{
        if(answer){
            const save_res:any = await handleSaveChatDetail({
                chat_id: chatId,
                role: 'AI',
                content: {
                    answer: answer
                }
            })
            if (!save_res.success){
                return
            }
        }
        if (currentChatId === 0){
            setCurrentChatId(chatId);
            getHistory();
        }
        else{
            handleGetChatInfo()
        }
        controller = new AbortController();
        signal = controller.signal;
    };
    const handleAsk = async (question:string, is_retry:boolean)=>{
        const llm_name = currentChatInfo.llm_name;
        const chatId = currentChatId === 0 ? await createChat() : currentChatId
        if(!chatId){
            return
        }
        setQuestion('');
        setLoading(true);
        is_retry
            ?
            setChatDetail([
                ...chatDetail.slice(0, -1),
                {chat_id: chatId, role: 'AI', content: {answer: 'AI思考中...'}}
            ])
            :
            setChatDetail([
                ...chatDetail,
                {chat_id: chatId, role: 'HUMAN', content: {question: question}},
                {chat_id: chatId, role: 'AI', content: {answer: 'AI思考中...'}}
            ])
        let fullAnswer = '';
        try{
            const response:any = await fetch('/api/llm/stream_ask', {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    question: question,
                    chat_id: chatId,
                    is_retry: is_retry
                }),
                signal: signal
            })
            if(!response.ok){
                message.error('调用AI接口错误');
                return
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            while (true){
                const { done, value } = await reader.read();
                if (done) {
                    handleDone(chatId, fullAnswer);
                    // console.log("数据流下载完毕");
                    break
                }
                const decodedJson = ParseDeltaStr(decoder.decode(value));

                // console.log('11111111111111111111111');
                // console.log(decoder.decode(value));
                // console.log(decodedJson);
                decodedJson.forEach((item, index, arr)=>{
                    llm_name.includes('ERNIE')
                        ?
                        fullAnswer = fullAnswer + (item.result || '')
                        :
                        fullAnswer = fullAnswer + (item.choices[0].delta?.content || '')
                })
                is_retry
                    ?
                    setChatDetail([
                        ...chatDetail.slice(0, -1),
                        {chat_id: chatId, role: 'AI', content: {answer: fullAnswer}},
                    ])
                    :
                    setChatDetail([
                        ...chatDetail,
                        {chat_id: chatId, role: 'HUMAN', content: {question: question}},
                        {chat_id: chatId, role: 'AI', content: {answer: fullAnswer}}
                    ])
            }
        }catch(error){
            // message.success('停止成功');
            handleDone(chatId, fullAnswer);
        }
        setLoading(false);
    };
    const handleExtractCase = async (answer:string) =>{
        const res:any = await LlmExtractJsonApi({
            answer: answer
        })
        if(res.success){
            const cases = res.is_list ? res.data : [res.data];
            // 验证是否为用例
            if (!cases[0]?.priority ||
                !cases[0]?.description[0]?.steps ||
                !(cases[0]?.title || cases[0]?.name)
            ){
                message.error('该数据不符合测试用例格式')
                return
            }
            setPreviewCases(cases);
            setCasePreviewOpen(true);
        }
    };
    const handleExtractData = async (answer:string) =>{
        const res:any = await LlmExtractJsonApi({
            answer: answer
        })
        if(res.success){
            const data = res.is_list ? res.data : [res.data];
            if (data[0]?.description){
                message.error('该数据不符合测试数据要求格式')
                return
            }
            setPreviewData(data.map((x, index:number)=>{
                x.key = index + 1
                return x
            }));
            setDataPreviewOpen(true);
        }
    };
    const convertToHtml = (text:any)=>{
        let converter = new showdown.Converter();
        return converter.makeHtml(text)

    };
    const handleChatDelete = async (chat_id:number)=>{
        const res:any = await LlmChatDeleteApi({
            chat_id: chat_id
        })
        if(res.success){
            message.success('删除成功');
            getHistory();
            chat_id === currentChatId && setCurrentChatId(0);
        }
    };
    const getLlmOptions = async ()=>{
        const res:any = await LlmGetApi({
        });
        if(res.success){
            setLlmOptions(res.data)
        }
    };
    const getPromptTemplates = async (projectId?: number)=>{
        const res:any = await PromptGetApi({
            project_id: projectId || currentProjectId,
            sprint_id: ""
        });
        if(res.success){
            setPromptTemplates(res.data || [])
        }
    };
    const handleTemplateSelect = (templateId:any)=>{
        setSelectedTemplate(templateId);
        const template = promptTemplates.find((x:any)=>x.id === templateId);
        if(template){
            // 将模板内容添加到输入框前面
            setQuestion(template.content + (question ? '\n\n' + question : ''));
        }
    };
    const scrollToBottom = () => {
        const chatContainer:any = document.querySelector(".chat-container");
        chatContainer.scrollBy({
            top: chatContainer.scrollHeight,
            behavior: "smooth",
        })
    };
    const handleSaveChatDetail = async (info)=>{
        return await LlmSaveChatDetailApi({
          ...info
      })
    };
    const handleGetChatInfo = async () =>{
        if(currentChatId === 0){
            setCurrentChatInfo({
                llm_id: null,
                llm_name: '',
                detail: []
            });
            setChatDetail([]);
            return
        }
        const res:any = await LlmChatInfoApi({
            chat_id: currentChatId
        })
        if(res.success){
            setCurrentChatInfo(res.data);
            setChatDetail(res.data.detail);
        }
    }

    useEffect(()=>{
        handleGetChatInfo()
    }, [currentChatId]);
    useEffect(()=>{
        getHistory();
        getPromptTemplates(currentProjectId);
        setSelectedTemplate(null);  // 切换项目时清空模板选择
    }, [currentProjectId]);
    useEffect(()=>{
        scrollToBottom();
        const codes = document.querySelectorAll('pre code');
        codes.forEach((el:any) => {
            if(loading){  // 如果AI回复中，跳过渲染，不然页面会一直闪烁
                // console.log('111');
                return
            }
            // 让code进行高亮
            hljs.highlightElement(el);
            // 为每个代码块添加一个复制按钮
            const copyButton = document.createElement('Button');
            copyButton.textContent = '复制';
            const codeBlock = el.parentNode;
            codeBlock.appendChild(copyButton);
            // 为复制按钮添加一个点击事件
            copyButton.addEventListener('click', (event) => {
                // 使用clipboard.js来复制代码块的内容
                copy(el.innerText);
                message.success('复制成功');
            });

        })
    }, [chatDetail]);
    useEffect(()=>{
        getLlmOptions();
    }, []);
    return (
        <div
        >
            <Row>
                <Col span={4}
                     style={{height: window.innerHeight - 30,
                         overflow: "auto", borderRight: '1px solid rgba(0,0,0,0.2)',
                     }}>
                    <Space direction={"vertical"} style={{width: '100%'}}>
                        <Space wrap>
                            <SelectProject
                                style={{width: 150}}
                                value={currentProjectId}
                                onChange={(value)=>{
                                    setCurrentChatId(0);
                                    localStorage.setItem('project_id', value);
                                    localStorage.setItem('sprint_id', '');
                                    setCurrentProjectId(value);
                                }}
                            />
                            <Button
                                onClick={()=>{
                                    currentChatId === 0
                                        ?
                                        message.info('已经是新会话')
                                        :
                                        setCurrentChatId(0)
                                }}
                            >新会话</Button>

                        </Space>

                        <List
                            dataSource={historyData}
                            renderItem={(item) => (
                                <li
                                    style={{
                                        boxShadow: item.id === currentChatId ? '0 0 6px 0 rgba(113,127,167,.28)': null,
                                        background: item.id === currentChatId ? '#fff': null,
                                    }}
                                    className={'chatHistoryItem'}
                                    onClick={()=>{
                                        setCurrentChatId(item.id);
                                    }}
                                >
                                    <Space direction={"vertical"} style={{width: '100%'}}>
                                        <span className={'historyText'}
                                            style={{
                                                color: item.id === currentChatId ? '#1677ff': null,
                                            }}
                                        >{item.title}</span>
                                        <Row>
                                            <Col span={18} className={"historyData"}>{formatDate(item.create_time)}</Col>
                                            <Col span={6}>
                                                <div
                                                    className={"historyOperation"}
                                                >
                                                    <DeleteOutlined
                                                        onClick={(e)=>{
                                                            e.stopPropagation();
                                                            handleChatDelete(item.id);
                                                        }}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                    </Space>


                                </li>

                            )}
                        />
                    </Space>
                </Col>
                <Col span={20}  style={{paddingLeft: 30}}
                >
                    <Row style={{height: window.innerHeight - 230, overflow: "auto"}} className={'chat-container'}>
                        <Col span={20}>
                            {chatDetail && chatDetail.map((x:any, index:number)=>{
                                return (
                                    <div key={index}>
                                        <Space align={"baseline"}>
                                            {x.role === 'HUMAN' ?
                                                <Avatar size={30} style={{backgroundColor: '#87d068'}}
                                                        icon={<UserOutlined />}
                                                />
                                                :
                                                <Avatar size={30} style={{backgroundColor: '#f56a00'}}>AI</Avatar>
                                            }
                                            {x.role === 'HUMAN' ?
                                                <pre className={styles.chatFamily} style={{paddingBottom: 15, whiteSpace: "pre-wrap"}}>{x.content.question}</pre>
                                                :
                                                (x.fail ?
                                                        <Space>
                                                            <span>{x.content.answer}</span>
                                                            <a
                                                                onClick={()=>{
                                                                    handleAsk('', true)
                                                                }}
                                                            >重试</a>

                                                        </Space>

                                                        :
                                                        <div style={{width:'100%'}} className={'AIAnswerBody'}>
                                                            <div
                                                                dangerouslySetInnerHTML={{__html: convertToHtml(x.content.answer)}}
                                                            />
                                                            <div className={'chatOperation'}>
                                                                <Space>
                                                                    <a
                                                                        onClick={()=>{
                                                                            handleExtractCase(x.content.answer)
                                                                        }}>提取用例</a>
                                                                    <a
                                                                        onClick={()=>{
                                                                            handleExtractData(x.content.answer)
                                                                        }}>提取数据</a>
                                                                    <a
                                                                        onClick={()=>{
                                                                            copy(x.content.answer);
                                                                            message.success('复制成功');
                                                                        }}>复制</a>
                                                                </Space>
                                                            </div>
                                                        </div>

                                                )
                                            }
                                        </Space>
                                    </div>

                                )
                            })}
                        </Col>
                    </Row>
                    <Row>
                        <Col span={20}>
                            <div
                                style={{marginTop:40}}
                            >
                                <div className={'llmOptions'}>
                                    <Space>
                                        <span>AI模型：</span>
                                        <Select
                                            disabled={currentChatId !== 0 || loading}
                                            options={llmOptions.map((x)=>({label:x.name, value:x.id}))}
                                            style={{width: 150}}
                                            value={currentChatInfo.llm_id || llmOptions.filter((x)=>x.default == 1)[0]?.id}
                                            onChange={(value:any, option:any)=>{
                                                setCurrentChatInfo({
                                                    ...currentChatInfo,
                                                    llm_id: value,
                                                    llm_name: option.label
                                                })
                                            }}
                                        />
                                        <span>问答模板：</span>
                                        <Select
                                            placeholder="选择问答模板"
                                            allowClear
                                            options={promptTemplates.map((x:any)=>({label:x.name, value:x.id}))}
                                            style={{width: 150}}
                                            value={selectedTemplate}
                                            onChange={handleTemplateSelect}
                                        />
                                        {!(chatDetail.length == 0 || loading) && (
                                            <>
                                                <span style={{paddingLeft: 20}}>快捷回复：</span>
                                                <a
                                                    onClick={()=>handleAsk('请返回正确的json格式', false)}
                                                >请返回正确的json格式</a>
                                            </>
                                        )}
                                        {
                                            loading && (
                                            <Button onClick={()=>{
                                                controller.abort();
                                            }}>停止</Button>
                                            )
                                        }


                                    </Space>
                                </div>
                                <Input.TextArea
                                    value={question}
                                    onChange={(e)=>setQuestion(e.target.value)}
                                    disabled={loading}
                                    allowClear
                                    placeholder={'请输入您的问题,回车提交问题，使用SHIFT + ENTER 换行'}
                                    autoSize={{minRows: 5, maxRows:20}}
                                    onPressEnter={(e:any)=>{
                                        if(!e.shiftKey){
                                            e.preventDefault();
                                            if(!question){
                                                message.info('请输入问题');
                                                return
                                            }
                                            handleAsk(e.target.value, false)
                                           ;
                                        }
                                    }}
                                />
                            </div>
                        </Col>
                    </Row>

                </Col>
            </Row>
            <GenCasePreview
                open={casePreviewOpen}
                onCancel={()=>setCasePreviewOpen(false)}
                project_id={currentProjectId}
                caseData={previewCases}
                onSaveCase={()=>setCasePreviewOpen(false)}
            />
            <GenDataPreviewModal
                open={dataPreviewOpen}
                project_id={currentProjectId}
                genData={previewData}
                onClose={()=>setDataPreviewOpen(false)}
            />
        </div>
    )
}

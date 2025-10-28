import React, {FunctionComponent, useState, useEffect} from "react";
import './index.less';
import {
    Modal,
    Space,
    Table,
    Tag,
    TreeSelect,
    message, Button, Select, Avatar, Row, Col, List, Input, Divider, Drawer
} from 'antd';
import showdown from "showdown";
import {ChatIconAI} from "@/components/icons";
import {saveCaseApi, saveOptimisedCaseApi} from "@/apis/cases";

import {SelectProject, SelectSprint} from "@/components/myAntd";
import {nodesGetApi} from "@/apis/nodes";
import {DataPrepareSaveDataApi, DataPrepareGetApi, DataPrepareGetDetailApi} from "@/apis/dataPrepare";
import {formatDate, get_init_project, ParseDeltaStr} from "@/utils/utils";
import {
    LlmChatDeleteApi,
    LlmChatHistoryApi, LlmChatInfoApi,
    LlmCreateChatApi,
    LlmExtractJsonApi,
    LlmGetApi,
    LlmSaveChatDetailApi
} from "@/apis/llm";
import hljs from "highlight.js/lib/common";
import 'highlight.js/styles/stackoverflow-dark.css';
import copy from "copy-to-clipboard";
import {DeleteOutlined, UserOutlined} from "@ant-design/icons";
import styles from "@/pages/ai_chat/index.less";
let controller = new AbortController();
let signal = controller.signal;


export const GenCasePreview:FunctionComponent = (props: any) =>{
    const {project_id, caseData, onSaveCase} = props;
    const [dataSource, setDataSource] = useState([]);
    const [sprintId, setSprintId] = useState(null);
    const [nodesData, setNodesData] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isOptimise, setIsOptimise] = useState(false);
    const columns = [
        {
            title: isOptimise ? '编号': '序号',
            dataIndex: isOptimise ? 'id': 'num',
            key: isOptimise ? 'id': 'num',
            width: 70
            // render: (text: any, record: any, index: any) => `${index + 1}`,
        },
        {
            title: '用例名称',
            dataIndex: isOptimise ? 'name' :'title',
            key: isOptimise ? 'name' :'title',
            width: 200
        },
        {
            title: '等级',
            dataIndex: 'priority',
            key: 'priority',
            width: 70,
            render: (text:any, record:any)=>{
                if(text){
                    switch (text.toUpperCase()){
                        case 'P1':
                            return <Tag color={'#f80'}>{text}</Tag>
                        case 'P2':
                            return <Tag color={'#783887'}>{text}</Tag>
                        case 'P3':
                            return <Tag color={'#00d6b9'}>{text}</Tag>
                        default:
                            return <Tag>-</Tag>
                    }
                }
                return '-'
            }
        },
        {
            title: '前置条件',
            dataIndex: 'precondition',
            key: 'precondition',
            width: 200,
            ellipsis: true,
        },
        {
            title: '用例步骤',
            dataIndex: 'description',
            key: 'description',
            width: 300,
            render: (text:any, record:any) =>(
                <Space direction={"vertical"}>
                    {text.map((x:any, index:number)=>{
                        return (
                            <span key={index}>{x.steps || '-'}</span>
                        )
                    })}
                </Space>
            )
        },
        {
            title: '预期结果',
            dataIndex: 'description',
            key: 'description',
            width: 300,
            render: (text:any, record:any) =>(
                <Space direction={"vertical"}>
                    {text.map((x:any, index:number)=>{
                        return (
                            <span key={index}>{x.expect_result || '-'}</span>
                        )
                    })}
                </Space>
            )
        },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            width: 70,
            fixed: 'right',
            render: (text:any, record:any)=>(
                <Space>
                    <a onClick={()=>setDataSource(dataSource.filter((row:any)=>row.num != record.num))}>删除</a>
                </Space>
            )
        },
    ]
    const handleOnSaveCase = async ()=>{
        let res:any;
        if (isOptimise){
            res = await saveOptimisedCaseApi({
                cases: dataSource,
                project_id: project_id,
                sprint_id: sprintId,
                node_id: selectedNode
            });
        }
        else{
            res = await saveCaseApi({
                cases: dataSource,
                project_id: project_id,
                sprint_id: sprintId,
                node_id: selectedNode
            });
        }

        if (res.success){
            message.success('保存用例成功');
            onSaveCase()
        }
    };
    const getNodes = async()=>{
        const res:any = await nodesGetApi({
            project_id: project_id,
            sprint_id: sprintId
        });
        if (res.success){
            setNodesData(res.data);
        }
    };
    useEffect(()=>{
        caseData[0]?.id ? setIsOptimise(true) : setIsOptimise(false);
        setDataSource(caseData);
    }, [caseData]);
    useEffect(()=>{
        getNodes();
    }, [sprintId]);
    return (
        <Modal
            {...props}
            width={1200}
            title={`用例预览,当前有${dataSource.length}条用例`}
            okText={'保存'}
            cancelText={'放弃'}
            onOk={handleOnSaveCase}
            footer={(_, { OkBtn, CancelBtn})=>(
                <>
                    <Space>
                        <SelectSprint
                            project_id={project_id}
                            style={{width: 200}}
                            placeholder={'请选择迭代'}
                            onChange={(value:any)=>{
                                setSprintId(value)
                            }}
                        />
                        <TreeSelect
                            placeholder={'请选择保存模块'}
                            style={{width:200, marginRight:10}}
                            value={selectedNode}
                            treeData={nodesData}
                            treeDefaultExpandAll
                            onChange={(value)=>{
                                setSelectedNode(value);
                            }}
                        />
                    </Space>
                    <CancelBtn />
                    <OkBtn />

                </>

            )}
        >
            <Table
             dataSource={dataSource}
             columns={columns}
             scroll={{x:800}}
             rowKey={'num'}
             pagination={{defaultPageSize:5,showSizeChanger:true,showTotal:(total)=>`共${total}条`}}
            />
        </Modal>
    )
}

export const GenDataPreviewModal:FunctionComponent = (props: any) =>{
    const {open, onClose, onSaveData, genData, project_id} = props;
    const [dataSource, setDataSource] = useState([]);
    const [columns, setColumns] = useState(false);
    const [templateOptions, setTemplateOptions] = useState([]);
    const [dataPrepareOptions, setDataPrepareOptions] = useState([]);

    const [dataPrepareId, setDataPrepareId] = useState(null);
    const [dataType, setDataType] = useState(null);
    const handleSetGenResultColumns = (resultData:any)=>{
        const handleDeleteGenResult = async (key)=>{
            setDataSource(resultData.filter((x)=>x.key != key));
        };
        let keys = ['key'];
        resultData.forEach((item, index, arr) =>{
            keys.push(...Object.keys(item))
            keys = Array.from(new Set(keys));
        })
        let basicGenResultColumns:any = keys.map((x:any)=>{
            if (x === 'key'){
                return {
                    title: '序号',
                    dataIndex: 'key',
                    key: 'key',
                    width: 70,
                }
            }
            return {
                title: x,
                dataIndex: x,
                key: x,
                width: 150,
                ellipsis: true
            }
        })
        basicGenResultColumns = [
            ...basicGenResultColumns,
            {
                title: '操作',
                dataIndex: 'operation',
                key: 'operation',
                width: 100,
                fixed: 'right',
                render: (text:any, record:any)=>(
                    <Space>
                        <Button
                            type={"link"}
                            size={"small"}
                            onClick={()=>{
                                handleDeleteGenResult(record.key);
                            }}
                        >
                            删除
                        </Button>
                    </Space>
                )

            }
        ]

        setColumns(basicGenResultColumns);
    };
    const handleGetTemplateList = async ()=>{
        const res:any = await DataPrepareGetApi({
            project_id: project_id
        })
        if(res.success){
            setTemplateOptions(res.data.map((x)=>{
                return {
                    value: x.id,
                    label: x.file_name
                }
            }))
        }
    };
    const handleGetDataPrepareOptions = async (info:any)=>{
        const res:any = await DataPrepareGetDetailApi(info);
        if (res.success){
            setDataPrepareOptions(res.data.map(x=>{
                return {label: x.sheet_name, value: x.id}
            }))
        }
    };
    const handleSaveData = async(isAdd:boolean)=>{
        const res:any = await DataPrepareSaveDataApi({
            data: dataSource,
            data_prepare_id: dataPrepareId,
            is_add: isAdd,
            data_type: dataType
        })
        if(res.success){
            message.success('操作成功');
            onClose()
        }
    };
    useEffect(()=>{
        setDataSource([
            ...genData
        ]);
    }, [genData,]);

    useEffect(()=>{
        handleSetGenResultColumns([
            ...dataSource
        ]);
    }, [dataSource,]);

    useEffect(()=>{
        handleGetTemplateList();
    }, [project_id]);
    return (
        <Modal
            width={1000}
            title={'测试数据预览'}
            open={open}
            okText={'覆盖'}
            cancelText={'取消'}
            onOk={()=>{
                handleSaveData(false);
                onSaveData();
            }}
            onCancel={onClose}
            footer={(_, { OkBtn, CancelBtn})=>(
                <>
                    <Space>
                        <Select
                            placeholder={'请选择模板'}
                            style={{width:150}}
                            options={templateOptions}
                            onChange={(template_id:any)=>handleGetDataPrepareOptions({
                                template_id: template_id
                            })}
                        />
                        <Select
                            placeholder={'请选择sheet'}
                            style={{width:150}}
                            options={dataPrepareOptions}
                            value={dataPrepareId}
                            onChange={(value)=>setDataPrepareId(value)}
                        />
                        <Select
                            placeholder={'数据类型'}
                            style={{width:150}}
                            options={[
                                {value: 1, label: '正向'},
                                {value: 2, label: '逆向'}
                            ]}
                            value={dataType}
                            onChange={(value)=>setDataType(value)}
                        />
                        <CancelBtn />
                        <Button
                            type={"primary"}
                            onClick={()=>{
                                handleSaveData(true);
                                onSaveData();
                            }}
                        >追加</Button>
                        <OkBtn />
                    </Space>
                </>
            )}
        >
            <Table
                columns={columns}
                dataSource={dataSource}
                scroll={{x:800,}}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
            >
            </Table>

        </Modal>
    )
}

export const ChatFloatIcon:FunctionComponent = (props: any) =>{
    return (
        <div className={'AIIcon'}>
            <ChatIconAI
                {...props}
            />
        </div>

    )
}

export const ChatBody:FunctionComponent = (props: any)=>{
    const {chat_id, onSaveData, onChangeChatId} = props;
    const [currentProjectId, setCurrentProjectId] = useState(get_init_project());
    const [historyData, setHistoryData] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(chat_id || 0);
    const [chatDetail, setChatDetail] = useState([]);
    const [loading, setLoading] = useState(false);
    const [question, setQuestion] = useState('');
    const [casePreviewOpen, setCasePreviewOpen] = useState(false);
    const [previewCases, setPreviewCases] = useState([]);
    const [dataPreviewOpen, setDataPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [llmOptions, setLlmOptions] = useState([]);
    // const [currentLlm, setCurrentLlm] = useState(null);
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
    }
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
        handleGetChatInfo();
        onChangeChatId(currentChatId);
    }, [currentChatId]);
    useEffect(()=>{
        getHistory();

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
                     style={{height: window.innerHeight - 100,
                         overflow: "auto", borderRight: '1px solid rgba(0,0,0,0.2)',
                     }}>
                    <Space direction={"vertical"} style={{width: '100%'}}>
                        <Button
                            onClick={()=>{
                                currentChatId === 0
                                    ?
                                    message.info('已经是新会话')
                                    :
                                    setCurrentChatId(0)
                            }}
                        >创建新会话</Button>
                        <Divider style={{width:'100%', marginTop: 10, marginBottom:10}}/>

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
                    <Row style={{height: window.innerHeight - 300, overflow: "auto"}} className={'chat-container'}>
                        <Col span={22}>
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
                        <Col span={22}>
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
                                    autoSize={{minRows: 5, maxRows:10}}
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
                onSaveCase={()=>{
                    setCasePreviewOpen(false);
                    onSaveData();
                }}
            />
            <GenDataPreviewModal
                open={dataPreviewOpen}
                project_id={currentProjectId}
                genData={previewData}
                onClose={()=>setDataPreviewOpen(false)}
                onSaveData={onSaveData}
            />
        </div>
    )
}

export const ChatBodyDrawer = (props:any)=>{
    const {open, onClose, chat_id, onSaveData} = props;
    const [currentChatId, setCurrentChatId] = useState(null);

    return (
        <Drawer
            title={'AI对话'}
            style={{zIndex:9999}}
            styles={{body:{padding:15}}}
            width={1000}
            open={open}
            onClose={onClose}
            destroyOnClose
            extra={
                <a onClick={()=>{
                    currentChatId
                        ?
                        window.open('/ai_chat?chat_id=' + currentChatId)
                        :
                        window.open('/ai_chat')
                }}>
                    进入全屏模式
                </a>
            }
        >

            <ChatBody
                chat_id={chat_id}
                onSaveData={onSaveData}
                onChangeChatId={(value)=>setCurrentChatId(value)}
            />
        </Drawer>
    )
}

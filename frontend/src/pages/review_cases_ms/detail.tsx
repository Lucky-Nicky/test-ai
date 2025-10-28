import React, {useState, useEffect} from "react";
import {
    Row,
    Col,
    Space,
    Table,
    Tag,
    Button,
    Drawer,
    Form,
    Input,
    Divider,
    message,
    Modal, Avatar
} from "antd";
import {useParams, history} from "umi";
import {
    MSGetReviewCaseListApi,
    MSGetReviewNodeListApi,
    MSMarkReviewCaseResultApi,
    MSGetReviewCaseDetailApi, MSGetReviewHistoryApi, MSButchMarkReviewCaseResultApi
} from "@/apis/reviewCasesMS";
import {formatDate, get_init_project, get_init_sub_project, ParseDeltaStr} from "@/utils/utils";
import {NodesTree} from "./nodesTree";
import styles from "@/pages/sprint_management/index.less";
import {PrdListModal} from "@/pages/review_cases_ms/prdListModal";
import {LlmAskApi, LlmCreateChatApi, LlmSaveChatDetailApi} from "@/apis/llm";
import {prdReviewCasesPrepareApi} from "@/apis/prds";
import showdown from "showdown";
import {ChatBodyDrawer, ChatFloatIcon} from "@/pages/ai_chat/chatCompononts";
import {ButchReviewDrawer} from "@/pages/review_cases_ms/butchreviewDrawer";
let controller = new AbortController();
let signal = controller.signal;

export default () => {
    const params = useParams();
    const [projectId, setProjectId] = useState(get_init_project());
    const [subProjectId, setSubProjectId] = useState(get_init_sub_project());
    const [caseData, setCaseData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nodeData, setNodeData] = useState([]);
    const [selectedNodeIds, setSelectedNodeIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectPrdInfo, setSelectPrdInfo] = useState(null);
    const [prdText, setPrdText] = useState([]);
    const [prdModalOpen, setPrdModalOpen] = useState(false);
    const [anwser, setAnwser] = useState('');
    const [chatId, setChatId] = useState(null);
    const [caseDetailInfo, setCaseDetailInfo] = useState(null);
    const [caseDetailOpen, setCaseDetailOpen] = useState(false);
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [comment, setComment] = useState('');
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [reviewHistory, setReviewHistory] = useState([]);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectCases, setSelectCases] = useState([]);
    const [butchCaseReviewOpen, setButchCaseReviewOpen] = useState(false);
    const [isAnswerDone, setIsAnswerDone] = useState(true);
    const [form] = Form.useForm();
    const columns = [
        {
            title: '用例编号',
            dataIndex: 'num',
            key: 'num',
        },
        {
            title: '用例名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '用例等级',
            dataIndex: 'priority',
            key: 'priority',
        },
        {
            title: '评审状态',
            dataIndex: 'reviewStatus',
            key: 'reviewStatus',
            render: (text: any, record: any) => {
                return getResultTag(text);
            }
        },
        {
            title: '评审人',
            dataIndex: 'reviewerName',
            key: 'reviewerName',
        },
        {
            title: '责任人',
            dataIndex: 'maintainerName',
            key: 'maintainerName',
        },
        {
            title: '操作',
            dataIndex: 'operations',
            key: 'operations',
            render: (text: any, record: any, index: number) => (
                <Space.Compact>
                    <Button type={"link"} size={"small"} onClick={() => {
                        if (!chatId) {
                            message.info('请先选择产品文档!!')
                            return
                        }
                        handleGetReviewCaseDetail(record.id);
                        setCaseDetailOpen(true);
                        setCurrentIndex(index);
                    }}>评审</Button>
                    <Button
                        onClick={() => {
                            setHistoryModalOpen(true);
                            handleGetHistory({
                                project_id: projectId,
                                case_id: record.caseId,
                                review_id: record.reviewId
                            })
                        }}
                        type={"link"}
                        size={"small"}
                    >记录</Button>
                </Space.Compact>
            )
        },
    ];
    const handleGetReviewCase = async (info) => {
        setLoading(true);
        const res: any = await MSGetReviewCaseListApi({
            node_ids: selectedNodeIds,
            project_id: subProjectId || projectId,
            review_id: params.id,
            page: page,
            num: pageSize,
            ...info,
        })
        if (res.success) {
            setCaseData(res.data.listObject)
        }
        setLoading(false);
        setTotal(res.data.itemCount);
    };
    const handleGetReviewCaseDetail = async (id) => {
        setLoading(true);
        const res: any = await MSGetReviewCaseDetailApi({
            id: id,
            project_id: subProjectId || projectId,
        })
        setLoading(false);
        if (res.success) {
            setCaseDetailInfo(res.data);
        }
    }
    const handleGetReviewNode = async () => {
        const res: any = await MSGetReviewNodeListApi({
            project_id: subProjectId || projectId,
            review_id: params.id
        })
        if (res.success) {
            setNodeData(res.data)
        }
    };
    const createChat = async () => {
        const res: any = await LlmCreateChatApi({
            project_id: projectId,
        });
        if (res.success) {
            setChatId(res.data.id);
            return res.data.id
        }
        return null
    };
    const handleFormatCase = (case_info_list) => {
        return JSON.stringify(case_info_list.map(case_info=>{
            return {
                title : case_info.name,
                precondition: case_info.prerequisite || null,
                priority: case_info.priority,
                steps: JSON.parse(case_info.steps)
            }
        }));
    };
    const handleAIReviewPrepare = async () => {
        setLoading(true);
        const res: any = await prdReviewCasesPrepareApi({
            chat_id: await createChat(),
            prd_content: prdText
        })
        if (res.success) {
            setAnwser(res.data);
        }
        setLoading(false);
    };
    const handleDoneStream = async (chatId, answer)=>{
        setIsAnswerDone(true);
        if(answer){
            const save_res:any = await LlmSaveChatDetailApi({
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

        controller = new AbortController();
        signal = controller.signal;
    };
    const handleSteamAsk = async (question:string)=>{
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
                    handleDoneStream(chatId, fullAnswer);
                    // console.log("数据流下载完毕");
                    break
                }
                const decodedJson = ParseDeltaStr(decoder.decode(value));

                // console.log('11111111111111111111111');
                // console.log(decoder.decode(value));
                // console.log(decodedJson);
                decodedJson.forEach((item, index, arr)=>{
                        fullAnswer = fullAnswer + (item.choices[0].delta?.content || '')
                })
                setAnwser(fullAnswer);
            }
        }catch(error){
            // message.success('停止成功');
            handleDoneStream(chatId, fullAnswer);
        }
        setLoading(false);
    };
    const handleAIReview = async (caseInfoList) => {
        const question = handleFormatCase(caseInfoList) + '\n' + '请给出这批用例的评审结果';
        setIsAnswerDone(false);
        handleSteamAsk(question);
    };
    const convertToHtml = (text: any) => {
        let converter = new showdown.Converter();
        return converter.makeHtml(text)
    };
    const handleMarkResult = async (info) => {
        setLoading(true);
        const res: any = await MSMarkReviewCaseResultApi(info);
        setLoading(false)
        if (res.success) {
            message.success('操作成功')
            handleGetReviewCase({})
            handleGetReviewCaseDetail(caseDetailInfo.id);
        }
    };
    const handleButchMarkResult = async (info) => {
        setLoading(true);
        const res: any = await MSButchMarkReviewCaseResultApi(info);
        setLoading(false)
        if (res.success) {
            message.success('操作成功')
            handleGetReviewCase({})
            setSelectCases([]);
            setButchCaseReviewOpen(false);
        }
    };
    const getResultTag = (result) => {
        switch (result) {
            case 'Pass':
                return <Tag color={"green-inverse"}>通过</Tag>
            case 'UnPass':
                return <Tag color={"red-inverse"}>未通过</Tag>
            default:
                return <Tag color={"yellow-inverse"}>评审中</Tag>

        }
    };
    const handleGetHistory = async (info) => {
        const res: any = await MSGetReviewHistoryApi(info);
        if (res.success) {
            setReviewHistory(res.data);
        }
    };

    useEffect(() => {
        handleGetReviewCase({})
        handleGetReviewNode();
    }, [])
    useEffect(() => {
        prdText.length > 0 && handleAIReviewPrepare();
    }, [prdText]);
    useEffect(() => {
        if (caseDetailInfo && (form.getFieldsValue().id !== caseDetailInfo.id)) {
            form.setFieldsValue({
                ...caseDetailInfo,
                steps: JSON.parse(caseDetailInfo.steps)
            });
            setAnwser('');
            handleAIReview([caseDetailInfo]);
        }
    }, [caseDetailInfo])
    return (
        <>
            <div className={styles.actionBar}>
                <Space>
                    <Button
                        onClick={() => history.push('/review_cases_ms')}
                    >
                        返回
                    </Button>
                    <Button
                        disabled={selectCases.length == 0}
                        type={"primary"}
                        onClick={() => {
                            if(!chatId){
                                message.info('请先选择产品文档!!')
                                return
                            }
                            setButchCaseReviewOpen(true);
                            setAnwser('');
                            handleAIReview(selectCases);
                        }}
                    >
                        批量评审
                    </Button>
                    <Button type={"primary"} onClick={() => {
                        setPrdModalOpen(true);
                    }}>{selectPrdInfo ? '重新选择' : '选择产品文档'}</Button>
                    {selectPrdInfo ?
                        (<span>{selectPrdInfo?.file_name}</span>)
                        :
                        null
                    }

                </Space>
            </div>
            <Row>
                <Col span={6} style={{maxHeight: '90vh', overflow: "auto"}}>
                    <NodesTree
                        fieldNames={{
                            title: 'name',
                            key: 'id',
                            children: 'children'
                        }}
                        nodesData={nodeData}
                        onChange={(nodes) => {
                            setSelectedNodeIds(nodes);
                            handleGetReviewCase({
                                node_ids: nodes
                            })
                        }}
                    />
                </Col>
                <Col span={18} style={{maxHeight: '90vh', overflow: "auto"}}>
                    <Table
                        rowKey={'id'}
                        dataSource={caseData}
                        columns={columns}
                        loading={loading}
                        rowSelection={{
                            selectedRowKeys: selectCases.map(x=>x.id),
                            onChange: (keys, rows) => {
                                setSelectCases(rows);
                            }
                        }}
                        pagination={{
                            total: total,
                            pageSize: pageSize,
                            showSizeChanger: true,
                            showTotal: (total) => `共${total}条`,
                            onChange: (page: number, pageSize) => {
                                setPage(page);
                                setPageSize(pageSize)
                                handleGetReviewCase({
                                    page: page,
                                    num: pageSize
                                })
                            }
                        }}
                    />
                </Col>
            </Row>
            <PrdListModal
                open={prdModalOpen}
                onSelectNoPrdReview={() => {
                    setPrdModalOpen(false);
                    setSelectPrdInfo({
                        file_name: '无需求评审',
                    })
                    setPrdText(['暂无需求文档']
                    );
                }}
                onCancel={() => setPrdModalOpen(false)}
                onselectPrd={(prdInfo, prdText) => {
                    setPrdModalOpen(false);
                    setSelectPrdInfo(prdInfo);
                    setPrdText(prdText);
                }}
                projectId={projectId}
            />
            <Drawer
                title={(
                    <Space>
                        <span>{caseDetailInfo?.num}</span>
                        <span>{caseDetailInfo?.name}</span>
                        {
                            getResultTag(caseDetailInfo?.reviewStatus)
                        }
                    </Space>
                )}
                width={'80%'}
                open={caseDetailOpen}
                onOk={() => setCaseDetailOpen(false)}
                onClose={() => setCaseDetailOpen(false)}
                footer={(
                    <Space>
                        <Button
                            disabled={currentIndex <= 0 || loading}
                            onClick={() => {
                                !isAnswerDone && controller.abort();
                                handleGetReviewCaseDetail(caseData[currentIndex - 1].id)
                                setCurrentIndex(currentIndex - 1);
                            }}
                        >上一条</Button>
                        <Button
                            disabled={currentIndex >= caseData.length - 1 || loading}
                            onClick={() => {
                                !isAnswerDone && controller.abort();
                                handleGetReviewCaseDetail(caseData[currentIndex + 1].id)
                                setCurrentIndex(currentIndex + 1);
                            }}
                        >下一条</Button>
                        <Divider
                            type={"vertical"}
                        />
                        <Button
                            disabled={loading}
                            type={"primary"}
                            onClick={() => {
                                handleMarkResult({
                                    project_id: subProjectId || projectId,
                                    id: caseDetailInfo.id,
                                    review_id: caseDetailInfo.reviewId,
                                    case_id: caseDetailInfo.caseId,
                                    status: 'Pass'
                                })
                            }}
                        >
                            通过
                        </Button>
                        <Button
                            disabled={loading}
                            onClick={() => setCommentModalOpen(true)}
                            type={"primary"}
                        >
                            失败
                        </Button>
                        <Divider
                            type={"vertical"}
                        />
                        {
                            isAnswerDone && (
                                <Button
                                    disabled={!anwser}
                                    onClick={() => {
                                        setAnwser('');
                                        handleAIReview([caseDetailInfo]);
                                    }}
                                >再次评审</Button>
                            )
                        }
                        {
                            isAnswerDone && (
                                <Button
                                    disabled={!anwser}
                                    onClick={() => {
                                        setChatDrawerOpen(true);
                                    }}
                                >{'人工提问'}</Button>
                            )
                        }
                        {
                            !isAnswerDone && (
                                <Button
                                    onClick={() => {
                                        controller.abort();
                                    }}
                                >{'停止'}</Button>
                            )
                        }


                    </Space>
                )}
            >
                <>
                    <Form
                        layout={"vertical"}
                        form={form}
                        style={{maxHeight: '40vh', overflow: "auto"}}
                    >
                        <Form.Item
                            hidden
                            label={'评审id'}
                            name={'id'}
                        >
                            <Input bordered={false} readOnly/>

                        </Form.Item>
                        <Form.Item
                            label={'用例名称'}
                            name={'name'}
                            rules={[{required: true}]}
                        >
                            <Input bordered={false} readOnly/>

                        </Form.Item>
                        <Space>
                            <Form.Item
                                label={'优先级'}
                                name={'priority'}
                                rules={[{required: true}]}
                            >
                                <Input readOnly/>
                            </Form.Item>
                            <Form.Item
                                label={'模块'}
                                name={'nodePath'}
                                rules={[{required: true}]}
                            >
                                <Input readOnly/>
                            </Form.Item>
                        </Space>
                        <Form.Item
                            label={'前置条件'}
                            name={'prerequisite'}
                        >
                            <Input.TextArea
                                readOnly
                                autoSize={{maxRows: 5}}
                            />
                        </Form.Item>

                        <Form.List name="steps">
                            {(fields, {add, remove}) => {
                                return (
                                    <>
                                        {fields.map((field, index) => (
                                            <Space key={field.key} align={'start'}>
                                                <Form.Item
                                                    name={[field.name, 'num']}
                                                    label={index === 0 ? '序号' : ''}
                                                    style={{marginBottom: 10}}
                                                >
                                                    <Input
                                                        readOnly
                                                        style={{width: 70}}
                                                        bordered={false}
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'desc']}
                                                    label={index === 0 ? '步骤' : ''}
                                                    style={{marginBottom: 10}}
                                                >
                                                    <Input.TextArea
                                                        readOnly
                                                        style={{width: 450}}
                                                        autoSize
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'result']}
                                                    label={index === 0 ? '结果' : ''}
                                                    style={{marginBottom: 10}}
                                                >
                                                    <Input.TextArea
                                                        readOnly
                                                        style={{width: 450}}
                                                        autoSize
                                                    />
                                                </Form.Item>

                                            </Space>
                                        ))}
                                    </>
                                );
                            }}
                        </Form.List>


                    </Form>
                    <Row>
                        <Col span={24}>
                            <Divider>AI评审意见</Divider>
                            <div className={styles.reviewArea}>
                                <Space align={"baseline"}>
                                    <Avatar size={30} style={{backgroundColor: '#f56a00'}}>AI</Avatar>
                                    {anwser ?
                                        (
                                            <div
                                                dangerouslySetInnerHTML={{__html: convertToHtml(anwser)}}
                                            />
                                        )
                                        :
                                        <div
                                            dangerouslySetInnerHTML={{__html: convertToHtml('AI响应中...')}}
                                        />
                                    }
                                </Space>

                            </div>
                        </Col>
                    </Row>

                </>
            </Drawer>
            <ButchReviewDrawer
                open={butchCaseReviewOpen}
                caseData={selectCases}
                onOk={()=>setButchCaseReviewOpen(false)}
                onClose={()=>setButchCaseReviewOpen(false)}
                answer={anwser}
                isAnswerDone={isAnswerDone}
                onReviewAgain={()=>{
                    setAnwser('');
                    handleAIReview(selectCases);
                }}
                onManualAsk={()=>{
                    setChatDrawerOpen(true);
                }}
                onStopAI={()=>{
                    controller.abort();
                }}
                onMarkResult={()=>{
                    handleButchMarkResult({
                        project_id: subProjectId || projectId,
                        ids: selectCases.map(x=>x.caseId),
                        review_id: selectCases[0].reviewId,
                        status: 'Pass'
                    })
                }}
                onOpenFailModal={()=>setCommentModalOpen(true)}


            />
            <Modal
                confirmLoading={loading}
                title={'失败原因备注'}
                open={commentModalOpen}
                onOk={async () => {
                    if (!comment) {
                        message.info('请输出备注');
                        return
                    }
                    setCommentModalOpen(false);
                    if (butchCaseReviewOpen){
                        await handleButchMarkResult({
                            project_id: subProjectId || projectId,
                            ids: selectCases.map(x=>x.caseId),
                            review_id: selectCases[0].reviewId,
                            status: 'UnPass',
                            comment: comment,
                        })
                    }else{
                        await handleMarkResult({
                            project_id: subProjectId || projectId,
                            id: caseDetailInfo.id,
                            review_id: caseDetailInfo.reviewId,
                            case_id: caseDetailInfo.caseId,
                            status: 'UnPass',
                            comment: comment
                        })
                    }


                }}
                onCancel={() => setCommentModalOpen(false)}
            >

                <Input.TextArea
                    placeholder={'请输入备注'}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
            </Modal>
            <Modal
                width={700}
                title={'评审历史'}
                open={historyModalOpen}
                onOk={() => setHistoryModalOpen(false)}
                onCancel={() => setHistoryModalOpen(false)}
            >
                {
                    reviewHistory.length > 0
                        ?
                        (reviewHistory.map((x, index: number) => {

                            return <p
                                key={index}>{formatDate(x.createTime, true)} - {x.authorName} - {x.status} - {x.description || '无备注'}</p>
                        }))
                        :
                        <span>暂无记录</span>

                }
            </Modal>
            <ChatBodyDrawer
                open={chatDrawerOpen}
                onClose={() => setChatDrawerOpen(false)}
                chat_id={chatId}
                onSaveData={() => {
                }}
            />
            <ChatFloatIcon
                spin
                style={{width: 40, height: 40}}
                onClick={() => setChatDrawerOpen(true)}
            />
        </>
    )
}
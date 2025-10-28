import {
    Space,
    Table,
    Form,
    Tag, Button, Row, Col, Input, Select, TreeSelect, Drawer, Divider, message, Modal
} from 'antd'
import {
    getPrdPagesApi,
    getProductFilesApi,
    prdReviewCasesPrepareApi,
} from '@/apis/prds';
import {SearchSection} from '@/components/search';
import React, { useState, useEffect} from "react";
import {formatDate} from "@/utils/utils";
import styles from './index.less';
import {getCaseApi, CaseDetailApi} from "@/apis/cases";
import {NodesTree} from "@/pages/review_cases/nodesTree";
import {LlmAskApi, LlmCreateChatApi} from "@/apis/llm";
import showdown from "showdown";
import {nodesGetApi} from "@/apis/nodes";
import {CaseTable} from "@/pages/review_cases/caseTable";
import {caseReviewMarkResultApi, caseReviewHistoryApi} from "@/apis/reviewCases";
import {ChatBodyDrawer, ChatFloatIcon} from "@/pages/ai_chat/chatCompononts";


export default ()=> {
    const [searchParams, setSearchParams] = useState({
        project_id: '',
        sprint_id: '',
        node_id: 0
    });
    const [prdData, setPrdData] = useState([]);
    const [prdText, setPrdText] = useState([]);
    const [caseData, setCaseData] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nodesData, setNodesData] = useState([]);
    const [caseDetail, setCaseDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reviewPrdId, setReviewPrdId] = useState(null);
    const [anwser, setAnwser] = useState('');
    const [chatId, setChatId] = useState(null);
    const [caseDetailOpen, setCaseDetailOpen] = useState(false);
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [comment, setComment] = useState('');
    const [history, setHistory] = useState([]);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [form] = Form.useForm();
    const getPrds = async (values)=>{
        const res:any = await getProductFilesApi({...values});
        if (res.success){
            setPrdData(res.data);
        }
    };
    const getPrdPages = async (url)=>{
        const res:any = await getPrdPagesApi({url: url, file_type: 'pdf'});
        if (res.success){
            setPrdText(res.data);
        }
    };
    const getCases = async (info:any)=>{
        const res:any = await getCaseApi({
            ...info,
        })
        if(res.success){
            setCaseData(res.data);
        }
    };
    const handleCaseDetail = async (case_id:number)=>{
        const res:any = await CaseDetailApi({
            case_id: case_id
        })
        if (res.success){
            setCaseDetail(res.data);
        }
    }
    const createChat = async ()=>{
        const res:any = await LlmCreateChatApi({
            project_id: searchParams.project_id,
        });
        if(res.success){
            setChatId(res.data.id);
            return res.data.id
        }
        return null
    };
    const handleAIReviewPrepare = async ()=>{
        setLoading(true);
        const res:any = await prdReviewCasesPrepareApi({
            chat_id: chatId ? chatId : await createChat(),
            prd_content: prdText
        })
        if(res.success){
            setAnwser(res.data);
        }
        setLoading(false);
    };
    const handleAIReview = async (caseInfo)=>{
        const res:any = await LlmAskApi({
            chat_id: chatId,
            question: handleFormatCase(caseInfo) + '\n' + '请给出这条用例的评审结果'
        })
        if(res.success){
            setAnwser(res.data);
        }
    };
    const convertToHtml = (text:any)=>{
        let converter = new showdown.Converter();
        return converter.makeHtml(text)
    };
    const getNodes = async(values)=>{
        const res:any = await nodesGetApi({
            ...values
        });
        if (res.success){
            setNodesData(res.data);
        }
    };
    const handleFormatCase = (case_info)=>{
        const title = `用例标题：${case_info.name}`;
        const priority = `优先级：${case_info.priority}`;
        const description = case_info.description.map((x:any, index:number)=>{
            return `步骤${index + 1}：${x.steps} ，结果${index + 1}：${x.expect_result}`
        })
        return title + '\n' + priority + '\n' + description.join('\n')
    };
    const handleMarkResult = async (info:any)=>{
        const res:any = await caseReviewMarkResultApi(info);
        if(res.success){
            message.success('操作成功');
            getCases(searchParams);
            handleCaseDetail(info.case_id);
        }
    };
    const handleShowHistory = async (info:any)=>{
        const res:any = await caseReviewHistoryApi(info);
        if(res.success){
            setHistory(res.data)
        }
    };
    const getResultTag = (result)=>{
        switch (result) {
            case 0:
                return <Tag color={"green-inverse"}>通过</Tag>
            case 1:
                return <Tag color={'red-inverse'}>未通过</Tag>
            default:
                return <Tag>未评审</Tag>
        }
    };
    const columns = [
        {
            title: '序号',
            dataIndex: 'xh',
            key: 'xh',
            width: 70,
            render: (text: any, record: any, index: any) => `${index + 1}`,
        },
        {
            title: '迭代号',
            dataIndex: 'sprint_name',
            key: 'sprint_name',
            // width: 100,
            render: (text: any, record: any, index: any) => (
                <Tag color={'#2db7f5'}>{text}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (text: any, record: any, index: any) => (
                <Tag color={text == 0 ? 'yellow-inverse' : 'green-inverse'}>{text == 0 ? '进行中': '已完成'}</Tag>
            ),
        },
        {
            title: '产品文档',
            dataIndex: 'file_name',
            key: 'file_name',
            render: (text:any, record:any) => (
                text ?
                <Space>
                    <a href={record.upload_type == 2 ? record.online_path :record.oss_path} target={'_blank'}>{text}</a>
                </Space>:
                    '-'
            )
        },
        {
            title: 'AI用例',
            dataIndex: 'case_num',
            key: 'case_num',
            width: 100,
            render: (text:any , record:any)=>(
                <a href={`/generate_cases?sprint_id=${record.sprint_id}`}>{text}</a>
            )
        },
        {
            title: '创建时间',
            dataIndex: 'create_time',
            key: 'create_time',
            ellipsis: true,
            render:(text:any, record:any)=>formatDate(text)
        },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            fixed: 'right',
            width: 250,
            render: (text:any, record:any) => (
                <Space size={"small"}>
                    <a onClick={async (e)=>{
                        if(!record.oss_path){
                            message.info('暂时只支持PDF需求')
                            return
                        }
                        setReviewPrdId(record.id);
                        await getPrdPages(record.oss_path);
                        await getCases({
                            project_id: searchParams.project_id,
                            sprint_id: record.sprint_id
                        });
                        await getNodes({
                            project_id: searchParams.project_id,
                            sprint_id: record.sprint_id
                        })
                        setSearchParams({
                            ...searchParams,
                            project_id: searchParams.project_id,
                            sprint_id: record.sprint_id
                        })
                    }}>评审</a>

                </Space>
            )
        },
    ];
    useEffect( ()=>{
        prdText.length > 0 && handleAIReviewPrepare();
    }, [prdText])
    useEffect( ()=>{
        if(caseDetail && (form.getFieldsValue().id !== caseDetail.id)){
            form.setFieldsValue({
                ...caseDetail,
            });
            setAnwser('');
            handleAIReview(caseDetail);
        }
    }, [caseDetail])
    return (
        reviewPrdId ?
            <>
                <div className={styles.caseAriea}>
                    <div className={styles.actionBar}>
                        <Space>
                            <Button
                                onClick={()=>setReviewPrdId(null)}
                            >
                                返回
                            </Button>
                        </Space>
                    </div>
                    <Row>
                        <Col span={4} style={{paddingRight: 20, borderRight: '1px solid #f5f5f5', overflow: "auto", maxHeight: '90vh'}}>
                            <NodesTree
                                nodesData={nodesData}
                                searchParams={searchParams}
                                onChange={(info)=>{
                                    setSearchParams({
                                        ...info
                                    });
                                    getCases(info);
                                }}
                            />
                        </Col>
                        <Col span={20} style={{paddingLeft: 20, maxHeight: '90vh', overflow: "auto"}}>
                            <CaseTable
                                caseData={caseData}
                                onAIReview={(case_id:number, index:number)=> {
                                    handleCaseDetail(case_id);
                                    setCaseDetailOpen(true);
                                    setCurrentIndex(caseData.map((x)=>x.id).indexOf(case_id));
                                }}
                                onShowHistory={(case_id:number)=>{
                                    setHistoryModalOpen(true);
                                    handleShowHistory({
                                        case_id: case_id
                                    })
                                }}
                                loading={loading}
                            />
                        </Col>
                    </Row>


              </div>
                <Drawer
                    title={(
                        <Space>
                            <span>{caseDetail?.id}</span>
                            <span>{caseDetail?.name}</span>
                            {
                                getResultTag(caseDetail?.review_status)
                            }
                        </Space>
                    )}
                    width={1000}
                    open={caseDetailOpen}
                    onOk={()=>setCaseDetailOpen(false)}
                    onClose={()=>setCaseDetailOpen(false)}
                    footer={(
                        <Space>
                            <Button
                                disabled={currentIndex <= 0 || loading}
                                onClick={()=>{
                                    handleCaseDetail(caseData[currentIndex - 1].id)
                                    setCurrentIndex(currentIndex - 1);
                                }}
                            >上一条</Button>
                            <Button
                                disabled={currentIndex >= caseData.length - 1 || loading}
                                onClick={()=>{
                                    handleCaseDetail(caseData[currentIndex + 1].id)
                                    setCurrentIndex(currentIndex + 1);
                                }}
                            >下一条</Button>
                            <Divider
                                type={"vertical"}
                            />
                            <Button
                                type={"primary"}
                                onClick={()=>{
                                    handleMarkResult({
                                        case_id: caseDetail?.id,
                                        result: 'pass',
                                    });
                                }}
                            >
                                通过
                            </Button>
                            <Button
                                onClick={()=>setCommentModalOpen(true)}
                                type={"primary"}
                            >
                                失败
                            </Button>
                            <Divider
                                type={"vertical"}
                            />
                            <Button
                                disabled={!anwser}
                                onClick={()=>{
                                    setAnwser('');
                                    handleAIReview(caseDetail);
                                }}
                            >再次评审</Button>
                        </Space>
                    )}
                >
                    <>
                        <Form
                            layout={"vertical"}
                            form={form}
                            style={{maxHeight: 500, overflow:"auto"}}
                        >
                            <Form.Item
                                label={'用例id'}
                                name={'id'}
                                hidden
                            >
                                <Input bordered={false} readOnly />

                            </Form.Item>
                            <Form.Item
                                label={'用例名称'}
                                name={'name'}
                                rules={[{ required: true }]}
                            >
                                <Input bordered={false} readOnly />

                            </Form.Item>
                            <Space>
                                <Form.Item
                                    label={'优先级'}
                                    name={'priority'}
                                    rules={[{ required: true }]}
                                >
                                    <Select
                                        disabled
                                        style={{width: 200}}
                                        options={[
                                            {value: 'P1', label: 'P1'},
                                            {value: 'P2', label: 'P2'},
                                            {value: 'P3', label: 'P3'},
                                        ]}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label={'模块'}
                                    name={'node_id'}
                                    rules={[{ required: true }]}
                                >
                                    <TreeSelect
                                        disabled
                                        style={{width: 200}}
                                        treeData={nodesData}
                                        treeDefaultExpandAll={true}
                                    />
                                </Form.Item>
                            </Space>
                            <Form.Item
                                label={'前置条件'}
                                name={'precondition'}
                            >
                                <Input.TextArea
                                    readOnly
                                />
                            </Form.Item>

                            <Form.List name="description">
                                {(fields, { add, remove }) => {
                                    return (
                                        <>
                                            {fields.map((field, index) => (
                                                <Space key={field.key} align={'start'}>
                                                    <Form.Item
                                                        name={[field.name, 'steps']}
                                                        label={index === 0 ? '步骤' : ''}
                                                        style={{marginBottom:10}}
                                                    >
                                                        <Input.TextArea
                                                            readOnly
                                                            style={{width:350}}
                                                            autoSize
                                                        />
                                                    </Form.Item>
                                                    <Form.Item
                                                        name={[field.name, 'expect_result']}
                                                        label={index === 0 ? '结果' : ''}
                                                        style={{marginBottom:10}}
                                                    >
                                                        <Input.TextArea
                                                            readOnly
                                                            style={{width:350}}
                                                            autoSize={{maxRows: 5}}
                                                        />
                                                    </Form.Item>
                                                </Space>
                                            ))}
                                        </>
                                    );
                                }}
                            </Form.List>


                        </Form>
                        <Divider>AI评审意见</Divider>
                        <div className={styles.reviewArea}>
                            {anwser ?
                                (
                                    <div
                                        style={{paddingLeft: 30}}
                                        dangerouslySetInnerHTML={{__html: convertToHtml(anwser)}}
                                    />
                                )
                            :
                                <span>AI评审意见获取中...</span>
                            }

                        </div>
                    </>
                </Drawer>
                <Modal
                    title={'失败原因备注'}
                    open={commentModalOpen}
                    onOk={async ()=>{
                        if(!comment){
                            message.info('请输出备注');
                            return
                        }
                        await handleMarkResult({
                            case_id: caseDetail?.id,
                            result: 'failed',
                            comment: comment
                        })
                        setCommentModalOpen(false);
                    }}
                    onCancel={()=>setCommentModalOpen(false)}
                >

                    <Input.TextArea
                        placeholder={'请输入备注'}
                        value={comment}
                        onChange={(e)=>setComment(e.target.value)}
                    />
                </Modal>
                <Modal
                    width={700}
                    title={'评审历史'}
                    open={historyModalOpen}
                    onOk={()=>setHistoryModalOpen(false)}
                    onCancel={()=>setHistoryModalOpen(false)}
                >
                    {
                        history.length > 0
                        ?
                            (history.map((x, index:number)=>{

                                return <p key={index}>{formatDate(x.create_time)} - {x.result === 0 ? '通过' : '失败'} - {x.comment || '无备注'}</p>
                            }))
                            :
                            <span>暂无记录</span>

                    }
                </Modal>
                <ChatBodyDrawer
                    open={chatDrawerOpen}
                    onClose={()=>setChatDrawerOpen(false)}
                    chat_id={chatId}
                    onSaveData={()=>{
                    }}
                />
                <ChatFloatIcon
                    spin
                    style={{ width: 40, height: 40}}
                    onClick={()=>setChatDrawerOpen(true)}
                />
            </>
            :
        <>
            <SearchSection
                onSubmit={(values)=>{
                    setSearchParams({
                        ...values,
                        node_id: searchParams.node_id
                    })
                    getPrds(values);
                }}
            />
            <Table
                loading={loading}
                columns={columns}
                dataSource={prdData}
                rowKey={'id'}
                scroll={{x: 1200}}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
            />

        </>
    )
}
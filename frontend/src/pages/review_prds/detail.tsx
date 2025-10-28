import React, {useState, useEffect} from "react";
import {
    Space,
    Button, Col, Row, Divider, Descriptions, Tag, message, Form, Modal, Select, Input, Avatar
} from "antd";
import {useParams, history} from "umi";
import {formatDate, get_init_project, ParseDeltaStr} from "@/utils/utils";
import styles from './index.less'
import {getPrdPagesApi, getProductFileDetailApi} from "@/apis/prds";
import PdfPreview from "./pdfViewModal";
import {LlmAskApi, LlmCreateChatApi, LlmSaveChatDetailApi} from "@/apis/llm";
import showdown from "showdown";
import {prdReviewEditReviewIssuesApi, prdReviewMarkResultApi} from "@/apis/reviewPrd";
import {MinusCircleOutlined, PlusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import {ChatBodyDrawer, ChatFloatIcon} from "@/pages/ai_chat/chatCompononts";
let controller = new AbortController();
let signal = controller.signal;


export default () => {
    const params = useParams();
    const [projectId, setProjectId] = useState(get_init_project());
    const [prdInfo, setPrdInfo] = useState(null);
    const [prdText, setPrdText] = useState([]);
    const [reviewResult, setReviewResult] = useState([]);
    const [selectStandard, setSelectStandard] = useState(null);
    const [pdfViewOpen, setPdfViewOpen] = useState(false);
    const [answer, setAnswer] = useState('');
    const [isAnswerDone, setIsAnswerDone] = useState(true);
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [leftIssuesOpen, setLeftIssuesOpen] = useState(false);
    const [isEditQuestion, setIsEditQuestion] = useState(false);
    const [diyQuestion, setDiyQuestion] = useState(null);
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [leftIssuesForm] = Form.useForm();
    const handleGetReviewTag = (text)=>{
        switch (text){
            case '失败':
                return <Tag color={'#f55'}>{text}</Tag>;
            case '进行中':
                return <Tag color={"yellow-inverse"}>{text}</Tag>
            case '已完成':
                return <Tag color={"green-inverse"}>{text}</Tag>
            default:
                return <Tag color={'#b0b8b8'}>{text}</Tag>
        }
    }
    const items = [
        {
            key: '1',
            label: '需求文档',
            children: <a onClick={()=>setPdfViewOpen(true)}>{prdInfo?.file_name}</a>,
            span: 1
        },
        {
            key: '2',
            label: '版本',
            children: prdInfo?.sprint_name,
            span: 1
        },
        {
            key: '3',
            label: '评审状态',
            children: handleGetReviewTag(prdInfo?.review_status),
            span: 1
        },
        {
            key: '4',
            label: '备注',
            children: prdInfo?.remark || '-',
            span: 1
        },
        {
            key: '5',
            label: '用户故事',
            contentStyle: {padding: 0},
            children:<ol  style={{maxHeight: 100, overflow: 'auto'}}>
                {
                    prdInfo?.story.map((x:any, index:number)=>(
                        <li key={index}>
                            <Space align={"baseline"}>
                                <a
                                    style={{whiteSpace: "nowrap"}}
                                    color={"green"}
                                    onClick={()=>{
                                        window.open(x.url);
                                    }}
                                >{x.key}</a>
                                <span style={{whiteSpace: "nowrap"}}>{x.priority}</span>
                                <span>{x.summary}</span>
                            </Space>

                        </li>
                    ))
                }
            </ol>,
            span: 4
        },
        {
            key: '6',
            label: '遗留问题',
            contentStyle: {padding: 0},
            children: <ol style={{maxHeight: 100, overflow: 'auto'}}>
                {
                    prdInfo?.review_issues.map((x:any, index:number)=>(
                        <li key={index}>
                            <Space align={"baseline"}>
                                <span style={{textDecoration: x.status === 1 ? "line-through": null}}>{x.description}</span>
                            </Space>
                        </li>
                    ))
                }
            </ol>,
            span: 4
        },

    ];
    const handleGetResultColor = (result)=>{
        switch (result){
            case 1:
                return 'green-inverse'
            case 2:
                return '#f50'
            default:
                return 'orange'
        }
    }
    const createChat = async ()=>{
        const res:any = await LlmCreateChatApi({
            project_id: projectId,
        });
        if(res.success){
            setChatId(res.data.id);
            return res.data.id
        }
        return null
    };
    const convertToHtml = (text:any)=>{
        let converter = new showdown.Converter();
        return converter.makeHtml(text)
    };
    const handleGetPrdText = async ()=>{
        const res:any = await getPrdPagesApi({url: prdInfo?.oss_path, file_type: 'pdf'});
        if (res.success){
            setPrdText(res.data);
        }
    }
    const handleGetPrdInfo = async () =>{
        const res:any = await getProductFileDetailApi({
            product_id: params.id
        })
        if(res.success){
            setPrdInfo(res.data);
        }

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
                setAnswer(fullAnswer);
            }
        }catch(error){
            // message.success('停止成功');
            handleDoneStream(chatId, fullAnswer);
        }
        setLoading(false);
    };
    const handleAskQuestionPrePare = async() =>{
        setLoading(true);
        const res:any = await LlmAskApi({
            chat_id: chatId || await createChat(),
            question: '你是资深测试工程师，现在需要对需求进行评审，我将给你以下需求文档，然后基于需求文档回答问题\n' +
                '需求文档如下: \n' + prdText.join('\n') + '\n' +
                '你准备好进行评审了吗？'
        })
        setLoading(false);
        if(res.success){
            setAnswer(res.data);
        }
    };
    const handleAskQuestion = async(question) =>{
        setIsAnswerDone(false);
        setAnswer('');
        handleSteamAsk(question);
    };
    const handleMarkResult = async (info)=>{
        const res:any = await prdReviewMarkResultApi({
            product_id: params.id,
            ...info
        })
        if(res.success){
            message.success('操作成功');
            handleGetPrdInfo();
        }
    };
    const handleEditReviewIssues = async ()=>{
        leftIssuesForm
            .validateFields()
            .then(async (values:any)=>{
                console.log(values);
                const res:any = await prdReviewEditReviewIssuesApi({
                    product_id: params.id,
                    ...values
                })
                if(res.success){
                    message.success('操作成功');
                    handleGetPrdInfo();
                    setLeftIssuesOpen(false);
                }
            })
    };
    useEffect( ()=>{
        handleGetPrdInfo();
    }, [])
    useEffect(()=>{
        prdInfo && setReviewResult(prdInfo.review_info);
        leftIssuesForm.setFieldsValue({
           ...prdInfo
        });
        (prdInfo?.oss_path && prdText.length == 0) && handleGetPrdText();
    }, [prdInfo])
    useEffect(()=>{
        prdText.length > 0 && handleAskQuestionPrePare();
    }, [prdText])

    return (
        <>
            <div className={styles.actionBar}>
                <Space>
                    <Button
                        size={"small"}
                        onClick={() => history.push('/review_prds')}
                    >
                        返回需求列表
                    </Button>
                </Space>
            </div>
            <div className={styles.basicInfo}>
                <Descriptions
                    bordered
                    // title={'基本信息'}
                    items={items}
                    column={4}
                />
            </div>
            <Row>
                <Col span={12} style={{paddingLeft: 10, maxHeight: '50vh', overflow: "auto"}}>
                    <Divider >评审标准</Divider>
                    <div className={styles.standardList}>
                        {
                            reviewResult.map((x:any, index:number)=>(
                                <Tag
                                    style={{cursor: "pointer"}}
                                    bordered={selectStandard?.name == x.name}
                                    key={index}
                                    color={handleGetResultColor(x.review_result)}
                                    onClick={()=>{
                                        setSelectStandard(x);
                                        setIsEditQuestion(false);
                                    }}
                                >{x.name}</Tag>
                            ))
                        }
                    </div>
                    <div className={styles.selectStandard}>
                        {selectStandard ?
                            (isEditQuestion ? (
                                <Input.TextArea
                                    autoSize={{minRows: 3}}
                                    defaultValue={JSON.parse(selectStandard.standard).map((x, index:number)=>{
                                        return `${index + 1}、${x}`
                                    }).join('\n')}
                                    onChange={(e:any)=>setDiyQuestion(e.target.value)}
                                />
                            ): (
                                JSON.parse(selectStandard.standard).map((x, index:number)=>(
                                    <p key={index}>{index + 1}、{x}</p>
                                ))
                            )):
                            '请选择评审标准'
                        }
                    </div>
                    <div className={styles.operationArea}>
                        {selectStandard ?
                            (
                                <Space>
                                    {
                                        isAnswerDone && (
                                            <Button
                                                disabled={!chatId}
                                                type={"primary"}
                                                onClick={()=>handleAskQuestion(isEditQuestion ? diyQuestion : selectStandard.standard)}
                                            >提问</Button>
                                        )
                                    }
                                    {
                                        !isAnswerDone && (
                                            <Button
                                                onClick={()=>{
                                                    controller.abort();
                                                    setIsAnswerDone(true);
                                                }}
                                            >停止</Button>
                                        )
                                    }

                                    <a
                                        onClick={()=>setIsEditQuestion(!isEditQuestion)}
                                    >{isEditQuestion ? '切换标准' : '切换自定义'}</a>
                                    <Divider type={"vertical"} dashed={false}/>
                                    <Button
                                        type={"primary"}
                                        onClick={()=>{
                                            handleMarkResult({
                                                standard_id: selectStandard.id,
                                                result: 1,

                                            })
                                        }}
                                    >通过</Button>
                                    <Button
                                        onClick={()=>{
                                            handleMarkResult({
                                                standard_id: selectStandard.id,
                                                result: 2,

                                            })
                                        }}
                                        type={"primary"}
                                    >失败</Button>
                                    <Divider type={"vertical"} dashed={false}/>
                                    <Button
                                        onClick={()=>setLeftIssuesOpen(true)}
                                    >编辑遗留问题</Button>
                                </Space>
                            ) :
                            null

                        }

                    </div>

                </Col>
                <Col span={12} style={{paddingLeft: 10, maxHeight: '50vh', overflow: "auto"}}>
                    <Divider >AI回答</Divider>
                    <div>
                        <Space align={"baseline"}>
                            <Avatar size={30} style={{backgroundColor: '#f56a00'}}>AI</Avatar>
                            {answer ?
                                (
                                    <div
                                        dangerouslySetInnerHTML={{__html: convertToHtml(answer)}}
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
            <PdfPreview
                url={prdInfo?.oss_path}
                open={pdfViewOpen}
                onClose={()=>setPdfViewOpen(false)}
            />
            <Modal
                title={'编辑遗留问题'}
                width={700}
                open={leftIssuesOpen}
                onOk={handleEditReviewIssues}
                onCancel={()=>setLeftIssuesOpen(false)}
                okText={'编辑'}
                cancelText={'取消'}
            >
                <Form
                    form={leftIssuesForm}
                    layout={"vertical"}
                >
                    <Form.List name="review_issues">
                        {(fields, { add, remove }) => {
                            return (
                                <>
                                    {fields.map((field, index) => (
                                        <Space key={field.key} align={index === 0 ? 'center' :'start'}>
                                            <Form.Item
                                                name={[field.name, 'description']}
                                                label={index === 0 ? <b>问题描述</b> : null}
                                                style={{marginBottom:10}}
                                                rules={[{ required: true, message: '请输入问题'}]}
                                            >
                                                <Input.TextArea
                                                    placeholder={'请输入问题'}
                                                    style={{width:500}}
                                                    autoSize={true}
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                name={[field.name, 'status']}
                                                label={index === 0 ? <b>是否已解决</b>: null}
                                                style={{marginBottom:10}}
                                                initialValue={0}
                                            >
                                                <Select
                                                    style={{width: 100}}
                                                    options={[
                                                        {label: '否', value: 0},
                                                        {label: '是', value: 1}
                                                    ]}
                                                />
                                            </Form.Item>
                                            <PlusCircleOutlined
                                                onClick={()=>add('', index)}
                                            />
                                            <MinusCircleOutlined
                                                onClick={() => remove(field.name)}
                                            />
                                        </Space>
                                    ))}
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        添加问题
                                    </Button>
                                </>
                            );
                        }}
                    </Form.List>
                </Form>
            </Modal>
            <ChatBodyDrawer
                open={chatDrawerOpen}
                onClose={()=>setChatDrawerOpen(false)}
                chat_id={chatId}
                onSaveData={()=>{}}
            />
            <ChatFloatIcon
                spin
                style={{ width: 40, height: 40}}
                onClick={()=>setChatDrawerOpen(true)}
            />
        </>
    )
}
import React, {FunctionComponent, useState, useEffect} from "react";
import {
    Modal,
    Select,
    Divider,
    Button,
    Space,
    Table,
    Tag,
    TreeSelect, Input, Spin, Form, message, Row, Col, Tabs, Avatar
} from 'antd';
import {
    MinusCircleOutlined,
    PlusOutlined
} from '@ant-design/icons';
import {sprintGetApi} from '@/apis/sprint';
import {LlmCreateChatApi, LlmExtractJsonApi, LlmSaveChatDetailApi} from '@/apis/llm';
import {history} from "umi";
import {basicWikiPagesGetApi, projectsApi} from '@/apis/basic';
import {
    generateCasesApi,
    generateCasesByTitleApi,
    optimiseCasesApi,
    saveCaseApi,
    saveOptimisedCaseApi
} from "@/apis/cases";
import {PromptGetApi} from '@/apis/prompt';
import {basicWikiSpaceGetApi} from "@/apis/basic";
import showdown from "showdown";
import {getProductFilesApi} from "@/apis/prds";
import {ParseDeltaStr} from "@/utils/utils";

export const SelectSprint:FunctionComponent = (props: any) =>{
    const {project_id} = props;
    const [sprintOption, setSprintOption] = useState([]);
    const getSprint = async ()=>{
        const res:any = await sprintGetApi({
            project_id: project_id
        })
        if(res.success){
            setSprintOption(res.data.map((x:any)=>({label: x.name, value: x.id})));
        }
    }
    useEffect(()=>{
        getSprint();
    }, [project_id]);
    return (
        <Select
            {...props}
            options={sprintOption}
            showSearch
            allowClear
            filterOption={(input:string, option?:{ label: string; value: string })=> {
                return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
            }}
            dropdownRender={(menu)=>{
                return (
                    <>
                        {menu}
                        <Divider style={{ margin: '8px 0' }} />
                        <Button type={"link"} size={"small"} onClick={()=>history.push('/sprint_management')}>管理迭代</Button>
                    </>
                )
            }}
        />

    )
}

export const SelectProject:FunctionComponent = (props: any) =>{
    const {project_id} = props;
    const [projects, setProjects] = useState([]);
    const getProjects = async ()=>{
        const res:any = await projectsApi();
        if(res.success){
            setProjects(res.data.map((x:any)=>{
                return {value: x.id, label: x.name}
            }));
        }
    };
    useEffect(()=>{
        getProjects();
    }, []);
    return (
        <Select
            placeholder={'选择项目'}
            options={projects}
            {...props}
        />
    )
};

export const GenCase:FunctionComponent = (props: any) =>{
    const {open, searchParams, onCancel, onGenerateCase} = props;
    const [loading, setLoading] = useState(false);
    const [loadingPrds, setLoadingPrds] = useState(false);
    const [promptOption, setPromptOption] = useState([]);
    const [prdOption, setPrdOption] = useState([]);
    const [genType, setGenType] = useState('1');
    const [isManual, setIsManual] = useState(false);
    const [form] = Form.useForm();
    const [form1] = Form.useForm();
    const items = [
        {
            key: '1',
            label: '简单模式',
            children:<Form
                form={form}
                labelCol={{span: 2}}
            >
                <Form.Item
                    label={'prompt'}
                    name={'prompt_id'}
                    rules={[{required: true}]}
                >
                    <Select
                        style={{width: 200}}
                        options={promptOption}
                    />
                </Form.Item>
                <Form.Item
                    label="需求"
                    name={"prd_content"}
                    rules={[{ required: true }]}
                >
                    <Input.TextArea
                        style={{width:700}}
                        maxLength={5000}
                        showCount={true}
                        autoSize={{minRows:3, maxRows:20}}
                    />
                </Form.Item>
            </Form>

        },
        {
            key: '2',
            label: '精准模式',
            children: <Form form={form1}
                            labelCol={{span: 2}}
            >
                <Form.Item
                    label={'prompt'}
                    name={'prompt_id'}
                    rules={[{required: true}]}
                >
                    <Select
                        style={{width: 200}}
                        options={promptOption}
                    />
                </Form.Item>
                <Form.Item
                    label={'需求'}
                >
                    <Space>
                        {
                            isManual ?
                                (
                                    <Form.Item
                                        name={'prd_content'}
                                        rules={[{required: true}]}
                                        noStyle
                                    >
                                        <Input.TextArea
                                            style={{width: 530}}
                                            autoSize={{minRows:3, maxRows:10}}
                                        />
                                    </Form.Item>
                                )
                            :
                                (
                                    <Form.Item
                                        name={'prd_url'}
                                        rules={[{required: true}]}
                                        noStyle
                                    >
                                        <Select
                                            style={{width: 200}}
                                            options={prdOption}
                                            onDropdownVisibleChange={(visible)=>{
                                                visible && handleGetPrds()
                                            }}
                                            notFoundContent={loadingPrds ? <Spin size="small" /> : undefined}
                                        />
                                    </Form.Item>
                                )
                        }
                        <a onClick={()=>setIsManual(!isManual)}>{isManual ? '一键选择' : '手动输入'}</a>
                    </Space>


                </Form.Item>
                <Form.List
                    name="titles"
                >
                    {(fields, { add, remove }) => {
                        return (
                            <>
                                {fields.map((field, index) => (
                                    <Form.Item
                                        key={field.key}
                                        required={false}
                                        wrapperCol={{offset: index == 0 ? null : 2 }}
                                        // name={[field.name, 'title']}
                                        label={index === 0 ? '用例标题' : null}
                                    >
                                        <Form.Item
                                            {...field}
                                            noStyle
                                            rules={[{ required: true}]}
                                        >
                                            <Input.TextArea
                                                placeholder={'请输入用例标题或删除此行'}
                                                style={{width:500}}
                                                autoSize={{maxRows: 3}}
                                            />
                                        </Form.Item>
                                        {fields.length > 1 && (
                                            <MinusCircleOutlined
                                                style={{marginLeft: 10}}
                                                onClick={() => remove(field.name)}
                                            />
                                        )}
                                    </Form.Item>

                                ))}
                                <Button
                                    style={{width: 600}}
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    添加用例
                                </Button>
                            </>
                        );
                    }}
                </Form.List>
            </Form>
        }
    ]
    const createChat = async ()=>{
        const res:any = await LlmCreateChatApi({
            project_id: searchParams.project_id,
            ...form.getFieldsValue()
        });
        if(res.success){
            return res.data.id
        }
        return null
    };
    const handleValidateCaseFormate = (cases)=>{        // 验证是否为用例

        if (!cases[0]?.priority ||
            !cases[0]?.description[0]?.steps ||
            !(cases[0]?.title || cases[0]?.name)
        ){
            message.error('该数据不符合测试用例格式,请让AI修正或者重试')
            return false
        }
        return true
    };
    const handleGenCaseNormal = async ()=>{
        form
            .validateFields()
            .then(async (values) => {
                setLoading(true);
                const chat_id = await createChat();
                const res:any = await generateCasesApi({
                    ...values,
                    ...searchParams,
                    chat_id: chat_id
                });
                if(res.success){
                    const analysis_res:any = await LlmExtractJsonApi({
                        answer: res.data,
                    })
                    if (analysis_res.success){
                        handleValidateCaseFormate(analysis_res.data) &&
                        onGenerateCase({
                            cases: analysis_res.data,
                            chat_id: chat_id
                        });
                    }
                }
                setLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });
    };
    const handleGenCaseByTitle = async ()=>{
        form1
            .validateFields()
            .then(async (values) => {
                // console.log(values);
                // return
                setLoading(true);
                const chat_id = await createChat();
                const res:any = await generateCasesByTitleApi({
                    ...values,
                    ...searchParams,
                    chat_id: chat_id
                });
                if(res.success){
                    const analysis_res:any = await LlmExtractJsonApi({
                        answer: res.data,
                    })
                    if (analysis_res.success){
                        handleValidateCaseFormate(analysis_res.data) &&
                        onGenerateCase({
                            cases: analysis_res.data,
                            chat_id: chat_id
                        });
                    }
                }
                setLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });
    };
    const handleSubmitForm = ()=>{
        genType === '1' && handleGenCaseNormal();
        genType === '2' && handleGenCaseByTitle();


    };
    const handleGetPrompt = async ()=>{
        const res:any = await PromptGetApi({
            project_id: searchParams.project_id,
            role: 1
        })
        if(res.success){
            setPromptOption(res.data.map((x:any)=>({label: x.name, value: x.id})));
        }
    };
    const handleGetPrds = async ()=>{
        setLoadingPrds(true);
        const res: any = await getProductFilesApi({
            ...searchParams,
        });
        setLoadingPrds(false);
        if (res.success) {
            setPrdOption(res.data.filter(x=>x.oss_path).map(x=>({value: x.oss_path, label: x.file_name})));
        }

    };

    useEffect(()=>{
        form1.setFieldsValue({
            ...form1.getFieldsValue(),
            titles: ['']
        })
    }, []);

    useEffect(()=>{
        handleGetPrompt();
    }, [searchParams]);

    useEffect(()=>{
        form.setFieldsValue({
            ...form.getFieldsValue(),
            prompt_id: promptOption[0]?.value
        });
        form1.setFieldsValue({
            ...form1.getFieldsValue(),
            prompt_id: promptOption[0]?.value
        });
    }, [promptOption])
    return (
      <Modal
          open={open}
          okText={'生成'}
          cancelText={'取消'}
          onOk={handleSubmitForm}
          onCancel={onCancel}
          confirmLoading={loading}
          width={1000}
          title={'生成测试用例'}
      >
          <Spin spinning={loading}>
              <Tabs
                  defaultActiveKey={"1"}
                  tabPosition={"left"}
                  items={items}
                  onChange={(value)=>setGenType(value)}
              >

              </Tabs>
          </Spin>
      </Modal>
  )
};

export const OptimiseCase:FunctionComponent = (props: any) =>{
    const {open, cases, searchParams, onCancel, onOptimiseCase} = props;
    const [promptOption, setPromptOption] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const createChat = async ()=>{
        const res:any = await LlmCreateChatApi({
            project_id: searchParams.project_id,
            ...form.getFieldsValue()
        });
        if(res.success){
            return res.data.id
        }
        return null
    };
    const handleSubmitForm = ()=>{
        form
            .validateFields()
            .then(async (values) => {
                setLoading(true);
                const chat_id = await createChat();
                const res:any = await optimiseCasesApi({
                    ...values,
                    cases:cases,
                    ...searchParams,
                    chat_id: chat_id
                });
                if(res.success){
                    const analysis_res:any = await LlmExtractJsonApi({
                        answer: res.data,
                    })
                    if (analysis_res.success){
                        onOptimiseCase(analysis_res.data, chat_id);
                    }
                }
                setLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });

    };
    const handleGetPrompt = async ()=>{
        const res:any = await PromptGetApi({
            project_id: searchParams.project_id,
            role: 4
        })
        if(res.success){
            setPromptOption(res.data.map((x:any)=>({label: x.name, value: x.id})));
        }
    };

    useEffect(()=>{
        handleGetPrompt();
    }, [searchParams])
    useEffect(()=>{
        promptOption.length > 0 && form.setFieldsValue({
            ...form.getFieldsValue(),
            prompt_id: promptOption[0].value
        });
    }, [promptOption])
    return (
        <Modal
            open={open}
            okText={'优化'}
            cancelText={'取消'}
            onOk={handleSubmitForm}
            onCancel={onCancel}
            confirmLoading={loading}
            width={1000}
            title={`正在优化${cases.length || 0 }条测试用例`}
        >
            <Spin spinning={loading}>
                <Form
                    form={form}
                    // labelCol={{span: 2}}
                >
                    <Form.Item
                        label={'prompt'}
                        name={'prompt_id'}
                        rules={[{required: true}]}
                    >
                        <Select
                            style={{width: 200}}
                            options={promptOption}
                        />
                    </Form.Item>
                    <Form.Item
                        label="要求"
                        name={"demand"}
                        rules={[{ required: true }]}
                        style={{marginBottom: 0}}
                    >
                        <Input.TextArea
                            style={{width:800}}
                            maxLength={5000}
                            showCount={true}
                            autoSize={{minRows:3, maxRows:20}}
                        />
                    </Form.Item>
                    <Row>
                        <Col span={2}></Col>
                        <Col>
                            <Space>
                                <a onClick={()=>{
                                    form.setFieldsValue({
                                        ...form.getFieldsValue(),
                                        demand: '依照以下规范优化用例:\n' + '用例标题：标题为 功能模块+动作行为，简洁明了地描述测试用例的核心内容，以便快速了解测试目的。\n' +
                                            '用例步骤：为了让不懂业务的人也能轻易执行该用例，每个测试步骤只对应页面的一个操作，所有的测试步骤必须包含页面的打开，操作的执行等操作。\n' +
                                            '预期结果：与用例步骤一一对应，明确描述每个测试步骤的预期结果，以便与实际结果进行比较。'
                                    });
                                }}>用例规范</a>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Spin>
        </Modal>
    )
}

export const GenCasePreview:FunctionComponent = (props: any) =>{
    const {searchParams, caseData, nodesData, onSaveCase, onOpenChat} = props;
    const [dataSource, setDataSource] = useState([]);
    const [selectedNode, setSelectedNode] = useState(0);
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
                            return <Tag>{text}</Tag>
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
                project_id: searchParams.project_id,
                sprint_id: searchParams.sprint_id,
                node_id: selectedNode
            });
        }
        else{
            res = await saveCaseApi({
                cases: dataSource,
                project_id: searchParams.project_id,
                sprint_id: searchParams.sprint_id,
                node_id: selectedNode
            });
        }

        if (res.success){
            message.success('保存用例成功');
            onSaveCase()
        }
    };
    useEffect(()=>{
        caseData[0]?.id ? setIsOptimise(true) : setIsOptimise(false);
        setDataSource(caseData);
        setSelectedNode(searchParams?.node_id || 0);
    }, [caseData, searchParams]);
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
                    <Button
                        type={"link"}
                        onClick={onOpenChat}
                    >不满意？点我找AI优化</Button>
                    <TreeSelect
                        placeholder={'请选择保存模块'}
                        style={{width:200, marginRight:10}}
                        value={selectedNode}
                        treeData={nodesData}
                        treeDefaultExpandAll
                        onChange={(value)=>{
                            // console.log(value);
                            setSelectedNode(value);
                        }}
                    />
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

export const AskAnswerModal:FunctionComponent = (props: any) =>{
    const {open, searchParams, sourcePage, pages, onCancel, onOpenChat} = props;
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [form] = Form.useForm();
    const convertToHtml = (text: any) => {
        let converter = new showdown.Converter();
        return converter.makeHtml(text)
    };
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
    const handleDoneStream = async (chatId, answer)=>{
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
    };
    const handleSteamAsk = async (question:string)=>{
        setLoading(true);
        const chatId = await createChat();
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
    const handleAsk = async () => {
        const question = '现有以下文档,请根据文档问答问题： \n' +
            pages + '\n' +
            '问题如下: \n' +
            form.getFieldsValue()?.question;
        if(!question){
            message.error('请输入问题');
            return
        }
        handleSteamAsk(question);
    };
    return (
        <Modal
            open={open}
            width={1000}
            title={'文档问答'}
            okText={'提问'}
            cancelText={'取消'}
            onOk={handleAsk}
            onCancel={onCancel}
            confirmLoading={loading}
            footer={(_, { OkBtn, CancelBtn})=>(
                <>
                    <Button
                        disabled={!chatId}
                        type={"link"}
                        onClick={()=>onOpenChat(chatId)}
                    >不满意？点我进入聊天模式</Button>
                    <CancelBtn />
                    <OkBtn />

                </>

            )}
        >
            <Form
                disabled={loading}
                labelCol={{span: 2}}
                form={form}
            >
                <Form.Item
                    name={'question'}
                    label={'问题'}
                    style={{marginBottom: 0}}
                    rules={[{required: true}]}
                >
                    <Input.TextArea
                        style={{width: 600}}
                        allowClear
                        autoSize={{minRows:3, maxRows:10}}
                    />
                </Form.Item>
                <Row>
                    <Col span={2}></Col>
                    <Col>
                        <Space size={"large"}>
                            {sourcePage == 'prd' &&
                            <>
                                <a onClick={()=>form.setFieldsValue({
                                    ...form.getFieldsValue(),
                                    question: "以以下格式总结需求：\n" +
                                        "1、需求1\n" +
                                        " -改动1\n" +
                                        " -改动2\n" +
                                        "\n" +
                                        "2、需求2\n" +
                                        " -改动1\n" +
                                        " -改动2"
                                })}>总结需求</a>
                            </>
                            }
                            {sourcePage == 'plan' &&
                            <>
                                <a onClick={()=>form.setFieldsValue({
                                        ...form.getFieldsValue(),
                                        question:  "1、该测试计划是针对哪一个版本的测试？\n" +
                                            "2、该计划中是否附加了需求原型文档？\n" +
                                            "3、该计划中由几位测试人员，他们的分工的内容是什么？\n" +
                                            "4、该计划的测试策略内容是什么并给出原文内容。\n" +
                                            "5、该计划是否涉及性能测试？\n" +
                                            "6、分别指出以下测试的时间段，并分别计算工时(一个工作日算8个工时，周末和节假日不计算工时)\n" +
                                            "   1)测试用例编写\n" +
                                            "   2)冒烟测试\n" +
                                            "   3)系统测试\n" +
                                            "   4)回归测试\n" +
                                            "7、该计划中是否有明显的不合理的错误？"
                                    }
                                )}>总结计划</a>
                            </>
                            }
                        </Space>
                    </Col>
                </Row>
            </Form>
            <Divider>AI回答</Divider>
            <div style={{maxHeight: 300, overflow: "auto"}}>
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
                            dangerouslySetInnerHTML={{__html: convertToHtml('请输入问题...')}}
                        />
                    }
                </Space>
            </div>

        </Modal>
    )
}

export const SelectWikiSpace:FunctionComponent = (props: any) =>{
    const [spaceOption, setSpaceOption] = useState([]);
    const handleGetWikiSpaces = async ()=>{
        const res:any = await basicWikiSpaceGetApi();
        if(res.success){
            setSpaceOption(res.data.map((x:any)=>({label: x.name, value: x.key})));
        }
    };
    useEffect(()=>{
        handleGetWikiSpaces();
    }, []);
    return (
        <Select
            {...props}
            options={spaceOption}
            showSearch
            filterOption={(input:string, option?:{ label: string; value: string })=> {
                return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
            }}
        />

    )
}

export const SelectWikiPage:FunctionComponent = (props: any) =>{
    const {spaceKey} = props;
    const [pageOption, setPageOption] = useState([]);
    // const [parentPageId, setParentPageId] = useState(null);
    const handleGetWikiPages = async ()=>{
        const res:any = await basicWikiPagesGetApi({
            space_key: spaceKey,
        });
        if(res.success){
            setPageOption(res.data);
        }
    };
    const handleUpdateWikiPages = async (parent_page_id:any)=>{
        const res:any = await basicWikiPagesGetApi({
            parent_page_id: parent_page_id
        });
        if(res.success){
            setPageOption(pageOption.concat(res.data));
        }
    };
    useEffect(()=>{
        handleGetWikiPages();
    }, [spaceKey]);

    return (
        <TreeSelect
            {...props}
            treeDataSimpleMode
            treeData={pageOption}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            loadData={(record:any)=>{
                return handleUpdateWikiPages(record.id);
            }}
            // showSearch
            // filterOption={(input:string, option?:{ label: string; value: string })=> {
            //     return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
            // }}
        />

    )
}
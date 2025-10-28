import React, {useState, useEffect} from "react";
import {history} from 'umi';
import locale from "antd/es/time-picker/locale/zh_CN";
import showdown from "showdown";
import {
    Form,
    Divider, Radio, Row, Col, Button, Input, message, Space, Select, Switch, DatePicker, Spin, InputNumber
} from 'antd';
import {SelectWikiPage, SelectWikiSpace} from "@/components/myAntd";
import {basicAskAnswerApi, basicUploadWikiApi,developersApi,} from "@/apis/basic";
import {MinusCircleOutlined, PlusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import {genBusinessBackgroundByStory, genTestExecutePlanHtml, genTestResrouceHtml, genTestScopeHtml} from "@/apis/plan";
import {LlmCreateChatApi, LlmExtractJsonApi} from "@/apis/llm";

export const BusinessBackground = (props) =>{  // 测试依据
    const {projectId, prdText, html, isEdit, prdInfo, onGenerate} = props;
    const [loading, setLoading] = useState(false);
    const base = '<h1>1、业务背景、业务含义的简介 *</h1> \n';
    const createChat = async () => {
        const res: any = await LlmCreateChatApi({
            project_id: projectId,
        });
        if (res.success) {
            return res.data.id
        }
        return null
    };
    const handleOnAsk = async (info) =>{
        message.info('AI响应中，请稍等');
        setLoading(true);
        const res:any = await basicAskAnswerApi({
            pages: prdText,
            chat_id: await createChat(),
            ...info
        });
        setLoading(false);
        if (res.success){
            return res.data
        }
        return 'AI功能异常'
    };
    const convertToHtml = (text: any) => {
        let converter = new showdown.Converter();
        return converter.makeHtml(text)
    };
    const genBusinessBackGroundByStory = async ()=>{
        const res:any = await genBusinessBackgroundByStory({
            story: prdInfo?.story
        })
        if(res.success){
            onGenerate(base + res.data);
        }
    };
    useEffect(()=>{
        onGenerate(base + '<p>暂无</p>');
    }, [])
    return (
        <>
            <Row>
                <Col span={10}>
                    <Divider>生成方式</Divider>
                    <Space>
                        <Button
                            disabled={loading}
                            // type={"primary"}
                            onClick={async ()=>{
                                genBusinessBackGroundByStory()
                            }}

                        >
                            以用户故事生成
                        </Button>
                        <Button
                            disabled={loading || !prdText || prdText.length == 0}
                            // type={"primary"}
                            onClick={async ()=>{
                                onGenerate( '<h1>1、业务背景、业务含义的简介 *</h1> \n' + convertToHtml(await handleOnAsk({
                                    question: '提取需求文档中的业务背景'
                                })))
                            }}
                        >
                            需求文档中提取(AI)
                        </Button>
                    </Space>
                </Col>
                <Col span={14}>
                    <Divider>预览</Divider>
                    <Spin spinning={loading}>
                        {isEdit ?
                            (
                                <Input.TextArea
                                    autoSize={{minRows:3, maxRows: 20}}
                                    value={html}
                                    onChange={(e)=>onGenerate(e.target.value)}
                                />
                            ):
                            (
                                <div
                                    dangerouslySetInnerHTML={{__html: html}}
                                />
                            )}
                    </Spin>
                </Col>
            </Row>
        </>
    )
};

export const TestBasis = (props) =>{  // 测试依据
    const {html, isEdit, name, initSpace, onGenerate} = props;
    const [form]= Form.useForm();
    const spaceKey = Form.useWatch('space', form);
    const type = Form.useWatch('type', form);
    const base = '<h1>2、测试依据</h1> \n';
    useEffect(()=>{
        onGenerate(base);
    }, [])
    return (
        <>
            <Row>
                <Col span={10}>
                    <Divider>生成方式</Divider>
                    <Form
                        form={form}
                        labelCol={{span: 4}}
                    >
                        <Form.Item
                            label={'类型'}
                            name={'type'}
                            rules={[{ required: true }]}
                            initialValue={1}
                        >
                            <Radio.Group>
                                <Radio value={1}>wiki文档</Radio>
                                <Radio value={2}>其它文档</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            hidden={type != 1}
                            label={'空间'}
                            name={'space'}
                            rules={[{ required: true }]}
                            initialValue={initSpace}
                        >
                            <SelectWikiSpace
                                style={{width: 300}}
                            />
                        </Form.Item>
                        <Form.Item
                            hidden={type != 1}
                            label={'页面'}
                            name={'page'}
                            rules={[{ required: true }]}
                        >
                            <SelectWikiPage
                                onSelect={(value, node, extra)=>{
                                    onGenerate(base + `<p><a href="${node.url}">${name}</a></p>`);
                                }}
                                style={{width: 300}}
                                spaceKey={spaceKey}
                            />
                        </Form.Item>
                        <Form.Item
                            hidden={type != 2}
                            label={'url'}
                            name={'url'}
                        >
                            <Input
                                style={{width: 300}}
                                placeholder={'请输入产品文档url,例如 https://xxxxx.com'}
                                onChange={(e)=>{
                                    onGenerate(base + `<p><a href="${e.target.value}">${name}</a></p>`)
                                }}
                            />
                        </Form.Item>
                    </Form>
                </Col>
                <Col span={14}>
                    <Divider>预览</Divider>
                    {isEdit ?
                        (
                            <Input.TextArea
                                autoSize={{minRows:3, maxRows: 20}}
                                value={html}
                                onChange={(e)=>onGenerate(e.target.value)}
                            />
                        ):
                        (
                            <div
                                dangerouslySetInnerHTML={{__html: html}}
                            />
                        )}
                </Col>
            </Row>

        </>
    )
};

export const BusinessRisk = (props) =>{  // 测试依据
    const {html, isEdit, name, initSpace, onGenerate} = props;
    const [form] = Form.useForm();
    const base = '<h1>3、业务风险分析和约束 *</h1> \n';
    const handleGenHtml = (risks)=>{

        if(risks.length == 0){
            onGenerate(base + '<p>暂无</p>')
            return
        }
        let html = '';
        risks.map((risk, index:number)=>{
            const title = risk?.title || '';
            const measure = risk?.measure || '暂无'
            html  = html + `<p>${index + 1}、<b>风险描述：</b>${title}</p> \n` + '<b>应对措施:</b>' + measure + '\n'
        })
        onGenerate(base + html);
    }
    useEffect(()=>{
        onGenerate(base + '<p>暂无</p> \n');
    }, [])
    return (
        <>
            <Row>
                <Col span={12} style={{paddingRight: 20}}>
                    <Divider>生成方式</Divider>
                    <Form
                        form={form}
                        // labelCol={{span: 4}}
                        layout={"vertical"}
                        onValuesChange={(changedValues, allValues)=>{
                            handleGenHtml(allValues.risks)
                        }}
                    >
                        <Form.List name="risks">
                            {(fields, { add, remove }) => {
                                return (
                                    <>
                                        {fields.map((field, index) => (
                                            <Space key={field.key} align={index === 0 ? 'center' :'start'}>
                                                <Form.Item
                                                    name={[field.name, 'title']}
                                                    label={index === 0 ? <b>风险描述</b> : null}
                                                    style={{marginBottom:10}}
                                                    rules={[{ required: true}]}
                                                >
                                                    <Input.TextArea
                                                        placeholder={'请输入风险描述'}
                                                        style={{width:250}}
                                                        autoSize={true}
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'measure']}
                                                    label={index === 0 ? <b>应对措施</b>: null}
                                                    style={{marginBottom:10}}
                                                >
                                                    <Input.TextArea
                                                        placeholder={'请输入风险描述'}
                                                        style={{width:250}}
                                                        autoSize={true}
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
                                            添加风险
                                        </Button>
                                    </>
                                );
                            }}
                        </Form.List>

                    </Form>
                </Col>
                <Col span={12}>
                    <Divider>预览</Divider>
                    {isEdit ?
                        (
                            <Input.TextArea
                                autoSize={{minRows:3, maxRows: 20}}
                                value={html}
                                onChange={(e)=>onGenerate(e.target.value)}
                            />
                        ):
                        (
                            <div
                                dangerouslySetInnerHTML={{__html: html}}
                            />
                        )}
                </Col>
            </Row>

        </>
    )
};

export const TestResource = (props) =>{  // 测试环境
    const {html, isEdit, onGenerate, projectDetail} = props;
    const [developers, setDevelopers] = useState([]);
    const [form]= Form.useForm();
    const base = '<h1>4、测试资源</h1> \n';
    const handleGenHtml = async ()=>{
        const res:any = await genTestResrouceHtml({
            ...form.getFieldsValue()
        })
        if(res.success){
            onGenerate(base + res.data)
        }
    };
    const handleGetTesters = async()=>{
        const res:any = await developersApi({
            role: 2
        })
        if(res.success){
            setDevelopers(res.data);
        }
    }
    useEffect(()=>{
        handleGenHtml();
        handleGetTesters();
    }, [])
    return (
        <>
            <Row>
                <Col span={10}>
                    <Divider>生成方式</Divider>
                    <Form
                        form={form}
                        labelCol={{span: 4}}
                    >
                        <Form.Item
                            label={'环境'}
                            name={'env'}
                            initialValue={['sit', 'uat', 'prod']}
                        >
                            <Select
                                mode={"multiple"}
                                style={{width: 250}}
                                options={[
                                    {label: 'dev', value: 'dev'},
                                    {label: 'sit', value: 'sit'},
                                    {label: 'uat', value: 'uat'},
                                    {label: 'prod', value: 'prod'},
                                ]}
                                onChange={handleGenHtml}
                            />
                        </Form.Item>
                        <Form.Item
                            label={'测试人员'}
                            name={'tester'}
                            initialValue={projectDetail?.tester?.map(x=>{
                                return x.name
                            })}
                        >
                            <Select
                                mode={"multiple"}
                                style={{width: 250}}
                                onChange={handleGenHtml}
                                options={developers}
                                fieldNames={{label: 'name', value: 'name'}}

                            />
                        </Form.Item>
                        <Form.Item
                            label={'测试工具'}
                            name={'tool'}
                            initialValue={'Postman、 MeterSphere'}
                        >
                            <Input
                                style={{width: 250}}
                                onBlur={handleGenHtml}
                            />
                        </Form.Item>
                    </Form>
                </Col>
                <Col span={14}>
                    <Divider>预览</Divider>
                    {isEdit ?
                        (
                            <Input.TextArea
                                autoSize={{minRows:3, maxRows: 20}}
                                value={html}
                                onChange={(e)=>onGenerate(e.target.value)}
                            />
                        ):
                        (
                            <div
                                dangerouslySetInnerHTML={{__html: html}}
                            />
                        )}
                </Col>
            </Row>

        </>
    )
};

export const TestScope = (props) =>{   // 测试风险
    const {projectId, prdText, html, isEdit, onGenerate} = props;
    const [chatId, setChatId] = useState(null);
    const [isManual, setIsManual] = useState(false);
    const [manualJson, setManualJson] = useState('[\n' +
        '    {\n' +
        '        "需求": "需求1",\n' +
        '        "模块": "模块1",\n' +
        '        "测试范围": [\n' +
        '            "验证xxxx",\n' +
        '            "验证xxxx",\n' +
        '            "验证xxxx"\n' +
        '        ]\n' +
        '    }\n' +
        ']');
    const [loading, setLoading] = useState(false);
    const base = '<h1>5、测试范围、工时评估和任务分配 *</h1> \n';
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
    const handleOnAsk = async (info) =>{
        message.info('AI响应中，请稍等');
        setLoading(true);
        const res:any = await basicAskAnswerApi({
            pages: prdText,
            chat_id: await createChat(),
            ...info
        });
        setLoading(false);
        if (res.success){
            handleExtractJson(res.data);
        }
    };
    const handleExtractJson = async (answer:string)=>{
        const res:any = await LlmExtractJsonApi({
            answer: answer
        })
        if(res.success){
            setManualJson(JSON.stringify(res.data, null, 4));
            handleGenHtml({
                scope_json: res.data
            })
        }
    };
    const handleGenHtml = async (info)=>{
        const res:any = await genTestScopeHtml(info);
        if(res.success){
            message.success('生成成功');
            onGenerate(base + res.data);
        }
    };
    useEffect(()=>{
        onGenerate(base);
    }, [])
    return (
        <>
            <Row>
                <Col span={10} style={{paddingRight: 20}}>
                    <Divider>生成方式</Divider>

                    {isManual && (
                        <div style={{marginBottom: 20}}>
                            <Input.TextArea
                                allowClear
                                disabled={loading}
                                autoSize={{minRows: 15, maxRows: 15}}
                                value={manualJson}
                                onChange={(e)=>setManualJson(e.target.value)}
                            />
                        </div>
                    )}
                    <Space>
                        <Button
                            disabled={loading}
                            type="primary"
                            onClick={()=>handleOnAsk({
                                question: '以上内容是需求文档，根据需求文档按照拆分为不同的需求，然后按照以下json模板填写数据：\n' +
                                    '[\n' +
                                    '    {\n' +
                                    '        "需求": "你生成的需求",\n' +
                                    '        "模块": "你生成的模块",\n' +
                                    '        "测试范围": [\n' +
                                    '            "验证xxxx",\n' +
                                    '            "验证yyyy",\n' +
                                    '            "验证zzzz"\n' +
                                    '        ]\n' +
                                    '    },\n' +
                                    '    {\n' +
                                    '        "需求": "",\n' +
                                    '        "模块": "",\n' +
                                    '        "测试范围": [\n' +
                                    '            "验证xxxx",\n' +
                                    '            "验证yyyy",\n' +
                                    '            "验证zzzz"\n' +
                                    '        ]\n' +
                                    '    }\n' +
                                    '] \n' +
                                    '请严格以提供的json模板为格式生成测试范围数据并返回'
                            })}
                        >
                            {chatId ? 'AI重新生成': 'AI生成'}
                        </Button>
                        {isManual && (
                            <Button
                                disabled={loading}
                                onClick={()=>{
                                    handleExtractJson(manualJson)
                            }}>人工生成</Button>
                        )}
                        <Button onClick={()=>setIsManual(!isManual)}>{isManual ? '取消': '手动输入json'}</Button>
                    </Space>

                </Col>
                <Col span={14}>
                    <Divider>预览</Divider>
                    <Spin spinning={loading}>
                        {isEdit ?
                            (
                                <Input.TextArea
                                    autoSize={{minRows:3, maxRows: 20}}
                                    value={html}
                                    onChange={(e)=>onGenerate(e.target.value)}
                                />
                            ):
                            (
                                <div
                                    dangerouslySetInnerHTML={{__html: html}}
                                />
                            )}
                    </Spin>
                </Col>
            </Row>

        </>
    )
};

export const TestStrategy = (props) =>{   // 测试策略
    const {html, isEdit, onGenerate} = props;
    const [form] = Form.useForm();
    const base = '<h1>6、测试策略</h1> \n';
    const initFormValue = {
        strategy: [
            {testType: '功能测试', active: true, description: '1、开发自测\n2、测试冒烟\n3、第一轮系统测试\n4、第二轮系统测试 \n5、回归测试'},
            {testType: '国际化测试', active: false},
            {testType: '性能测试', active: false},
            {testType: '安全测试', active: false},
            {testType: '兼容性测试', active: false},
        ]
    }
    const handleGenHtml = (values)=>{
        // console.log(values);
        let html = '';
        values.forEach((value, index, arr)=>{
            html = html + `<b>${value.testType}</b>\n <p>${value.active ? (value.description || '暂无') : '不涉及'}</p> `
        })
        onGenerate(base + html);
    }

    useEffect(()=>{
        form.setFieldsValue(initFormValue);
        handleGenHtml(initFormValue.strategy);
    }, [])
    return (
        <>
            <Row>
                <Col span={12} style={{paddingRight: 20}}>
                    <Divider>生成方式</Divider>
                    <Form
                        form={form}
                        layout={"vertical"}
                        onValuesChange={(changedValues, allValues)=>{
                            handleGenHtml(allValues.strategy)
                        }}

                    >
                        <Form.List name="strategy">
                            {(fields, { add, remove }) => {
                                return (
                                    <>
                                        {fields.map((field, index) => (
                                            <Space key={field.key} align={'start'}>
                                                <Form.Item
                                                    name={[field.name, 'testType']}
                                                    label={index === 0 ? <b>测试类型</b> : null}
                                                    style={{marginBottom:10}}
                                                    rules={[{ required: true}]}
                                                >
                                                    <Input
                                                        readOnly
                                                        style={{width:250}}
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'active']}
                                                    label={index === 0 ? <b>涉及</b>: null}
                                                    style={{marginBottom:10}}
                                                >
                                                    <Switch
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'description']}
                                                    label={index === 0 ? <b>策略</b>: null}
                                                    style={{marginBottom:10}}
                                                >
                                                    <Input.TextArea
                                                        style={{width:250}}
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

                </Col>
                <Col span={12}>
                    <Divider>预览</Divider>
                    {isEdit ?
                        (
                            <Input.TextArea
                                autoSize={{minRows:3, maxRows: 20}}
                                value={html}
                                onChange={(e)=>onGenerate(e.target.value)}
                            />
                        ):
                        (
                            <div
                                dangerouslySetInnerHTML={{__html: html}}
                            />
                        )}
                </Col>
            </Row>
        </>
    )
};

export const ExecutePlan = (props) =>{   //测试执行计划
    const {html, isEdit, onGenerate} = props;
    const [form] = Form.useForm();
    const base = '<h1>7、测试执行计划</h1> \n';
    const initFormValue = {
        executePlan: [
            {testStage: '用例编写', remark: ''},
            {testStage: '跟测', remark: ''},
            {testStage: '冒烟测试', remark: ''},
            {testStage: '第一轮系统测试', remark: ''},
            {testStage: '第二轮系统测试', remark: ''},
            {testStage: '回归测试', remark: ''},
            {testStage: '回滚验证', remark: ''},

        ]
    };

    const handleGenHtml = async (values)=>{
        const res:any = await genTestExecutePlanHtml({
            plan_json: values
        });
        if(res.success){
            onGenerate(base + res.data);
        }

    }

    useEffect(()=>{
        form.setFieldsValue(initFormValue);
        handleGenHtml(initFormValue.executePlan);
    }, [])
    return (
        <>
            <Row>
                <Col span={12} style={{paddingRight: 20}}>
                    <Divider>生成方式</Divider>
                    <Form
                        form={form}
                        layout={"vertical"}
                        // onValuesChange={(changedValues, allValues)=>{
                        //     handleGenHtml(allValues.executePlan)
                        // }}

                    >
                        <Form.List name="executePlan">
                            {(fields, { add, remove }) => {
                                return (
                                    <>
                                        {fields.map((field, index) => (
                                            <Space key={field.key} align={'start'}>
                                                <Form.Item
                                                    name={[field.name, 'testStage']}
                                                    label={index === 0 ? <b>阶段</b> : null}
                                                    style={{marginBottom:10}}
                                                    rules={[{ required: true}]}
                                                >
                                                    <Input
                                                        readOnly
                                                        style={{width:150}}
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'time']}
                                                    label={index === 0 ? <b>时间</b>: null}
                                                    style={{marginBottom:10}}
                                                >
                                                    <InputNumber
                                                        style={{width: 150}}
                                                        addonAfter="工时(h)"
                                                        onBlur={()=>{
                                                            handleGenHtml(form.getFieldsValue().executePlan)
                                                        }}
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'remark']}
                                                    label={index === 0 ? <b>备注</b>: null}
                                                    style={{marginBottom:10}}
                                                >
                                                    <Input.TextArea
                                                        autoSize={{maxRows: 5}}
                                                        style={{width: 230}}
                                                        onBlur={()=>{
                                                            handleGenHtml(form.getFieldsValue().executePlan)
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Space>
                                        ))}
                                    </>
                                );
                            }}
                        </Form.List>
                    </Form>

                </Col>
                <Col span={12}>
                    <Divider>预览</Divider>
                    {isEdit ?
                        (
                            <Input.TextArea
                                autoSize={{minRows:3, maxRows: 20}}
                                value={html}
                                onChange={(e)=>onGenerate(e.target.value)}
                            />
                        ):
                        (
                            <div
                                dangerouslySetInnerHTML={{__html: html}}
                            />
                        )}
                </Col>
            </Row>
        </>
    )
};

export const UploadWiki = (props) =>{
    const {projectId, finalHtml, isEdit, initSpace, initTitle, onGenerate} = props;
    const [form]= Form.useForm();
    const spaceKey = Form.useWatch('space', form);
    const uploadType = Form.useWatch('upload_type', form);
    const [loading, setLoading] = useState(false);
    const handleUpload = async ()=>{
        form
            .validateFields()
            .then(async (values:any)=>{
                setLoading(true);
                const res:any = await basicUploadWikiApi({
                    ...values,
                    html_body: finalHtml,
                    project_id: projectId
                });
                setLoading(false);
                if(res.success){
                   message.success('操作成功');
                   history.push('/plan_management');
                }
            })
    };

    useEffect(()=>{
        form.setFieldsValue({
            ...form.getFieldsValue(),
            page: null
        })
    }, [spaceKey]);

    useEffect(()=>{
        initTitle && form.setFieldsValue({
            ...form.getFieldsValue(),
            title: initTitle
        })
        uploadType == 2 && form.setFieldsValue({   // 修改为更新时，重置页面和标题
            ...form.getFieldsValue(),
            page: null,
            title: null
        })
    }, [uploadType]);

    return (
        <>
            <Row>
                <Col span={10}>
                    <Divider>上传wiki</Divider>
                    <Form
                        form={form}
                        labelCol={{span: 4}}
                    >
                        <Form.Item
                            label={'类型'}
                            name={'upload_type'}
                            rules={[{ required: true }]}
                            initialValue={1}
                        >
                            <Radio.Group>
                                <Radio value={1}>新建</Radio>
                                <Radio value={2}>更新</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            label={'空间'}
                            name={'space'}
                            rules={[{ required: true }]}
                            initialValue={initSpace}
                        >
                            <SelectWikiSpace
                                style={{width: 300}}
                            />
                        </Form.Item>
                        <Form.Item
                            label={uploadType == 1 ? '父页面': '页面'}
                            name={'page'}
                            rules={[{ required: true }]}
                        >
                            <SelectWikiPage
                                onSelect={(value, node, extra)=>{
                                    uploadType == 2 && form.setFieldsValue({
                                        ...form.getFieldsValue(),
                                        title: node.title
                                    })
                                }}
                                style={{width: 300}}
                                spaceKey={spaceKey}
                            />
                        </Form.Item>
                        <Form.Item
                            label={'标题'}
                            name={'title'}
                            rules={[{ required: true }]}
                            initialValue={initTitle}
                        >
                            <Input
                                disabled={uploadType == 2}
                                style={{width: 300}}
                            />
                        </Form.Item>
                        <Form.Item
                            wrapperCol={{offset: 4 }}
                        >
                            <Button
                                disabled={loading}
                                type={"primary"}
                                onClick={handleUpload}
                            >{uploadType == 1 ? '创建计划' : '更新计划'}</Button>
                        </Form.Item>

                    </Form>

                </Col>
                <Col span={14}>
                    <Divider>最终预览</Divider>
                    {isEdit ?
                        (
                            <Input.TextArea
                                autoSize={{minRows:3, maxRows: 20}}
                                value={finalHtml}
                                onChange={(e)=>onGenerate(e.target.value)}
                            />
                        ):
                        (
                            <div
                                dangerouslySetInnerHTML={{__html: finalHtml}}
                            />
                        )}
                </Col>
            </Row>

        </>
    )
};
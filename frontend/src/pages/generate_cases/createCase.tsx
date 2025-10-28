import React, {FunctionComponent, useState, useEffect} from "react";
import {
    Button,
    Divider,
    Drawer, Form, Input, message, Popconfirm, Select, Space, Spin, Tabs, Tag, TreeSelect

} from 'antd'
import {MinusCircleOutlined, PlusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import {getProductFilesApi} from "@/apis/prds";
import {createSingleCaseByTitleApi, saveCaseApi} from "@/apis/cases";
import {LlmCreateChatApi, LlmExtractJsonApi} from "@/apis/llm";

export const CreateCase:FunctionComponent = (props: any) => {
    const {searchParams, open, onClose, nodesData, selectNode, onSaveCase} = props;
    const [form] = Form.useForm();
    const [prdOption, setPrdOption] = useState([]);
    const [prdPath, setPrdPath] = useState(null);
    const [prdText, setPrdText] = useState('');
    const [activeKey, setActiveKey] = useState('1');
    const [loading, setLoading] = useState(false);
    const handleGetPrds = async ()=>{
        const res: any = await getProductFilesApi({
            ...searchParams,
        });
        if (res.success) {
            setPrdOption(res.data.filter(x=>x.oss_path).map(x=>({value: x.oss_path, label: x.file_name})));
        }

    };
    const handleSaveCase = async (is_continue:boolean=false)=>{
        form
            .validateFields()
            .then(async (values)=>{
                setLoading(true);
                const res:any = await saveCaseApi({
                    case:values,
                    project_id: searchParams.project_id,
                    sprint_id: searchParams.sprint_id,
                    node_id: values?.node_id
                });
                setLoading(false);
                if (res.success){
                    message.success('保存用例成功');
                    onSaveCase();
                    if(is_continue){
                        form.setFieldsValue({
                            title: '',
                            priority: null,
                            precondition: '',
                            description: null
                        });
                    }
                    else{
                        onClose()
                    }
                }
            })
    };
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
    const handleGenCaseByTitle = async ()=>{
        if (!form.getFieldsValue()?.title){
            message.info('请先输入用例名称');
            return
        }
        if (activeKey === '1' && !prdPath){
            message.info('请选择需求文档');
            return
        }
        if (activeKey === '2' && !prdText){
            message.info('请输入需求');
            return
        }
        setLoading(true);
        const res:any = await createSingleCaseByTitleApi({
            prd_url: activeKey == '1'? prdPath: null,
            prd_content: activeKey == '3' ? '暂无需求' : (activeKey == '1'? null : prdText),
            title: form.getFieldsValue()?.title,
            chat_id: await createChat()
        });
        if(res.success){
            const analysis_res:any = await LlmExtractJsonApi({
                answer: res.data,
                is_list: false
            })
            if (analysis_res.success){
                // console.log(analysis_res.data);
                form.setFieldsValue({
                    ...form.getFieldsValue(),
                    ...analysis_res.data,
                });
            }
        }
        setLoading(false);
    };
    const tabItems = [
        {
            key: '1',
            label: '选择需求',
            children: <Select
                value={prdPath}
                style={{width: 200}}
                options={prdOption}
                onChange={(value)=>setPrdPath(value)}
            />

        },
        {
            key: '2',
            label: '输入需求',
            children: <Input.TextArea
                allowClear
                value={prdText}
                onChange={(e)=>setPrdText(e.target.value)}
                style={{width: 300}}
                autoSize={{minRows: 3, maxRows: 10}}
            />
        },
        {
            key: '3',
            label: '无需求',
            children: '无需求生成的用例准确度较低'
        }
    ];
    useEffect(()=>{
        prdOption.length > 0 && setPrdPath(prdOption[0].value);
    }, [prdOption])
    useEffect(()=>{
        form.setFieldsValue({
            ...form.getFieldsValue(),
            node_id: selectNode
        })
    }, [selectNode])
    return (
        <>
            <Drawer
                width={1000}
                title={'创建用例'}
                open={open}
                onClose={onClose}
                footer={(
                    <Space>
                        <Button type={"primary"} onClick={()=>{
                            handleSaveCase(false);
                        }}>保存</Button>
                        <Button type={"primary"} onClick={()=>{
                           handleSaveCase(true);
                        }}>继续新增</Button>
                        <Button onClick={()=>{
                            form.setFieldsValue({
                                title: '',
                                priority: null,
                                precondition: '',
                                description: null
                            })
                        }}>清空</Button>
                        <Button onClick={onClose}>关闭</Button>
                    </Space>
                )}
            >
                <Spin
                    spinning={loading}
                >
                    <Form
                        layout={"vertical"}
                        form={form}
                    >
                        <Form.Item
                            label={'用例名称'}

                        >
                            <Space>
                                <Form.Item
                                    name={'title'}
                                    rules={[{ required: true }]}
                                    noStyle
                                >
                                    <Input
                                        style={{width: 500}}
                                    />
                                </Form.Item>
                                <Popconfirm
                                    title={null}
                                    icon={null}
                                    onOpenChange={(open)=>{
                                        open && handleGetPrds();
                                    }}
                                    onConfirm={handleGenCaseByTitle}
                                    okText={'生成'}
                                    cancelText={'取消'}
                                    description={
                                        <Tabs
                                            activeKey={activeKey}
                                            items={tabItems}
                                            onChange={(key)=>{setActiveKey(key)}}
                                         />
                                    }
                                >
                                    <a>AI生成</a>
                                </Popconfirm>

                            </Space>
                        </Form.Item>
                        <Space>
                            <Form.Item
                                label={'优先级'}
                                name={'priority'}
                                rules={[{ required: true }]}
                            >
                                <Select
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
                            />
                        </Form.Item>
                        <Space>
                            <Divider style={{width: 30}} />
                            <Divider style={{width: 400}}>步骤</Divider>
                            <Divider style={{width: 400}}>结果</Divider>
                        </Space>

                        <Form.List name="description">
                            {(fields, { add, remove }) => {
                                return (
                                    <>
                                        {fields.map((field, index) => (
                                            <Space key={field.key} align={'start'}>
                                                <div style={{width: 30}}>{index + 1}、</div>
                                                <Form.Item
                                                    name={[field.name, 'steps']}
                                                    // label={index === 0 ? '步骤' : ''}
                                                    style={{marginBottom:10}}
                                                >
                                                    <Input.TextArea
                                                        bordered
                                                        style={{width:400}}
                                                        autoSize
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'expect_result']}
                                                    // label={index === 0 ? '结果' : ''}
                                                    style={{marginBottom:10}}
                                                >
                                                    <Input.TextArea
                                                        bordered
                                                        style={{width:400}}
                                                        autoSize
                                                    />
                                                </Form.Item>
                                                <PlusCircleOutlined
                                                    // style={{marginTop: index === 0 ? 30: null}}
                                                    onClick={()=>add('', index)}
                                                />
                                                <MinusCircleOutlined
                                                    // style={{marginTop: index === 0 ? 30: null}}
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
                                            添加步骤
                                        </Button>

                                    </>
                                );
                            }}
                        </Form.List>


                    </Form>
                </Spin>

            </Drawer>
        </>
    )
}
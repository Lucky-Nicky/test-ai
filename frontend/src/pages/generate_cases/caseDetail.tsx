import React, {FunctionComponent, useState, useEffect} from "react";
import type { MenuProps } from 'antd';
import {EditCaseApi} from '@/apis/cases'
import {
    Button,
    Drawer,
    Form, Input, Select, Space, TreeSelect, message, Divider, Tag
} from 'antd'
import {
    MinusCircleOutlined,
    PlusCircleOutlined,
    PlusOutlined
} from '@ant-design/icons';
export const CaseDetail:FunctionComponent = (props: any) =>{
    const {open, onClose, onEdit, caseData, nodesData} = props;
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm();
    const handleEditCase = async()=>{
        form
            .validateFields()
            .then(async (values) => {
                // console.log(values);
                setLoading(true);
                const res:any = await EditCaseApi({
                    ...values,
                    case_id: caseData.id,
                });
                if(res.success){
                    // console.log('333');
                    message.success('操作成功');
                    onEdit();
                }
                setLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });
    };
    const getCaseColor = (text:string)=>{
        switch (text?.toUpperCase()){
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
    useEffect(()=>{
        form.setFieldsValue({
           ...caseData
        });
    }, [caseData])
    useEffect(()=>{
        setEditing(false);
    }, [open])
    return (
        <Drawer
            onClose={onClose}
            open={open}
            maskClosable={false}
            destroyOnClose={true}
            width={1000}
            title={(
                <Space>
                    <span>{caseData?.name}</span>
                    {getCaseColor(caseData.priority)}
                </Space>

            )}
            footer={(
                <Space>
                    <Button onClick={onClose}>
                        {editing ? '取消' : '关闭'}
                    </Button>
                    <Button type={"primary"} onClick={()=> {
                        form.setFieldsValue({
                            ...caseData
                        });
                        setEditing(!editing);
                    }}>{editing ? '取消编辑' : '编辑'}</Button>
                    {editing ? (
                        <Button type={"primary"} onClick={handleEditCase}>
                            保存
                        </Button>
                    ) : null}

                </Space>
            )}
        >
            <Form
                layout={"vertical"}
                form={form}
            >
                <Form.Item
                    label={'用例名称'}
                    name={'name'}
                    rules={[{ required: true }]}
                >
                    <Input readOnly={!editing}/>

                </Form.Item>
                <Space>
                    <Form.Item
                        label={'优先级'}
                        name={'priority'}
                        rules={[{ required: true }]}
                    >
                        <Select
                            disabled={!editing}
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
                            disabled={!editing}
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
                        bordered={editing}
                        readOnly={!editing}
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
                                                readOnly={!editing}
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
                                                readOnly={!editing}
                                                style={{width:400}}
                                                autoSize
                                            />
                                        </Form.Item>
                                        {editing ? (
                                            <PlusCircleOutlined
                                                // style={{marginTop: index === 0 ? 30: null}}
                                                onClick={()=>add('', index)}
                                            />
                                        ) : null}

                                        {editing && fields.length > 1 ? (
                                            <MinusCircleOutlined
                                                // style={{marginTop: index === 0 ? 30: null}}
                                                onClick={() => remove(field.name)}
                                            />
                                        ) : null}
                                    </Space>
                                ))}
                                {editing ? (
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        添加步骤
                                    </Button>
                                ) : null}

                            </>
                        );
                    }}
                </Form.List>


            </Form>
        </Drawer>

    )
}

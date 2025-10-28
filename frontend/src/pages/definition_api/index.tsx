import React, {useState, useEffect} from "react";
import { SearchSection } from './search';
import {
    Button, Popconfirm,
    Space, Table,
    Form, Modal, Input, Select, Drawer, message, Row, Col, Divider
} from 'antd';
import {formatDate} from "@/utils/utils";
import styles from "@/pages/generate_cases/index.less";
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/stackoverflow-dark.css';
import {apiInfoDeleteApi, apiInfoGetApi, apiInfoSaveApi, executePyScriptApi} from "@/apis/apiInfo";

export default () =>{
    const [searchParams, setSearchParams] = useState({
        project_id: '',
        sprint_id: '',
        node_id: 0
    });
    const [apiData, setApiData] = useState([]);
    const [currentEditId, setCurrentEditId] = useState(null);
    const [addApiModalOpen, setAddApiModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [textScript, setTextScript] = useState("");
    const [scriptResult, setScriptResult] = useState(null);
    const [form] = Form.useForm();
    const apiColumns = [
        {
            title: '编号',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'url',
            dataIndex: 'url',
            key: 'url',
            ellipsis: true,
        },
        {
            title: 'method',
            dataIndex: 'method',
            key: 'method',
            width: 100,
        },
        {
            title: 'body',
            dataIndex: 'body',
            key: 'body',
            width: 300,
            ellipsis: true,
        },
        {
            title: 'result',
            dataIndex: 'result',
            key: 'result',
            width: 300,
            ellipsis: true,
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            ellipsis: true,
            width: 100
        },
        {
            title: '创建时间',
            dataIndex: 'create_time',
            key: 'create_time',
            width: 200,
            ellipsis: true,
            sorter: (a, b) => {
                return a.create_time - b.create_time
            },
            render:(text:any, record:any)=>formatDate(text)
        },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'creator',
            width: 200,
            render:(text, record)=>(
                <>
                    <Popconfirm
                        title={'确定删除？'}
                        onConfirm={()=>handleDeleteApi(record.id)}
                    >
                        <Button size={"small"} type={"link"}>删除</Button>
                    </Popconfirm>
                    <Button
                        size={"small"}
                        type={"link"}
                        onClick={()=>{
                            form.setFieldsValue({
                                ...record
                            });
                            setCurrentEditId(record.id);
                            setAddApiModalOpen(true);
                        }}
                    >详情</Button>
                    <Button
                        size={"small"}
                        type={"link"}
                        onClick={()=>{
                            handleGenPyCode({

                            })
                        }}
                    >测试</Button>
                </>
            )
        },
    ];

    const handleGetApi = async (info:any=null)=>{
        const res:any = await apiInfoGetApi({
            project_id: searchParams.project_id,
                ...info
        })
        if(res.success){
            setApiData(res.data);
        }
    };
    const handleSaveApi = () =>{
      form
          .validateFields()
          .then(async (values)=>{
              console.log(values);
              const res:any = await apiInfoSaveApi({
                  id: currentEditId,
                  ...values,
                  project_id: searchParams.project_id
              })
              if(res.success){
                  message.success('操作成功');
                  setAddApiModalOpen(false);
                  handleGetApi();
              }
          })
    };
    const handleDeleteApi = async (id)=>{
        const res:any = await apiInfoDeleteApi({
            id: id
        })
        if(res.success){
            handleGetApi();
        }
    };
    const handleGenPyCode = (info) =>{
        setTextScript(`import requests
print("hello world")

`)
    }
    const handleRunPyScript = async (code)=>{
        const res:any = await executePyScriptApi({
            code: textScript
        })
        if(res.success){
            setScriptResult(res.data);
        }
    };
    useEffect(()=>{
        if(!textScript){
            return
        }
        const codes = document.querySelectorAll('pre code');
        codes.forEach((el:any) => {
            // 让code进行高亮
            hljs.highlightElement(el);
        })
    }, [textScript]);
    return (
        <>
            <SearchSection
                onSubmit={(values)=>{
                    setSearchParams({
                        ...values
                    })
                    handleGetApi(values);
                }}
                searchParams={searchParams}

            />
            <div className={styles.actionBar}>
                <Space>
                    <Button size={"small"} loading={loading} onClick={()=>{
                        form.resetFields();
                        setCurrentEditId(null);
                        setAddApiModalOpen(true);
                    }}>添加接口</Button>
                </Space>
            </div>
            <Table
                dataSource={apiData}
                columns={apiColumns}
            />
            <Drawer
                width={700}
                title={currentEditId ? '编辑接口': '添加接口'}
                open={addApiModalOpen}
                onClose={()=>setAddApiModalOpen(false)}
                footer={(
                    <Space>
                        <Button type={"primary"} onClick={handleSaveApi}>保存</Button>
                        <Button onClick={()=>setAddApiModalOpen(false)}>取消</Button>
                    </Space>
                )}
            >
                <Form
                    form={form}
                    labelCol={{span: 3}}
                >
                    <Form.Item
                        label={'名称'}
                        name={'name'}
                        rules={[{required:true, message:'请输入名称'}]}
                    >
                        <Input
                            // style={{width: 400}}
                        />
                    </Form.Item>
                    <Form.Item
                        label={'url'}
                        name={'url'}
                        rules={[{required:true, message:'请输入url'}]}
                    >
                        <Input
                            // style={{width: 400}}
                        />
                    </Form.Item>
                    <Form.Item
                        label={'Method'}
                        name={'method'}
                        initialValue={'GET'}
                    >
                        <Select
                            style={{width: 100}}
                            options={[
                                {label: 'GET', value: 'GET'},
                                {label: 'POST', value: 'POST'}
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label={'params'}
                        name={'params'}
                    >
                        <Input
                            // style={{width: 400}}
                        />
                    </Form.Item>
                    <Form.Item
                        label={'body'}
                        name={'body'}
                    >
                        <Input.TextArea
                            // style={{width: 400}}
                            autoSize={{minRows: 10, maxRows: 20}}
                        />
                    </Form.Item>
                </Form>
            </Drawer>
            <Modal
                width={1000}
                open={!!textScript}
                onCancel={()=>{setTextScript('')}}
                footer={(
                    <Space>
                        <Button
                            type={"primary"}
                            onClick={()=>{handleRunPyScript()}}>执行</Button>
                    </Space>
                )}
            >
                <Row gutter={16}>
                    <Col span={13}>
                        <pre>
                            <code
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e)=>{
                                    console.log('123321');
                                    setTextScript(e.target.innerText);
                                }}
                            >
                                {textScript}
                            </code>
                        </pre>
                    </Col>
                    <Col span={9}>
                    <pre>
                        {scriptResult?.stdout}
                    </pre>
                        {
                            scriptResult?.stderr && (
                            <pre>
                            <Divider>stderr</Divider>
                                {scriptResult?.stderr}
                            </pre>
                            )
                        }

                    </Col>
                </Row>


            </Modal>
        </>

    )
}
import React, {useState, useEffect} from "react";
import { SearchSection } from '@/components/search'
import {
    Button, Form, Input, message, Modal,
    Space, Table, Tag,
} from 'antd';
import {history} from 'umi';

import styles from './index.less';
import {AskAnswerModal, SelectSprint, SelectWikiPage, SelectWikiSpace} from "@/components/myAntd";
import PdfPreview from "@/components/pdfViewModal";
import {getPlansApi, addPlanApi, deletePlanApi} from '@/apis/plan'
import {formatDate} from "@/utils/utils";
import {ChatBodyDrawer, ChatFloatIcon} from "@/pages/ai_chat/chatCompononts";
import {projectsDetailApi} from "@/apis/basic";
export default () =>{
    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useState({
        project_id: '',
        sprint_id: '',
        node_id: 0
    });
    const [projectDetail, setProjectDetail] = useState(null);
    const [planData, setPlanData] = useState([]);
    const [addsSprintModal, setAddsSprintModal] = useState(false);
    const [preViewDrawer, setPreViewDrawer] = useState(false);
    const [isEditSprint, setIsEditSprint] = useState(false);
    const [editId, setEditId] = useState(null);
    const [preViewInfo, setPreViewInfo] = useState({url: '', sprint_id: ''});
    const [pages, setPages] = useState('');
    const [askAnswerOpen, setAskAnswerOpen] = useState(false);
    const [chatInfo, setChatInfo] = useState({chat_id: null});
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const spaceKey = Form.useWatch('space', form);
    const columns = [
        {
            title: '序号',
            dataIndex: 'xh',
            key: 'xh',
            width:100,
            render: (text: any, record: any, index: any) => `${index + 1}`,
        },
        {
            title: '迭代号',
            dataIndex: 'sprint_name',
            key: 'sprint_name',
            width:200,
            ellipsis: true,
            render: (text: any, record: any, index: any) => (
                <Tag color={'#2db7f5'}>{text}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (text: any, record: any, index: any) => (
                <Tag color={text == 0 ? 'yellow-inverse' : 'green-inverse'}>{text == 0 ? '进行中': '已完成'}</Tag>
            ),
        },
        {
            title: '计划文档',
            dataIndex: 'file_name',
            key: 'file_name',
            render: (text:any, record:any) => (
                text ?
                    <Space>
                        <a href={record.oss_path} target={'_blank'}>{text}</a>
                    </Space>:
                    '-'
            )
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
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
            ellipsis: true,
            render:(text:any, record:any)=>formatDate(text)
        },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            render: (text:any, record:any) => (
                <Space size={"small"}>
                    <a onClick={(e)=>{
                        e.preventDefault();
                        // console.log(record.file_type);
                        setPreViewInfo({
                            url: record.oss_path,
                            sprint_id: record.sprint_id
                        });
                        setPreViewDrawer(true);
                    }}>预览</a>
                    <a onClick={()=>{
                        form.resetFields();
                        form.setFieldsValue({
                            ...record,
                            space:projectDetail?.confluence_space_key
                        });
                        setIsEditSprint(true);
                        setEditId(record.id);
                        setAddsSprintModal(true);
                    }}>编辑</a>
                    <a onClick={()=>handleDeletePlan(record.id)}>删除</a>
                </Space>
            )
        },
    ]
    const getPlans= async (values)=>{
        const res:any = await getPlansApi({...values});
        if (res.success){
            setPlanData(res.data);
        }
    }
    const handleAddPlan = ()=>{
        form
            .validateFields()
            .then(async (values:any)=>{
                console.log(values);
                setLoading(true);
                const res:any = await addPlanApi({
                    ...values,
                    product_id: isEditSprint ? editId : null,
                    project_id: searchParams.project_id,
                });
                if(res.success){
                    message.success(isEditSprint ? '编辑成功' : '添加成功');
                    setAddsSprintModal(false);
                    getPlans(searchParams);
                }
                setLoading(false)
            })
    }
    const handleDeletePlan = async (plan_id)=>{
        const res:any = await deletePlanApi({
            plan_id: plan_id
        })
        if (res.success){
            message.success('删除成功');
            getPlans(searchParams);
        }
    }
    const handleAskAndAnwser = async (pages)=>{
        setAskAnswerOpen(true);
        setPages(pages);
    };
    const handleProjectDetail = async ()=>{
        const res:any = await projectsDetailApi({
            project_id: searchParams.project_id
        })
        if(res.success){
            setProjectDetail(res.data);
        }
    };
    useEffect(()=>{
        searchParams.project_id && handleProjectDetail()
    }, [searchParams]);

    useEffect(()=>{
        form.setFieldsValue({
            ...form.getFieldsValue(),
            page: null
        })
    }, [spaceKey]);
    return (
        <>
            <SearchSection
                onSubmit={(values)=>{
                    setSearchParams({
                        ...values
                    })
                    getPlans(values);
                }}
                sprintStatus
            />
            <div className={styles.actionBar}>
                <Space>
                    <Button size={"small"} onClick={()=>{
                        form.setFieldsValue({
                            space: projectDetail?.confluence_space_key
                        });
                        setIsEditSprint(false);
                        setAddsSprintModal(true);
                    }}>+wiki计划</Button>
                    <Button size={"small"} onClick={()=>{
                        history.push('/create_plan');
                    }}>AI创建</Button>
                </Space>
            </div>
            <Table
                columns={columns}
                dataSource={planData}
                rowKey={'id'}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
            />

            <Modal
                title={isEditSprint ? '编辑测试计划' : '添加测试计划'}
                open={addsSprintModal}
                onCancel={()=>setAddsSprintModal(false)}
                okText={'确定'}
                cancelText={'取消'}
                onOk={handleAddPlan}
                confirmLoading={loading}
            >
                <Form
                    form={form}
                    style={{marginTop:20}}
                    labelCol={{span:4}}
                    disabled={loading}
                >
                    <Form.Item
                        label={'迭代号'}
                        name={'sprint_id'}
                        rules={[{ required: true }]}
                        // style={{width:300}}
                    >
                        <SelectSprint
                            project_id={searchParams.project_id}
                        />
                    </Form.Item>
                    <Form.Item
                        label={'空间'}
                        name={'space'}
                        rules={[{ required: true }]}
                    >
                        <SelectWikiSpace />
                    </Form.Item>
                    <Form.Item
                        label={'页面'}
                        name={'page'}
                        rules={[{ required: true }]}
                    >
                        <SelectWikiPage
                            spaceKey={spaceKey}
                        />
                    </Form.Item>
                    <Form.Item
                        label={'备注'}
                        name={'remark'}
                        rules={[{ required: false }]}
                        // style={{width:300}}
                    >
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
            <PdfPreview
                url={preViewInfo.url}
                open={preViewDrawer}
                onClose={()=>setPreViewDrawer(false)}
                onAsk={handleAskAndAnwser}
            />
            <AskAnswerModal
                sourcePage={'plan'}
                searchParams={searchParams}
                open={askAnswerOpen}
                pages={pages}
                onCancel={()=>setAskAnswerOpen(false)}
                onOpenChat={(value)=>{
                    setChatInfo({
                        ...chatInfo,
                        chat_id: value
                    });
                    setChatDrawerOpen(true);
                }}
            />
            <ChatBodyDrawer
                open={chatDrawerOpen}
                onClose={()=>setChatDrawerOpen(false)}
                chat_id={chatInfo?.chat_id}
                onSaveData={()=>getPlans(searchParams)}
            />
            <ChatFloatIcon
                spin
                style={{ width: 40, height: 40}}
                onClick={()=>setChatDrawerOpen(true)}
            />
        </>
    )
}
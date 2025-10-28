import React, {useState, useEffect} from "react";
import styles from './index.less';
import { sprintAddApi, sprintGetApi, sprintDeleteApi, sprintEditApi} from '@/apis/sprint'
import {formatDate, get_init_project} from "@/utils/utils";
import {SearchSection} from "./search";
import {
    Button,
    Form,
    Input,
    message,
    Modal,
    Spin,
    Space,
    Table,
    Tag, Radio, Select
} from "antd";
import {SearchJiraRelease, SearchJiraSprint} from "@/pages/sprint_management/component";
export default () =>{
    const [searchParams, setSearchParams] = useState({project_id: get_init_project()});
    const [loading, setLoading] = useState(false);
    const [addSprintOpen, setAddSprintOpen] = useState(false);
    const [sprintData, setSprintData] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingSprint, setEditingSprint] = useState('');
    const colums = [
        {
            title: '序号',
            dataIndex: 'xh',
            key: 'xh',
            width: 200,
            render: (text: any, record: any, index: any) => `${index + 1}`,
        },
        {
            title: '迭代号',
            dataIndex: 'name',
            key: 'name',
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
            width: 200,
            render: (text: any, record: any, index: any) => (
                <Space>
                    <a onClick={()=>{
                        setIsEditing(true);
                        setEditingSprint(record.id);
                        console.log(record);
                        form.setFieldsValue({
                            ...record,
                        });
                        setAddSprintOpen(true);
                    }}>编辑</a>
                    <Button type={'link'} disabled onClick={()=>handleDeleteSprint(record.id)}>删除</Button>
                </Space>
            ),
        }
    ];
    const [form] = Form.useForm();
    const source = Form.useWatch('source', form);
    const getSprint = async (values)=>{
        // console.log(searchParams);
        const res:any = await sprintGetApi({
            ...values,
        })
        if(res.success){
            setSprintData(res.data)
        }
    };
    const handleDeleteSprint = async (sprint_id:number)=>{
        // console.log(searchParams);
        const res:any = await sprintDeleteApi({
            sprint_id: sprint_id
        })
        if(res.success){
            console.log('操作成功');
            getSprint(searchParams);
        }
    };
    const handleSubmitForm = ()=>{
        form
            .validateFields()
            .then(async (values) => {
                setLoading(true);
                if (isEditing){
                    const res:any = await sprintEditApi({
                        sprint_id: editingSprint,
                        kw:{
                            ...values
                        }
                    })
                    if(res.success){
                        message.success('操作成功');
                        setAddSprintOpen(false);
                        getSprint(searchParams);
                    }
                }
                else{
                    const res:any = await sprintAddApi({
                        ...values,
                        project_id: searchParams.project_id,
                    });
                    if(res.success){
                        message.success('操作成功');
                        setAddSprintOpen(false);
                        getSprint(searchParams);
                    }
                }


                setLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });

    };
    // useEffect(()=>{
    //     addSprintOpen &&
    //     form.setFieldsValue({
    //         ...form.getFieldsValue(),
    //         name: '',
    //     });
    // }, [source])
    return (
        <>
            <SearchSection
                onSubmit={(values)=>{
                    setSearchParams({
                        ...values
                    })
                    getSprint(values);
                }}
                searchParams={searchParams}

            />
            <div className={styles.actionBar}>
                <Space>
                    <Button size={"small"} onClick={()=>{
                        setIsEditing(false);
                        form.resetFields();
                        setAddSprintOpen(true);
                    }}>+添加迭代</Button>
                </Space>
            </div>
            <Table
                columns={colums}
                dataSource={sprintData}
                rowKey={'id'}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
            />

            <Modal
                open={addSprintOpen}
                okText={'确认'}
                cancelText={'取消'}
                onOk={handleSubmitForm}
                onCancel={()=>setAddSprintOpen(false)}
                confirmLoading={loading}
                destroyOnClose
                // width={1000}
                title={isEditing ? '编辑迭代' : '添加迭代'}
            >
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        labelCol={{span: 5}}
                        style={{marginTop:20}}
                    >
                        <Form.Item
                            name={'source'}
                            label={'来源'}
                            rules={[{required: true}]}
                            initialValue={1}
                        >
                            <Radio.Group>
                                <Radio value={1}>jira迭代</Radio>
                                <Radio value={2}>jira版本</Radio>
                                <Radio value={3}>自定义</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            name={'name'}
                            label={'迭代号'}
                            hidden={source != 3}
                            rules={[{required: source == 3}]}
                        >
                            <Input
                             style={{width:250}}
                            />
                        </Form.Item>
                        <Form.Item
                            name={'name'}
                            label={'迭代号'}
                            hidden={source != 1}
                            rules={[{required: source == 1}]}
                        >
                            <SearchJiraSprint
                                project_id={searchParams.project_id}
                                style={{width:250}}
                            />
                        </Form.Item>
                        <Form.Item
                            name={'name'}
                            label={'迭代号'}
                            hidden={source != 2}
                            rules={[{required: source == 2}]}
                        >
                            <SearchJiraRelease
                                project_id={searchParams.project_id}
                                style={{width:250}}
                            />
                        </Form.Item>
                        <Form.Item
                            name={'status'}
                            label={'状态'}
                            rules={[{required: true}]}
                            initialValue={0}
                        >
                            <Select
                                style={{width: 250}}
                                options={[
                                    {value: 0, label: '进行中'},
                                    {value: 1, label: '已完成'}
                                ]}
                            />
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </>

    )
}
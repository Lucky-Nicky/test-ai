import {useState, useEffect} from "react";
import styles from './index.less';
import {PromptGetApi, PromptAddApi, PromptValidateApi, PromptDeleteApi} from '@/apis/prompt';
import {SearchSection} from "@/components/search";
import {
    Button,
    Form,
    Input,
    message,
    Modal,
    Space,
    Table,
    Select, InputNumber, Tag
} from "antd";
import {formatDate} from "@/utils/utils";
export default () =>{
    const [searchParams, setSearchParams] = useState({
        project_id: '',
        sprint_id: '',
    });
    const [loading, setLoading] = useState(false);
    const [addPromptOpen, setAddPromptOpen] = useState(false);
    const [promptData, setPromptData] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [checkPromptOpen, setCheckPromptOpen] = useState(false);
    const [checkPromptContent, setCheckPromptContent] = useState('');
    const [promptRoleOption, setPromptRoleOption] = useState([
        {'label': '用例生成', value: 1},
        {'label': '文档问答', value: 3},
        {'label': '用例优化', value: 4},
        {'label': '数据准备', value: 5},
        {'label': '用例review', value: 6},
        {'label': '数据准备问答', value: 7},
    ]);
    const colums = [
        {
            title: '序号',
            dataIndex: 'xh',
            key: 'xh',
            width: 100,
            render: (text: any, record: any, index: any) => `${index + 1}`,
        },
        {
            title: '模板名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '模板类型',
            dataIndex: 'role',
            key: 'role',
            render: (text:number, record:any)=>{
                const temp:any = promptRoleOption.filter((x)=> x.value === text)
                return <Tag color={'green-inverse'}>{temp.length > 0 ? temp[0].label : '-'}</Tag>

            }
        },
        {
            title: '内容',
            dataIndex: 'content',
            key: 'content',
            render: (text:any, record:any) =>(
                <Button type={"link"} onClick={()=>{
                    setCheckPromptContent(text);
                    setCheckPromptOpen(true);
                }}>查看</Button>

            )
        },
        {
            title: '创建时间',
            dataIndex: 'create_time',
            key: 'create_time',
            width: 200,
            ellipsis: true,
            render:(text:any, record:any)=>formatDate(text)
        },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            render: (text: any, record: any, index: any) => (
                <Space size={"small"}>
                    <Button
                        disabled={!record.project_id}
                        type={"link"}
                        size={"small"}
                        onClick={()=>{
                        setIsEditing(true);
                        form.setFieldsValue({
                            ...record,
                            prompt_id: record.id
                        });
                        setAddPromptOpen(true);
                    }}>编辑</Button>
                    <Button
                        disabled={!record.project_id}
                        type={'link'}
                        size={"small"}
                        onClick={()=>handleDeletePrompt(record.id)}>删除</Button>
                </Space>
            ),
        }
    ];
    const [form] = Form.useForm();
    const getPrompt = async(values) =>{
        const res:any = await PromptGetApi({
            ...values
        });
        if (res.success){
            setPromptData(res.data);
        }
    };
    const handleAddprompt = ()=>{
        form
            .validateFields()
            .then(async (values:any)=>{
                console.log(values);
                setLoading(true);
                const validate_res:any = await PromptValidateApi({
                    ...values,
                    project_id: searchParams.project_id
                })
                if (validate_res.success){
                    const res:any = await PromptAddApi({
                        ...values,
                        project_id: searchParams.project_id
                    })
                    if(res.success){
                        message.success('操作成功');
                        setAddPromptOpen(false);
                        getPrompt(searchParams);
                    }
                }
                setLoading(false);
            })
    };
    const handleDeletePrompt = async(prompt_id:number)=>{
        const res:any = await PromptDeleteApi({
           prompt_id: prompt_id
        });
        if (res.success){
            message.success('操作成功');
            getPrompt(searchParams);
        }
    }
    return (
        <>
            <SearchSection
                onSubmit={(values)=>{
                    setSearchParams({
                        ...values
                    })
                    getPrompt(values);
                }}
            />
            <div className={styles.actionBar}>
                <Space>
                    <Button size={"small"} onClick={()=>{
                        setIsEditing(false);
                        form.resetFields();
                        setAddPromptOpen(true);
                    }}>+添加模板</Button>
                </Space>
            </div>
            <Table
                columns={colums}
                dataSource={promptData}
                rowKey={'id'}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
            />
            <Modal
                open={checkPromptOpen}
                onCancel={()=>setCheckPromptOpen(false)}
                footer={[
                    <Button key={'ok'} type={"primary"} onClick={()=>setCheckPromptOpen(false)}>确认</Button>
                ]}

                width={1000}
            >
                <pre><code>{checkPromptContent}</code></pre>
            </Modal>
            <Modal
                title={isEditing ? '编辑模板' : '新增模板'}
                width={1000}
                open={addPromptOpen}
                onCancel={()=>setAddPromptOpen(false)}
                onOk={handleAddprompt}
                confirmLoading={loading}
                okText={'确定'}
                cancelText={'取消'}
            >
                <Form
                    form={form}
                    labelCol={{span:2}}
                >
                    <Form.Item
                        label={'模板id'}
                        name={'prompt_id'}
                        hidden={true}
                    >
                        <InputNumber />
                    </Form.Item>
                    <Form.Item
                        label={'模板名称'}
                        name={'name'}
                        rules={[{ required: true }]}
                    >
                        <Input style={{width: 200}}/>
                    </Form.Item>
                    <Form.Item
                        label={'模板类型'}
                        name={'role'}
                        rules={[{ required: true }]}
                        initialValue={1}
                    >
                        <Select
                            style={{width: 200}}
                            options={promptRoleOption}
                        />
                    </Form.Item>
                    <Form.Item
                        label={'模板内容'}
                        name={'content'}
                        rules={[{ required: true }]}
                    >
                        <Input.TextArea
                            autoSize={{minRows:6, maxRows: 20}}
                        />
                    </Form.Item>
                </Form>

            </Modal>
        </>

    )
}
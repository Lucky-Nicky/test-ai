import {
    Button,
    Modal,
    Space,
    Table,
    Form,
    Input,
    Upload,
    message, Radio, Tag
} from 'antd'
import {
    getProductFilesApi,
    addProductFilesApi,
    deleteProductFilesApi
} from '@/apis/prds';
import {projectsDetailApi, uploadApi} from '@/apis/basic'
import {nodesGetApi} from "@/apis/nodes";
import {SearchSection} from '@/components/search';
import {
    SelectSprint,
    GenCasePreview,
    GenCase,
    AskAnswerModal,
    SelectWikiSpace, SelectWikiPage
} from '@/components/myAntd';
import React, { useState, useEffect} from "react";
import styles from "@/pages/generate_cases/index.less";
import PdfPreview from '@/components/pdfViewModal'
import HtmlPreview from "@/components/htmlViewModal";
import {formatDate} from "@/utils/utils";
import {ChatBodyDrawer, ChatFloatIcon} from "@/pages/ai_chat/chatCompononts";
import {syncJiraInfoApi} from "@/apis/sprint";
import {JiraInfoModal} from "./prd_componont";

export default ()=> {
    const [form] = Form.useForm();
    const [prdData, setPrdData] = useState([]);
    const [nodesData, setNodesData] = useState([]);
    const [searchParams, setSearchParams] = useState({
        project_id: '',
        sprint_id: '',
        node_id: 0
    });
    const [projectDetail, setProjectDetail] = useState(null);
    const [addsSprintModal, setAddsSprintModal] = useState(false);
    const [preViewDrawer, setPreViewDrawer] = useState(false);
    const [htmlViewDrawer, setHtmlViewDrawer] = useState(false);
    const [isEditSprint, setIsEditSprint] = useState(false);
    const [editId, setEditId] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [preViewInfo, setPreViewInfo] = useState({url: '', sprint_id: ''});
    const [uploadType, setUploadType] = useState(3);
    const [genCaseData, setGenCaseData] = useState([]);
    const [casePreviewOpen, setCasePreviewOpen] = useState(false);
    const [genCaseOpen, setGenCaseOpen] = useState(false);
    const [askAnswerOpen, setAskAnswerOpen] = useState(false);
    const [pages, setPages] = useState([]);
    const [chatInfo, setChatInfo] = useState({chat_id: null});
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [jiraInfoOpen, setJiraInfoOpen] = useState(false);
    const [jiraInfoviewType, setJiraInfoviewType] = useState('1');
    const [editRowDate, setEditRowDate] = useState(null);

    const spaceKey = Form.useWatch('space', form);
    const handleProjectDetail = async ()=>{
        const res:any = await projectsDetailApi({
            project_id: searchParams.project_id
        })
        if(res.success){
            setProjectDetail(res.data);
        }
    };
    const getPrds = async (values)=>{
        const res:any = await getProductFilesApi({...values});
        if (res.success){
            setPrdData(res.data);
        }
    }
    const getNodes = async(sprint_id)=>{
        const res:any = await nodesGetApi({
            project_id: searchParams.project_id,
            sprint_id: sprint_id
        });
        if (res.success){
            setNodesData(res.data);
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
            ellipsis: true,
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
            title: '故事',
            dataIndex: 'story',
            key: 'story',
            width: 70,
            render: (text:any , record:any)=>(
                record.story.length > 0
                    ?
                    <a onClick={()=>{
                        setEditRowDate(record);
                        setJiraInfoviewType('1');
                        setJiraInfoOpen(true);
                    }}>{record.story?.length}</a>
                    :
                    0
            )
        },
        {
            title: '缺陷',
            dataIndex: 'bug',
            key: 'bug',
            width: 70,
            render: (text:any , record:any)=>(
                record.bug.length > 0
                    ?
                    <a onClick={()=>{
                        setEditRowDate(record);
                        setJiraInfoviewType('2');
                        setJiraInfoOpen(true);
                    }}>{record.bug?.length}</a>
                    :
                    0
            )
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
            width: 100
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
            fixed: 'right',
            width: 250,
            render: (text:any, record:any) => (
                <Space size={"small"}>
                    <a onClick={(e)=>{
                        e.preventDefault();
                        // console.log(record.file_type);
                        setPreViewInfo({
                            url: record.upload_type == 2 ?  record.online_path : record.oss_path,
                            sprint_id: record.sprint_id
                        });
                        getNodes(record.sprint_id);
                        switch (record.file_type){
                            case 'pdf':
                                setPreViewDrawer(true);
                                break
                            case 'online':
                                setHtmlViewDrawer(true);
                                break
                            default:
                                message.info('暂不支持该格式的预览:' + record.file_type);
                        }


                    }}>预览</a>
                    <a onClick={()=>handleSyncJiraInfo({
                        sprint_id: record.sprint_id,
                        sprint_name: record.sprint_name
                    })}>同步</a>
                    <a onClick={()=>{
                        setUploadType(record.upload_type);
                        console.log(record);
                        if(record.upload_type == 1) {
                            const fileInfo: any = {
                                uid: '1',
                                name: record.file_name,
                                url: record.oss_path,
                            }
                            setFileList([fileInfo]);
                            form.setFieldsValue({
                                ...record,
                                upload_file:{
                                    file: fileInfo,
                                    fileList: [fileInfo]
                                }
                            });
                        }
                        else{
                            form.setFieldsValue({
                                ...record,
                                space: projectDetail?.confluence_space_key
                            });
                            setFileList([]);
                        }
                        setIsEditSprint(true);
                        setEditId(record.id);
                        setAddsSprintModal(true);
                    }}>编辑</a>
                    <a onClick={()=>handleDeleteSprint(record.id)}>删除</a>
                </Space>
            )
        },
    ]
    const handleAddSprint = ()=>{
        form
            .validateFields()
            .then(async (values:any)=>{
                console.log(values);
                setLoading(true);
                const get_filename = (upload_type:number) =>{
                    if(upload_type === 2){
                        return '在线文档'
                    }
                    if(upload_type === 1){
                        return values.upload_file.file.name
                    }
                    return null
                }
                const res:any = await addProductFilesApi({
                    ...values,
                    product_id: isEditSprint ? editId : null,
                    project_id: searchParams.project_id,
                    sprint_id: values.sprint_id,
                    file_name: get_filename(values.upload_type),
                    oss_path: values.upload_file?.file.url,
                    online_path: values.online_path,
                    file_type: values.upload_type == 2 ? 'online' : null
                });
                if(res.success){
                    message.success(isEditSprint ? '编辑成功' : '添加成功');
                    setAddsSprintModal(false);
                    getPrds(searchParams);
                }
                setLoading(false);
            })
    }
    const handleDeleteSprint = async (product_id)=>{
        const res:any = await deleteProductFilesApi({
            product_id: product_id
        })
        if (res.success){
            message.success('删除成功');
            getPrds(searchParams);
        }
    };
    const handleAskAndAnwser = async (pages)=>{
        setAskAnswerOpen(true);
        setPages(pages);
    };
    const handleSyncJiraInfo = async (info)=>{
        setLoading(true);
        const res:any = await syncJiraInfoApi({
            ...info,
            project_id: searchParams.project_id
        })
        if(res.success){
            message.success('操作成功');
            getPrds(searchParams);
        }
        setLoading(false);
    }
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
                    getPrds(values);
                }}
                sprintStatus
            />
            <div className={styles.actionBar}>
                <Space>
                    <Button size={"small"} onClick={()=>{
                        setUploadType(3);
                        setFileList([]);
                        form.setFieldsValue({
                            space: projectDetail?.confluence_space_key
                        });
                        setIsEditSprint(false);
                        setAddsSprintModal(true);
                    }}>+新增需求</Button>
                </Space>
            </div>
            <Table
                loading={loading}
                columns={columns}
                dataSource={prdData}
                rowKey={'id'}
                scroll={{x: 1200}}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
            />

            <Modal
                title={isEditSprint ? '编辑产品文档' : '新增产品文档'}
                open={addsSprintModal}
                onCancel={()=>setAddsSprintModal(false)}
                okText={'确定'}
                cancelText={'取消'}
                onOk={handleAddSprint}
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
                        label={'文档类型'}
                        name={'upload_type'}
                        rules={[{ required: true }]}
                        initialValue={3}
                    >
                        <Radio.Group onChange={(e)=>setUploadType(e.target.value)}>
                            <Radio value={3}>wiki文档</Radio>
                            <Radio value={1}>本地pdf</Radio>
                            <Radio value={2}>在线文档</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item
                        label={'文档附件'}
                        name={'upload_file'}
                        rules={[{ required: uploadType == 1 }]}
                        hidden={uploadType !== 1}
                    >
                        <Upload.Dragger
                            customRequest={async (e:any)=>{
                                const {file, onSuccess} = e;
                                console.log(file);
                                const res = await uploadApi(file.name, file);
                                if(res){
                                    file.url = res
                                    onSuccess(file, e);
                                }


                            }}
                            fileList={fileList}
                            onChange={(info)=>{
                                let newFileList = [...info.fileList];
                                newFileList = newFileList.slice(-1);
                                newFileList = newFileList.map((file) => {
                                    return file;
                                });
                                setFileList(newFileList);
                            }}
                        >
                            <p>+upload</p>
                        </Upload.Dragger>
                    </Form.Item>
                    <Form.Item
                        label={'文档链接'}
                        name={'online_path'}
                        rules={[{ required: uploadType == 2 }]}
                        hidden={uploadType !== 2}
                    >
                    <Input />
                    </Form.Item>
                    <Form.Item
                        label={'空间'}
                        name={'space'}
                        rules={[{ required: uploadType == 3 }]}
                        hidden={uploadType !== 3}
                    >
                        <SelectWikiSpace />
                    </Form.Item>
                    <Form.Item
                        label={'页面'}
                        name={'page'}
                        rules={[{ required: uploadType == 3 }]}
                        hidden={uploadType !== 3}
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
            <GenCase
                searchParams={searchParams}
                open={genCaseOpen}
                onCancel={()=>setGenCaseOpen(false)}
                onGenerateCase={({cases, chat_id})=>{
                    setGenCaseData(cases);
                    setChatInfo({
                        ...chatInfo,
                        chat_id: chat_id
                    })
                    setGenCaseOpen(false);
                    setCasePreviewOpen(true);
                }}
            />
            <PdfPreview
                url={preViewInfo.url}
                open={preViewDrawer}
                onClose={()=>setPreViewDrawer(false)}
                onGenCase={()=>setGenCaseOpen(true)}
                onAsk={handleAskAndAnwser}
            />
            <HtmlPreview
                url={preViewInfo.url}
                open={htmlViewDrawer}
                onClose={()=>setHtmlViewDrawer(false)}
                onGenCase={()=>setGenCaseOpen(true)}
            />
            <GenCasePreview
                searchParams={{
                    ...searchParams,
                    sprint_id:preViewInfo.sprint_id
                }}
                open={casePreviewOpen}
                caseData={genCaseData}
                nodesData={nodesData}
                onSaveCase={()=>{
                    setCasePreviewOpen(false);
                    getPrds(searchParams);
                }}
                onCancel={()=>{
                    setCasePreviewOpen(false);
                    setGenCaseOpen(true);
                }}
                onOpenChat={()=>{
                    setCasePreviewOpen(false);
                    setChatDrawerOpen(true);
                }}
            />
            <AskAnswerModal
                sourcePage={'prd'}
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
                onSaveData={()=>getPrds(searchParams)}
            />
            <ChatFloatIcon
                spin
                style={{ width: 40, height: 40}}
                onClick={()=>setChatDrawerOpen(true)}
            />
            <JiraInfoModal
                open={jiraInfoOpen}
                data={editRowDate}
                type={jiraInfoviewType}
                onOK={()=>setJiraInfoOpen(false)}
            />


        </>

    )
}
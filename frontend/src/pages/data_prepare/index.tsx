import React, {useState, useEffect} from "react";
import { SearchSection } from '@/components/search'
import {
    Button, Col, Form, Input, InputNumber, message, Modal, Popconfirm, Radio, Row, Select,
    Space, Spin, Switch, Table, Tag, Tooltip, Upload
} from 'antd';
import {MinusCircleOutlined, PlusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import styles from '@/components/index.less';
import {uploadApi} from "@/apis/basic";
import {
    DataPrepareGetApi,
    DataPrepareDeleteApi,
    DataPrepareDeleteSheetApi,
    DataPrepareAddApi,
    DataPrepareAddSheetApi,
    DataPrepareGetSheetsApi,
    DataPrepareGetHeadersApi,
    DataPrepareSaveColumnsDemandApi,
    DataPrepareGenerateDataApi,
    DataPrepareDownloadApi, DataPrepareGetDetailApi,
    DataPrepareDownloadAllApi
} from '@/apis/dataPrepare'
import {GenResultModal} from "@/pages/data_prepare/genResultModal";
import {GenPreviewModal} from "@/pages/data_prepare/genPreviewModal";
import {LlmCreateChatApi, LlmExtractJsonApi} from "@/apis/llm";
import {formatDate} from "@/utils/utils";
import {ChatBodyDrawer, ChatFloatIcon} from "@/pages/ai_chat/chatCompononts";
import {PromptGetApi} from "@/apis/prompt";
import {AskAnswer} from "@/pages/data_prepare/askAnswer";


export default () =>{
    const [form] = Form.useForm();
    const [addSheetForm] = Form.useForm();
    const [demandForm] = Form.useForm();
    const [genDataForm] = Form.useForm();
    const data_type = Form.useWatch('data_type', genDataForm);
    const [searchParams, setSearchParams] = useState({
        project_id: '',
        sprint_id: '',
        node_id: 0
    });
    const [Data, setData] = useState([]);
    const [childData, setChildData] = useState([]);
    const [expandedRowKeys, setExpandedRowKeys] = useState([])
    const [addsDataModal, setAddsDataModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editInfo, setEditInfo] = useState(null);
    const [childEditInfo, setChildEditInfo] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [addSheetModal, setAddSheetModal] = useState(false);
    const [columnsDemandOpen, setColumnsDemandOpen] = useState(false);
    const [currentColumnsDemand, setCurrentColumnsDemand] = useState([]);
    const [sheetOptions, setSheetOptions] = useState([]);
    const [headerOptionsAll, setHeaderOptionsAll] = useState([]);
    const [headerOptions, setHeaderOptions] = useState([]);
    const [genDataOpen, setGenDataOpen] = useState(false);
    const [genResultOpen, setGenResultOpen] = useState(false);
    const [genPreViewOpen, setGenPreViewOpen] = useState(false);
    const [genPreViewData, setGenPreViewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chatInfo, setChatInfo] = useState({chat_id: null});
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [genResultType, setGenResultType] = useState(1);
    const [promptOption, setPromptOption] = useState([]);
    const [askAnswerOpen, setAskAnswerOpen] = useState(false);
    const columns = [
        {
            title: '编号',
            dataIndex: 'id',
            key: 'id',
            width: 70,
            render: (text: any, record: any, index: any) => `${index + 1}`,
        },
        {
            title: '基础模板',
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
            render:(text:any, record:any)=>formatDate(text)
        },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            // fixed: 'right',
            width: 350,
            render: (text:any, record:any) => (
                <Space.Compact size={"small"}>
                    <Button
                        size={"small"}
                        type={"link"}
                        onClick={()=>{
                            setAddSheetModal(true);
                            setEditInfo(record);
                            setChildEditInfo(null);
                            addSheetForm.resetFields();
                        }}
                    >添加sheet</Button>
                    <Popconfirm title={'下载数据'}
                                okText={'下载'}
                                cancelText={'取消'}
                                description={(
                                    <Radio.Group onChange={(e)=>setGenResultType(e.target.value)}>
                                        <Radio value={1}>正向</Radio>
                                        <Radio value={2}>逆向</Radio>
                                    </Radio.Group>
                                )}
                                onConfirm={()=>{
                                    handleDownloadDataAll(record.id, genResultType);
                                }}
                    >
                        <Button size={"small"} type={"link"}>下载</Button>
                    </Popconfirm>
                    <Button
                        size={"small"}
                        type={"link"}
                        onClick={()=>{
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
                        setEditInfo(record);
                        setAddsDataModal(true);
                        setIsEdit(true);
                    }}>编辑</Button>
                    <Popconfirm title={'确认删除？'}
                        onConfirm={()=>handleDeleteData(record.id)}
                    >
                        <Button
                            size={"small"}
                            type={"link"}
                        >删除</Button>
                    </Popconfirm>
                </Space.Compact>
            )
        },
    ];
    const expandedRowRender = (record: any)=>{
        const columns = [
            {
                title: 'sheet名',
                dataIndex: 'sheet_name',
                key: 'sheet_name',
                width: 200,
                render:(text:any, record:any)=>(
                    <Tag color={"green-inverse"}>{text}</Tag>
                )
            },
            {
                title: '头部行',
                dataIndex: 'header_row',
                key: 'header_row',
                width: 80,
            },
            {
                title: '数据行',
                dataIndex: 'data_row',
                key: 'data_row',
                width: 80,
            },
            {
                title: '规则行',
                dataIndex: 'rule_row',
                key: 'rule_row',
                width: 80,
            },
            {
                title: '字段逻辑',
                dataIndex: 'columns_demand',
                key: 'columns_demand',
                width: 500,
                render:(text:any, record:any) =>(
                    text.length === 0 ?(
                            <div>还未配置字段逻辑
                            <Button
                                    size={"small"}
                                    type={"link"}
                                    onClick={()=>{
                                        setColumnsDemandOpen(true);
                                        setChildEditInfo(record);
                                        handleGetHeaders(record.id);
                                        demandForm.setFieldsValue({
                                            columns_demand: record.columns_demand
                                        })
                                    }}
                                >配置</Button>
                            </div>
                        )


                        :
                     <>
                         <Space direction={"vertical"} style={{fontSize: 12}}>
                             {text.slice(0,record.column_length).map((x:any, index:number)=>{
                                 let description:any = [];
                                 x.unique && description.push('唯一');
                                 (x.len?.num && x.len?.symbol != 0) && description.push(((x.len.symbol === 1 ? '<=': '=') + x.len.num + '字符'));
                                 x.logistic && description.push(x.logistic);
                                 return (
                                     <Tooltip key={index} title={x.logistic}>
                                    <span>
                                        <b style={{color: "red"}}>{x.required ? '*' : null}</b><b>{x.name}:</b>
                                        {description.length > 0 ? description.join(',') : null}
                                    </span>
                                     </Tooltip>

                                 )
                             })}
                         </Space>
                         <div>
                             {
                                 text.length > record.column_length
                                     ?
                                     (<Button type={"link"} size={"small"}  style={{paddingLeft: 0}}
                                              onClick={()=>setChildData(childData.map((x:any)=>{
                                         if(x.id === record.id){
                                             x.column_length = x.column_length + 5
                                         }
                                         return x
                                     }))}>显示更多</Button>)
                                     :
                                     null
                             }
                             {
                                 record.column_length > 5
                                     ?
                                     (<Button type={"link"} size={"small"}  style={{paddingLeft: 0}}
                                              onClick={()=>setChildData(childData.map((x:any)=>{
                                         if(x.id === record.id){
                                             x.column_length = 5
                                         }
                                         return x
                                     }))}>收起</Button>)
                                     :
                                     null
                             }
                             <Button
                                 size={"small"}
                                 type={"link"}
                                 onClick={()=>{
                                     setColumnsDemandOpen(true);
                                     setChildEditInfo(record);
                                     handleGetHeaders(record.id);
                                     demandForm.setFieldsValue({
                                         columns_demand: record.columns_demand
                                     })
                                 }}
                             >配置</Button>
                         </div>

                     </>
                )
            },
            {
                title: '生成结果',
                dataIndex: 'generated_data',
                key: 'generated_data',
                width: 200,
                render: (text:any, record:any) =>(
                    (text.length === 0 && record.generated_data_abnormal.length === 0) ?
                        '-'
                        :
                    <>
                        {text.length > 0 ?
                            <Space>
                                <span>{text.length}条正向数据</span>
                                <Button
                                    size={"small"}
                                    type={"link"}
                                    style={{padding: 0}}
                                    onClick={()=>{
                                        setGenResultType(1);
                                        setGenResultOpen(true);
                                        setChildEditInfo(record);
                                    }}
                                >
                                    查看
                                </Button>
                            </Space>
                            : null
                        }
                        {record.generated_data_abnormal.length > 0 ?
                            <Space>
                                <span>{record.generated_data_abnormal.length}条逆向数据</span>
                                <Button
                                    size={"small"}
                                    type={"link"}
                                    style={{padding: 0}}
                                    onClick={()=>{
                                        setGenResultType(2);
                                        setGenResultOpen(true);
                                        setChildEditInfo(record);
                                    }}
                                >
                                    查看
                                </Button>
                            </Space>
                            : null
                        }

                    </>
                )
            },
            {
                title: '操作',
                dataIndex: 'operation',
                key: 'operation',
                // fixed: 'right',
                width: 200,
                render: (text:any, record:any) => (
                    <Space.Compact size={"small"}>
                        <Button
                            disabled={record.columns_demand.length === 0}
                            size={"small"}
                            type={"link"}
                            onClick={()=>{
                                setCurrentColumnsDemand(record.columns_demand);
                                setGenDataOpen(true);
                                setChildEditInfo(record);
                            }}
                        >
                            AI生成
                        </Button>
                        <Button
                            disabled={record.columns_demand.length === 0}
                            size={"small"}
                            type={"link"}
                            onClick={()=>{
                                setCurrentColumnsDemand(record.columns_demand);
                                setAskAnswerOpen(true);
                                setChildEditInfo(record);
                            }}
                        >
                            AI建议
                        </Button>

                        <Button
                            onClick={()=>{
                                console.log(record);
                                setChildEditInfo(record);
                                setAddSheetModal(true);
                                addSheetForm.setFieldsValue({
                                    ...record
                                })
                            }}
                            size={"small"}
                            type={"link"}
                        >编辑</Button>
                        <Popconfirm title={'确认删除？'}
                                    onConfirm={()=>handleDeleteSheetData(record.id)}
                        >
                            <Button
                                size={"small"}
                                type={"link"}
                            >删除</Button>
                        </Popconfirm>

                    </Space.Compact>
                )
            },
        ];
        const subTableSource = childData.filter((x: any) => x.template_id == record.id);
        return <Table columns={columns} rowKey={'id'} dataSource={subTableSource} pagination={false} />;

    };
    const getDetail = async (template_id)=>{
        const res:any = await DataPrepareGetDetailApi({
            template_id: template_id,
        });
        if(res.success){
            setChildData(res.data);
        }

    }
    const createChat = async ()=>{
        const res:any = await LlmCreateChatApi({
            project_id: searchParams.project_id,
        });
        if(res.success){
            setChatInfo({
                chat_id: res.data.id
            });
            return res.data.id
        }
        return null
    };
    const getData= async (values)=>{
        const res:any = await DataPrepareGetApi({...values});
        if (res.success){
            setData(res.data);
        }
    };
    const handleAddData = ()=>{
        form
            .validateFields()
            .then(async (values:any)=>{
                console.log(values);
                const res:any = await DataPrepareAddApi({
                    ...values,
                    template_id: isEdit ? editInfo?.id : null,
                    project_id: searchParams.project_id,
                    file_name: values.upload_file.file.name,
                    oss_path: values.upload_file?.file.url,
                });
                if(res.success){
                    message.success(isEdit ? '编辑成功' : '添加成功');
                    setAddsDataModal(false);
                    getData(searchParams);
                }
            })
    };
    const handleAddSheet = ()=>{
        addSheetForm
            .validateFields()
            .then(async (values:any)=>{
                const res:any = await DataPrepareAddSheetApi({
                    ...values,
                    template_id: editInfo?.id,
                    data_prepare_id: childEditInfo ? childEditInfo.id : undefined
                })
                if(res.success){
                    message.success('添加成功');
                    setAddSheetModal(false);
                    getDetail(editInfo?.id);
                }
            })
    };
    const handleDeleteData = async (template_id)=>{
        const res:any = await DataPrepareDeleteApi({
            template_id: template_id
        })
        if (res.success){
            message.success('删除成功');
            getData(searchParams);
        }
    };
    const handleDeleteSheetData = async (data_prepare_id)=>{
        const res:any = await DataPrepareDeleteSheetApi({
            data_prepare_id: data_prepare_id
        })
        if (res.success){
            message.success('删除成功');
            getDetail(editInfo?.id);
        }
    };
    const handleGetSheets = async ()=>{
        setSheetOptions([])
        const res:any = await DataPrepareGetSheetsApi({
            file_path: editInfo?.oss_path,
        })
        if (res.success){
            setSheetOptions(res.data);
        }
    };
    const handleGetHeaders = async (data_prepare_id:number)=>{
        const res:any = await DataPrepareGetHeadersApi({
            data_prepare_id: data_prepare_id,
        })
        if (res.success){
            setHeaderOptionsAll(res.data);
        }
    };
    const handleSaveColumnsDemand = async ()=>{
        demandForm
            .validateFields()
            .then(async (values:any)=>{
                // console.log(values);
                // return
                const res:any = await DataPrepareSaveColumnsDemandApi({
                    ...values,
                    data_prepare_id: childEditInfo?.id,
                })
                if (res.success){
                    message.success('操作成功');
                    getDetail(editInfo?.id);
                    setColumnsDemandOpen(false);
                }
            })

    };
    const handleSetColumnsDemandOptions = ()=>{
        const selectedOption = demandForm.getFieldsValue().columns_demand
            .map((x:any)=>x?.name);
        // console.log(selectedOption);
        setHeaderOptions(headerOptionsAll.filter((x:any)=>!selectedOption.includes(x.value)));
    };
    const handleGenerateData = async ()=>{
        genDataForm
            .validateFields()
            .then(async (values:any)=>{
                const chat_id = await createChat();
                setLoading(true);
                const res:any = await DataPrepareGenerateDataApi({
                    ...values,
                    columns_demand: currentColumnsDemand,
                    chat_id: chat_id,
                    ...searchParams
                })
                if (res.success){
                    const analysis_res:any = await LlmExtractJsonApi({
                        answer: res.data,
                    })
                    if (analysis_res.success){
                        // 为每一行加上key字段
                        setGenPreViewData(analysis_res.data.map((x, index:number)=>{
                            x.key = index + 1
                            return x
                        }));
                        setGenDataOpen(false);
                        setGenPreViewOpen(true);
                    }
                }
                setLoading(false);
            })

    };
    const handleDownloadDataAll = async (template_id:number, data_type:number)=>{
        const res:any = await DataPrepareDownloadAllApi({
            template_id: template_id,
            data_type: data_type
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([res.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        link.download = res.headers['content-disposition'].split('filename=')[1];
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleGetPrompt = async ()=>{
        const res:any = await PromptGetApi({
            project_id: searchParams.project_id,
            role: 5
        })
        if(res.success){
            setPromptOption(res.data.map((x:any)=>({label: x.name, value: x.id})));
        }
    };
    const handleSetRules = (value:string)=>{
        const option_rows = headerOptionsAll.filter(x=>x.value == value);
        if(option_rows.length > 0){
            console.log(option_rows);
            const temp = demandForm.getFieldsValue().columns_demand.map(x=>{
                if(x.name == value){
                    x.logistic = option_rows[0].rule
                }
                return x
            })
            demandForm.setFieldsValue({
                columns_demand: temp
            })
        }
    };
    const handleSetAllDemand = ()=>{
        demandForm.setFieldsValue({
            columns_demand: headerOptionsAll.map(x=>{
                return {name: x.value, required: x.required, len: {symbol: 0}, logistic: x.rule}
            })
        })
    };
    useEffect(()=>{
        handleGetPrompt();
    }, [searchParams])
    useEffect(()=>{
        promptOption.length > 0 && genDataForm.setFieldsValue({
            ...genDataForm.getFieldsValue(),
            prompt_id: promptOption[0].value
        });
    }, [promptOption])
    return (
        <>
            <SearchSection
                onSubmit={(values)=>{
                    setSearchParams({
                        ...values
                    })
                    getData(values);
                }}
            />
            <div className={styles.actionBar}>
                <Space>
                    <Button size={"small"} onClick={()=>{
                        setFileList([]);
                        form.resetFields();
                        setIsEdit(false);
                        setAddsDataModal(true);
                    }}>+数据模板</Button>
                </Space>
            </div>
            <Table
                columns={columns}
                dataSource={Data}
                rowKey={'id'}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
                expandedRowRender={expandedRowRender}
                expandedRowKeys={expandedRowKeys}
                onExpand={(isOpen, record)=>{
                    isOpen && setEditInfo(record);
                    isOpen ? setExpandedRowKeys([record.id]) : setExpandedRowKeys([]);
                    isOpen && getDetail(record.id);


                }}
            />

            <Modal
                title={isEdit ? '编辑数据模板' : '添加数据模板'}
                open={addsDataModal}
                onCancel={()=>setAddsDataModal(false)}
                okText={'确定'}
                cancelText={'取消'}
                onOk={handleAddData}
            >
                <Form
                    form={form}
                    style={{marginTop:20}}
                    labelCol={{span:4}}
                >
                    <Form.Item
                        label={'基础模板'}
                        name={'upload_file'}
                        rules={[{ required: true }]}
                    >
                        <Upload.Dragger
                            customRequest={async (e:any)=>{
                                const {file, onSuccess} = e;
                                console.log(file);
                                if(!file.name?.includes('.xlsx')){
                                    setFileList([]);
                                    return message.error('只支持上传xlsx格式数据');
                                }
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
                </Form>
            </Modal>
            <Modal
                title={'添加sheet'}
                open={addSheetModal}
                onCancel={()=>setAddSheetModal(false)}
                okText={'确定'}
                cancelText={'取消'}
                onOk={handleAddSheet}
            >
                <Form
                    form={addSheetForm}
                    style={{marginTop:20}}
                    labelCol={{span:4}}
                >
                    <Form.Item
                        label={'sheet'}
                        name={'sheet_name'}
                        rules={[{ required: true }]}
                    >
                        <Select
                            style={{width:200}}
                            options={sheetOptions}
                            onFocus={handleGetSheets}
                            notFoundContent={<Spin size="small" />}
                        />
                    </Form.Item>
                    <Form.Item
                        label={'头部行'}
                        name={'header_row'}
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={1}/>
                    </Form.Item>
                    <Form.Item
                        label={'数据行'}
                        name={'data_row'}
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={1}/>
                    </Form.Item>
                    <Form.Item
                        label={'规则行'}
                        name={'rule_row'}
                    >
                        <InputNumber min={1}/>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                open={columnsDemandOpen}
                title={'编辑字段逻辑与要求'}
                width={1000}
                onCancel={()=>setColumnsDemandOpen(false)}
                footer={[
                    <Button onClick={()=>setColumnsDemandOpen(false)}>取消</Button>,
                    <Button  type={"primary"} onClick={handleSetAllDemand}>一键配置</Button>,
                    <Button  type={"primary"} onClick={handleSaveColumnsDemand}>保存</Button>
                ]}
            >
                <Form
                    form={demandForm}
                    layout={"vertical"}
                    // hideRequiredMark
                >
                    <Form.List name="columns_demand">
                        {(fields, { add, remove }) => {
                            return (
                                <>
                                    {fields.map((field, index) => (
                                        <Space key={field.key} align={index === 0 ? 'center' :'start'}>
                                            <Form.Item
                                                name={[field.name, 'name']}
                                                label={index === 0 ? <b>字段名</b> : null}
                                                style={{marginBottom:10}}
                                                rules={[{ required: true, message: '请选择字段'}]}
                                            >
                                                <Select
                                                    options={headerOptions}
                                                    style={{width:150}}
                                                    onDropdownVisibleChange={handleSetColumnsDemandOptions}
                                                    onChange={(value:any)=>{
                                                        handleSetRules(value);
                                                    }}
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                name={[field.name, 'required']}
                                                label={index === 0 ? <b>必填</b>: null}
                                                style={{marginBottom:10}}
                                                initialValue={false}
                                            >
                                                <Switch
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                name={[field.name, 'unique']}
                                                label={index === 0 ? <b>唯一</b>: null}
                                                style={{marginBottom:10}}
                                                initialValue={false}
                                            >
                                                <Switch
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                name={'Len'}
                                                label={index === 0 ? <b>长度限制</b>: null}
                                                style={{marginBottom:10}}
                                            >
                                                <Space.Compact>
                                                    <Form.Item
                                                        initialValue={0}
                                                        name={[field.name, 'len', 'symbol']}
                                                        noStyle
                                                    >
                                                        <Select
                                                            style={{width: 70}}
                                                            options={[
                                                                {value: 0, label: '无'},
                                                                {value: 1, label: '<='},
                                                                {value: 2, label: '='}
                                                            ]}
                                                        />
                                                    </Form.Item>
                                                    <Form.Item
                                                        name={[field.name, 'len', 'num']}
                                                        noStyle
                                                    >
                                                        <InputNumber
                                                            style={{width: 70}}
                                                            controls={false}
                                                        />
                                                    </Form.Item>
                                                </Space.Compact>
                                            </Form.Item>
                                            <Form.Item
                                                name={[field.name, 'logistic']}
                                                label={index === 0 ? <b>逻辑</b> : null}
                                                style={{marginBottom:10}}
                                            >
                                                <Input.TextArea
                                                    placeholder={'为空的时候会根据字段的字面意思生成数据'}
                                                    style={{width:500}}
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
                                        添加要求
                                    </Button>
                                </>
                            );
                        }}
                    </Form.List>
                </Form>

            </Modal>
            <Modal
                title={<span>生成测试数据<i style={{fontWeight: "lighter", fontSize:14}}>（生成大量数据的时候建议让AI分多次会话返回数据）</i></span>}
                open={genDataOpen}
                width={700}
                okText={'生成数据'}
                cancelText={'取消'}
                onOk={handleGenerateData}
                onCancel={()=>setGenDataOpen(false)}
                confirmLoading={loading}
            >
                <Spin spinning={loading}>
                    <Form
                        form={genDataForm}
                        labelCol={{span: 3}}
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
                            label={'数据类型'}
                            name={'data_type'}
                            initialValue={1}
                        >
                            <Radio.Group>
                                <Radio value={1}>正向</Radio>
                                <Radio value={2}>逆向</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            label={'其它要求'}
                            name={'other_demands'}
                            style={{marginBottom: 0}}
                        >
                            <Input.TextArea
                                allowClear
                                autoSize={{minRows:3, maxRows:5}}
                                style={{width: 500}}
                                placeholder={'请输入其它要求,非必填'}
                            />
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 3}}>

                                {data_type == 1 ?
                                    (
                                        <Space>
                                            <a onClick={()=>{
                                                genDataForm.setFieldsValue({
                                                    ...genDataForm.getFieldsValue(),
                                                    other_demands: '只填必填'
                                                })
                                            }}>只填必填</a>
                                            <a onClick={()=>{
                                                genDataForm.setFieldsValue({
                                                    ...genDataForm.getFieldsValue(),
                                                    other_demands: '所有字段都填写数据'
                                                })
                                            }}>都填</a>
                                        </Space>
                                    )
                                    :
                                    (
                                        <Space>
                                            <a onClick={()=>{
                                                genDataForm.setFieldsValue({
                                                    ...genDataForm.getFieldsValue(),
                                                    other_demands: 'xxx字段生成各种异常数据'
                                                })
                                            }}>字段异常</a>
                                            <a onClick={()=>{
                                                genDataForm.setFieldsValue({
                                                    ...genDataForm.getFieldsValue(),
                                                    other_demands: '生成必填项为空的异常数据'
                                                })
                                            }}>必填项为空</a>
                                            <a onClick={()=>{
                                                genDataForm.setFieldsValue({
                                                    ...genDataForm.getFieldsValue(),
                                                    other_demands: '生成数据类型不正确的异常数据'
                                                })
                                            }}>格式异常</a>
                                            <a onClick={()=>{
                                                genDataForm.setFieldsValue({
                                                    ...genDataForm.getFieldsValue(),
                                                    other_demands: '生成边界超出或者低于范围的异常数据'
                                                })
                                            }}>边界异常</a>
                                        </Space>
                                    )}


                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
            <GenResultModal
                dataPrepareId={childEditInfo?.id}
                genResultType={genResultType}
                open={genResultOpen}
                onClose={()=>{
                    setGenResultOpen(false);
                }}
                onOk={()=>setGenResultOpen(false)}
                onDeleteResult={()=>{
                    getDetail(editInfo?.id);
                }}
            />
            <GenPreviewModal
                open={genPreViewOpen}
                onClose={()=>{
                    setGenPreViewOpen(false);
                    getDetail(editInfo?.id);
                }}
                genData={genPreViewData}
                dataPrepareId={childEditInfo?.id}
                dataType={genDataForm.getFieldsValue()?.data_type}
                onOpenChat={()=>{setChatDrawerOpen(true)}}
                onDelete={(key:number)=>{setGenPreViewData(genPreViewData.filter((x)=>x.key !== key))}}
            />
            <AskAnswer
                projectId={searchParams.project_id}
                open={askAnswerOpen}
                dataPrepareInfo={childEditInfo}
                onCancel={()=>setAskAnswerOpen(false)}
            />
            <ChatBodyDrawer
                open={chatDrawerOpen}
                onClose={()=>setChatDrawerOpen(false)}
                chat_id={chatInfo?.chat_id}
                onSaveData={()=>getData(searchParams)}
            />
            <ChatFloatIcon
                spin
                style={{ width: 40, height: 40}}
                onClick={()=>setChatDrawerOpen(true)}
            />
        </>
    )
}
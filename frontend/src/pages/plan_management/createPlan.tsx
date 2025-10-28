import React, {useState, useEffect} from "react";
import {history} from 'umi';
import {
    Button,
    Space,
    Steps,
    Table, Divider
} from 'antd';
import {formatDate, get_init_project} from "@/utils/utils";
import styles from './index.less';
import {Tag} from "antd";
import {getPrdPagesApi, getProductFilesApi} from "@/apis/prds";
import {projectsDetailApi} from "@/apis/basic";
import {
    TestBasis,
    UploadWiki,
    BusinessRisk,
    TestScope,
    TestStrategy, ExecutePlan, BusinessBackground, TestResource
} from "@/pages/plan_management/createPlanConponent";
import {ChatBodyDrawer, ChatFloatIcon} from "@/pages/ai_chat/chatCompononts";

export default () =>{
    const [projectId, setProjectId] = useState(get_init_project());
    const [projectDetail, setProjectDetail] = useState(null);
    const [current, setCurrent] = useState(0);
    const [prds, setPrds] = useState([]);
    const [prdInfo, setPrdInfo] = useState(null);
    const [prdText, setPrdText] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [businessBackground, setBusinessBackground] = useState(''); // 业务背景值
    const [testBasis, setTestBasis] = useState(''); // 测试依据
    const [businessRisk, setBusinessRisk] = useState(''); // 业务风险分析和约束 *
    const [testResource, setTestResource] = useState(''); // 测试资源
    const [testScopeHtml, setTestScopeHtml] = useState(''); // 测试范围、工时评估和任务分配 *
    const [testStrategy, setTestStrategy] = useState(''); // 测试策略
    const [executePlan, setExecutePlan] = useState(''); // 测试执行计划
    const [finalHtml, setFinalHtml] = useState(''); // 最终结果
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const next = () => {
        setCurrent(current + 1);
    };
    const stepsItem = [
        {key: '选择需求', title: '选择需求'},
        {key: '业务背景', title: '业务背景'},
        {key: '测试依据', title: '测试依据'},
        {key: '业务风险', title: '业务风险'},
        {key: '测试资源', title: '测试资源'},
        {key: '测试范围', title: '测试范围'},
        {key: '测试策略', title: '测试策略'},
        {key: '执行计划', title: '执行计划'},
        {key: '上传wiki', title: '上传wiki'}
    ];
    const prdColumns = [
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
            title: '用户故事',
            dataIndex: 'story',
            key: 'story',
            width: 100,
            render: (text: any, record: any, index: any) => (
                <span>{record?.story.length}</span>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'create_time',
            key: 'create_time',
            ellipsis: true,
            width: 200,
            render:(text:any, record:any)=>formatDate(text)
        },
    ];
    const handleProjectDetail = async ()=>{
        const res:any = await projectsDetailApi({
            project_id: projectId
        })
        if(res.success){
            setProjectDetail(res.data);
        }
    };
    const handleGetPrds = async ()=>{

        const res: any = await getProductFilesApi({
            project_id: projectId,
        });
        if (res.success) {
            setPrds(res.data);
        }

    };

    const getPrdPages = async (url) => {
        const res: any = await getPrdPagesApi({url: url, file_type: 'pdf'});
        if (res.success) {
            setPrdText(res.data);
        }

    };


    useEffect(()=>{
        projectId && handleProjectDetail()
    }, [projectId]);
    useEffect(()=>{
        projectId && handleGetPrds()
    }, []);
    useEffect(()=>{
        setFinalHtml(businessBackground + testBasis + businessRisk + testResource + testScopeHtml + testStrategy + executePlan)
    }, [businessBackground, testBasis, testResource, businessRisk, testScopeHtml, testStrategy, executePlan]);

    const prev = () => {
        setCurrent(current - 1);
    };
    return (
        <>
            <Steps
                current={current}
                items={stepsItem}
                onChange={(value:number)=>{setCurrent(value)}}
            />
            <div className={styles.stepContent}>
                {
                    current == 0 && (
                        <Table
                            rowKey={'id'}
                            dataSource={prds}
                            columns={prdColumns}
                            rowSelection={{
                                selectedRowKeys: prdInfo ? [prdInfo.id] : [],
                                type: 'radio',
                                onChange: (keys, rows)=>{
                                    setPrdInfo(rows.length > 0 ? rows[0] : null);
                                    rows.length > 0 && getPrdPages(rows[0].oss_path)
                                }
                            }}
                        />

                    )
                }
                <div hidden={current != 1}>
                    <BusinessBackground
                        projectId={projectId}
                        prdText={prdText}
                        prdInfo={prdInfo}
                        html={businessBackground}
                        isEdit={isEdit}
                        onGenerate={(html)=>setBusinessBackground(html)}
                    />
                </div>
                {projectDetail && (
                    <div hidden={current != 2}>
                        <TestBasis
                            isEdit={isEdit}
                            html={testBasis}
                            name={prdInfo?.sprint_name ? `${prdInfo.sprint_name}需求文档`: '需求文档'}
                            initSpace={projectDetail?.confluence_space_key}
                            onGenerate={(html)=>setTestBasis(html)}
                        />
                    </div>
                )}

                <div hidden={current != 3}>
                    <BusinessRisk
                        isEdit={isEdit}
                        html={businessRisk}
                        onGenerate={(html)=>setBusinessRisk(html)}
                    />
                </div>
                {projectDetail && (
                    <div hidden={current != 4}>
                        <TestResource
                            isEdit={isEdit}
                            html={testResource}
                            onGenerate={(html)=>setTestResource(html)}
                            projectDetail={projectDetail}
                        />
                    </div>
                )}

                <div hidden={current != 5}>
                    <TestScope
                        projectId={projectId}
                        prdText={prdText}
                        isEdit={isEdit}
                        html={testScopeHtml}
                        onGenerate={(html)=>setTestScopeHtml(html)}
                    />
                </div>
                <div hidden={ current != 6}>
                    <TestStrategy
                        isEdit={isEdit}
                        html={testStrategy}
                        onGenerate={(html)=>setTestStrategy(html)}
                    />
                </div>
                <div hidden={ current != 7}>
                    <ExecutePlan
                        isEdit={isEdit}
                        html={executePlan}
                        onGenerate={(html)=>setExecutePlan(html)}
                    />
                </div>
                {current == stepsItem.length - 1 && (
                    <>
                        <UploadWiki
                            projectId={projectId}
                            initSpace={projectDetail?.confluence_space_key}
                            initTitle={prdInfo?.sprint_name ? `${prdInfo.sprint_name}测试计划`: null}
                            finalHtml={finalHtml}
                            isEdit={isEdit}
                            onGenerate={(html)=>setFinalHtml(html)}
                        />
                    </>
                )}
            </div>
            <div>
                <Space>
                    <Button onClick={()=>history.push('/plan_management')}>返回计划列表</Button>
                    <Divider type={"vertical"}/>
                    <Button type={"primary"} disabled={current <= 0} onClick={prev}>上一步</Button>
                    <Button type={"primary"} disabled={current >= stepsItem.length - 1} onClick={next}>下一步</Button>
                    <Divider type={"vertical"}/>
                    <Button onClick={()=>setIsEdit(!isEdit)}>{isEdit ? '取消' : '编辑'}</Button>
                </Space>
            </div>
            <ChatBodyDrawer
                open={chatDrawerOpen}
                onClose={()=>setChatDrawerOpen(false)}
                // chat_id={chatInfo?.chat_id}
                onSaveData={()=>{
                }}
            />
            <ChatFloatIcon
                spin
                style={{ width: 40, height: 40}}
                onClick={()=>setChatDrawerOpen(true)}
            />
        </>
    )
}
import React, {useState, useEffect} from "react";
import { Resizable } from 'react-resizable';
import { CaseTable } from './caseTable'
import { CaseDetail } from './caseDetail'
import { SearchSection } from '@/components/search'
import {GenCase, GenCasePreview, OptimiseCase} from "@/components/myAntd";
import {
    Space,
    Button,
    message,
    Row, Col, Drawer, Popconfirm, Tabs,
} from 'antd'
import {
    getCaseApi,
    exportCasesApi,
    bunchDeleteCaseApi,
} from "@/apis/cases";
import {nodesGetApi} from "@/apis/nodes";
import {NodesTree, MoveCaseModal} from "@/pages/generate_cases/nodesTree";
import styles from './index.less';
import {ChatBodyDrawer, ChatFloatIcon} from "@/pages/ai_chat/chatCompononts";
import {ErrImportCasesResult} from "@/pages/generate_cases/ErrorImportCases";
import {CreateCase} from "@/pages/generate_cases/createCase";
import {CaseMind} from "@/pages/generate_cases/caseMind";
export default () =>{
    const [searchParams, setSearchParams] = useState({
        project_id: '',
        sprint_id: '',
        node_id: 0
    });
    const [caseData, setCaseData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nodesData, setNodesData] = useState([]);
    const [genCaseData, setGenCaseData] = useState([]);
    const [genCaseOpen, setGenCaseOpen] = useState(false);
    const [createCaseOpen, setCreateCaseOpen] = useState(false);
    const [caseDetailOpen, setCaseDetailOpen] = useState(false);
    const [casePreviewOpen, setCasePreviewOpen] = useState(false);
    const [caseOptimiseOpen, setCaseOptimiseOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [selectedCaseIds, setSelectedCaseIds] = useState([]);
    const [moveCaseOpen, setMoveCaseOpen] = useState(false);
    const [caseDtail, setCaseDtail] = useState({});
    const [isCopy, setIsCopy] = useState(false);
    const [showMind, setShowMind] = useState(false);
    const [chatInfo, setChatInfo] = useState({chat_id: null});
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [errorImportModalOpen, setErrorImportModalOpen] = useState(false);
    const [errorImportData, setErrorImportData] = useState({
        failed: [],
        total: 0
    });
    const[width, setWidth] = useState(200);

    const handleExportCases = async ()=>{
        setExporting(true);
        const res:any = await exportCasesApi({
            ...searchParams,
            case_list: selectedCaseIds
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([res.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        link.download = res.headers['content-disposition'].split('filename=')[1];
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExporting(false);
    };
    const getCases = async (values)=>{
        setLoading(true);
        const res:any = await getCaseApi({
            ...values,
            node_id: values.sprint_id ? values.node_id : 0
        })
        setLoading(false);
        if(res.success){
            setCaseData(res.data)
        }
    };
    const getNodes = async(values)=>{
        const res:any = await nodesGetApi({
            ...values
        });
        if (res.success){
            setNodesData(res.data);
        }
    };
    const handleOnChangedSelect = (keys:any)=>{
        setSelectedCaseIds(keys);
    }
    const handleBunchDeleteCase = async () =>{
      const res:any = await bunchDeleteCaseApi({
          case_ids: selectedCaseIds,
      });
      if (res.success){
          message.success('操作成功');
          getCases(searchParams);
          getNodes(searchParams);
      }
    };
    const handleOnCaseDetail = async (detailInfo)=>{
        setCaseDetailOpen(true);
        setCaseDtail({
            ...detailInfo
        });
    };

    return (
        <>
            <SearchSection
                onSubmit={(values)=>{
                    const newValues = {
                        ...values,
                        // node_id: searchParams.node_id
                    }
                    setSearchParams({
                        ...newValues
                    })
                    getCases(newValues);
                    getNodes(newValues);
                    setSelectedCaseIds([]);
                }}
            />
            <div className={styles.actionBar}>
                <Space>
                    {!showMind && (
                        <>
                            {selectedCaseIds.length > 0 ?
                                <span>当前一共选中{selectedCaseIds.length}条数据</span>:
                                null
                            }
                            <Button size={"small"} disabled={!searchParams?.sprint_id} onClick={()=>setGenCaseOpen(true)}>批量创建</Button>
                            <Button size={"small"} disabled={!searchParams?.sprint_id} onClick={()=>setCreateCaseOpen(true)}>创建</Button>
                            <Button size={"small"} disabled={selectedCaseIds.length === 0} onClick={()=>setCaseOptimiseOpen(true)}>优化</Button>
                            <Button size={"small"} disabled={genCaseData.length === 0} onClick={()=>setCasePreviewOpen(true)}>上次预览</Button>
                            <Button size={"small"} disabled={selectedCaseIds.length === 0} onClick={()=>{
                                setIsCopy(false);
                                setMoveCaseOpen(true);
                            }}>移动</Button>
                            <Button size={"small"} disabled={selectedCaseIds.length === 0} onClick={()=>{
                                setIsCopy(true);
                                setMoveCaseOpen(true);
                            }}>复制</Button>
                            <Popconfirm
                                title={`确认删除${selectedCaseIds.length}条数据？`}
                                placement={"topRight"}
                                onConfirm={handleBunchDeleteCase}
                            >
                                <Button size={"small"} disabled={selectedCaseIds.length === 0}>删除</Button>
                            </Popconfirm>
                            <Button size={"small"} onClick={()=>setShowMind(true)}>{'脑图浏览'}</Button>
                        </>
                    )}

                    {/*<Button size={"small"} onClick={handleExportCases} loading={exporting}>导出</Button>*/}
                </Space>
            </div>
            <Row wrap={false}>
                <Resizable
                    width={width}
                    height={0}
                    onResize={(event, {size})=>{
                        setWidth(size.width >= 0 ? size.width: 0);
                    }}
                    handle={
                        <div
                            className={styles.resizeHandle}
                        >

                        </div>
                    }

                >
                    <Col style={{width: width}} className={styles.nodeBox}>
                        <NodesTree
                            searchParams={searchParams}
                            nodesData={nodesData}
                            onChange={(values:any)=>{
                                setSearchParams({
                                    ...values
                                })
                                getNodes(values);
                                getCases(values);
                            }}
                            selectedCaseIds={selectedCaseIds}
                            onImportError={(errorData)=>{
                                setErrorImportData(errorData);
                                setErrorImportModalOpen(true);
                            }}
                            loading={loading}
                        />
                    </Col>
                </Resizable>

                <Col flex={'auto'}>

                    {
                        showMind ? (
                            <CaseMind
                                searchParams={searchParams}
                                nodesData={nodesData}
                                onSaveMinds={()=>{
                                    getNodes(searchParams);
                                    getCases(searchParams);
                                }}
                                onClose={()=>{setShowMind(false)}}
                            />
                        ) :
                            (
                                <CaseTable
                                    caseData={caseData}
                                    selectedIds={selectedCaseIds}
                                    OnChange={()=>{
                                        getNodes(searchParams);
                                        getCases(searchParams);
                                    }}
                                    onChangedSelect={handleOnChangedSelect}
                                    onEditCase={handleOnCaseDetail}
                                    loading={loading}
                                />
                            )
                    }


                </Col>
            </Row>

            <GenCase
                open={genCaseOpen}
                searchParams={searchParams}
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
            <GenCasePreview
                open={casePreviewOpen}
                searchParams={searchParams}
                nodesData={nodesData}
                caseData={genCaseData}
                onOpenChat={()=>{
                    setCasePreviewOpen(false);
                    setChatDrawerOpen(true);
                }}
                onSaveCase={()=>{
                    setCasePreviewOpen(false);
                    getCases(searchParams);
                    getNodes(searchParams);
                    setGenCaseData([]);
                }}
                onCancel={()=>{
                    setCasePreviewOpen(false);
                }}
            />
            <CreateCase
                open={createCaseOpen}
                onClose={()=>setCreateCaseOpen(false)}
                nodesData={nodesData}
                searchParams={searchParams}
                selectNode={searchParams?.node_id}
                onSaveCase={()=>{
                    getCases(searchParams);
                    getNodes(searchParams);
                }}
            />
            <MoveCaseModal
                open={moveCaseOpen}
                nodesData={nodesData}
                isCopy={isCopy}
                onCancel={()=>setMoveCaseOpen(false)}
                selectedCases={selectedCaseIds}
                onAfterMove={()=>{
                    setSelectedCaseIds([]);
                    getCases(searchParams);
                    getNodes(searchParams);
                }}
            />
            <CaseDetail
                open={caseDetailOpen}
                nodesData={nodesData}
                caseData={caseDtail}
                onClose={()=>setCaseDetailOpen(false)}
                onEdit={()=>{
                    setCaseDetailOpen(false);
                    getCases(searchParams);
                    getNodes(searchParams);
                }}
            />
            <OptimiseCase
                open={caseOptimiseOpen}
                cases={caseData.filter((x)=>selectedCaseIds.indexOf(x.id) >= 0)}
                searchParams={searchParams}
                onOptimiseCase={(cases, chat_id)=>{
                    setGenCaseData(cases);
                    setCaseOptimiseOpen(false);
                    setCasePreviewOpen(true);
                    setChatInfo({
                        ...chatInfo,
                        chat_id: chat_id
                    })
                }}
                onCancel={()=>setCaseOptimiseOpen(false)}
            />
            <ChatBodyDrawer
                open={chatDrawerOpen}
                onClose={()=>setChatDrawerOpen(false)}
                chat_id={chatInfo?.chat_id}
                onSaveData={()=>{
                    getCases(searchParams);
                    getNodes(searchParams);

                }}
            />
            <ErrImportCasesResult
                open={errorImportModalOpen}
                onCancel={()=>setErrorImportModalOpen(false)}
                errorDate={errorImportData}
            />
            <ChatFloatIcon
                spin
                style={{ width: 40, height: 40}}
                onClick={()=>setChatDrawerOpen(true)}
            />
        </>

    )
}
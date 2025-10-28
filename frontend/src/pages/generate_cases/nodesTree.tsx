import {FunctionComponent, useState} from "react";
import {nodesAddApi, nodesDeleteApi, nodesEditApi, nodesDragNodeApi, nodesGetMSNodesApi} from "@/apis/nodes";
import {importCaseApi} from "@/apis/cases";
import {bunchMoveCaseApi, bunchCopyCaseApi} from "@/apis/cases";
import {
    Tree,
    Button, Space, message, Input, ConfigProvider, Modal, Popconfirm, Spin, Select, Cascader
} from 'antd'
import {PlusOutlined, MinusOutlined, EditOutlined} from '@ant-design/icons';
import './index.less'
export const NodesTree:FunctionComponent = (props: any) =>{
    const {nodesData, searchParams, onChange, onImportError, selectedCaseIds, loading} = props;
    const [selectNodeId, setSelectNodeId] = useState(null);
    const [addNodeName, setAddNodeName] = useState('');
    const [editNodeName, setEditNodeName] = useState('');
    const [MsNodes, setMsNodes] = useState([]);
    const [MsNodesPath, setMsNodesPath] = useState('迭代用例');
    const [syncing, setSyncing] = useState(false);
    const handleAddNode = async(name:string)=>{
        const res:any = await nodesAddApi({
            ...searchParams,
            parent_node_id: selectNodeId,
            node_name: name
        })
        if(res.success){
            message.success('添加成功');
            onChange({
                ...searchParams
            });
        }
    };
    const handleEditNode = async(name:string) =>{
        const res:any = await nodesEditApi({
            node_id: selectNodeId,
            name: name
        })
        if(res.success){
            message.success('操作成功');
            onChange({
                ...searchParams
            });
        }
    }
    const handleDeleteNode = async()=>{
        const res:any = await nodesDeleteApi({
            node_id: selectNodeId,
        })
        if(res.success){
            message.success('操作成功');
            onChange({
                ...searchParams
            });
        }
        setSelectNodeId(null);
    };
    const handleImportToMs = async() =>{
        if(!MsNodesPath){
            message.error('请选择存放路径！');
            return
        }
        setSyncing(true);
        const res:any = await importCaseApi({
            project_id: searchParams.project_id,
            sprint_id: searchParams.sprint_id,
            node_id: selectNodeId,
            case_list: selectedCaseIds,
            ms_node_path: MsNodesPath
        })
        if(res.success){
            if(res.data.failed.length > 0){
                onImportError(res.data);
            }
            message.success('操作成功');
        }
        setSyncing(false);
    };
    const handleOnDrop = async(info)=>{
        let parent_node_id;
        let position;
        console.log(info);
        // const dropPos = info.node.pos.split('-');
        // const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        if(info.dropToGap){   //插入缝隙中而不是子节点
            parent_node_id = info.node.parent_id || 0;
            position = info.dropPosition
        }
        else{
            position = 0;
            parent_node_id = info.node.value || 0;
        }
        const res:any = await nodesDragNodeApi({
            project_id: searchParams.project_id,
            sprint_id: searchParams.sprint_id,
            drag_node_id: info.dragNode.value,
            target_parent_id:parent_node_id,
            position: position
        })
        if(res.success){
            message.success('操作成功');
            onChange({
                ...searchParams
            });
        }
    };
    const handleGetMSNodes = async ()=>{
        const res:any = await nodesGetMSNodesApi({
            ...searchParams
        })
        if(res.success){
            setMsNodes(res.data);
        }
    }

    return <>
        {searchParams?.sprint_id && nodesData.length > 0 && nodesData[0].children ?
            <Spin spinning={loading}>
                <Popconfirm
                    title={'导入Metersphere'}
                    description={(
                        <Space>
                            <Cascader
                                allowClear
                                changeOnSelect
                                expandTrigger={"hover"}
                                value={MsNodesPath}
                                options={MsNodes}
                                fieldNames={{label:'label', value: 'name', children: 'children'}}
                                defaultValue={'迭代用例'}
                                onChange={(values, selectedOptions)=>{
                                    // console.log(values);
                                    values.length >0 && setMsNodesPath(values.join('/'))
                                }}
                                dropdownRender={(menus)=>{
                                    if(MsNodes.length === 0){
                                        return <Spin />
                                    }
                                    return menus
                                }}
                            />
                            <span>
                                /
                            </span>
                            <span>
                                   {nodesData[0]?.title}
                            </span>
                        </Space>
                    )}
                    okText={"确认"}
                    cancelText={"取消"}
                    onConfirm={handleImportToMs}
                >
                    <Button
                        type={"link"}
                        size={"small"}
                        disabled={syncing || (selectNodeId == null && selectedCaseIds.length==0)}
                        style={{marginBottom:10}}
                        onClick={handleGetMSNodes}
                    >{syncing ? '导入中' : '导入metersphere'}</Button>
                </Popconfirm>

                <ConfigProvider
                    theme={{
                        components: {
                            Tree: {
                                nodeSelectedBg: '#99a0ac',
                                colorBgContainer: null,
                            },
                        },
                    }}
                >
                    <Tree
                        style={{marginRight: 5}}
                        showLine
                        blockNode
                        draggable={{icon:false}}
                        onDrop={handleOnDrop}
                        treeData={nodesData}
                        defaultExpandAll={true}
                        onSelect={(selectedKeys:any, e)=>{
                            if (e.selected){
                                setSelectNodeId(selectedKeys[0]);
                                onChange({
                                    ...searchParams,
                                    node_id: selectedKeys[0]
                                })
                            }
                            else{
                                setSelectNodeId(null);
                            }

                        }}
                        titleRender={(nodeData:any)=>(
                            <>
                                <span className={"nodeText"}>{`${nodeData.title}(${nodeData.case_num})`}</span>
                                <Space className={'nodeOperation'}>
                                    {
                                        (selectNodeId != null && nodeData.key == selectNodeId) ?
                                            <Popconfirm
                                                icon={null}
                                                okText={'添加'}
                                                showCancel={false}
                                                onConfirm={()=>{
                                                    addNodeName && handleAddNode(addNodeName)
                                                }}
                                                description={<Input
                                                    value={addNodeName}
                                                    onChange={(e:any)=>setAddNodeName(e.target.value)}
                                                    onClick={(e)=>{e.stopPropagation()}}
                                                />}
                                            >
                                                <PlusOutlined
                                                    onClick={(e)=>{
                                                        e.stopPropagation();
                                                        setAddNodeName('');
                                                    }}
                                                />
                                            </Popconfirm>

                                            : null
                                    }
                                    {
                                        (selectNodeId && nodeData.key == selectNodeId) ?
                                            <MinusOutlined
                                                onClick={(e)=>{
                                                    e.stopPropagation();
                                                    handleDeleteNode();
                                                }}
                                            />
                                            : null
                                    }
                                    {
                                        (selectNodeId && nodeData.key == selectNodeId) ?
                                            <Popconfirm
                                                icon={null}
                                                okText={'编辑'}
                                                showCancel={false}
                                                onConfirm={()=>{
                                                    editNodeName && handleEditNode(editNodeName)
                                                }}
                                                description={<Input
                                                    value={editNodeName}
                                                    onChange={(e:any)=>setEditNodeName(e.target.value)}
                                                    onClick={(e)=>{e.stopPropagation()}}
                                                />}
                                            >
                                                <EditOutlined
                                                    onClick={(e)=>{
                                                        e.stopPropagation();
                                                        setEditNodeName(nodeData.title);
                                                    }}
                                                />
                                            </Popconfirm>
                                            : null
                                    }
                                </Space>

                            </>
                        )}
                    />
                </ConfigProvider>
            </Spin>
            :
            <span>请先选择迭代</span>
        }
    </>


}

export const MoveCaseModal:FunctionComponent = (props: any) =>{
    const {nodesData, isCopy, selectedCases, open, onCancel, onAfterMove} = props;
    const [selectNodeId, setSelectNodeId] = useState(null);
    const handleMoveCase =async()=>{
        console.log(selectNodeId);
        const res:any = await bunchMoveCaseApi({
            case_ids: selectedCases,
            target_node_id: selectNodeId
        })
        if (res.success){
            message.success('操作成功');
            onCancel();
            onAfterMove()
        }
    };
    const handleCopyCase =async()=>{
        // console.log(selectNodeId);
        const res:any = await bunchCopyCaseApi({
            case_ids: selectedCases,
            target_node_id: selectNodeId
        })
        if (res.success){
            message.success('操作成功');
            onCancel();
            onAfterMove()
        }
    };
    return <>
        <Modal
            open={open}
            // title={`移动${selectedCases.length}条用例至`}
            title={(isCopy ? '复制': '移动') + selectedCases.length + '条用例至'}
            onCancel={onCancel}
            onOk={()=>{
                isCopy ? handleCopyCase() : handleMoveCase()
            }}
            okButtonProps={{
                disabled: selectNodeId == null
            }}
            okText={'移动'}
            cancelText={'取消'}
        >
            {nodesData[0]?.children ?
                <Tree
                    // rootStyle={{background: "none"}}
                    showLine={true}
                    blockNode
                    treeData={nodesData}
                    defaultExpandAll={true}
                    onSelect={(selectedKeys:any, e)=>{
                        if (e.selected){
                            setSelectNodeId(selectedKeys[0]);
                        }
                        else{
                            setSelectNodeId(null);
                        }

                    }}
                />
            : '加载中'}


        </Modal>
    </>


}

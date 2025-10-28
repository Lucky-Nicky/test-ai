import {FunctionComponent, useState} from "react";
import {nodesAddApi, nodesDeleteApi, nodesEditApi, nodesDragNodeApi} from "@/apis/nodes";
import {importCaseApi} from "@/apis/cases";
import {bunchMoveCaseApi, bunchCopyCaseApi} from "@/apis/cases";
import {
    Tree,
    Button, Space, message, Input, ConfigProvider, Modal, Popconfirm
} from 'antd'
import {PlusOutlined, MinusOutlined, EditOutlined} from '@ant-design/icons';
import './index.less'
export const NodesTree:FunctionComponent = (props: any) =>{
    const {nodesData, searchParams, onChange} = props;

    return <>
        {searchParams?.sprint_id && nodesData.length > 0 && nodesData[0].children ?
            <>
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
                        treeData={nodesData}
                        defaultExpandAll={true}
                        onSelect={(selectedKeys:any, e)=>{
                            if (e.selected){
                                onChange({
                                    ...searchParams,
                                    node_id: selectedKeys[0]
                                })
                            }

                        }}
                        titleRender={(nodeData:any)=>(
                            <>
                                <span className={"nodeText"}>{`${nodeData.title}(${nodeData.case_num})`}</span>
                            </>
                        )}
                    />
                </ConfigProvider>
            </>
            :
            <span>请先选择迭代</span>
        }
    </>
}


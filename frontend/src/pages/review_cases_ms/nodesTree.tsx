import {FunctionComponent, useState} from "react";
import {
    Tree,
    ConfigProvider
} from 'antd'
import './index.less'
export const NodesTree:FunctionComponent = (props: any) =>{
    const {nodesData, onChange} = props;

    return <>
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
                {nodesData.length > 0 ? (
                        <Tree
                            style={{marginRight: 5}}
                            showLine
                            blockNode
                            treeData={nodesData}
                            defaultExpandAll={true}
                            onSelect={(selectedKeys:any, e)=>{
                                const getAllNodes = (obj)=>{
                                    let nodes = [];
                                    obj.forEach(x=>{
                                        if (x.id){
                                            nodes.push(x.id)
                                        }
                                        if (x.children){
                                            nodes = nodes.concat(getAllNodes(x.children));
                                            onChange(nodes);
                                        }
                                    })

                                    return nodes;
                                }
                                if (e.selected){
                                    // console.log(e.selectedNodes);
                                    onChange(getAllNodes(e.selectedNodes));
                                }

                            }}
                            titleRender={(nodeData:any)=>(
                                <>
                                    <span className={"nodeText"}>{`${nodeData.name}(${nodeData.caseNum})`}</span>
                                </>
                            )}
                        />
                ) :

                '暂无模块信息'}

            </ConfigProvider>
        </>
    </>
}


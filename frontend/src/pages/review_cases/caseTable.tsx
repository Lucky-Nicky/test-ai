import {FunctionComponent, useState, useEffect} from "react";
import {
    Table,
    Space,
    Tag,
    Button,
} from 'antd'
import {formatDate} from "@/utils/utils";

const CaseTable:FunctionComponent = (props: any) =>{
    const {caseData, onAIReview, onShowHistory, loading} = props;
    const columns = [
        {
            title: '编号',
            dataIndex: 'id',
            key: 'id',
            width: 70
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            width: 200
        },
        {
            title: '等级',
            dataIndex: 'priority',
            key: 'priority',
            width: 70,
            render: (text:any, record:any)=>{
                switch (text?.toUpperCase()){
                    case 'P1':
                        return <Tag color={'#f80'}>{text}</Tag>
                    case 'P2':
                        return <Tag color={'#783887'}>{text}</Tag>
                    case 'P3':
                        return <Tag color={'#00d6b9'}>{text}</Tag>
                    default:
                        return <Tag>{text}</Tag>
                }
            }
        },
        {
            title: '评审状态',
            dataIndex: 'review_status',
            key: 'review_status',
            width: 100,
            render: (text, record) =>{
                switch (text) {
                    case 0:
                        return <Tag color={"green-inverse"}>通过</Tag>
                    case 1:
                        return <Tag color={'red-inverse'}>未通过</Tag>
                    default:
                        return <Tag>未评审</Tag>
                }
            }
        },
        {
            title: '前置条件',
            dataIndex: 'precondition',
            key: 'precondition',
            ellipsis: true,
            width: 200
        },
        {
            title: '用例步骤',
            dataIndex: 'description',
            key: 'description',
            width: 400,
            render: (text:any, record:any) =>(
                <Space direction={"vertical"} style={{fontSize:12}}>
                    {text.slice(0, 5).map((x:any, index:number)=>{
                        return (
                            <span key={index} title={x.steps} >{x.steps || '-'}</span>
                        )
                    })}
                    <Space>
                        {
                            text.length > 5
                                ?
                                <span>已隐藏{text.length - 5}条步骤</span>
                                : null
                        }
                    </Space>
                </Space>
            )
        },
        {
            title: '预期结果',
            dataIndex: 'description',
            key: 'description',
            width: 400,
            render: (text:any, record:any) =>(
                <Space direction={"vertical"}  style={{fontSize:12}}>
                    {text.slice(0, 5).map((x:any, index:number)=>{
                    return (
                    <span key={index}>{x.expect_result || '-'}</span>
                    )
                })}
                    <Space>
                        {
                            text.length > 5
                                ?
                                <span>已隐藏{text.length - 5}条结果</span>
                                :
                                null
                        }
                    </Space>
                </Space>
            )
        },
        {
            title: '迭代',
            dataIndex: 'sprint_name',
            key: 'sprint_name',
            width: 100,
            ellipsis: true,
        },
        {
            title: '创建时间',
            dataIndex: 'create_time',
            key: 'create_time',
            width: 100,
            ellipsis: true,
            render:(text:any, record:any)=>formatDate(text)
        },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            width: 120,
            fixed:'right',
            render: (row:any, record:any, index:number) =>(
                <Space size={"small"}>
                    <Button type={'link'} size={'small'} disabled={loading} onClick={()=>{
                        onAIReview(record.id, index);
                    }}>评审</Button>
                    <Button type={'link'} size={'small'} onClick={()=>{
                        onShowHistory(record.id);
                    }}>记录</Button>
                </Space>
            )
        },
    ]
    return (
        <>
            <Table
                columns={columns}
                rowKey={'id'}
                dataSource={caseData}
                scroll={{x:800}}
                pagination={{defaultPageSize:10, showSizeChanger: true,showTotal:(total)=>`共${total}条`}}
            >

            </Table>
        </>

    )
}
export {CaseTable}
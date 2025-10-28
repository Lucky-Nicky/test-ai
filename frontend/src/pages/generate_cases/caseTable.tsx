import {FunctionComponent, useState, useEffect} from "react";
import type { MenuProps } from 'antd';
import {deleteCaseApi} from '@/apis/cases'
import {
    Table,
    Space,
    Tag,
    Button,
    message, Popconfirm
} from 'antd'
import {formatDate} from "@/utils/utils";

const CaseTable:FunctionComponent = (props: any) =>{
    const {selectedIds, caseData, OnChange, onChangedSelect, onEditCase, loading} = props;
    const [selectedCaseIds, setSelectedCaseIds] = useState([]);
    const deleteCase = async(case_id:number)=>{
        const res:any = await deleteCaseApi({case_id: case_id});
        if (res.success){
            message.success('删除成功');
            OnChange()
        }
    }
    const columns = [
        {
            title: '编号',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            width: 300
        },
        {
            title: '等级',
            dataIndex: 'priority',
            key: 'priority',
            width: 80,
            filters: [
                {text: 'P1', value: 'P1'},
                {text: 'P2', value: 'P2'},
                {text: 'P3', value: 'P3'},
            ],
            onFilter:(value, record)=>record.priority == value,
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
            width: 350,
            ellipsis: true,
            render: (text:any, record:any) =>(
                <Space direction={"vertical"} style={{fontSize:12}}>
                    {text.slice(0, 5).map((x:any, index:number)=>{
                        return (
                            <span
                                key={index}
                                title={x.steps}
                            >{x.steps || '-'}</span>
                        )
                    })}
                    <Space>
                        {
                            text.length > 5
                                ?
                                <span>已隐藏{text.length - 5}条步骤<a onClick={()=>onEditCase(record)}>显示所有</a></span>
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
            width: 350,
            ellipsis: true,
            render: (text:any, record:any) =>(
                <Space direction={"vertical"}  style={{fontSize:12}}>
                    {text.slice(0, 5).map((x:any, index:number)=>{
                    return (
                    <span
                        key={index}
                        title={x.expect_result}
                    >{x.expect_result || '-'}</span>
                    )
                })}
                    <Space>
                        {
                            text.length > 5
                                ?
                                <span>已隐藏{text.length - 5}条结果<a onClick={()=>onEditCase(record)}>显示所有</a></span>
                                :
                                null
                        }
                    </Space>
                </Space>
            )
        },
        // {
        //     title: '评审状态',
        //     dataIndex: 'review_status',
        //     key: 'review_status',
        //     width: 100,
        //     render: (text, record) =>{
        //         switch (text) {
        //             case 0:
        //                 return <Tag color={"green-inverse"}>通过</Tag>
        //             case 1:
        //                 return <Tag color={'red-inverse'}>未通过</Tag>
        //             default:
        //                 return <Tag>未评审</Tag>
        //         }
        //     }
        // },
        {
            title: '迭代',
            dataIndex: 'sprint_name',
            key: 'sprint_name',
            width: 100,
            ellipsis: true,
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
            width: 110,
            ellipsis: true,
            sorter: (a, b) => {
                return a.create_time - b.create_time
            },
            render:(text:any, record:any)=>formatDate(text)
        },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            width: 120,
            fixed:'right',
            render: (row:any, record:any) =>(
                <Space size={"small"}>
                    <Button type={'link'} size={'small'} onClick={()=>onEditCase(record)}>详情</Button>
                    <Popconfirm
                        placement={'topRight'}
                        title={'确认删除用例?'}
                        onConfirm={()=>deleteCase(record.id)}
                    >
                        <Button type={'link'}  size={'small'}>删除</Button>
                    </Popconfirm>

                </Space>
            )
        },
    ];
    useEffect(()=>{
        setSelectedCaseIds(selectedIds);
    }, [selectedIds]);
    return (
        <>
            <Table
                loading={loading}
                columns={columns}
                rowKey={'id'}
                dataSource={caseData}
                scroll={{x:2000}}
                rowSelection={{
                    selectedRowKeys: selectedCaseIds,
                    onChange:(keys, rows)=>{
                        setSelectedCaseIds(keys);
                        onChangedSelect(keys);
                    }
                }}
                pagination={{defaultPageSize:10, showSizeChanger: true,showTotal:(total)=>`共${total}条`}}

            >

            </Table>
        </>

    )
}
export {CaseTable}
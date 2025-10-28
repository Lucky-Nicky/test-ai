import React, {useState, useEffect } from "react";
import {
    Button,
    message,
    Space,
    Table, Tag,
} from "antd";
import {formatDate} from "@/utils/utils";
import {LlmGetApi, LlmSwitchDefaultApi} from "@/apis/llm";

export default () =>{
    const [loading, setLoading] = useState(false);
    const handleSwitchDefault = async (llm_id)=>{
        const res:any = await LlmSwitchDefaultApi({
            llm_id: llm_id
        })
        if (res.success){
            message.success('操作成功!');
            handleGetLLMData();
        }
    }
    const columns = [
        {
            title: '模型名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text: any, record: any, index: any) => (
                <Tag color={record.default == 0 ? 'green' : 'green-inverse'}>{text}</Tag>
            ),
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
        },
        // {
        //     title: '激活',
        //     dataIndex: 'default',
        //     key: 'default',
        //     width: 200,
        //     render: (text: any, record: any, index: any) => (
        //         <span>{text == 0 ? '否' : '当前使用中' }</span>
        //     ),
        // },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            render: (text: any, record: any, index: any) => (
                <Space>
                    <Button
                        type={"link"}
                        disabled={record.default == 1}
                        onClick={()=>handleSwitchDefault(record.id)}
                    >切换</Button>
                </Space>
            ),
        },

    ];
    const [LLMData, setLLMData] = useState([]);
    const handleGetLLMData = async ()=>{
        const res:any = await  LlmGetApi({});
        if(res.success){
            setLLMData(res.data);
        }
    }

    useEffect(()=>{
        handleGetLLMData();
    }, [])

    return (
        <>
            <Table
                loading={loading}
                columns={columns}
                dataSource={LLMData}
                rowKey={'sprint_id'}
                pagination={{showSizeChanger: true, showTotal:(total)=>`共${total}条`,}}
            />
        </>
    )
}

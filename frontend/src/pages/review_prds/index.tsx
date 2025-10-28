import React, {useState, useEffect} from "react";
import {history} from 'umi';
import {
    Table,
    message,
    Space,
    Tag

} from 'antd'
import {
    getProductFilesApi,
} from '@/apis/prds';
import {SearchSection} from '@/components/search';
import {formatDate} from "@/utils/utils";



export default ()=> {
    const [searchParams, setSearchParams] = useState({
        project_id: '',
        sprint_id: '',
    });
    const [prdData, setPrdData] = useState([]);
    const [loading, setLoading] = useState(false);
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
            title: '评审状态',
            dataIndex: 'review_status',
            key: 'review_status',
            width: 100,
            render: (text:any, record:any)=>{
                switch (text){
                    case '失败':
                        return <Tag color={'#f55'}>{text}</Tag>;
                    case '进行中':
                        return <Tag color={"yellow-inverse"}>{text}</Tag>
                    case '已完成':
                        return <Tag color={"green-inverse"}>{text}</Tag>
                    default:
                        return <Tag color={'#b0b8b8'}>{text}</Tag>
                }
            }
        },
        {
            title: '故事',
            dataIndex: 'story',
            key: 'story',
            width: 70,
            render: (text:any, record:any)=>(
                <span>{text.length}</span>
            )
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
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
                    <a onClick={()=>{
                        if(!record.oss_path){
                            message.info('暂不支持非PDF文档评审');
                            return
                        }
                        history.push('/review_prds_detail/' + record.id);
                    }}>详情</a>

                </Space>
            )
        },
    ]
    const getPrds = async (values)=>{
        const res:any = await getProductFilesApi({...values});
        if (res.success){
            setPrdData(res.data);
        }
    };

    return (
        <>
            <SearchSection
                onSubmit={(values)=>{
                    setSearchParams({
                        ...values,
                    })
                    getPrds(values);
                }}
                sprintStatus
            />
            <Table
                style={{marginTop: 30}}
                // loading={loading}
                columns={columns}
                dataSource={prdData}
                rowKey={'id'}
                // scroll={{x: 1200}}
                // pagination={{defaultPageSize:10, showSizeChanger: true}}
            />

        </>

    )
}
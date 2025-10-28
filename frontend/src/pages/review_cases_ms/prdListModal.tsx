import React, {FunctionComponent, useEffect, useState} from "react";
import {
    message,
    Modal, Space, Tag, Table
} from 'antd';
import {getPrdPagesApi, getProductFilesApi} from "@/apis/prds";
import {formatDate} from "@/utils/utils";

export const PrdListModal: FunctionComponent = (props: any) => {
    const {open, onSelectNoPrdReview, onCancel, onselectPrd, projectId} = props;
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
            ellipsis: true,
            render: (text: any, record: any, index: any) => (
                <Tag color={'#2db7f5'}>{text}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
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
            render: (text:any, record:any) => (
                <Space size={"small"}>
                    <a onClick={async (e)=>{
                        if(!record.oss_path){
                            message.info('暂时只支持PDF需求')
                            return
                        }
                        onselectPrd(record, await getPrdPages(record.oss_path));
                    }}>选择</a>

                </Space>
            )
        },
    ];
    const getPrds = async (values) => {
        setLoading(true);
        const res: any = await getProductFilesApi({...values});
        if (res.success) {
            setPrdData(res.data);
        }
        setLoading(false);
    };
    const getPrdPages = async (url) => {
        setLoading(true);
        const res: any = await getPrdPagesApi({url: url, file_type: 'pdf'});
        setLoading(false);
        if (res.success) {
            return res.data;
        }

    }
    useEffect(()=>{
        getPrds({
            project_id: projectId
        })
    }, [])
    return (
        <Modal
            width={1000}
            open={open}
            onOk={onSelectNoPrdReview}
            onCancel={onCancel}
            okText={'无需求评审'}
            cancelText={'关闭'}
        >
            <Table
                loading={loading}
                dataSource={prdData}
                columns={columns}
                rowKey={'id'}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
            />
        </Modal>
    )
}


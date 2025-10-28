import React, { useState, useEffect} from "react";
import {Space, Table, Tag} from "antd";
import {MSGetReviewListApi} from "@/apis/reviewCasesMS";
import {SearchSection} from "@/pages/review_cases_ms/search";
import {history} from "umi";
import {formatDate} from "@/utils/utils";

export default ()=> {
    const [searchParams, setSearchParams] = useState({
        project_id: '',
        sprint_id: '',
        node_id: 0
    });
    const [reviewList, setReviewList] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const columns = [
        {
            title: '评审名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (text:any, record:any)=>(
                text == 'Finished' ?
                    <Tag color={"green-inverse"}>完成</Tag>
                    :
                    <Tag color={"yellow-inverse"}>进行中</Tag>
            )
        },
        {
            title: '用例数',
            dataIndex: 'caseCount',
            key: 'caseCount',
        },
        {
            title: '评审通过率',
            dataIndex: 'passRate',
            key: 'passRate',
            render: (text:any, record:any)=>(
                text != 100 ? <Tag color={"red"}>{text}%</Tag> : <Tag color={"green"}>{text}%</Tag>
            )
        },
        {
            title: '评审人',
            dataIndex: 'reviewers',
            key: 'reviewers',
            render: (text:any, record:any) =>{
                const reviewers = record.reviewers.map((x)=>x.name);
                return reviewers.join(',')
            }
        },
        {
            title: '创建者',
            dataIndex: 'creatorName',
            key: 'creatorName',
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            render: (text:any, record:any)=>(
                <span>{formatDate(text, true)}</span>
            )
        },
        {
            title: '操作',
            dataIndex: 'operations',
            key: 'operations',
            render:(text:any, record:any)=>(
                <Space>
                    <a onClick={()=>history.push('/review_cases_ms_detail/' + record.id)}>评审</a>
                </Space>
            )
        }
    ]
    const handleGetReviewList = async (info)=>{
        setLoading(true);
        const res:any = await MSGetReviewListApi({
            ...info
        });
        if (res.success){
            setReviewList(res.data.listObject);
            setTotal(res.data.itemCount);

        }
        setLoading(false);
    };

    return (
        <>
            <SearchSection
                onSubmit={(values)=>{
                    setSearchParams({
                        ...values
                    })
                    handleGetReviewList(values);
                }}
            />
            <Table
                rowKey={'id'}
                dataSource={reviewList}
                columns={columns}
                loading={loading}
                pagination={{
                    total: total,
                    pageSize1: 10,
                    showTotal:(total)=>`共${total}条`,
                    onChange: (page:number, pageSize) =>{
                        handleGetReviewList({
                            ...searchParams,
                            page: page
                        })
                    }
                }}
            />
        </>
    )
}
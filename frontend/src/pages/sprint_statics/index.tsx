import React, {useState, useEffect } from "react";
import {
    message,
    Space,
    Table, Tag,
} from "antd";
import {SearchSection} from "./search";
import {get_init_project} from "@/utils/utils";
import {sprintStaticsGetApi} from "@/apis/sprintStatics";
import {formatDate} from "@/utils/utils";

export default () =>{
    // const [searchParams, setSearchParams] = useState({project_id: get_init_project()});
    const [sprintStaticsData, setSprintStaticsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const sprintStaticsGet = async (values)=>{
        setLoading(true);
        const res:any = await sprintStaticsGetApi({
            ...values
        })
        if(res.success){
            setSprintStaticsData(res.data);
        }
        setLoading(false);

    };
    const columns = [
        {
            title: '项目',
            dataIndex: 'project',
            key: 'project',
            width: 200,
            sorter: (rowA:any, rowB:any)=>{
                return rowA.project >= rowB.project
            },
            sortDirections: ['descend']
        },
        {
            title: '迭代',
            dataIndex: 'name',
            key: 'name',
            width: 200,
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
            title: '迭代创建时间',
            dataIndex: 'sprint_create_date',
            key: 'sprint_create_date',
            width: 200,
            render: (text: any, record: any, index: any) => (
                formatDate(text)
            ),
        },
        {
            title: '故事数',
            dataIndex: 'story_total',
            key: 'story_total',
            width: 100,
        },
        {
            title: 'AI用例数',
            dataIndex: 'case_total',
            key: 'case_total',
            width: 100,
        },
        {
            title: '缺陷数',
            dataIndex: 'bug_total',
            key: 'bug_total',
            width: 100,
        },
        {
            title: '用例编写时间',
            dataIndex: 'first_case_date',
            key: 'first_case_date',
            // width: 400,
            render: (text, record) =>(
                record.first_case_date ? (
                    <>
                        {formatDate(record.first_case_date)}
                        {' ~ '}
                        {formatDate(record.last_case_date)}
                    </>) : '-'

            )
        },
        // {
        //     title: '用例编写耗时',
        //     dataIndex: 'time_spend',
        //     key: 'time_spend',
        //     width: 200
        // },
    ];

    return (
        <>
            <SearchSection
                onSubmit={(values)=>{
                    sprintStaticsGet(values)
                }}
                allowClearProject={true}
            />
        <Table
            loading={loading}
            columns={columns}
            dataSource={sprintStaticsData}
            rowKey={'sprint_id'}
            pagination={{showSizeChanger: true, showTotal:(total)=>`共${total}条`,}}
        />
        </>
    )
}
